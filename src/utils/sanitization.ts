import DOMPurify from 'dompurify'
import { XSSProtection, InputValidation } from './security'

// DOMPurifyの設定
const purifyConfig = {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
  ALLOWED_ATTR: [],
  KEEP_CONTENT: true,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  RETURN_DOM_IMPORT: false,
  RETURN_TRUSTED_TYPE: false
}

/**
 * 基本的なサニタイゼーション関数
 */

/**
 * HTMLエンティティをエスケープ
 */
export const escapeHTML = (text: string): string => {
  return XSSProtection.sanitizeText(text)
}

/**
 * HTMLサニタイゼーション
 */
export const sanitizeHtml = (input: string): string => {
  if (!input || typeof input !== 'string') {
    return ''
  }
  
  return DOMPurify.sanitize(input, purifyConfig)
}

/**
 * プレーンテキストサニタイゼーション（HTMLタグを完全に除去）
 */
export const sanitizeText = (input: string): string => {
  if (!input || typeof input !== 'string') {
    return ''
  }
  
  // HTMLタグを完全に除去
  const withoutTags = DOMPurify.sanitize(input, { 
    ALLOWED_TAGS: [], 
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true 
  })
  
  // 特殊文字をエスケープ
  return escapeSpecialChars(withoutTags)
}

/**
 * 特殊文字のエスケープ
 */
export const escapeSpecialChars = (input: string): string => {
  if (!input || typeof input !== 'string') {
    return ''
  }
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

/**
 * 改行文字の正規化
 */
export const normalizeLineBreaks = (text: string): string => {
  if (!text || typeof text !== 'string') return ''
  return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
}

/**
 * 前後の空白を除去
 */
export const trimWhitespace = (text: string): string => {
  if (!text || typeof text !== 'string') return ''
  return text.trim()
}

/**
 * 安全な長さ制限
 */
export const limitLength = (text: string, maxLength: number): string => {
  if (!text || typeof text !== 'string') return ''
  if (maxLength <= 0) return ''
  
  return text.length > maxLength ? text.slice(0, maxLength) : text
}

/**
 * 数値のサニタイゼーション（型安全）
 */
export const sanitizeNumber = (value: unknown, options: {
  min?: number
  max?: number
  defaultValue?: number
  allowFloat?: boolean
} = {}): number => {
  const { min, max, defaultValue = 0, allowFloat = false } = options
  
  // 型変換
  let numValue: number
  if (typeof value === 'number') {
    numValue = value
  } else if (typeof value === 'string') {
    numValue = allowFloat ? parseFloat(value) : parseInt(value, 10)
  } else {
    return defaultValue
  }
  
  // NaNチェック
  if (isNaN(numValue) || !isFinite(numValue)) {
    return defaultValue
  }
  
  // 範囲制限
  if (typeof min === 'number' && numValue < min) {
    numValue = min
  }
  if (typeof max === 'number' && numValue > max) {
    numValue = max
  }
  
  return allowFloat ? numValue : Math.round(numValue)
}

/**
 * SQLインジェクション対策のための文字列エスケープ
 */
export const escapeSqlString = (input: string): string => {
  if (!input || typeof input !== 'string') {
    return ''
  }
  
  // シングルクォートをエスケープ
  return input.replace(/'/g, "''")
}

/**
 * ファイル名のサニタイゼーション
 */
export const sanitizeFilename = (input: string): string => {
  if (!input || typeof input !== 'string') {
    return ''
  }
  
  return input
    .replace(/[<>:"/\\|?*]/g, '') // 無効な文字を除去
    .replace(/\s+/g, '_')         // スペースをアンダースコアに
    .replace(/[^\w\-_.]/g, '')    // 英数字、ハイフン、アンダースコア、ドット以外を除去
    .slice(0, 255)                // 長さ制限
}

/**
 * URLのサニタイゼーション
 */
export const sanitizeUrl = (input: string): string => {
  if (!input || typeof input !== 'string') {
    return ''
  }
  
  try {
    const url = new URL(input)
    
    // 許可されたプロトコルのみ
    const allowedProtocols = ['http:', 'https:', 'mailto:']
    if (!allowedProtocols.includes(url.protocol)) {
      return ''
    }
    
    return url.toString()
  } catch {
    return ''
  }
}

/**
 * 入力データの包括的サニタイゼーション
 */
export const sanitizeInputData = (data: Record<string, unknown>): Record<string, unknown> => {
  const sanitized: Record<string, unknown> = {}
  
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeText(value)
    } else if (typeof value === 'number') {
      // 数値は NaN や Infinity をチェック
      sanitized[key] = isFinite(value) ? value : 0
    } else if (typeof value === 'boolean') {
      sanitized[key] = value
    } else if (value === null || value === undefined) {
      sanitized[key] = value
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'string' ? sanitizeText(item) : item
      )
    } else if (typeof value === 'object') {
      sanitized[key] = sanitizeInputData(value as Record<string, unknown>)
    } else {
      sanitized[key] = value
    }
  }
  
  return sanitized
}

/**
 * 統合的なフォームデータサニタイゼーション
 */
export const sanitizeFormData = {
  /**
   * ユーザー登録データのサニタイゼーション
   */
  userRegistration: (data: {
    username: string
    email: string
    password: string
    confirmPassword: string
  }) => {
    // 入力値検証
    const usernameValidation = InputValidation.validateInput(data.username, {
      maxLength: 20,
      minLength: 3,
      allowHTML: false,
      allowSpecialChars: false
    })
    
    const emailValidation = InputValidation.validateEmail(data.email)
    const passwordValidation = InputValidation.validatePassword(data.password)
    
    if (!usernameValidation.isValid) {
      throw new Error(`Username validation failed: ${usernameValidation.errors.join(', ')}`)
    }
    
    if (!emailValidation.isValid) {
      throw new Error(`Email validation failed: ${emailValidation.errors.join(', ')}`)
    }
    
    if (!passwordValidation.isValid) {
      throw new Error(`Password validation failed: ${passwordValidation.errors.join(', ')}`)
    }
    
    return {
      username: sanitizeText(data.username).slice(0, 20),
      email: sanitizeText(data.email).toLowerCase().slice(0, 255),
      password: data.password, // パスワードはハッシュ化されるのでサニタイズしない
      confirmPassword: data.confirmPassword
    }
  },

  /**
   * ユーザーログインデータのサニタイゼーション
   */
  userLogin: (data: {
    email: string
    password: string
  }) => {
    const emailValidation = InputValidation.validateEmail(data.email)
    
    if (!emailValidation.isValid) {
      throw new Error(`Email validation failed: ${emailValidation.errors.join(', ')}`)
    }
    
    return {
      email: sanitizeText(data.email).toLowerCase().slice(0, 255),
      password: data.password // パスワードはハッシュ化されるのでサニタイズしない
    }
  },

  /**
   * 日記データのサニタイゼーション（型安全性強化）
   */
  diary: (data: {
    title: string
    content: string
    date: string
    mood: number | string // PRレビューで指摘された型の曖昧さを明確化
  }) => {
    // 入力値検証
    const titleValidation = InputValidation.validateInput(data.title, {
      maxLength: 100,
      minLength: 1,
      allowHTML: false
    })
    
    const contentValidation = InputValidation.validateInput(data.content, {
      maxLength: 5000,
      minLength: 1,
      allowHTML: false
    })
    
    if (!titleValidation.isValid) {
      throw new Error(`Title validation failed: ${titleValidation.errors.join(', ')}`)
    }
    
    if (!contentValidation.isValid) {
      throw new Error(`Content validation failed: ${contentValidation.errors.join(', ')}`)
    }
    
    // 日付の検証
    const dateValidation = validateDate(data.date)
    if (!dateValidation.isValid) {
      throw new Error(`Date validation failed: ${dateValidation.error}`)
    }
    
    // 気分値のサニタイゼーション（型安全性強化）
    const sanitizedMood = sanitizeNumber(data.mood, {
      min: 0,
      max: 100,
      defaultValue: 50,
      allowFloat: false
    })
    
    return {
      title: sanitizeText(data.title).slice(0, 100),
      content: normalizeLineBreaks(sanitizeText(data.content)).slice(0, 5000),
      date: sanitizeText(data.date),
      mood: sanitizedMood // 常にnumber型を保証
    }
  },

  /**
   * アカウント設定データのサニタイゼーション
   */
  accountSettings: (data: {
    displayName?: string
    bio?: string
    preferences?: Record<string, unknown>
  }) => {
    const result: {
      displayName?: string
      bio?: string
      preferences?: Record<string, unknown>
    } = {}
    
    if (data.displayName !== undefined) {
      const nameValidation = InputValidation.validateInput(data.displayName, {
        maxLength: 50,
        allowHTML: false
      })
      
      if (nameValidation.isValid) {
        result.displayName = sanitizeText(data.displayName).slice(0, 50)
      }
    }
    
    if (data.bio !== undefined) {
      const bioValidation = InputValidation.validateInput(data.bio, {
        maxLength: 500,
        allowHTML: false
      })
      
      if (bioValidation.isValid) {
        result.bio = normalizeLineBreaks(sanitizeText(data.bio)).slice(0, 500)
      }
    }
    
    if (data.preferences !== undefined) {
      result.preferences = sanitizePreferences(data.preferences)
    }
    
    return result
  }
}

/**
 * 日付の検証（型安全）
 */
export const validateDate = (dateString: string): { isValid: boolean; error?: string } => {
  if (!dateString || typeof dateString !== 'string') {
    return { isValid: false, error: 'Date is required' }
  }
  
  const date = new Date(dateString)
  if (isNaN(date.getTime())) {
    return { isValid: false, error: 'Invalid date format' }
  }
  
  // 未来の日付をチェック
  const today = new Date()
  today.setHours(23, 59, 59, 999) // 今日の終わりまで許可
  if (date > today) {
    return { isValid: false, error: 'Future dates are not allowed' }
  }
  
  // 過去すぎる日付をチェック（100年前まで）
  const hundredYearsAgo = new Date()
  hundredYearsAgo.setFullYear(today.getFullYear() - 100)
  if (date < hundredYearsAgo) {
    return { isValid: false, error: 'Date is too far in the past' }
  }
  
  return { isValid: true }
}

/**
 * 設定オブジェクトのサニタイゼーション
 */
export const sanitizePreferences = (preferences: Record<string, unknown>): Record<string, unknown> => {
  const sanitized: Record<string, unknown> = {}
  
  for (const [key, value] of Object.entries(preferences)) {
    // キーのサニタイゼーション
    const sanitizedKey = sanitizeText(key).slice(0, 50)
    if (!sanitizedKey) continue
    
    // 値の型に応じたサニタイゼーション
    if (typeof value === 'string') {
      sanitized[sanitizedKey] = sanitizeText(value).slice(0, 1000)
    } else if (typeof value === 'number') {
      sanitized[sanitizedKey] = sanitizeNumber(value, { allowFloat: true })
    } else if (typeof value === 'boolean') {
      sanitized[sanitizedKey] = Boolean(value)
    } else if (value === null || value === undefined) {
      sanitized[sanitizedKey] = null
    } else if (Array.isArray(value)) {
      // 配列は最大10要素まで
      sanitized[sanitizedKey] = value.slice(0, 10).map(item => {
        if (typeof item === 'string') {
          return sanitizeText(item).slice(0, 100)
        } else if (typeof item === 'number') {
          return sanitizeNumber(item, { allowFloat: true })
        }
        return null
      }).filter(item => item !== null)
    }
    // オブジェクトや関数などは無視
  }
  
  return sanitized
}

/**
 * CSVやJSON出力用のサニタイゼーション
 */
export const sanitizeForExport = (data: unknown): string => {
  if (data === null || data === undefined) {
    return ''
  }
  
  if (typeof data === 'string') {
    return sanitizeText(data)
  }
  
  if (typeof data === 'number') {
    return isFinite(data) ? data.toString() : '0'
  }
  
  if (typeof data === 'boolean') {
    return data.toString()
  }
  
  if (typeof data === 'object') {
    try {
      return sanitizeText(JSON.stringify(data))
    } catch {
      return '[object]'
    }
  }
  
  return sanitizeText(String(data))
}

/**
 * ファイル名のサニタイゼーション
 */
export const sanitizeFileName = (filename: string): string => {
  if (!filename || typeof filename !== 'string') return 'untitled'
  
  // 危険な文字を除去
  const sanitized = filename
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_') // Windows/Unix危険文字
    .replace(/^\.+/, '_') // 先頭のドット
    .replace(/\.+$/, '_') // 末尾のドット
    .slice(0, 255) // 長さ制限
  
  return sanitized || 'untitled'
}

/**
 * XSS攻撃パターンの検出
 */
export const detectXssPatterns = (input: string): boolean => {
  if (!input || typeof input !== 'string') {
    return false
  }
  
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
    /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
    /data:text\/html/gi,
    /vbscript:/gi,
    /expression\s*\(/gi
  ]
  
  return xssPatterns.some(pattern => pattern.test(input))
}

/**
 * SQLインジェクション攻撃パターンの検出
 */
export const detectSqlInjectionPatterns = (input: string): boolean => {
  if (!input || typeof input !== 'string') {
    return false
  }
  
  const sqlPatterns = [
    /'|\\'|;|--|(\s|\+)or(\s|\+)/gi,
    /'|\\'|;|--|(\s|\+)and(\s|\+)/gi,
    /'|\\'|;|--|(\s|\+)union(\s|\+)/gi,
    /'|\\'|;|--|(\s|\+)select(\s|\+)/gi,
    /'|\\'|;|--|(\s|\+)insert(\s|\+)/gi,
    /'|\\'|;|--|(\s|\+)update(\s|\+)/gi,
    /'|\\'|;|--|(\s|\+)delete(\s|\+)/gi,
    /'|\\'|;|--|(\s|\+)drop(\s|\+)/gi,
    /'|\\'|;|--|(\s|\+)create(\s|\+)/gi,
    /'|\\'|;|--|(\s|\+)alter(\s|\+)/gi
  ]
  
  return sqlPatterns.some(pattern => pattern.test(input))
}

/**
 * セキュリティチェック統合関数
 */
export const performSecurityCheck = (input: string): {
  isSecure: boolean
  threats: string[]
} => {
  const threats: string[] = []
  
  if (detectXssPatterns(input)) {
    threats.push('XSS攻撃パターンを検出しました')
  }
  
  if (detectSqlInjectionPatterns(input)) {
    threats.push('SQLインジェクション攻撃パターンを検出しました')
  }
  
  return {
    isSecure: threats.length === 0,
    threats
  }
}

// デフォルトエクスポート
export default {
  escapeHTML,
  sanitizeHtml,
  sanitizeText,
  normalizeLineBreaks,
  trimWhitespace,
  limitLength,
  sanitizeNumber,
  sanitizeFormData,
  validateDate,
  sanitizePreferences,
  sanitizeForExport,
  sanitizeFileName,
  detectXssPatterns,
  detectSqlInjectionPatterns,
  performSecurityCheck
}