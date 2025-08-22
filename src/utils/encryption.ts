import type { EncryptionConfig, EncryptedData, EncryptionKeyInfo } from '@/types/encryption'

/**
 * データ暗号化ユーティリティ
 * センシティブデータの暗号化・復号化を担当
 */
export class DataEncryption {
  private static readonly ALGORITHM = 'AES-GCM'
  private static readonly KEY_LENGTH = 256
  private static readonly IV_LENGTH = 12
  private static readonly TAG_LENGTH = 16
  private static masterKey: CryptoKey | null = null

  /**
   * マスター暗号化キーを生成
   */
  static async generateMasterKey(): Promise<CryptoKey> {
    const key = await crypto.subtle.generateKey(
      {
        name: this.ALGORITHM,
        length: this.KEY_LENGTH,
      },
      true, // extractable
      ['encrypt', 'decrypt']
    )
    
    this.masterKey = key
    return key
  }

  /**
   * マスター暗号化キーを設定
   */
  static setMasterKey(key: CryptoKey): void {
    this.masterKey = key
  }

  /**
   * マスターキーを取得（なければ生成）
   */
  static async getMasterKey(): Promise<CryptoKey> {
    if (!this.masterKey) {
      await this.generateMasterKey()
    }
    return this.masterKey!
  }

  /**
   * データを暗号化
   */
  static async encryptData(data: string): Promise<EncryptedData> {
    if (!data || typeof data !== 'string') {
      throw new Error('Invalid data for encryption')
    }

    const key = await this.getMasterKey()
    const iv = crypto.getRandomValues(new Uint8Array(this.IV_LENGTH))
    const encodedData = new TextEncoder().encode(data)

    const encryptedBuffer = await crypto.subtle.encrypt(
      {
        name: this.ALGORITHM,
        iv: iv,
      },
      key,
      encodedData
    )

    const encryptedArray = new Uint8Array(encryptedBuffer)
    const encryptedData = Array.from(encryptedArray, byte => byte.toString(16).padStart(2, '0')).join('')
    const ivHex = Array.from(iv, byte => byte.toString(16).padStart(2, '0')).join('')

    return {
      data: encryptedData,
      iv: ivHex,
      algorithm: this.ALGORITHM,
      timestamp: Date.now(),
      version: '1.0'
    }
  }

  /**
   * データを復号化
   */
  static async decryptData(encryptedData: EncryptedData): Promise<string> {
    if (!encryptedData || !encryptedData.data || !encryptedData.iv) {
      throw new Error('Invalid encrypted data')
    }

    const key = await this.getMasterKey()
    
    // HEX文字列をUint8Arrayに変換
    const iv = new Uint8Array(encryptedData.iv.match(/.{2}/g)!.map(byte => parseInt(byte, 16)))
    const encrypted = new Uint8Array(encryptedData.data.match(/.{2}/g)!.map(byte => parseInt(byte, 16)))

    try {
      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: this.ALGORITHM,
          iv: iv,
        },
        key,
        encrypted
      )

      const decryptedData = new TextDecoder().decode(decryptedBuffer)
      return decryptedData
    } catch {
      throw new Error('Decryption failed: Invalid key or corrupted data')
    }
  }

  /**
   * キー情報をエクスポート（バックアップ用）
   */
  static async exportKey(): Promise<EncryptionKeyInfo> {
    const key = await this.getMasterKey()
    const exportedKey = await crypto.subtle.exportKey('jwk', key)
    
    return {
      keyData: exportedKey,
      algorithm: this.ALGORITHM,
      keyLength: this.KEY_LENGTH,
      createdAt: Date.now(),
      version: '1.0'
    }
  }

  /**
   * キーをインポート（復元用）
   */
  static async importKey(keyInfo: EncryptionKeyInfo): Promise<void> {
    if (!keyInfo.keyData || keyInfo.algorithm !== this.ALGORITHM) {
      throw new Error('Invalid key information')
    }

    try {
      const importedKey = await crypto.subtle.importKey(
        'jwk',
        keyInfo.keyData,
        {
          name: this.ALGORITHM,
          length: keyInfo.keyLength
        },
        true,
        ['encrypt', 'decrypt']
      )
      
      this.masterKey = importedKey
    } catch {
      throw new Error('Failed to import encryption key')
    }
  }

  /**
   * センシティブフィールドのバッチ暗号化
   */
  static async encryptSensitiveFields(data: Record<string, unknown>): Promise<Record<string, unknown>> {
    const sensitiveFields = ['title', 'content', 'note', 'personal_note', 'reflection']
    const result = { ...data }

    for (const field of sensitiveFields) {
      if (result[field] && typeof result[field] === 'string') {
        result[field] = await this.encryptData(result[field] as string)
      }
    }

    return result
  }

  /**
   * センシティブフィールドのバッチ復号化
   */
  static async decryptSensitiveFields(data: Record<string, unknown>): Promise<Record<string, unknown>> {
    const sensitiveFields = ['title', 'content', 'note', 'personal_note', 'reflection']
    const result = { ...data }

    for (const field of sensitiveFields) {
      if (result[field] && typeof result[field] === 'object' && 
          (result[field] as EncryptedData).data) {
        result[field] = await this.decryptData(result[field] as EncryptedData)
      }
    }

    return result
  }
}

/**
 * キー管理システム
 */
export class KeyManager {
  private static readonly STORAGE_KEY = 'encryption_key_info'
  private static readonly KEY_ROTATION_INTERVAL = 90 * 24 * 60 * 60 * 1000 // 90日

  /**
   * キーを安全に保存
   */
  static async storeKey(keyInfo: EncryptionKeyInfo): Promise<void> {
    try {
      // キー情報をセッションストレージに保存（一時的）
      // 本来はより安全な方法（HSM、キーボルトなど）を使用すべき
      const encryptedKeyInfo = await this.encryptKeyInfo(keyInfo)
      sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(encryptedKeyInfo))
    } catch (error) {
      console.error('Failed to store encryption key:', error)
      throw new Error('Key storage failed')
    }
  }

  /**
   * 保存されたキーを取得
   */
  static async retrieveKey(): Promise<EncryptionKeyInfo | null> {
    try {
      const storedData = sessionStorage.getItem(this.STORAGE_KEY)
      if (!storedData) return null

      const encryptedKeyInfo = JSON.parse(storedData)
      return await this.decryptKeyInfo(encryptedKeyInfo)
    } catch (error) {
      console.error('Failed to retrieve encryption key:', error)
      return null
    }
  }

  /**
   * キーローテーション（定期的な更新）
   */
  static async rotateKey(): Promise<void> {
    const currentKey = await this.retrieveKey()
    
    if (!currentKey || this.isKeyExpired(currentKey)) {
      await DataEncryption.generateMasterKey()
      const keyInfo = await DataEncryption.exportKey()
      await this.storeKey(keyInfo)
    }
  }

  /**
   * キーの有効期限チェック
   */
  static isKeyExpired(keyInfo: EncryptionKeyInfo): boolean {
    const age = Date.now() - keyInfo.createdAt
    return age > this.KEY_ROTATION_INTERVAL
  }

  /**
   * キー削除（セキュアな削除）
   */
  static async deleteKey(): Promise<void> {
    sessionStorage.removeItem(this.STORAGE_KEY)
    // メモリからもキーを削除
    DataEncryption.setMasterKey(null as unknown as CryptoKey)
  }

  /**
   * キー情報の暗号化（メタ暗号化）
   */
  private static async encryptKeyInfo(keyInfo: EncryptionKeyInfo): Promise<EncryptedData> {
    // 簡易的な実装：実際には別のキーで暗号化すべき
    const keyString = JSON.stringify(keyInfo)
    return await DataEncryption.encryptData(keyString)
  }

  /**
   * キー情報の復号化
   */
  private static async decryptKeyInfo(encryptedKeyInfo: EncryptedData): Promise<EncryptionKeyInfo> {
    const keyString = await DataEncryption.decryptData(encryptedKeyInfo)
    return JSON.parse(keyString)
  }
}

/**
 * 暗号化設定管理
 */
export class EncryptionConfigManager {
  private static config: EncryptionConfig = {
    enabled: true,
    algorithm: 'AES-GCM',
    keyLength: 256,
    rotationInterval: 90 * 24 * 60 * 60 * 1000, // 90日
    sensitiveFields: [
      'title',
      'content', 
      'note',
      'personal_note',
      'reflection',
      'tags',
      'private_data'
    ],
    encryptByDefault: true,
    requireEncryption: ['personal_note', 'private_data']
  }

  static getConfig(): EncryptionConfig {
    return { ...this.config }
  }

  static updateConfig(updates: Partial<EncryptionConfig>): void {
    this.config = { ...this.config, ...updates }
  }

  static isSensitiveField(fieldName: string): boolean {
    return this.config.sensitiveFields.includes(fieldName)
  }

  static requiresEncryption(fieldName: string): boolean {
    return this.config.requireEncryption.includes(fieldName)
  }
}

/**
 * 暗号化の初期化
 */
export async function initializeEncryption(): Promise<void> {
  try {
    // 保存されたキーを復元
    const storedKey = await KeyManager.retrieveKey()
    
    if (storedKey) {
      await DataEncryption.importKey(storedKey)
    } else {
      // 新しいキーを生成
      await DataEncryption.generateMasterKey()
      const keyInfo = await DataEncryption.exportKey()
      await KeyManager.storeKey(keyInfo)
    }

    // キーローテーションの設定
    setInterval(async () => {
      await KeyManager.rotateKey()
    }, 24 * 60 * 60 * 1000) // 24時間ごとにチェック

    console.log('🔐 Encryption system initialized')
  } catch (error) {
    console.error('Failed to initialize encryption:', error)
    throw new Error('Encryption initialization failed')
  }
}