import { create } from 'zustand'

export type MessageType = 'success' | 'error' | 'warning' | 'info'
export type MessagePosition = 'top-center' | 'top-right' | 'bottom-right' | 'bottom-center'

export interface Message {
  id: string
  text: string
  type: MessageType
  duration: number
}

interface MessageStore {
  messages: Message[]
  position: MessagePosition
  addMessage: (msg: Omit<Message, 'id'>) => void
  removeMessage: (id: string) => void
  setPosition: (position: MessagePosition) => void
}

export const useMessageStore = create<MessageStore>((set) => ({
  messages: [],
  position: 'bottom-center',
  addMessage: (msg) =>
    set((state) => ({
      messages: [...state.messages, { ...msg, id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2) }],
    })),
  removeMessage: (id) =>
    set((state) => ({
      messages: state.messages.filter((m) => m.id !== id),
    })),
  setPosition: (position) => set({ position }),
}))
