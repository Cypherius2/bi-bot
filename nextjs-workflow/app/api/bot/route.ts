import { NextRequest, NextResponse } from 'next/server'

// Integration with existing bot API
const BOT_API_BASE = process.env.BOT_API_BASE || '/api'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const endpoint = searchParams.get('endpoint') || 'account'
  const botUrl = `${BOT_API_BASE}/${endpoint}`

  try {
    const response = await fetch(botUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Bot API error: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Bot integration error:', error)
    return NextResponse.json(
      { error: 'Failed to connect to bot API', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 503 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { endpoint, method = 'POST', data } = body

    if (!endpoint) {
      return NextResponse.json({ error: 'Endpoint required' }, { status: 400 })
    }

    const botUrl = `${BOT_API_BASE}/${endpoint}`

    const response = await fetch(botUrl, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    })

    if (!response.ok) {
      throw new Error(`Bot API error: ${response.status}`)
    }

    const result = await response.json()
    return NextResponse.json(result)
  } catch (error) {
    console.error('Bot integration error:', error)
    return NextResponse.json(
      { error: 'Failed to execute bot action', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 503 }
    )
  }
}

// Health check for bot connection
export async function HEAD(request: NextRequest) {
  try {
    const botUrl = `${BOT_API_BASE}/health`
    const response = await fetch(botUrl, { method: 'HEAD' })
    
    if (response.ok) {
      return new NextResponse(null, { status: 200 })
    } else {
      return new NextResponse(null, { status: 503 })
    }
  } catch (error) {
    return new NextResponse(null, { status: 503 })
  }
}