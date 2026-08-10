/**
 * 목적: markdown 문자열을 HTML로 변환해 읽기 전용으로 표시하는 컴포넌트.
 *       비디오/오디오/유튜브 카드, 백틱 아이콘뱃지 등은 lib/markdownRenderer의 공용 규칙을 그대로 사용해
 *       에디터 미리보기(MdSplitEditor)와 동일하게 렌더링된다.
 * 사용법:
 *   <MarkdownViewer content={post.content} />
 */
import { useMemo, useRef } from 'react'
import { renderMarkdown } from '@/lib/markdownRenderer'
import { useMediaCardToggle } from '@/shared/hooks/useMediaCardToggle'

interface Props {
  content: string
}

export default function MarkdownViewer({ content }: Props) {
  const html = useMemo(() => renderMarkdown(content || ''), [content])
  const containerRef = useRef<HTMLDivElement>(null)
  useMediaCardToggle(containerRef)

  return (
    <div
      ref={containerRef}
      className="markdown-body"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
