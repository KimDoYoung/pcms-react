/**
 * 목적: 인라인으로 배치 가능한 리사이징 이미지 TipTap 확장
 *
 * 사용법:
 *   ResizableInlineImage.configure({ allowBase64: true })
 *   editor.chain().focus().setImage({ src }).run()
 *
 * props (node attributes):
 *   - src: 이미지 URL 또는 base64
 *   - alt: 대체 텍스트
 *   - title: 제목
 *   - width: 이미지 너비(px 숫자). null이면 원본 크기.
 *
 * 특징:
 *   - NodeView 루트를 <span>(인라인 요소)으로 렌더링 → 같은 단락 내 이미지들이 나란히 배치됨
 *   - 우측 하단 핸들을 드래그해 너비 조절 가능
 *   - 리사이징 중 stopEvent로 ProseMirror 이벤트 간섭 차단
 */
import Image from '@tiptap/extension-image'
import { mergeAttributes } from '@tiptap/core'

const ResizableInlineImage = Image.extend({
  inline: true,

  group: 'inline',

  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (el) =>
          el.getAttribute('width') || el.style.width?.replace('px', '') || null,
        renderHTML: (attrs) =>
          attrs.width ? { width: attrs.width, style: `width: ${attrs.width}px` } : {},
      },
    }
  },

  renderHTML({ HTMLAttributes }) {
    return ['img', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)]
  },

  addNodeView() {
    return ({ node, getPos, view }) => {
      // <span>을 루트로 사용 → 인라인 요소이므로 같은 <p> 안에서 나란히 배치됨
      const wrapper = document.createElement('span')
      wrapper.style.cssText =
        'display: inline-block; position: relative; vertical-align: bottom; line-height: 0; cursor: default;'

      const img = document.createElement('img')
      img.src = node.attrs.src || ''
      if (node.attrs.alt) img.alt = node.attrs.alt
      if (node.attrs.title) img.title = node.attrs.title
      img.style.cssText = [
        'display: block',
        'max-width: 100%',
        'border-radius: 0.375rem',
        node.attrs.width ? `width: ${node.attrs.width}px` : '',
      ]
        .filter(Boolean)
        .join('; ')

      wrapper.appendChild(img)

      // 리사이징 핸들 (우측 하단)
      const handle = document.createElement('span')
      handle.style.cssText =
        'position: absolute; bottom: 3px; right: 3px; width: 12px; height: 12px;' +
        'background: white; border: 2px solid #6b7280; border-radius: 50%;' +
        'cursor: nwse-resize; display: none; z-index: 10;'
      wrapper.appendChild(handle)

      let isResizing = false
      let startX = 0
      let startWidth = 0

      const showHandle = () => {
        handle.style.display = 'block'
      }
      const hideHandle = () => {
        if (!isResizing) handle.style.display = 'none'
      }

      wrapper.addEventListener('mouseenter', showHandle)
      wrapper.addEventListener('mouseleave', hideHandle)

      handle.addEventListener('mousedown', (e) => {
        e.preventDefault()
        e.stopPropagation()
        isResizing = true
        startX = e.clientX
        startWidth = img.offsetWidth

        const onMouseMove = (e: MouseEvent) => {
          if (!isResizing) return
          const newWidth = Math.max(40, startWidth + (e.clientX - startX))
          img.style.width = `${newWidth}px`
        }

        const onMouseUp = () => {
          if (!isResizing) return
          isResizing = false
          handle.style.display = 'none'

          if (typeof getPos === 'function') {
            view.dispatch(
              view.state.tr.setNodeMarkup(getPos(), null, {
                ...node.attrs,
                width: img.offsetWidth,
              }),
            )
          }

          document.removeEventListener('mousemove', onMouseMove)
          document.removeEventListener('mouseup', onMouseUp)
        }

        document.addEventListener('mousemove', onMouseMove)
        document.addEventListener('mouseup', onMouseUp)
      })

      return {
        dom: wrapper,
        // 리사이징 핸들에서 발생한 이벤트만 ProseMirror에서 차단
        stopEvent(event) {
          return handle.contains(event.target as Node)
        },
      }
    }
  },
})

export default ResizableInlineImage
