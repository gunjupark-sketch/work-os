import { NextRequest, NextResponse } from 'next/server'

const MCP_URL = 'https://mcp.medistaxion.com/mcp?api_key=cd1118d537ff78732aa5dfe082e1b18ada6c8efd3db66467ef4afac395ac0100'

async function callMCP(method: string, args: Record<string, unknown>) {
  const res = await fetch(MCP_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'tools/call',
      params: { name: method, arguments: args },
      id: Date.now(),
    }),
  })
  const json = await res.json()
  if (json.error) {
    return { error: json.error.message || 'MCP error' }
  }
  // MCP returns result.content[0].text
  const text = json.result?.content?.[0]?.text
  if (text) {
    try {
      return JSON.parse(text)
    } catch {
      return { text }
    }
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
