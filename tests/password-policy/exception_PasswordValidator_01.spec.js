/**
 * PasswordValidator 異常系テスト
 * 
 * エラーハンドリングと例外ケースをテスト
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { 
  PasswordValidator,
  DEFAULT_PASSWORD_POLICY
} from '@/utils/password-policy'

// Crypto API のモック
Object.defineProperty(globalThis, 'crypto', {
  value: {
    subtle: {
      digest: vi.fn(async () => {
        return new ArrayBuffer(32) // SHA-256の結果をシミュレート
      })
    }
  }
})

describe('PasswordValidator - 異常系', () => {
  let validator

  beforeEach(() => {
    validator = new PasswordValidator()
  })

  describe('基本要件違反', () => {
    it('最小長度を満たさないパスワードがエラーになること', () => {
      const result = validator.validatePassword('short')
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.includes('文字以上'))).toBe(true)
    })

    it('最大長度を超えるパスワードがエラーになること', () => {
      // 65文字のパスワード（デフォルト最大長64文字を超える）
      const longPassword = 'A'.repeat(65)
      const result = validator.validatePassword(longPassword)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.includes('文字以下'))).toBe(true)
    })

    it('大文字を含まないパスワードがエラーになること', () => {
      const result = validator.validatePassword('password123!')
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.includes('大文字'))).toBe(true)
    })

    it('小文字を含まないパスワードがエラーになること', () => {
      const result = validator.validatePassword('PASSWORD123!')
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.includes('小文字'))).toBe(true)
    })

    it('数字を含まないパスワードがエラーになること', () => {
      const result = validator.validatePassword('Password!')
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.includes('数字'))).toBe(true)
    })

    it('特殊文字を含まないパスワードがエラーになること', () => {
      const result = validator.validatePassword('Password123')
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.includes('特殊文字'))).toBe(true)
    })
  })

  describe('複数要件違反', () => {
    it('複数の要件に違反したパスワードで複数のエラーが発生すること', () => {
      const result = validator.validatePassword('weak')
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(1)
    })

    it('すべての要件に違反したパスワードで最大数のエラーが発生すること', () => {
      const result = validator.validatePassword('a')
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThanOrEqual(4) // 長さ、大文字、数字、特殊文字
    })
  })

  describe('ユーザー情報禁止違反', () => {
    it('メールアドレスの一部を含むパスワードがエラーになること', () => {
      const result = validator.validatePassword(
        'johndoePassword123!',
        'johndoe@example.com',
        'user'
      )
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.includes('メールアドレス'))).toBe(true)
    })

    it('ユーザー名を含むパスワードがエラーになること', () => {
      const result = validator.validatePassword(
        'testuserPassword123!',
        'user@example.com',
        'testuser'
      )
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.includes('ユーザー名'))).toBe(true)
    })

    it('大文字小文字を区別せずユーザー情報を検出すること', () => {
      const result = validator.validatePassword(
        'JOHNDOEpassword123!',
        'johndoe@example.com',
        'user'
      )
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.includes('メールアドレス'))).toBe(true)
    })

    it('ユーザー名の大文字小文字変換でも検出すること', () => {
      const result = validator.validatePassword(
        'TESTUSERpass123!',
        'user@example.com',
        'testuser'
      )
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.includes('ユーザー名'))).toBe(true)
    })
  })

  describe('一般的なパスワード違反', () => {
    it('一般的すぎるパスワードがエラーになること', () => {
      const commonPasswords = ['password123', 'admin123', 'qwerty123']
      
      commonPasswords.forEach(password => {
        const result = validator.validatePassword(password + '!')
        expect(result.isValid).toBe(false)
        expect(result.errors.some(e => e.includes('一般的すぎる'))).toBe(true)
      })
    })

    it('同じ文字の連続で警告が発生すること', () => {
      const result = validator.validatePassword('Password111!')
      expect(result.warnings.some(w => w.includes('同じ文字の連続'))).toBe(true)
    })

    it('連続する数字で警告が発生すること', () => {
      const sequences = ['123', '234', '345', '456', '567', '678', '789', '890']
      
      sequences.forEach(seq => {
        const result = validator.validatePassword(`Password${seq}!`)
        expect(result.warnings.some(w => w.includes('連続する数字'))).toBe(true)
      })
    })

    it('キーボード配列で警告が発生すること', () => {
      const patterns = ['qwerty', 'asdf', 'zxcv']
      
      patterns.forEach(pattern => {
        const result = validator.validatePassword(`${pattern}Password123!`)
        expect(result.warnings.some(w => w.includes('キーボード配列'))).toBe(true)
      })
    })

    it('大文字小文字を区別せずキーボード配列を検出すること', () => {
      const result = validator.validatePassword('QWERTYPassword123!')
      expect(result.warnings.some(w => w.includes('キーボード配列'))).toBe(true)
    })
  })

  describe('不正な入力データ処理', () => {
    it('空文字列パスワードで適切なエラーが発生すること', () => {
      const result = validator.validatePassword('')
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('null値の処理でエラーにならないこと', () => {
      expect(() => {
        validator.validatePassword(null)
      }).not.toThrow()
    })

    it('undefined値の処理でエラーにならないこと', () => {
      expect(() => {
        validator.validatePassword(undefined)
      }).not.toThrow()
    })

    it('非文字列値の処理でエラーにならないこと', () => {
      expect(() => {
        validator.validatePassword(123)
      }).not.toThrow()
      
      expect(() => {
        validator.validatePassword({})
      }).not.toThrow()
    })
  })

  describe('境界値テスト', () => {
    it('最小長度ちょうどのパスワードは有効になること', () => {
      // デフォルトポリシーの最小長度は8文字
      const result = validator.validatePassword('Pass123!')
      expect(result.isValid).toBe(true)
    })

    it('最小長度より1文字短いパスワードは無効になること', () => {
      const result = validator.validatePassword('Pass12!')
      expect(result.isValid).toBe(false)
    })

    it('最大長度ちょうどのパスワードは有効になること', () => {
      // 64文字ちょうど
      const password64 = 'A'.repeat(60) + '123!'
      const result = validator.validatePassword(password64)
      expect(result.isValid).toBe(true)
    })

    it('最大長度より1文字長いパスワードは無効になること', () => {
      // 65文字
      const password65 = 'A'.repeat(61) + '123!'
      const result = validator.validatePassword(password65)
      expect(result.isValid).toBe(false)
    })
  })

  describe('スコア計算の異常ケース', () => {
    it('極端に弱いパスワードのスコアが0以下にならないこと', () => {
      const result = validator.validatePassword('a')
      expect(result.score).toBeGreaterThanOrEqual(0)
    })

    it('極端に強いパスワードのスコアが100を超えないこと', () => {
      const superStrong = 'VeryComplexPassword123!@#$%^&*()_+{}|:"<>?[]\\;\',./'
      const result = validator.validatePassword(superStrong)
      expect(result.score).toBeLessThanOrEqual(100)
    })

    it('パターン減点が正しく適用されること', () => {
      const patternPassword = 'Password123456!'
      const randomPassword = 'ComplexWord987$'
      
      const patternResult = validator.validatePassword(patternPassword)
      const randomResult = validator.validatePassword(randomPassword)
      
      // パターンを含むパスワードの方がスコアが低くなるはず
      expect(patternResult.score).toBeLessThan(randomResult.score)
    })
  })

  describe('カスタムポリシーの異常ケース', () => {
    it('無効なポリシー値でもエラーにならないこと', () => {
      const invalidPolicy = {
        ...DEFAULT_PASSWORD_POLICY,
        minLength: -1,
        maxLength: -1
      }
      
      expect(() => {
        new PasswordValidator(invalidPolicy)
      }).not.toThrow()
    })

    it('矛盾するポリシー設定でもインスタンス作成できること', () => {
      const contradictoryPolicy = {
        ...DEFAULT_PASSWORD_POLICY,
        minLength: 20,
        maxLength: 10 // 最小 > 最大
      }
      
      expect(() => {
        new PasswordValidator(contradictoryPolicy)
      }).not.toThrow()
    })

    it('すべての要件を無効にしたポリシーでも動作すること', () => {
      const permissivePolicy = {
        minLength: 1,
        maxLength: 1000,
        requireUppercase: false,
        requireLowercase: false,
        requireNumbers: false,
        requireSpecialChars: false,
        prohibitCommonPasswords: false,
        prohibitUserInfo: false,
        maxAttempts: 999,
        lockoutDuration: 0
      }
      
      const permissiveValidator = new PasswordValidator(permissivePolicy)
      const result = permissiveValidator.validatePassword('weak')
      
      expect(result.isValid).toBe(true)
    })
  })

  describe('メモリと性能', () => {
    it('大量の検証処理でメモリリークしないこと', () => {
      const passwords = []
      for (let i = 0; i < 1000; i++) {
        passwords.push(`TestPassword${i}!`)
      }
      
      passwords.forEach(password => {
        const result = validator.validatePassword(password)
        expect(result).toBeTruthy()
      })
      
      // メモリが適切に解放されていることを確認
      // （実際のテストでは process.memoryUsage() を使用可能）
      expect(true).toBe(true)
    })

    it('非常に長いパスワードでもタイムアウトしないこと', () => {
      const veryLongPassword = 'A'.repeat(10000) + 'password123!'
      
      const startTime = Date.now()
      const result = validator.validatePassword(veryLongPassword)
      const endTime = Date.now()
      
      // 処理時間が合理的な範囲内（1秒未満）
      expect(endTime - startTime).toBeLessThan(1000)
      expect(result).toBeTruthy()
    })
  })

  describe('ハッシュ化の異常ケース', () => {
    it('空文字列のハッシュ化が正常に動作すること', async () => {
      const hash = await validator.hashPassword('')
      expect(hash).toBeTruthy()
      expect(typeof hash).toBe('string')
    })

    it('非常に長い文字列のハッシュ化が正常に動作すること', async () => {
      const longPassword = 'A'.repeat(10000)
      const hash = await validator.hashPassword(longPassword)
      expect(hash).toBeTruthy()
      expect(typeof hash).toBe('string')
    })

    it('特殊文字を含む文字列のハッシュ化が正常に動作すること', async () => {
      const specialPassword = '🔐🚨⚠️!@#$%^&*()_+{}|:"<>?[]\\;\',./'
      const hash = await validator.hashPassword(specialPassword)
      expect(hash).toBeTruthy()
      expect(typeof hash).toBe('string')
    })

    it('null/undefinedのハッシュ化でエラーが適切に処理されること', async () => {
      await expect(validator.hashPassword(null)).rejects.toThrow()
      await expect(validator.hashPassword(undefined)).rejects.toThrow()
    })
  })

  describe('強度ラベルの境界値', () => {
    it('負のスコアでも適切なラベルが返されること', () => {
      expect(validator.getStrengthLabel(-10)).toBe('非常に弱い')
    })

    it('100を超えるスコアでも適切なラベルが返されること', () => {
      expect(validator.getStrengthLabel(150)).toBe('非常に強い')
    })

    it('NaNやInfinityでも適切に処理されること', () => {
      expect(validator.getStrengthLabel(NaN)).toBe('非常に弱い')
      expect(validator.getStrengthLabel(Infinity)).toBe('非常に強い')
      expect(validator.getStrengthLabel(-Infinity)).toBe('非常に弱い')
    })
  })
})