import { ImageResponse } from 'next/og'
import React from 'react'

export const runtime = 'edge'

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 24,
          background: '#3b82f6',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          borderRadius: '20%',
        }}
      >
        🏠
      </div>
    ),
    {
      width: 32,
      height: 32,
    }
  )
}
