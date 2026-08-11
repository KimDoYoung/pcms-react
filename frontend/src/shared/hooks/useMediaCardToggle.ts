/**
 * 목적: renderMarkdown() 결과물(dangerouslySetInnerHTML) 안에 박힌 `.media-card`
 *       (비디오/오디오/유튜브 토글 카드)를 실제로 열고 닫을 수 있게 해주는 훅.
 *       markdown-it이 만드는 결과는 정적 HTML 문자열이라 React 컴포넌트로 다룰 수 없으므로,
 *       컨테이너에 클릭 이벤트를 위임해 순수 DOM 조작으로 재생을 토글한다.
 *
 * 사용법:
 *   const containerRef = useRef<HTMLDivElement>(null)
 *   useMediaCardToggle(containerRef)
 *   <div ref={containerRef} className="markdown-body" dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />
 *
 * props: containerRef - 렌더링된 마크다운 HTML을 담고 있는 엘리먼트의 ref
 */
import { useEffect, type RefObject } from 'react'

function buildMediaElement(card: HTMLElement): HTMLElement {
  const type = card.dataset.mediaType
  const src = card.dataset.mediaSrc ?? ''
  const ytId = card.dataset.ytId

  if (type === 'youtube' && ytId) {
    const iframe = document.createElement('iframe')
    iframe.src = `https://www.youtube.com/embed/${ytId}`
    iframe.allowFullscreen = true
    return iframe
  }
  if (type === 'audio') {
    const audio = document.createElement('audio')
    audio.src = src
    audio.controls = true
    return audio
  }
  const video = document.createElement('video')
  video.src = src
  video.controls = true
  return video
}

export function useMediaCardToggle(containerRef: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    function onClick(e: MouseEvent) {
      const btn = (e.target as HTMLElement).closest<HTMLElement>('.media-toggle-btn')
      if (!btn || !container?.contains(btn)) return

      const card = btn.closest<HTMLElement>('.media-card')
      const body = card?.querySelector<HTMLElement>('.media-card-body')
      if (!card || !body) return

      const type = card.dataset.mediaType ?? 'video'
      const openLabel = type === 'youtube' ? '유튜브 숨기기' : type === 'audio' ? '오디오 숨기기' : '비디오 숨기기'
      const closeLabel = type === 'youtube' ? '유튜브 보이기' : type === 'audio' ? '오디오 보이기' : '비디오 보이기'

      const opening = body.hasAttribute('hidden')
      if (opening) {
        if (body.children.length === 0) {
          body.appendChild(buildMediaElement(card))
        }
        body.removeAttribute('hidden')
        card.classList.add('is-open')
        btn.textContent = openLabel
      } else {
        body.setAttribute('hidden', '')
        card.classList.remove('is-open')
        body.innerHTML = ''
        btn.textContent = closeLabel
      }
    }

    container.addEventListener('click', onClick)
    return () => container.removeEventListener('click', onClick)
  }, [containerRef])
}
