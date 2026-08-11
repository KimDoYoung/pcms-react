/**
 * 목적: HTML 에디터(ContentEditor/TipTap)에 비디오/오디오/유튜브를 삽입하기 위한 커스텀 블록 노드.
 *       ResizableInlineImage.ts와 같은 패턴(Node.create + mergeAttributes)으로 만든 atom 노드.
 *
 * 사용법:
 *   MediaEmbedExtension  // ContentEditor의 extensions 배열에 추가
 *   editor.chain().focus().insertContent({
 *     type: 'mediaEmbed',
 *     attrs: { mediaType: 'video', src: 'https://...', label: '제목' },
 *   }).run()
 *
 * props (node attributes):
 *   - mediaType: 'video' | 'audio' | 'youtube'
 *   - src: 비디오/오디오 재생 URL (youtube면 미사용)
 *   - ytId: 유튜브 영상 ID (mediaType이 youtube일 때만)
 *   - label: 제목(title 속성으로만 쓰임, 화면에 별도 표시 없음)
 *
 * 특징:
 *   - atom 블록 노드라 통째로 선택/삭제된다 (내부 편집 불가)
 *   - renderHTML이 실제 <video>/<audio>/<iframe> 태그를 만들어 저장 HTML에 그대로 남는다
 *   - parseHTML이 그 태그들을 역으로 인식해 재편집(setContent) 시에도 노드가 그대로 복원된다
 */
import { Node, mergeAttributes } from '@tiptap/core'

export type MediaEmbedType = 'video' | 'audio' | 'youtube'

const MediaEmbedExtension = Node.create({
  name: 'mediaEmbed',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: false,

  addAttributes() {
    return {
      mediaType: { default: 'video' },
      src: { default: null },
      ytId: { default: null },
      label: { default: null },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'video[src]',
        getAttrs: (el) => ({
          mediaType: 'video',
          src: (el as HTMLElement).getAttribute('src'),
          label: (el as HTMLElement).getAttribute('title'),
        }),
      },
      {
        tag: 'audio[src]',
        getAttrs: (el) => ({
          mediaType: 'audio',
          src: (el as HTMLElement).getAttribute('src'),
          label: (el as HTMLElement).getAttribute('title'),
        }),
      },
      {
        tag: 'iframe[src*="youtube.com/embed/"]',
        getAttrs: (el) => {
          const src = (el as HTMLElement).getAttribute('src') || ''
          const match = src.match(/embed\/([\w-]+)/)
          return {
            mediaType: 'youtube',
            ytId: match ? match[1] : null,
            label: (el as HTMLElement).getAttribute('title'),
          }
        },
      },
    ]
  },

  renderHTML({ node, HTMLAttributes }) {
    const { mediaType, src, ytId, label } = node.attrs

    if (mediaType === 'youtube') {
      return [
        'iframe',
        mergeAttributes(HTMLAttributes, {
          src: `https://www.youtube.com/embed/${ytId}`,
          title: label || undefined,
          allowfullscreen: 'true',
          style: 'width:80%;aspect-ratio:16/9;border:none;border-radius:0.5rem;display:block;margin:0.75rem 0;',
        }),
      ]
    }

    const tag = mediaType === 'audio' ? 'audio' : 'video'
    return [
      tag,
      mergeAttributes(HTMLAttributes, {
        src,
        title: label || undefined,
        controls: 'true',
        style: 'width:80%;border-radius:0.5rem;display:block;margin:0.75rem 0;',
      }),
    ]
  },
})

export default MediaEmbedExtension
