export interface ChatMessage {
  id: number
  sender: string
  content: string
  message_type: 'message' | 'request' | 'response' | 'status' | 'handoff' | 'done'
  channel: string
  in_reply_to?: number
  timestamp: string
}

export interface Channel {
  name: string
  message_count: number
  last_activity: string
}

export interface Instance {
  instance_id: string
  description?: string
  status: 'online' | 'offline'
  last_seen?: string
}

export const SENDER_COLORS: Record<string, { bg: string; text: string; avatar: string }> = {
  strategist: { bg: 'bg-purple-100', text: 'text-purple-800', avatar: 'bg-purple-500' },
  'code-worker': { bg: 'bg-blue-100', text: 'text-blue-800', avatar: 'bg-blue-500' },
  'code-worker-2': { bg: 'bg-emerald-100', text: 'text-emerald-800', avatar: 'bg-emerald-500' },
  '건주': { bg: 'bg-gray-100', text: 'text-gray-800', avatar: 'bg-gray-800' },
  '이사님': { bg: 'bg-gray-100', text: 'text-gray-600', avatar: 'bg-gray-400' },
}

export const SENDER_NAMES: Record<string, string> = {
  strategist: '영희',
  'code-worker': '철수',
  'code-worker-2': '동수',
  '건주': '건주',
  '이사님': '이사님',
}

export const MESSAGE_TYPE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  request: { bg: 'bg-orange-100', text: 'text-orange-700', label: '요청' },
  done: { bg: 'bg-green-100', text: 'text-green-700', label: '완료' },
  status: { bg: 'bg-blue-100', text: 'text-blue-700', label: '상태' },
  message: { bg: 'bg-gray-100', text: 'text-gray-600', label: '메시지' },
  response: { bg: 'bg-indigo-100', text: 'text-indigo-700', label: '응답' },
  handoff: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: '인계' },
}
