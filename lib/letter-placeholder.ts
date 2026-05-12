// 封面图/图标的"字母+纯色"占位样式。
// 这里的调色板和 hash 函数必须与 app/api/screenshot/route.ts 保持一致,
// 保证服务端 SVG 兜底和客户端 placeholder 在颜色上完全一致。

const PALETTE = [
  '#1e88e5',
  '#43a047',
  '#e53935',
  '#fb8c00',
  '#8e24aa',
  '#00897b',
  '#3949ab',
  '#d81b60',
  '#6d4c41',
  '#546e7a',
  '#7cb342',
  '#039be5',
]

function pickColor(seed: string): string {
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) | 0
  }
  return PALETTE[Math.abs(h) % PALETTE.length]
}

function getInitial(host: string): string {
  const cleaned = host.replace(/^www\./, '')
  const ch = cleaned.charAt(0)
  return ch ? ch.toUpperCase() : '?'
}

export interface LetterPlaceholder {
  color: string
  letter: string
}

export function getLetterPlaceholder(url: string): LetterPlaceholder {
  try {
    const host = new URL(url).hostname
    const cleanHost = host.replace(/^www\./, '')
    return { color: pickColor(cleanHost), letter: getInitial(host) }
  } catch {
    return { color: '#546e7a', letter: '?' }
  }
}
