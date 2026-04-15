import { useCallback } from 'react'
import { useMessageStore, type MessageType, type MessagePosition } from '@/shared/store/messageStore'

export function useMessage() {
  const addMessage = useMessageStore(state => state.addMessage)
  const setPosition = useMessageStore(state => state.setPosition)

  const showMessage = useCallback((text: string, type: MessageType = 'info', duration = 3000) => {
    addMessage({ text, type, duration })
  }, [addMessage])

  const changePosition = useCallback((position: MessagePosition) => {
    setPosition(position)
  }, [setPosition])

  return { showMessage, changePosition }
}
