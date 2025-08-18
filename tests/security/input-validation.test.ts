import { describe, it, expect } from 'vitest'
import { InputValidation } from '@/utils/security'

describe('InputValidation', () => {
  describe('validateInput', () => {
    it('should validate normal input successfully', () => {
      const result = InputValidation.validateInput('Hello World')
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.riskLevel).toBe('low')
    })

    it('should reject input that exceeds maximum length', () => {
      const longInput = 'a'.repeat(101)
      const result = InputValidation.validateInput(longInput, { maxLength: 100 })
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Input exceeds maximum length of 100')
      expect(result.riskLevel).toBe('medium')
    })

    it('should reject input shorter than minimum length', () => {
      const result = InputValidation.validateInput('ab', { minLength: 3 })
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Input is shorter than minimum length of 3')
    })

    it('should detect XSS attempts', () => {
      const maliciousInput = '<script>alert("xss")</script>'
      const result = InputValidation.validateInput(maliciousInput)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Potential XSS attack detected')
      expect(result.riskLevel).toBe('critical')
    })

    it('should warn about special characters when not allowed', () => {
      const inputWithSpecialChars = 'Hello & World'
      const result = InputValidation.validateInput(inputWithSpecialChars, { 
        allowSpecialChars: false 
      })
      
      expect(result.isValid).toBe(true) // warnings don't make it invalid
      expect(result.warnings).toContain('Input contains special characters')
      expect(result.riskLevel).toBe('medium')
    })

    it('should allow special characters when explicitly allowed', () => {
      const inputWithSpecialChars = 'Hello & World'
      const result = InputValidation.validateInput(inputWithSpecialChars, { 
        allowSpecialChars: true 
      })
      
      expect(result.isValid).toBe(true)
      expect(result.warnings).toHaveLength(0)
      expect(result.riskLevel).toBe('low')
    })

    it('should reject HTML when not allowed', () => {
      const htmlInput = '<p>Hello World</p>'
      const result = InputValidation.validateInput(htmlInput, { allowHTML: false })
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('HTML tags not allowed')
      expect(result.riskLevel).toBe('high')
    })

    it('should allow HTML when explicitly allowed', () => {
      const htmlInput = '<p>Hello World</p>'
      const result = InputValidation.validateInput(htmlInput, { allowHTML: true })
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should handle invalid input types', () => {
      const result = InputValidation.validateInput(null as never)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Invalid input type')
      expect(result.riskLevel).toBe('medium')
    })

    it('should combine multiple validation rules', () => {
      const maliciousLongInput = '<script>alert("xss")</script>' + 'a'.repeat(100)
      const result = InputValidation.validateInput(maliciousLongInput, {
        maxLength: 50,
        allowHTML: false
      })
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Input exceeds maximum length of 50')
      expect(result.errors).toContain('Potential XSS attack detected')
      expect(result.riskLevel).toBe('critical') // 最も高いリスクレベル
    })
  })

  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org'
      ]
      
      validEmails.forEach(email => {
        const result = InputValidation.validateEmail(email)
        expect(result.isValid).toBe(true)
        expect(result.errors).toHaveLength(0)
        expect(result.riskLevel).toBe('low')
      })
    })

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'notanemail',
        '@example.com',
        'user@',
        'user..name@example.com',
        'user@.com'
      ]
      
      invalidEmails.forEach(email => {
        const result = InputValidation.validateEmail(email)
        expect(result.isValid).toBe(false)
        expect(result.errors).toContain('Invalid email format')
      })
    })

    it('should detect XSS attempts in email', () => {
      const maliciousEmail = 'test@example.com<script>alert("xss")</script>'
      const result = InputValidation.validateEmail(maliciousEmail)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Invalid email format')
      expect(result.errors).toContain('Potential XSS attack in email')
    })
  })

  describe('validatePassword', () => {
    it('should validate strong passwords', () => {
      const strongPasswords = [
        'StrongP@ssw0rd',
        'MySecure123!',
        'C0mpl3x&Secure'
      ]
      
      strongPasswords.forEach(password => {
        const result = InputValidation.validatePassword(password)
        expect(result.isValid).toBe(true)
        expect(result.errors).toHaveLength(0)
        expect(result.riskLevel).toBe('low')
      })
    })

    it('should reject passwords that are too short', () => {
      const result = InputValidation.validatePassword('Short1!')
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Password must be at least 8 characters long')
      expect(result.riskLevel).toBe('medium')
    })

    it('should require lowercase letters', () => {
      const result = InputValidation.validatePassword('NOLOWERCASE123!')
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Password must contain at least one lowercase letter')
    })

    it('should require uppercase letters', () => {
      const result = InputValidation.validatePassword('nouppercase123!')
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Password must contain at least one uppercase letter')
    })

    it('should require numbers', () => {
      const result = InputValidation.validatePassword('NoNumbers!')
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Password must contain at least one number')
    })

    it('should require special characters', () => {
      const result = InputValidation.validatePassword('NoSpecialChars123')
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Password must contain at least one special character')
    })

    it('should reject passwords that are too long', () => {
      const tooLongPassword = 'a'.repeat(129) + 'A1!'
      const result = InputValidation.validatePassword(tooLongPassword)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Password is too long')
      expect(result.riskLevel).toBe('medium')
    })

    it('should accumulate multiple errors', () => {
      const weakPassword = 'weak'
      const result = InputValidation.validatePassword(weakPassword)
      
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(1)
      expect(result.errors).toContain('Password must be at least 8 characters long')
      expect(result.errors).toContain('Password must contain at least one uppercase letter')
      expect(result.errors).toContain('Password must contain at least one number')
      expect(result.errors).toContain('Password must contain at least one special character')
    })
  })
})