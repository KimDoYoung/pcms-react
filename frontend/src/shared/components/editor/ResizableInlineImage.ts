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
 *   - 이미지 클릭 시 선택 상태(isSelected)가 유지되어 상단 플로팅 툴바가 마우스 이동 시 사라지지 않음
 *   - 스마트 클램핑(Smart Clamping): 이미지가 에디터 좌/우측 가장자리에 있어도 툴바가 에디터 밖으로 잘리지 않고 안쪽으로 자동 보정
 *   - 상단 공간 부족 시 이미지 아래로 자동 반전(Flip)
 *   - 툴바와 이미지 사이에 투명 브릿지를 배치하여 호버 시에도 부드럽게 툴바로 마우스 이동 가능
 *   - 툴바 버튼 크기 및 가독성 확대 (좌측, 인라인, 우측, 삭제)
 *   - 우측 하단 핸들을 드래그해 너비 조절 가능
 *   - NodeView update 및 destroy 생명주기 완비 (문서 외부 클릭 리스너 정리)
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
      let currentNode = node
      const wrapMode = currentNode.attrs.wrap || 'none'
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
      if (currentNode.attrs.alt) img.alt = currentNode.attrs.alt
      if (currentNode.attrs.title) img.title = currentNode.attrs.title
      img.style.cssText = [
        'display: block',
        'max-width: 100%',
        'border-radius: 0.375rem',
        'transition: outline 0.15s ease',
        currentNode.attrs.width ? `width: ${currentNode.attrs.width}px` : '',
      ]
        .filter(Boolean)
        .join('; ')

      img.onload = () => {
        if (!currentNode.attrs.width && img.offsetWidth === 0 && img.naturalWidth > 0) {
          img.style.width = `${img.naturalWidth}px`
        }
      }
      img.src = currentNode.attrs.src || ''

      wrapper.appendChild(img)

      // 리사이징 핸들 (우측 하단)
      const handle = document.createElement('span')
      handle.style.cssText =
        'position: absolute; bottom: 2px; right: 2px; width: 14px; height: 14px;' +
        'background: #ffffff; border: 2px solid #4f46e5; border-radius: 50%;' +
        'cursor: nwse-resize; display: none; z-index: 40; box-shadow: 0 1px 4px rgba(0,0,0,0.35);'
      wrapper.appendChild(handle)

      // 감싸기/삭제 미니 플로팅 툴바
      const toolbar = document.createElement('div')
      toolbar.style.cssText =
        'position: absolute; bottom: calc(100% + 6px); left: 0;' +
        'display: none; align-items: center; gap: 4px; background: rgba(15, 23, 42, 0.95);' +
        'backdrop-filter: blur(4px); border: 1px solid rgba(255, 255, 255, 0.18);' +
        'padding: 4px 6px; border-radius: 6px; z-index: 50; box-shadow: 0 4px 14px rgba(0,0,0,0.35);' +
        'white-space: nowrap; user-select: none;'

      // 툴바와 이미지 사이의 마우스 이탈 방지 투명 브릿지 영역
      const bridge = document.createElement('div')
      bridge.style.cssText = 'position: absolute; top: 100%; left: 0; right: 0; height: 10px;'
      toolbar.appendChild(bridge)

      const createBtn = (
        text: string,
        title: string,
        active: boolean,
        onClick: () => void,
        isDanger = false,
      ) => {
        const btn = document.createElement('button')
        btn.type = 'button'
        btn.textContent = text
        btn.title = title
        const baseColor = isDanger ? '#f87171' : active ? '#ffffff' : '#cbd5e1'
        const bg = active ? '#4f46e5' : 'transparent'
        btn.style.cssText =
          `padding: 4px 8px; font-size: 12px; font-weight: 500; font-family: inherit; ` +
          `border: none; border-radius: 4px; cursor: pointer; transition: all 0.15s ease; ` +
          `display: inline-flex; align-items: center; ` +
          `background: ${bg}; color: ${baseColor};`
        btn.onmouseenter = () => {
          if (!active) {
            btn.style.background = isDanger ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.15)'
            btn.style.color = '#ffffff'
          }
        }
        btn.onmouseleave = () => {
          if (!active) {
            btn.style.background = 'transparent'
            btn.style.color = baseColor
          }
        }
        btn.onclick = (e) => {
          e.preventDefault()
          e.stopPropagation()
          onClick()
        }
        return btn
      }

      const renderToolbar = (currentWrap: string) => {
        toolbar.innerHTML = ''
        toolbar.appendChild(bridge)
        toolbar.appendChild(createBtn('👈 좌측', '텍스트 좌측 감싸기', currentWrap === 'left', () => setWrap('left')))
        toolbar.appendChild(createBtn('⏹ 인라인', '기본 (인라인)', currentWrap === 'none', () => setWrap('none')))
        toolbar.appendChild(createBtn('👉 우측', '텍스트 우측 감싸기', currentWrap === 'right', () => setWrap('right')))
        toolbar.appendChild(createBtn('🗑️ 삭제', '이미지 삭제', false, () => removeNode(), true))
      }

      const updateToolbarPosition = () => {
        if (toolbar.style.display === 'none') return

        const editorEl = view.dom
        const editorRect = editorEl.getBoundingClientRect()
        const wrapperRect = wrapper.getBoundingClientRect()
        const toolbarWidth = toolbar.offsetWidth || 250
        const toolbarHeight = toolbar.offsetHeight || 32

        // 중앙 배치 기준 leftPx
        let leftPx = (wrapperRect.width - toolbarWidth) / 2

        // 에디터 좌측 및 우측 경계 여백(8px) 기준 클램핑 (좌우 잘림 완벽 방지)
        const minLeftPx = editorRect.left + 8 - wrapperRect.left
        const maxLeftPx = editorRect.right - 8 - wrapperRect.left - toolbarWidth

        if (leftPx < minLeftPx) {
          leftPx = minLeftPx
        }
        if (leftPx > maxLeftPx) {
          leftPx = maxLeftPx
        }

        toolbar.style.left = `${Math.round(leftPx)}px`
        toolbar.style.transform = 'none'

        // 상단 공간 검사 (상단이 에디터 영역 밖으로 나가면 이미지 아래로 플립)
        if (wrapperRect.top - toolbarHeight - 6 < editorRect.top) {
          toolbar.style.bottom = 'auto'
          toolbar.style.top = 'calc(100% + 6px)'
          bridge.style.top = 'auto'
          bridge.style.bottom = '100%'
        } else {
          toolbar.style.top = 'auto'
          toolbar.style.bottom = 'calc(100% + 6px)'
          bridge.style.bottom = 'auto'
          bridge.style.top = '100%'
        }
      }

      const setWrap = (newWrap: 'none' | 'left' | 'right') => {
        if (typeof getPos === 'function') {
          const pos = getPos()
          if (pos !== undefined) {
            view.dispatch(
              view.state.tr.setNodeMarkup(pos, null, {
                ...currentNode.attrs,
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
            view.dispatch(view.state.tr.delete(pos, pos + currentNode.nodeSize))
          }
        }
      }

      renderToolbar(currentNode.attrs.wrap || 'none')
      wrapper.appendChild(toolbar)

      let isSelected = false
      let isHovered = false
      let isResizing = false
      let startX = 0
      let startWidth = 0

      const showUI = () => {
        handle.style.display = 'block'
        renderToolbar(currentNode.attrs.wrap || 'none')
        toolbar.style.display = 'flex'
        requestAnimationFrame(updateToolbarPosition)
      }

      const hideUI = () => {
        if (isSelected || isResizing) return
        handle.style.display = 'none'
        toolbar.style.display = 'none'
      }

      const selectImage = () => {
        isSelected = true
        img.style.outline = '2px solid #6366f1'
        img.style.outlineOffset = '2px'
        showUI()
      }

      const deselectImage = () => {
        isSelected = false
        img.style.outline = 'none'
        img.style.outlineOffset = '0px'
        if (!isHovered) {
          hideUI()
        }
      }

      wrapper.addEventListener('mouseenter', () => {
        isHovered = true
        showUI()
      })
      wrapper.addEventListener('mouseleave', () => {
        isHovered = false
        hideUI()
      })

      img.addEventListener('click', (e) => {
        e.preventDefault()
        e.stopPropagation()
        selectImage()
      })

      const onDocPointerDown = (e: MouseEvent) => {
        if (!wrapper.contains(e.target as Node)) {
          deselectImage()
        }
      }
      document.addEventListener('pointerdown', onDocPointerDown)

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
          updateToolbarPosition()
        }

        const onMouseUp = () => {
          if (!isResizing) return
          isResizing = false

          if (!isSelected && !isHovered) {
            handle.style.display = 'none'
            toolbar.style.display = 'none'
          } else {
            updateToolbarPosition()
          }

          if (typeof getPos === 'function') {
            const pos = getPos()
            if (pos !== undefined) {
              view.dispatch(
                view.state.tr.setNodeMarkup(pos, null, {
                  ...currentNode.attrs,
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
        update(updatedNode) {
          if (updatedNode.type !== node.type) return false
          currentNode = updatedNode
          applyWrapperStyles(currentNode.attrs.wrap || 'none')
          if (currentNode.attrs.width) {
            img.style.width = `${currentNode.attrs.width}px`
          }
          renderToolbar(currentNode.attrs.wrap || 'none')
          if (toolbar.style.display !== 'none') {
            requestAnimationFrame(updateToolbarPosition)
          }
          return true
        },
        selectNode() {
          selectImage()
        },
        deselectNode() {
          deselectImage()
        },
        destroy() {
          document.removeEventListener('pointerdown', onDocPointerDown)
        },
        stopEvent(event) {
          return handle.contains(event.target as Node) || toolbar.contains(event.target as Node)
        },
      }
    }
  },
})

export default ResizableInlineImage

