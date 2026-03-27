import { NextRequest, NextResponse } from 'next/server'

const MCP_URL = 'https://mcp.medistaxion.com/mcp?api_key=cd1118d537ff78732aa5dfe082e1b18ada6c8efd3db66467ef4afac395ac0100'
const HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json, text/event-stream',
}

// Session cache (serverless per-instance)
let sessionId: string | null = null
let sessionCreatedAt = 0
const SESSION_TTL = 4 * 60 * 1000 // 4 min

function parseSSE(text: string) {
  // SSE format: "event: message\ndata: {...}"
  const lines = text.split('\n')
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      try {
        return JSON.parse(line.slice(6))
      } catch {
        // ignore
      }
    }
  }
  // Try parsing as raw JSON
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

async function initSession(): Promise<string | null> {
  // Reuse if fresh
  if (sessionId && Date.now() - sessionCreatedAt < SESSION_TTL) {
    return sessionId
  }

  // Step 1: Initialize
  const initRes = await fetch(MCP_URL, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'initialize',
      params: {
        protocolVersion: '2025-03-26',
        capabilities: {},
        clientInfo: { name: 'work-os-chat', version: '1.0' },
      },
      id: 1,
    }),
  })

  const newSessionId = initRes.headers.get('mcp-session-id')
  if (!newSessionId) return null

  // Step 2: Send initialized notification
  await fetch(MCP_URL, {
    method: 'POST',
    headers: { ...HEADERS, 'mcp-session-id': newSessionId },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'notifications/initialized',
    }),
  })

  sessionId = newSessionId
  sessionCreatedAt = Date.now()
  return sessionId
}

async function callMCP(method: string, args: Record<string, unknown>) {
  const sid = await initSession()
  if (!sid) return { error: 'Failed to initialize MCP session' }

  const res = await fetch(MCP_URL, {
    method: 'POST',
    headers: { ...HEADERS, 'mcp-session-id': sid },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'tools/call',
      params: { name: method, arguments: args },
      id: Date.now(),
    }),
  })

  const raw = await res.text()
  const json = parseSSE(raw)

  if (!json) return { error: 'Failed to parse MCP response' }

  if (json.error) {
    // Session expired — retry once
    if (json.error.message?.includes('not initialized') || json.error.message?.includes('Session')) {
      sessionId = null
      const retrySid = await initSession()
      if (!retrySid) return { error: 'Failed to re-initialize MCP session' }

      const retryRes = await fetch(MCP_URL, {
        method: 'POST',
        headers: { ...HEADERS, 'mcp-session-id': retrySid },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'tools/call',
          params: { name: method, arguments: args },
          id: Date.now(),
        }),
      })
      const retryRaw = await retryRes.text()
      const retryJson = parseSSE(retryRaw)
      if (!retryJson || retryJson.error) {
        return { error: retryJson?.error?.message || 'MCP retry failed' }
      }
      const retryText = retryJson.result?.content?.[0]?.text
      if (retryText) {
        try { return JSON.parse(retryText) } catch { return { text: retryText } }
      }
      return retryJson.result
    }
    return { error: json.error.message || 'MCP error' }
  }

  const text = json.result?.content?.[0]?.text
  if (text) {
    try { return JSON.parse(text) } catch { return { text } }
  }
  return json.result
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  if (action === 'messages') {
    const channel = searchParams.get('channel') || 'general'
    const afterId = searchParams.get('after_id')
    const limit = searchParams.get('limit') || '50'
    const args: Record<string, unknown> = { channel, limit: Number(limit) }
    if (afterId) args.after_id = Number(afterId)
    const data = await callMCP('check_messages', args)
    return NextResponse.json(data)
  }

  if (action === 'channels') {
    const data = await callMCP('list_channels', {})
    return NextResponse.json(data)
  }

  if (action === 'instances') {
    const data = await callMCP('list_instances', {})
    return NextResponse.json(data)
  }

  if (action === 'shared_data_list') {
    const data = await callMCP('list_shared_data', {})
    return NextResponse.json(data)
  }

  if (action === 'shared_data') {
    const key = searchParams.get('key')
    if (!key) return NextResponse.json({ error: 'key required' }, { status: 400 })
    const data = await callMCP('get_shared_data', { key })
    return NextResponse.json(data)
  }

  return NextResponse.json({ error: 'unknown action' }, { status: 400 })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { channel, content, sender, message_type, in_reply_to } = body

  if (!content || !sender) {
    return NextResponse.json({ error: 'content and sender required' }, { status: 400 })
  }

  const args: Record<string, unknown> = {
    channel: channel || 'general',
    content,
    sender,
    message_type: message_type || 'message',
  }
  if (in_reply_to) args.in_reply_to = Number(in_reply_to)

  const data = await callMCP('send_message', args)
  return NextResponse.json(data)
}
