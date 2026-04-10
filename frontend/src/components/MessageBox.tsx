import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { useMessageStore, type Message, type MessagePosition } from '@/store/messageStore'

const POSITION_CLASSES: Record<MessagePosition, string> = {
  'top-center': 'top-4 left-1/2 -translate-x-1/2',
  'top-right': 'top-4 right-4',
  'bottom-right': 'bottom-4 right-4',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
}

const TYPE_CLASSES: Record<Message['type'], { container: string; bar: string; icon: string }> = {
  success: {
    container: 'bg-green-50 border-green-200 text-green-800',
    bar: 'bg-green-400',
    icon: '✓',
  },
  error: {
    container: 'bg-red-50 border-red-200 text-red-800',
    bar: 'bg-red-400',
    icon: '✕',
  },
  warning: {
    container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    bar: 'bg-yellow-400',
    icon: '⚠',
  },
  info: {
    container: 'bg-blue-50 border-blue-200 text-blue-800',
    bar: 'bg-blue-400',
    icon: 'ℹ',
  },
}

function MessageItem({ message }: { message: Message }) {
  const removeMessage = useMessageStore((s) => s.removeMessage)
  const style = TYPE_CLASSES[message.type]
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      removeMessage(message.id)
    }, message.duration)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [message.id, message.duration, removeMessage])

  return (
    <div
      className={`relative w-80 rounded-lg border shadow-md overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200 ${style.container}`}
    >
      <div className="flex items-start gap-3 px-4 py-3">
        <span className="text-base font-bold shrink-0 mt-0.5">{style.icon}</span>
        <p className="flex-1 text-sm font-medium leading-snug">{message.text}</p>
        <button
          onClick={() => removeMessage(message.id)}
          className="shrink-0 opacity-50 hover:opacity-100 transition-opacity"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 카운트다운 바 */}
      <div
        className={`absolute bottom-0 left-0 h-1 ${style.bar}`}
        style={{
          animation: `countdown ${message.duration}ms linear forwards`,
        }}
      />

      <style>{`
        @keyframes countdown {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  )
}

export default function MessageBox() {
  const { messages, position } = useMessageStore()

  if (messages.length === 0) return null

  return (
    <div className={`fixed z-[100] flex flex-col gap-2 ${POSITION_CLASSES[position]}`}>
      {messages.map((msg) => (
        <MessageItem key={msg.id} message={msg} />
      ))}
    </div>
  )
}
