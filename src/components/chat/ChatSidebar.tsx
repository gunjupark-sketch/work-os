'use client'

import { Channel, Instance, SENDER_COLORS, SENDER_NAMES } from '@/types/chat'
import { Hash, Users } from 'lucide-react'

interface ChatSidebarProps {
  channels: Channel[]
  instances: Instance[]
  activeChannel: string
  onSelectChannel: (name: string) => void
}

export default function ChatSidebar({ channels, instances, activeChannel, onSelectChannel }: ChatSidebarProps) {
  return (
    <div className="w-56 flex-shrink-0 border-r border-navy/10 bg-white/60 flex flex-col">
      {/* Channels */}
      <div className="p-3">
        <h3 className="text-[11px] font-semibold text-navy/40 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Hash size={12} /> 채널
        </h3>
        <div className="space-y-0.5">
          {channels.map((ch) => (
            <button
              key={ch.name}
              onClick={() => onSelectChannel(ch.name)}
              className={`w-full text-left px-2.5 py-1.5 rounded-md text-sm transition-colors ${
                activeChannel === ch.name
                  ? 'bg-navy text-white'
                  : 'text-navy/70 hover:bg-navy/5'
              }`}
            >
              <span className="font-medium">#{ch.name}</span>
              <span className={`ml-1.5 text-[11px] ${activeChannel === ch.name ? 'text-white/60' : 'text-navy/30'}`}>
                {ch.message_count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Instances */}
      <div className="p-3 mt-auto border-t border-navy/10">
        <h3 className="text-[11px] font-semibold text-navy/40 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Users size={12} /> 인스턴스
        </h3>
        <div className="space-y-1.5">
          {instances.map((inst) => {
            const colors = SENDER_COLORS[inst.instance_id] || { avatar: 'bg-gray-400' }
            const displayName = SENDER_NAMES[inst.instance_id] || inst.instance_id
            return (
              <div key={inst.instance_id} className="flex items-center gap-2 text-xs">
                <div className="relative">
                  <div className={`w-6 h-6 rounded-full ${colors.avatar} flex items-center justify-center text-white text-[10px] font-bold`}>
                    {displayName.charAt(0)}
                  </div>
                  <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
                    inst.status === 'online' ? 'bg-green-400' : 'bg-gray-300'
                  }`} />
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-navy/70 truncate">{displayName}</div>
                  {inst.description && (
                    <div className="text-navy/30 truncate text-[10px]">{inst.description}</div>
                  )}
                </div>
              </div>
            )
          })}
          {instances.length === 0 && (
            <p className="text-navy/30 text-[11px]">접속 중인 인스턴스 없음</p>
          )}
        </div>
      </div>
    </div>
  )
}
