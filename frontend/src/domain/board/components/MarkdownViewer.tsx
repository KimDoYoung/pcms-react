/**
 * 목적: markdown 문자열을 HTML로 변환해 읽기 전용으로 표시하는 컴포넌트
 * 사용법:
 *   <MarkdownViewer content={post.content} />
 */
import { useMemo } from 'react'
import MarkdownIt from 'markdown-it'

const md = new MarkdownIt({
  html: false,      // 원시 HTML 삽입 비허용 (XSS 방지)
  linkify: true,    // URL 자동 링크화
  typographer: true,
  breaks: true,     // 줄바꿈을 <br>로 변환
})

interface Props {
  content: string
}

export default function MarkdownViewer({ content }: Props) {
  const html = useMemo(() => md.render(content || ''), [content])

  return (
    <div
      className="markdown-body"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
