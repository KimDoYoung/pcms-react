/**
 * 목적: renderMarkdown() 결과물(dangerouslySetInnerHTML) 안의 코드블록(```)에 삽입된
 *       `.code-copy-btn`을 눌렀을 때 코드 내용을 클립보드로 복사해주는 훅.
 *       markdown-it이 만드는 결과는 정적 HTML 문자열이라 React onClick을 못 붙이므로,
 *       컨테이너에 클릭 이벤트를 위임해 순수 DOM 조작으로 복사 동작을 구현한다.
 *
 * 사용법:
 *   const containerRef = useRef<HTMLDivElement>(null)
 *   useCodeBlockCopy(containerRef)
 *   <div ref={containerRef} className="markdown-body" dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />
 *
 * props: containerRef - 렌더링된 마크다운 HTML을 담고 있는 엘리먼트의 ref
 */
import { useEffect, type RefObject } from 'react'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { Check } from 'lucide-react'

const CHECK_ICON_SVG = renderToStaticMarkup(createElement(Check, { className: 'code-copy-icon' }))

export function useCodeBlockCopy(containerRef: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    function onClick(e: MouseEvent) {
      const btn = (e.target as HTMLElement).closest<HTMLElement>('.code-copy-btn')
      if (!btn || !container?.contains(btn) || btn.dataset.copying) return

      const code = btn.closest('.code-block')?.querySelector('pre code')
      const text = code?.textContent ?? ''
      if (!text) return

      navigator.clipboard.writeText(text).then(() => {
        btn.dataset.copying = '1'
        const original = btn.innerHTML
        btn.innerHTML = CHECK_ICON_SVG
        btn.classList.add('is-copied')
        setTimeout(() => {
          btn.innerHTML = original
          btn.classList.remove('is-copied')
          delete btn.dataset.copying
        }, 1500)
      })
    }

    container.addEventListener('click', onClick)
    return () => container.removeEventListener('click', onClick)
  }, [containerRef])
}
