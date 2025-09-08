import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  // 返回一个简单的SVG favicon
  const svg = `
    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="6" fill="#3b82f6"/>
      <text x="16" y="22" text-anchor="middle" font-size="18" fill="white">🏠</text>
    </svg>
  `

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
