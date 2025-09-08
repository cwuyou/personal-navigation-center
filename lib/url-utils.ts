/**
 * URL处理工具函数
 */

/**
 * 规范化URL，自动添加协议前缀
 * @param input 用户输入的URL
 * @returns 规范化后的URL
 */
export function normalizeUrl(input: string): string {
  if (!input || !input.trim()) {
    return input
  }

  const trimmed = input.trim()
  
  // 如果已经有协议前缀，直接返回
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed
  }
  
  // 如果是其他协议（如 ftp://, file:// 等），也直接返回
  if (trimmed.includes('://')) {
    return trimmed
  }
  
  // 自动添加 https:// 前缀
  return `https://${trimmed}`
}

/**
 * 验证URL是否有效
 * @param url URL字符串
 * @returns 是否为有效URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * 检查URL是否可能是有效的域名格式
 * @param input 用户输入
 * @returns 是否可能是有效域名
 */
export function isPossibleDomain(input: string): boolean {
  if (!input || !input.trim()) {
    return false
  }
  
  const trimmed = input.trim()
  
  // 基本的域名格式检查
  const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  
  // 移除可能的路径部分进行检查
  const domainPart = trimmed.split('/')[0].split('?')[0].split('#')[0]
  
  return domainRegex.test(domainPart)
}

/**
 * 智能处理用户输入的URL
 * @param input 用户输入
 * @returns 处理后的URL和是否需要自动获取标题
 */
export function processUserInput(input: string): {
  normalizedUrl: string
  shouldFetchTitle: boolean
  isValid: boolean
} {
  if (!input || !input.trim()) {
    return {
      normalizedUrl: input,
      shouldFetchTitle: false,
      isValid: false
    }
  }

  const trimmed = input.trim()
  
  // 如果已经是完整的URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return {
      normalizedUrl: trimmed,
      shouldFetchTitle: isValidUrl(trimmed),
      isValid: isValidUrl(trimmed)
    }
  }
  
  // 如果看起来像域名，自动添加https://
  if (isPossibleDomain(trimmed)) {
    const normalized = normalizeUrl(trimmed)
    return {
      normalizedUrl: normalized,
      shouldFetchTitle: isValidUrl(normalized),
      isValid: isValidUrl(normalized)
    }
  }
  
  // 其他情况，可能是无效输入
  return {
    normalizedUrl: trimmed,
    shouldFetchTitle: false,
    isValid: false
  }
}
