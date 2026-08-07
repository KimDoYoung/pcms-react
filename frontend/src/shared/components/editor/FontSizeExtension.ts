/**
 * TipTap 커스텀 확장 - 글자 크기(fontSize)
 *
 * 목적: TextStyle mark에 fontSize 속성을 추가해 선택 영역의 글자 크기를 개별 조절.
 * 사용법:
 *   extensions: [TextStyle, FontSize, ...]
 *   editor.chain().focus().setFontSize('20px').run()
 *   editor.chain().focus().unsetFontSize().run()
 *   editor.getAttributes('textStyle').fontSize // 현재 값 조회 (없으면 undefined)
 */
import { Extension } from '@tiptap/core'
import '@tiptap/extension-text-style'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    fontSize: {
      setFontSize: (size: string) => ReturnType
      unsetFontSize: () => ReturnType
    }
  }
}

export const FontSize = Extension.create({
  name: 'fontSize',

  addOptions() {
    return { types: ['textStyle'] }
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) => element.style.fontSize || null,
            renderHTML: (attributes) => {
              if (!attributes.fontSize) return {}
              return { style: `font-size: ${attributes.fontSize}` }
            },
          },
        },
      },
    ]
  },

  addCommands() {
    return {
      setFontSize:
        (size: string) =>
        ({ chain }) =>
          chain().setMark('textStyle', { fontSize: size }).run(),
      unsetFontSize:
        () =>
        ({ chain }) =>
          chain().setMark('textStyle', { fontSize: null }).run(),
    }
  },
})

export default FontSize
