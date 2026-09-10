/**
 * 목적: 인라인 배치 및 텍스트 감싸기(좌측/우측), 리사이징을 지원하는 TipTap 이미지 확장
 *
 * 사용법:
 *   ResizableInlineImage.configure({ allowBase64: true })
 *   editor.chain().focus().setImage({ src, wrap: 'left' }).run()
 *
 * props (node attributes):
 *   - src: 이미지 URL 또는 base64
 *   - alt: 대체 텍스트
 *   - title: 제목
 *   - width: 이미지 너비(px 숫자). null이면 원본 크기.
 *   - wrap: 텍스트 감싸기 모드 ('none' | 'left' | 'right', 기본 'none')
 *
 * 특징:
 *   - NodeView 루트를 <span>으로 렌더링하며, wrap 속성에 따라 float: left / float: right / inline-block 적용
 *   - 이미지 클릭 또는 호버 시 상단에 미니 플로팅 툴바(좌측 감싸기, 기본, 우측 감싸기, 삭제) 표시
 *   - 우측 하단 핸들을 드래그해 너비 조절 가능
 *   - 리사이징 및 툴바 조작 중 stopEvent로 ProseMirror 이벤트 간섭 차단
 *   - width/height 없이 viewBox만 있는 SVG가 크기 0으로 사라지는 크로미움 버그 보정
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
      wrap: {
        default: 'none',
        parseHTML: (el) =>
          el.getAttribute('data-wrap') || (el.style.float === 'left' ? 'left' : el.style.float === 'right' ? 'right' : 'none'),
        renderHTML: (attrs) => {
          if (!attrs.wrap || attrs.wrap === 'none') return {}
          return {
            'data-wrap': attrs.wrap,
            style: attrs.wrap === 'left'
              ? 'float: left; margin: 0.25rem 1rem 0.5rem 0;'
              : attrs.wrap === 'right'
              ? 'float: right; margin: 0.25rem 0 0.5rem 1rem;'
              : '',
          }
        },
      },
    }
  },

  renderHTML({ HTMLAttributes }) {
    return ['img', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)]
  },

  addNodeView() {
    return ({ node, getPos, view }) => {
      const wrapMode = node.attrs.wrap || 'none'
      const wrapper = document.createElement('span')

      const applyWrapperStyles = (currentWrap: string) => {
        let baseStyle = 'display: inline-block; position: relative; vertical-align: bottom; line-height: 0; cursor: default;'
        if (currentWrap === 'left') {
          baseStyle = 'display: block; float: left; margin: 0.25rem 1rem 0.5rem 0; position: relative; line-height: 0; cursor: default; clear: left;'
        } else if (currentWrap === 'right') {
          baseStyle = 'display: block; float: right; margin: 0.25rem 0 0.5rem 1rem; position: relative; line-height: 0; cursor: default; clear: right;'
        }
        wrapper.style.cssText = baseStyle
      }
      applyWrapperStyles(wrapMode)

      const img = document.createElement('img')
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

      img.onload = () => {
        if (!node.attrs.width && img.offsetWidth === 0 && img.naturalWidth > 0) {
          img.style.width = `${img.naturalWidth}px`
        }
      }
      img.src = node.attrs.src || ''

      wrapper.appendChild(img)

      // 리사이징 핸들 (우측 하단)
      const handle = document.createElement('span')
      handle.style.cssText =
        'position: absolute; bottom: 3px; right: 3px; width: 12px; height: 12px;' +
        'background: white; border: 2px solid #6b7280; border-radius: 50%;' +
        'cursor: nwse-resize; display: none; z-index: 10;'
      wrapper.appendChild(handle)

      // 감싸기/삭제 미니 플로팅 툴바
      const toolbar = document.createElement('div')
      toolbar.style.cssText =
        'position: absolute; top: -28px; left: 50%; transform: translateX(-50%);' +
        'display: none; align-items: center; gap: 2px; background: rgba(17, 24, 39, 0.92);' +
        'padding: 2px 4px; border-radius: 4px; z-index: 30; box-shadow: 0 2px 8px rgba(0,0,0,0.25);' +
        'white-space: nowrap; user-select: none;'

      const createBtn = (text: string, title: string, active: boolean, onClick: () => void) => {
        const btn = document.createElement('button')
        btn.type = 'button'
        btn.textContent = text
        btn.title = title
        btn.style.cssText =
          `padding: 2px 6px; font-size: 11px; font-family: sans-serif; border: none; border-radius: 3px; cursor: pointer; ` +
          (active
            ? 'background: #4f46e5; color: white; font-weight: bold;'
            : 'background: transparent; color: #d1d5db;')
        btn.onmouseenter = () => { if (!active) btn.style.color = 'white' }
        btn.onmouseleave = () => { if (!active) btn.style.color = '#d1d5db' }
        btn.onclick = (e) => {
          e.preventDefault()
          e.stopPropagation()
          onClick()
        }
        return btn
      }

      const renderToolbar = (currentWrap: string) => {
        toolbar.innerHTML = ''
        toolbar.appendChild(createBtn('👈 좌측', '텍스트 좌측 감싸기', currentWrap === 'left', () => setWrap('left')))
        toolbar.appendChild(createBtn('⏹ 기본', '기본 (인라인)', currentWrap === 'none', () => setWrap('none')))
        toolbar.appendChild(createBtn('👉 우측', '텍스트 우측 감싸기', currentWrap === 'right', () => setWrap('right')))
        toolbar.appendChild(createBtn('🗑️', '이미지 삭제', false, () => removeNode()))
      }

      const setWrap = (newWrap: 'none' | 'left' | 'right') => {
        if (typeof getPos === 'function') {
          const pos = getPos()
          if (pos !== undefined) {
            view.dispatch(
              view.state.tr.setNodeMarkup(pos, null, {
                ...node.attrs,
                wrap: newWrap,
              }),
            )
          }
        }
      }

      const removeNode = () => {
        if (typeof getPos === 'function') {
          const pos = getPos()
          if (pos !== undefined) {
            view.dispatch(view.state.tr.delete(pos, pos + node.nodeSize))
          }
        }
      }

      renderToolbar(node.attrs.wrap || 'none')
      wrapper.appendChild(toolbar)

      let isResizing = false
      let startX = 0
      let startWidth = 0

      const showUI = () => {
        handle.style.display = 'block'
        renderToolbar(node.attrs.wrap || 'none')
        toolbar.style.display = 'flex'
      }
      const hideUI = () => {
        if (!isResizing) {
          handle.style.display = 'none'
          toolbar.style.display = 'none'
        }
      }

      wrapper.addEventListener('mouseenter', showUI)
      wrapper.addEventListener('mouseleave', hideUI)
      img.addEventListener('click', (e) => {
        e.stopPropagation()
        showUI()
      })

      handle.addEventListener('mousedown', (e) => {
        e.preventDefault()
        e.stopPropagation()

        isResizing = true
        startX = e.clientX
        startWidth = img.offsetWidth

        const onMouseMove = (moveEvent: MouseEvent) => {
          if (!isResizing) return
          const newWidth = Math.max(40, startWidth + (moveEvent.clientX - startX))
          img.style.width = `${newWidth}px`
        }

        const onMouseUp = () => {
          if (!isResizing) return
          isResizing = false
          handle.style.display = 'none'
          toolbar.style.display = 'none'

          if (typeof getPos === 'function') {
            const pos = getPos()
            if (pos !== undefined) {
              view.dispatch(
                view.state.tr.setNodeMarkup(pos, null, {
                  ...node.attrs,
                  width: img.offsetWidth,
                }),
              )
            }
          }

          document.removeEventListener('mousemove', onMouseMove)
          document.removeEventListener('mouseup', onMouseUp)
        }

        document.addEventListener('mousemove', onMouseMove)
        document.addEventListener('mouseup', onMouseUp)
      })

      return {
        dom: wrapper,
        stopEvent(event) {
          return handle.contains(event.target as Node) || toolbar.contains(event.target as Node)
        },
      }
    }
  },
})

export default ResizableInlineImage
