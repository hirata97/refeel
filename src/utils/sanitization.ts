import DOMPurify from 'dompurify'

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

// HTMLサニタイゼーション
export const sanitizeHtml = (input: string): string => {
  if (!input || typeof input !== 'string') {
    return ''
  }
  
  return DOMPurify.sanitize(input, purifyConfig)
}

// プレーンテキストサニタイゼーション（HTMLタグを完全に除去）
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

// 特殊文字のエスケープ
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

// SQLインジェクション対策のための文字列エスケープ
export const escapeSqlString = (input: string): string => {
  if (!input || typeof input !== 'string') {
    return ''
  }
  
  // シングルクォートをエスケープ
  return input.replace(/'/g, "''")
}

// 改行コードの正規化
export const normalizeLineBreaks = (input: string): string => {
  if (!input || typeof input !== 'string') {
    return ''
  }
  
  return input
    .replace(/\r\n/g, '\n')  // Windows
    .replace(/\r/g, '\n')    // Mac
    .replace(/\n+/g, '\n')   // 連続する改行を1つに
    .trim()
}

// ファイル名のサニタイゼーション
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

// URLのサニタイゼーション
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

// 入力データの包括的サニタイゼーション
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

// フォームデータの専用サニタイゼーション
export const sanitizeFormData = {
  // ユーザー登録データ
  userRegistration: (data: {
    username: string
    email: string
    password: string
    confirmPassword: string
  }) => ({
    username: sanitizeText(data.username).slice(0, 20),
    email: sanitizeText(data.email).toLowerCase().slice(0, 254),
    password: data.password, // パスワードはハッシュ化前なのでそのまま
    confirmPassword: data.confirmPassword
  }),
  
  // ログインデータ
  userLogin: (data: {
    email: string
    password: string
  }) => ({
    email: sanitizeText(data.email).toLowerCase().slice(0, 254),
    password: data.password // パスワードはハッシュ化前なのでそのまま
  }),
  
  // 日記データ
  diary: (data: {
    title: string
    content: string
    date: string
    mood: number
  }) => ({
    title: sanitizeText(data.title).slice(0, 100),
    content: normalizeLineBreaks(sanitizeText(data.content)).slice(0, 5000),
    date: sanitizeText(data.date),
    mood: isFinite(data.mood) ? Math.max(1, Math.min(5, Math.round(data.mood))) : 1
  })
}

// XSS攻撃パターンの検出
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

// SQLインジェクション攻撃パターンの検出
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

// セキュリティチェック統合関数
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