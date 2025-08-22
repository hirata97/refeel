import { describe, it, expect, beforeEach, vi } from 'vitest'
import { DataEncryption, KeyManager, EncryptionConfigManager } from '@/utils/encryption'
import type { EncryptedData, EncryptionKeyInfo } from '@/types/encryption'

// Mock crypto API
const mockCrypto = {
  subtle: {
    generateKey: vi.fn(),
    encrypt: vi.fn(),
    decrypt: vi.fn(),
    exportKey: vi.fn(),
    importKey: vi.fn()
  },
  getRandomValues: vi.fn(),
  randomUUID: vi.fn()
}

// Mock sessionStorage
const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn()
}

global.crypto = mockCrypto as unknown as Crypto
global.sessionStorage = mockSessionStorage as unknown as Storage

describe('DataEncryption', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    DataEncryption.setMasterKey(null as unknown as CryptoKey)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('generateMasterKey', () => {
    it('should generate a new AES-GCM key', async () => {
      const mockKey = { type: 'secret', algorithm: { name: 'AES-GCM' } }
      mockCrypto.subtle.generateKey.mockResolvedValue(mockKey)

      const result = await DataEncryption.generateMasterKey()

      expect(mockCrypto.subtle.generateKey).toHaveBeenCalledWith(
        {
          name: 'AES-GCM',
          length: 256
        },
        true,
        ['encrypt', 'decrypt']
      )
      expect(result).toBe(mockKey)
    })

    it('should set the generated key as master key', async () => {
      const mockKey = { type: 'secret' }
      mockCrypto.subtle.generateKey.mockResolvedValue(mockKey)

      await DataEncryption.generateMasterKey()
      const retrievedKey = await DataEncryption.getMasterKey()

      expect(retrievedKey).toBe(mockKey)
    })
  })

  describe('encryptData', () => {
    it('should encrypt string data successfully', async () => {
      const testData = 'sensitive information'
      const mockKey = { type: 'secret' }
      const mockIV = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
      const mockEncrypted = new Uint8Array([13, 14, 15, 16])

      mockCrypto.subtle.generateKey.mockResolvedValue(mockKey)
      mockCrypto.getRandomValues.mockImplementation((arr) => {
        arr.set(mockIV)
        return arr
      })
      mockCrypto.subtle.encrypt.mockResolvedValue(mockEncrypted.buffer)

      const result = await DataEncryption.encryptData(testData)

      expect(result).toEqual({
        data: '0d0e0f10',
        iv: '0102030405060708090a0b0c',
        algorithm: 'AES-GCM',
        timestamp: expect.any(Number),
        version: '1.0'
      })
    })

    it('should throw error for invalid input', async () => {
      await expect(DataEncryption.encryptData('')).rejects.toThrow('Invalid data for encryption')
      await expect(DataEncryption.encryptData(null as unknown as string)).rejects.toThrow('Invalid data for encryption')
    })
  })

  describe('decryptData', () => {
    it('should decrypt data successfully', async () => {
      const testData = 'decrypted content'
      const mockKey = { type: 'secret' }
      const encryptedData: EncryptedData = {
        data: '0d0e0f10',
        iv: '0102030405060708090a0b0c',
        algorithm: 'AES-GCM',
        timestamp: Date.now(),
        version: '1.0'
      }

      mockCrypto.subtle.generateKey.mockResolvedValue(mockKey)
      mockCrypto.subtle.decrypt.mockResolvedValue(new TextEncoder().encode(testData).buffer)

      const result = await DataEncryption.decryptData(encryptedData)

      expect(result).toBe(testData)
    })

    it('should throw error for invalid encrypted data', async () => {
      const invalidData = {
        data: '',
        iv: '',
        algorithm: 'AES-GCM',
        timestamp: Date.now(),
        version: '1.0'
      }

      await expect(DataEncryption.decryptData(invalidData)).rejects.toThrow('Invalid encrypted data')
    })

    it('should throw error when decryption fails', async () => {
      const mockKey = { type: 'secret' }
      const encryptedData: EncryptedData = {
        data: '0d0e0f10',
        iv: '0102030405060708090a0b0c',
        algorithm: 'AES-GCM',
        timestamp: Date.now(),
        version: '1.0'
      }

      mockCrypto.subtle.generateKey.mockResolvedValue(mockKey)
      mockCrypto.subtle.decrypt.mockRejectedValue(new Error('Decryption failed'))

      await expect(DataEncryption.decryptData(encryptedData)).rejects.toThrow('Decryption failed: Invalid key or corrupted data')
    })
  })

  describe('encryptSensitiveFields', () => {
    it('should encrypt all sensitive fields in data object', async () => {
      const mockKey = { type: 'secret' }
      // Mock encrypted data structure will be created by encryption process

      mockCrypto.subtle.generateKey.mockResolvedValue(mockKey)
      mockCrypto.getRandomValues.mockImplementation((arr) => {
        arr.set(new Uint8Array(12))
        return arr
      })
      mockCrypto.subtle.encrypt.mockResolvedValue(new Uint8Array([1, 2, 3, 4]).buffer)

      const testData = {
        title: 'Goal Title',
        content: 'Goal Content',
        nonSensitive: 'Public Info',
        personal_note: 'Private Note'
      }

      const result = await DataEncryption.encryptSensitiveFields(testData)

      expect(typeof result.title).toBe('object')
      expect(typeof result.content).toBe('object')
      expect(result.nonSensitive).toBe('Public Info') // Should remain unchanged
      expect(typeof result.personal_note).toBe('object')
    })

    it('should handle empty or non-string fields', async () => {
      const testData = {
        title: null,
        content: '',
        note: 123,
        normalField: 'unchanged'
      }

      const result = await DataEncryption.encryptSensitiveFields(testData)

      expect(result.title).toBeNull()
      expect(result.content).toBe('')
      expect(result.note).toBe(123)
      expect(result.normalField).toBe('unchanged')
    })
  })
})

describe('KeyManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSessionStorage.getItem.mockReturnValue(null)
  })

  describe('storeKey', () => {
    it('should store encryption key info in session storage', async () => {
      const keyInfo: EncryptionKeyInfo = {
        keyData: { kty: 'oct', k: 'test-key' },
        algorithm: 'AES-GCM',
        keyLength: 256,
        createdAt: Date.now(),
        version: '1.0'
      }

      const mockKey = { type: 'secret' }
      mockCrypto.subtle.generateKey.mockResolvedValue(mockKey)
      mockCrypto.getRandomValues.mockImplementation((arr) => {
        arr.set(new Uint8Array(12))
        return arr
      })
      mockCrypto.subtle.encrypt.mockResolvedValue(new Uint8Array([1, 2, 3, 4]).buffer)

      await KeyManager.storeKey(keyInfo)

      expect(mockSessionStorage.setItem).toHaveBeenCalled()
    })

    it('should handle storage errors', async () => {
      const keyInfo: EncryptionKeyInfo = {
        keyData: { kty: 'oct', k: 'test-key' },
        algorithm: 'AES-GCM',
        keyLength: 256,
        createdAt: Date.now(),
        version: '1.0'
      }

      mockCrypto.subtle.generateKey.mockRejectedValue(new Error('Encryption failed'))

      await expect(KeyManager.storeKey(keyInfo)).rejects.toThrow('Key storage failed')
    })
  })

  describe('retrieveKey', () => {
    it('should retrieve and decrypt stored key info', async () => {
      const storedData = JSON.stringify({
        data: 'encrypted-key-info',
        iv: 'test-iv',
        algorithm: 'AES-GCM',
        timestamp: Date.now(),
        version: '1.0'
      })

      const expectedKeyInfo: EncryptionKeyInfo = {
        keyData: { kty: 'oct', k: 'test-key' },
        algorithm: 'AES-GCM',
        keyLength: 256,
        createdAt: Date.now(),
        version: '1.0'
      }

      mockSessionStorage.getItem.mockReturnValue(storedData)
      mockCrypto.subtle.generateKey.mockResolvedValue({ type: 'secret' })
      mockCrypto.subtle.decrypt.mockResolvedValue(
        new TextEncoder().encode(JSON.stringify(expectedKeyInfo)).buffer
      )

      const result = await KeyManager.retrieveKey()

      expect(result).toEqual(expectedKeyInfo)
    })

    it('should return null if no stored data', async () => {
      mockSessionStorage.getItem.mockReturnValue(null)

      const result = await KeyManager.retrieveKey()

      expect(result).toBeNull()
    })

    it('should handle retrieval errors', async () => {
      mockSessionStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error')
      })

      const result = await KeyManager.retrieveKey()

      expect(result).toBeNull()
    })
  })

  describe('isKeyExpired', () => {
    it('should return true for expired keys', () => {
      const expiredKey: EncryptionKeyInfo = {
        keyData: { kty: 'oct', k: 'test-key' },
        algorithm: 'AES-GCM',
        keyLength: 256,
        createdAt: Date.now() - (91 * 24 * 60 * 60 * 1000), // 91 days ago
        version: '1.0'
      }

      expect(KeyManager.isKeyExpired(expiredKey)).toBe(true)
    })

    it('should return false for valid keys', () => {
      const validKey: EncryptionKeyInfo = {
        keyData: { kty: 'oct', k: 'test-key' },
        algorithm: 'AES-GCM',
        keyLength: 256,
        createdAt: Date.now() - (30 * 24 * 60 * 60 * 1000), // 30 days ago
        version: '1.0'
      }

      expect(KeyManager.isKeyExpired(validKey)).toBe(false)
    })
  })
})

describe('EncryptionConfigManager', () => {
  it('should provide default configuration', () => {
    const config = EncryptionConfigManager.getConfig()

    expect(config).toEqual({
      enabled: true,
      algorithm: 'AES-GCM',
      keyLength: 256,
      rotationInterval: 90 * 24 * 60 * 60 * 1000,
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
    })
  })

  it('should identify sensitive fields correctly', () => {
    expect(EncryptionConfigManager.isSensitiveField('title')).toBe(true)
    expect(EncryptionConfigManager.isSensitiveField('content')).toBe(true)
    expect(EncryptionConfigManager.isSensitiveField('public_info')).toBe(false)
  })

  it('should identify required encryption fields correctly', () => {
    expect(EncryptionConfigManager.requiresEncryption('personal_note')).toBe(true)
    expect(EncryptionConfigManager.requiresEncryption('private_data')).toBe(true)
    expect(EncryptionConfigManager.requiresEncryption('title')).toBe(false)
  })

  it('should allow configuration updates', () => {
    const originalConfig = EncryptionConfigManager.getConfig()
    
    EncryptionConfigManager.updateConfig({
      enabled: false,
      keyLength: 128
    })

    const updatedConfig = EncryptionConfigManager.getConfig()
    
    expect(updatedConfig.enabled).toBe(false)
    expect(updatedConfig.keyLength).toBe(128)
    expect(updatedConfig.algorithm).toBe(originalConfig.algorithm) // Should remain unchanged
  })
})

describe('Integration Tests', () => {
  it('should perform complete encrypt-decrypt cycle', async () => {
    const testData = 'Complete integration test data'
    const mockKey = { type: 'secret' }
    const mockIV = new Uint8Array(12)
    const mockEncryptedBuffer = new Uint8Array([1, 2, 3, 4]).buffer

    mockCrypto.subtle.generateKey.mockResolvedValue(mockKey)
    mockCrypto.getRandomValues.mockImplementation((arr) => {
      arr.set(mockIV)
      return arr
    })
    mockCrypto.subtle.encrypt.mockResolvedValue(mockEncryptedBuffer)
    mockCrypto.subtle.decrypt.mockResolvedValue(new TextEncoder().encode(testData).buffer)

    // Encrypt
    const encrypted = await DataEncryption.encryptData(testData)
    expect(encrypted.data).toBeDefined()
    expect(encrypted.iv).toBeDefined()

    // Decrypt
    const decrypted = await DataEncryption.decryptData(encrypted)
    expect(decrypted).toBe(testData)
  })

  it('should handle complex data structures', async () => {
    const mockKey = { type: 'secret' }
    mockCrypto.subtle.generateKey.mockResolvedValue(mockKey)
    mockCrypto.getRandomValues.mockImplementation((arr) => {
      arr.set(new Uint8Array(12))
      return arr
    })
    mockCrypto.subtle.encrypt.mockResolvedValue(new Uint8Array([1, 2, 3, 4]).buffer)
    mockCrypto.subtle.decrypt.mockImplementation(async () => {
      return new TextEncoder().encode('decrypted').buffer
    })

    const complexData = {
      user_id: '123',
      title: 'My Goal',
      content: 'Goal details',
      metadata: {
        created_at: '2025-01-01',
        public: true
      },
      personal_note: 'Private thoughts'
    }

    const encrypted = await DataEncryption.encryptSensitiveFields(complexData)
    
    // Sensitive fields should be encrypted
    expect(typeof encrypted.title).toBe('object')
    expect(typeof encrypted.content).toBe('object')
    expect(typeof encrypted.personal_note).toBe('object')
    
    // Non-sensitive fields should remain unchanged
    expect(encrypted.user_id).toBe('123')
    expect(encrypted.metadata).toEqual(complexData.metadata)
  })
})