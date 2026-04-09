import { useEffect, useRef } from 'react'
import { Crepe } from '@milkdown/crepe'
import '@milkdown/crepe/theme/common/style.css'
import '@milkdown/crepe/theme/frame.css'

interface Props {
  /** 마운트 시 한 번만 읽히는 초기값 */
  defaultValue: string
  onChange: (markdown: string) => void
  placeholder?: string
}

export default function MilkdownEditor({ defaultValue, onChange, placeholder }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const onChangeRef = useRef(onChange)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    if (!containerRef.current) return

    const crepe = new Crepe({
      root: containerRef.current,
      defaultValue,
      featureConfigs: placeholder
        ? { [Crepe.Feature.Placeholder]: { text: placeholder } }
        : undefined,
    })

    // 변경 감지
    crepe.on((api) => {
      api.markdownUpdated((_ctx, markdown, prevMarkdown) => {
        if (markdown !== prevMarkdown) {
          onChangeRef.current(markdown)
        }
      })
    })

    crepe.create()

    return () => {
      crepe.destroy()
    }
    // defaultValue는 mount 시 1회만 읽음 — 의도적으로 deps 제외
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      ref={containerRef}
      className="border border-gray-200 rounded-lg overflow-hidden bg-white min-h-[300px]"
    />
  )
}
