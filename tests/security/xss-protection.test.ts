import { describe, it, expect } from 'vitest'
import { XSSProtection } from '@/utils/security'

describe('XSSProtection', () => {
  describe('sanitizeHTML', () => {
    it('should remove script tags', () => {
      const malicious = '<script>alert("xss")</script>Hello'
      const result = XSSProtection.sanitizeHTML(malicious)
      expect(result).toBe('Hello')
      expect(result).not.toContain('<script>')
    })

    it('should remove event handlers', () => {
      const malicious = '<div onclick="alert(\'xss\')">Click me</div>'
      const result = XSSProtection.sanitizeHTML(malicious)
      expect(result).not.toContain('onclick')
      expect(result).not.toContain('alert')
    })

    it('should allow safe HTML tags', () => {
      const safe = '<p><strong>Bold text</strong> and <em>italic text</em></p>'
      const result = XSSProtection.sanitizeHTML(safe)
      expect(result).toContain('<strong>')
      expect(result).toContain('<em>')
      expect(result).toContain('<p>')
    })

    it('should handle empty or invalid input', () => {
      expect(XSSProtection.sanitizeHTML('')).toBe('')
      expect(XSSProtection.sanitizeHTML(null as never)).toBe('')
      expect(XSSProtection.sanitizeHTML(undefined as never)).toBe('')
    })
  })

  describe('sanitizeText', () => {
    it('should escape HTML entities', () => {
      const input = '<script>alert("xss")</script>'
      const result = XSSProtection.sanitizeText(input)
      expect(result).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;')
    })

    it('should escape quotes and ampersands', () => {
      const input = 'Test & "quotes" and \'single quotes\''
      const result = XSSProtection.sanitizeText(input)
      expect(result).toBe('Test &amp; &quot;quotes&quot; and &#x27;single quotes&#x27;')
    })

    it('should handle special characters', () => {
      const input = '< > " \' & /'
      const result = XSSProtection.sanitizeText(input)
      expect(result).toBe('&lt; &gt; &quot; &#x27; &amp; &#x2F;')
    })
  })

  describe('sanitizeURL', () => {
    it('should allow valid HTTP URLs', () => {
      const validUrl = 'https://example.com/path'
      const result = XSSProtection.sanitizeURL(validUrl)
      expect(result).toBe(validUrl)
    })

    it('should allow mailto URLs', () => {
      const mailtoUrl = 'mailto:test@example.com'
      const result = XSSProtection.sanitizeURL(mailtoUrl)
      expect(result).toBe(mailtoUrl)
    })

    it('should reject javascript URLs', () => {
      const maliciousUrl = 'javascript:alert("xss")'
      const result = XSSProtection.sanitizeURL(maliciousUrl)
      expect(result).toBe('')
    })

    it('should reject data URLs', () => {
      const dataUrl = 'data:text/html,<script>alert("xss")</script>'
      const result = XSSProtection.sanitizeURL(dataUrl)
      expect(result).toBe('')
    })

    it('should handle invalid URLs', () => {
      expect(XSSProtection.sanitizeURL('not-a-url')).toBe('')
      expect(XSSProtection.sanitizeURL('')).toBe('')
      expect(XSSProtection.sanitizeURL(null as never)).toBe('')
    })
  })

  describe('secureDisplay', () => {
    it('should sanitize HTML when allowHTML is true', () => {
      const input = '<p>Safe</p><script>alert("xss")</script>'
      const result = XSSProtection.secureDisplay(input, true)
      expect(result).toContain('<p>')
      expect(result).not.toContain('<script>')
    })

    it('should escape all HTML when allowHTML is false', () => {
      const input = '<p>Test</p>'
      const result = XSSProtection.secureDisplay(input, false)
      expect(result).toBe('&lt;p&gt;Test&lt;&#x2F;p&gt;')
    })

    it('should default to text escaping', () => {
      const input = '<p>Test</p>'
      const result = XSSProtection.secureDisplay(input)
      expect(result).toBe('&lt;p&gt;Test&lt;&#x2F;p&gt;')
    })
  })

  describe('secureInput', () => {
    it('should always escape input values', () => {
      const input = '<script>alert("xss")</script>'
      const result = XSSProtection.secureInput(input)
      expect(result).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;')
    })
  })

  describe('detectXSSAttempt', () => {
    it('should detect script tags', () => {
      expect(XSSProtection.detectXSSAttempt('<script>alert("xss")</script>')).toBe(true)
      expect(XSSProtection.detectXSSAttempt('<SCRIPT>alert("xss")</SCRIPT>')).toBe(true)
    })

    it('should detect javascript URLs', () => {
      expect(XSSProtection.detectXSSAttempt('javascript:alert("xss")')).toBe(true)
      expect(XSSProtection.detectXSSAttempt('JAVASCRIPT:alert("xss")')).toBe(true)
    })

    it('should detect event handlers', () => {
      expect(XSSProtection.detectXSSAttempt('onload=alert("xss")')).toBe(true)
      expect(XSSProtection.detectXSSAttempt('onclick="alert(1)"')).toBe(true)
      expect(XSSProtection.detectXSSAttempt('onmouseover=malicious()')).toBe(true)
    })

    it('should detect dangerous tags', () => {
      expect(XSSProtection.detectXSSAttempt('<iframe src="evil.com"></iframe>')).toBe(true)
      expect(XSSProtection.detectXSSAttempt('<object data="evil.swf"></object>')).toBe(true)
      expect(XSSProtection.detectXSSAttempt('<embed src="evil.swf">')).toBe(true)
    })

    it('should not flag safe content', () => {
      expect(XSSProtection.detectXSSAttempt('Hello world')).toBe(false)
      expect(XSSProtection.detectXSSAttempt('<p>Safe paragraph</p>')).toBe(false)
      expect(XSSProtection.detectXSSAttempt('Email: test@example.com')).toBe(false)
    })

    it('should handle edge cases', () => {
      expect(XSSProtection.detectXSSAttempt('')).toBe(false)
      expect(XSSProtection.detectXSSAttempt(null as never)).toBe(false)
      expect(XSSProtection.detectXSSAttempt(undefined as never)).toBe(false)
    })
  })
})