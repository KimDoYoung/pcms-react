import { useMessageStore, type MessageType, type MessagePosition } from '@/shared/store/messageStore'

export function useMessage() {
  const { addMessage, setPosition } = useMessageStore()

  function showMessage(text: string, type: MessageType = 'info', duration = 3000) {
    addMessage({ text, type, duration })
  }

  function changePosition(position: MessagePosition) {
    setPosition(position)
  }

  return { showMessage, changePosition }
}
