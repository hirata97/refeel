/**
 * TwoFactorAuthManager 正常系テスト
 * 
 * 二要素認証システムの基本機能をテスト
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { 
  TwoFactorAuthManager,
  twoFactorAuthManager,
  TOTPGenerator,
  DEFAULT_TOTP_OPTIONS
} from '@/utils/two-factor-auth'

// Crypto API のモック（Node.js環境用）
global.crypto = {
  getRandomValues: (array) => {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256)
    }
    return array
  },
  subtle: {
    digest: vi.fn().mockResolvedValue(new ArrayBuffer(32))
  }
}

describe('TwoFactorAuthManager - 正常系', () => {
  let manager
  const testUserId = 'test-user-123'
  const testUserEmail = 'test@example.com'

  beforeEach(() => {
    localStorage.clear()
    manager = new TwoFactorAuthManager()
    
    // コンソール出力をモック
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  describe('インスタンス作成', () => {
    it('インスタンスが正しく作成されること', () => {
      expect(manager).toBeInstanceOf(TwoFactorAuthManager)
    })

    it('エクスポートされた twoFactorAuthManager インスタンスが利用できること', () => {
      expect(twoFactorAuthManager).toBeInstanceOf(TwoFactorAuthManager)
    })
  })

  describe('2FA セットアップ', () => {
    it('2FA セットアップが正常に実行されること', async () => {
      const result = await manager.setup2FA(testUserId, testUserEmail)

      expect(result).toHaveProperty('secret')
      expect(result).toHaveProperty('qrCodeUrl')
      expect(result).toHaveProperty('backupCodes')
      expect(result).toHaveProperty('manualEntryKey')
      
      expect(typeof result.secret).toBe('string')
      expect(result.secret.length).toBeGreaterThan(0)
      expect(result.qrCodeUrl).toContain('otpauth://totp/')
      expect(Array.isArray(result.backupCodes)).toBe(true)
      expect(result.backupCodes).toHaveLength(8)
      expect(typeof result.manualEntryKey).toBe('string')
    })

    it('QRコードURLが正しい形式で生成されること', async () => {
      const result = await manager.setup2FA(testUserId, testUserEmail)
      
      expect(result.qrCodeUrl).toContain('otpauth://totp/')
      expect(result.qrCodeUrl).toContain(encodeURIComponent(testUserEmail))
      expect(result.qrCodeUrl).toContain('Goal%20Categorization%20Diary')
      expect(result.qrCodeUrl).toContain('secret=')
      expect(result.qrCodeUrl).toContain('issuer=')
    })

    it('バックアップコードが正しい形式で生成されること', async () => {
      const result = await manager.setup2FA(testUserId, testUserEmail)
      
      result.backupCodes.forEach(code => {
        expect(typeof code).toBe('string')
        expect(code).toMatch(/^[A-Z0-9]{8}$/) // 8文字の英数字（大文字）
      })
    })

    it('手動入力キーが正しい形式で生成されること', async () => {
      const result = await manager.setup2FA(testUserId, testUserEmail)
      
      expect(result.manualEntryKey).toContain(' ') // スペース区切り
      expect(result.manualEntryKey.replace(/\s/g, '')).toBe(result.secret)
    })
  })

  describe('2FA 有効化', () => {
    it('正しいTOTPコードで2FAが有効化されること', async () => {
      // セットアップ
      const setupResult = await manager.setup2FA(testUserId, testUserEmail)
      
      // TOTPGenerator をモック
      const totpGenerator = manager.totpGenerator
      vi.spyOn(totpGenerator, 'verifyTOTP').mockResolvedValue(true)
      
      // 有効化
      const result = await manager.enable2FA(
        testUserId,
        testUserEmail,
        setupResult.secret,
        '123456',
        setupResult.backupCodes
      )
      
      expect(result).toBe(true)
      expect(manager.is2FAEnabled(testUserId)).toBe(true)
    })

    it('2FA有効化後にステータスが正しく設定されること', async () => {
      const setupResult = await manager.setup2FA(testUserId, testUserEmail)
      
      vi.spyOn(manager.totpGenerator, 'verifyTOTP').mockResolvedValue(true)
      
      await manager.enable2FA(
        testUserId,
        testUserEmail,
        setupResult.secret,
        '123456',
        setupResult.backupCodes
      )
      
      const status = manager.get2FAStatus(testUserId)
      expect(status.isEnabled).toBe(true)
      expect(status.setupAt).toBeInstanceOf(Date)
      expect(status.backupCodesCount).toBe(8)
      expect(status.lastUsedAt).toBeUndefined()
    })
  })

  describe('2FA コード検証', () => {
    beforeEach(async () => {
      // 2FAを有効化した状態にする
      const setupResult = await manager.setup2FA(testUserId, testUserEmail)
      vi.spyOn(manager.totpGenerator, 'verifyTOTP').mockResolvedValue(true)
      await manager.enable2FA(
        testUserId,
        testUserEmail,
        setupResult.secret,
        '123456',
        setupResult.backupCodes
      )
    })

    it('正しいTOTPコードで検証が成功すること', async () => {
      vi.spyOn(manager.totpGenerator, 'verifyTOTP').mockResolvedValue(true)
      
      const result = await manager.verify2FACode(testUserId, '123456')
      
      expect(result.isValid).toBe(true)
      expect(result.method).toBe('totp')
      expect(result.remainingBackupCodes).toBe(8)
    })

    it('バックアップコードで検証が成功すること', async () => {
      // セットアップ時のバックアップコードを取得
      const setupResult = await manager.setup2FA('temp-user', 'temp@example.com')
      const backupCode = setupResult.backupCodes[0]
      
      vi.spyOn(manager.totpGenerator, 'verifyTOTP')
        .mockResolvedValueOnce(true) // 有効化時
        .mockResolvedValue(false)    // 検証時（TOTPは失敗）

      await manager.enable2FA(
        'temp-user',
        'temp@example.com',
        setupResult.secret,
        '123456',
        setupResult.backupCodes
      )
      
      const result = await manager.verify2FACode('temp-user', backupCode)
      
      expect(result.isValid).toBe(true)
      expect(result.method).toBe('backup')
      expect(result.remainingBackupCodes).toBe(7) // 1つ使用済み
    })

    it('TOTP検証後に最終使用日時が更新されること', async () => {
      vi.spyOn(manager.totpGenerator, 'verifyTOTP').mockResolvedValue(true)
      
      await manager.verify2FACode(testUserId, '123456')
      
      const status = manager.get2FAStatus(testUserId)
      expect(status.lastUsedAt).toBeInstanceOf(Date)
    })
  })

  describe('2FA 無効化', () => {
    beforeEach(async () => {
      // 2FAを有効化した状態にする
      const setupResult = await manager.setup2FA(testUserId, testUserEmail)
      vi.spyOn(manager.totpGenerator, 'verifyTOTP').mockResolvedValue(true)
      await manager.enable2FA(
        testUserId,
        testUserEmail,
        setupResult.secret,
        '123456',
        setupResult.backupCodes
      )
    })

    it('正しいコードで2FAが無効化されること', async () => {
      vi.spyOn(manager.totpGenerator, 'verifyTOTP').mockResolvedValue(true)
      
      const result = await manager.disable2FA(testUserId, testUserEmail, '123456')
      
      expect(result).toBe(true)
      expect(manager.is2FAEnabled(testUserId)).toBe(false)
    })

    it('バックアップコードで2FAが無効化されること', async () => {
      const setupResult = await manager.setup2FA('temp-user', 'temp@example.com')
      const backupCode = setupResult.backupCodes[0]
      
      vi.spyOn(manager.totpGenerator, 'verifyTOTP')
        .mockResolvedValueOnce(true)  // 有効化時
        .mockResolvedValueOnce(false) // 無効化時のTOTP検証
      
      await manager.enable2FA(
        'temp-user',
        'temp@example.com',
        setupResult.secret,
        '123456',
        setupResult.backupCodes
      )
      
      const result = await manager.disable2FA('temp-user', 'temp@example.com', backupCode)
      
      expect(result).toBe(true)
      expect(manager.is2FAEnabled('temp-user')).toBe(false)
    })
  })

  describe('2FA ステータス確認', () => {
    it('2FAが無効な場合のステータスが正しく返されること', () => {
      const status = manager.get2FAStatus(testUserId)
      
      expect(status.isEnabled).toBe(false)
      expect(status.backupCodesCount).toBe(0)
      expect(status.setupAt).toBeUndefined()
      expect(status.lastUsedAt).toBeUndefined()
    })

    it('存在しないユーザーの2FA状態がfalseになること', () => {
      expect(manager.is2FAEnabled('nonexistent-user')).toBe(false)
    })

    it('2FA有効化後のステータスが正しく返されること', async () => {
      const setupResult = await manager.setup2FA(testUserId, testUserEmail)
      vi.spyOn(manager.totpGenerator, 'verifyTOTP').mockResolvedValue(true)
      
      await manager.enable2FA(
        testUserId,
        testUserEmail,
        setupResult.secret,
        '123456',
        setupResult.backupCodes
      )
      
      const status = manager.get2FAStatus(testUserId)
      
      expect(status.isEnabled).toBe(true)
      expect(status.setupAt).toBeInstanceOf(Date)
      expect(status.backupCodesCount).toBe(8)
    })
  })

  describe('バックアップコード再生成', () => {
    beforeEach(async () => {
      // 2FAを有効化した状態にする
      const setupResult = await manager.setup2FA(testUserId, testUserEmail)
      vi.spyOn(manager.totpGenerator, 'verifyTOTP').mockResolvedValue(true)
      await manager.enable2FA(
        testUserId,
        testUserEmail,
        setupResult.secret,
        '123456',
        setupResult.backupCodes
      )
    })

    it('バックアップコードが正常に再生成されること', async () => {
      const originalStatus = manager.get2FAStatus(testUserId)
      const originalCount = originalStatus.backupCodesCount
      
      const newCodes = await manager.regenerateBackupCodes(testUserId, testUserEmail)
      
      expect(newCodes).toBeTruthy()
      expect(Array.isArray(newCodes)).toBe(true)
      expect(newCodes).toHaveLength(8)
      
      // 新しいコードの形式チェック
      newCodes.forEach(code => {
        expect(code).toMatch(/^[A-Z0-9]{8}$/)
      })
      
      const newStatus = manager.get2FAStatus(testUserId)
      expect(newStatus.backupCodesCount).toBe(originalCount)
    })

    it('2FAが無効なユーザーではバックアップコード再生成がnullを返すこと', async () => {
      const result = await manager.regenerateBackupCodes('inactive-user', 'test@example.com')
      
      expect(result).toBeNull()
    })
  })

  describe('TOTP Generator 統合', () => {
    it('TOTPGeneratorが正しく初期化されること', () => {
      expect(manager.totpGenerator).toBeInstanceOf(TOTPGenerator)
    })

    it('シークレットが正しい長さで生成されること', async () => {
      const setupResult = await manager.setup2FA(testUserId, testUserEmail)
      
      // Base32エンコードされた32文字のシークレット
      expect(setupResult.secret).toMatch(/^[A-Z2-7]{32}$/)
    })
  })

  describe('エラーレスポンス処理', () => {
    it('2FAが無効化されていない場合の検証で適切なレスポンスが返されること', async () => {
      const result = await manager.verify2FACode(testUserId, '123456')
      
      expect(result.isValid).toBe(false)
      expect(result.method).toBeNull()
    })

    it('2FAが有効でないユーザーの無効化試行でfalseが返されること', async () => {
      const result = await manager.disable2FA(testUserId, testUserEmail, '123456')
      
      expect(result).toBe(false)
    })
  })

  describe('データ永続化', () => {
    it('2FA設定がlocalStorageに正しく保存されること', async () => {
      const setupResult = await manager.setup2FA(testUserId, testUserEmail)
      vi.spyOn(manager.totpGenerator, 'verifyTOTP').mockResolvedValue(true)
      
      await manager.enable2FA(
        testUserId,
        testUserEmail,
        setupResult.secret,
        '123456',
        setupResult.backupCodes
      )
      
      const stored = localStorage.getItem(`2fa_config_${testUserId}`)
      expect(stored).toBeTruthy()
      
      const config = JSON.parse(stored)
      expect(config.secret).toBe(setupResult.secret)
      expect(config.isEnabled).toBe(true)
      expect(config.backupCodes).toEqual(setupResult.backupCodes)
    })

    it('2FA無効化でlocalStorageからデータが削除されること', async () => {
      const setupResult = await manager.setup2FA(testUserId, testUserEmail)
      vi.spyOn(manager.totpGenerator, 'verifyTOTP').mockResolvedValue(true)
      
      await manager.enable2FA(
        testUserId,
        testUserEmail,
        setupResult.secret,
        '123456',
        setupResult.backupCodes
      )
      
      await manager.disable2FA(testUserId, testUserEmail, '123456')
      
      const stored = localStorage.getItem(`2fa_config_${testUserId}`)
      expect(stored).toBeNull()
    })
  })

  describe('バックアップコード使用追跡', () => {
    it('バックアップコード使用後にカウントが減ること', async () => {
      const setupResult = await manager.setup2FA(testUserId, testUserEmail)
      const backupCode = setupResult.backupCodes[0]
      
      vi.spyOn(manager.totpGenerator, 'verifyTOTP')
        .mockResolvedValueOnce(true)  // 有効化時
        .mockResolvedValue(false)     // 検証時
      
      await manager.enable2FA(
        testUserId,
        testUserEmail,
        setupResult.secret,
        '123456',
        setupResult.backupCodes
      )
      
      const beforeStatus = manager.get2FAStatus(testUserId)
      expect(beforeStatus.backupCodesCount).toBe(8)
      
      await manager.verify2FACode(testUserId, backupCode)
      
      const afterStatus = manager.get2FAStatus(testUserId)
      expect(afterStatus.backupCodesCount).toBe(7)
    })

    it('同じバックアップコードは2回使用できないこと', async () => {
      const setupResult = await manager.setup2FA(testUserId, testUserEmail)
      const backupCode = setupResult.backupCodes[0]
      
      vi.spyOn(manager.totpGenerator, 'verifyTOTP')
        .mockResolvedValueOnce(true)  // 有効化時
        .mockResolvedValue(false)     // 検証時
      
      await manager.enable2FA(
        testUserId,
        testUserEmail,
        setupResult.secret,
        '123456',
        setupResult.backupCodes
      )
      
      // 1回目の使用
      const firstResult = await manager.verify2FACode(testUserId, backupCode)
      expect(firstResult.isValid).toBe(true)
      
      // 2回目の使用（失敗するはず）
      const secondResult = await manager.verify2FACode(testUserId, backupCode)
      expect(secondResult.isValid).toBe(false)
    })
  })
})