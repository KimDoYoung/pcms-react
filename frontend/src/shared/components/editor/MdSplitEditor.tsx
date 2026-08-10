/**
 * 목적: 마크다운 에디터의 툴바 + 편집창 + 실시간 미리보기를 한 화면에 묶은 스플릿 에디터.
 *       게시판 등 content_type=markdown 페이지에서 기존 <MdTextarea>를 대체해 사용한다.
 *       에디터를 스크롤하면 같은 원문 줄(data-source-line 기준)에 대응하는 미리보기 위치로 자동 스크롤된다.
 *
 * 사용법:
 *   <MdSplitEditor value={content} onChange={setContent} onSave={() => handleSave(true)} />
 *
 * props:
 *   - value: string - 마크다운 내용
 *   - onChange: (value: string) => void - 내용 변경 콜백
 *   - onSave?: () => void - Ctrl+S 저장 콜백
 */
import { useEffect, useRef, useState } from 'react'
import MdTextarea, { type MdTextareaHandle } from '@/shared/components/editor/MdTextarea'
import MdEditorToolbar from '@/shared/components/editor/MdEditorToolbar'
import AssetPickerPopup from '@/shared/components/editor/AssetPickerPopup'
import MediaSelectorModal from '@/shared/components/editor/MediaSelectorModal'
import { renderMarkdown } from '@/lib/markdownRenderer'
import { measureLineTops } from '@/lib/textareaLinePositions'
import { useMediaCardToggle } from '@/shared/hooks/useMediaCardToggle'
import type { AssetType } from '@/domain/asset/types/asset'

interface Props {
  value: string
  onChange: (value: string) => void
  onSave?: () => void
}

interface AssetPopupState {
  atype: AssetType
  position: { x: number; y: number }
}

export default function MdSplitEditor({ value, onChange, onSave }: Props) {
  const [previewOpen, setPreviewOpen] = useState(true)
  const [previewWidthPercent, setPreviewWidthPercent] = useState(50)
  const [resizingPreview, setResizingPreview] = useState(false)
  const [mediaOpen, setMediaOpen] = useState(false)
  const [assetPopup, setAssetPopup] = useState<AssetPopupState | null>(null)

  const editorRef = useRef<MdTextareaHandle>(null)
  const textareaDomRef = useRef<HTMLTextAreaElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const previewContainerRef = useRef<HTMLDivElement>(null)

  useMediaCardToggle(previewContainerRef)

  // F9: 미리보기 토글
  // Ctrl+1,2,3,4: asset picker 오픈 (textarea 커서 근처)
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'F9') {
        e.preventDefault()
        setPreviewOpen((prev) => !prev)
        return
      }
      if (e.ctrlKey && !e.shiftKey && !e.altKey) {
        const key = e.key
        const typeMap: Record<string, AssetType> = { '1': 'EMOJI', '2': 'SYMBOL', '3': 'PHRASE', '4': 'TEMPLATE' }
        if (typeMap[key]) {
          e.preventDefault()
          const textarea = textareaDomRef.current
          let position = { x: Math.max(8, window.innerWidth / 2 - 192), y: 120 }
          if (textarea) {
            const [topInTextarea] = measureLineTops(textarea, [textarea.selectionStart])
            const rect = textarea.getBoundingClientRect()
            const x = rect.left + 8
            const y = rect.top + topInTextarea - textarea.scrollTop + 20
            position = {
              x: Math.max(8, Math.min(x, window.innerWidth - 400)),
              y: Math.max(8, Math.min(y, window.innerHeight - 280)),
            }
          }
          setAssetPopup({ atype: typeMap[key], position })
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  // 스플리터 드래그
  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!resizingPreview || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const percent = ((e.clientX - rect.left) / rect.width) * 100
      setPreviewWidthPercent(Math.max(20, Math.min(percent, 80)))
    }
    function onMouseUp() {
      setResizingPreview(false)
    }
    if (resizingPreview) {
      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('mouseup', onMouseUp)
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [resizingPreview])

  // 에디터 <-> 미리보기 줄 단위 스크롤 동기화.
  useEffect(() => {
    const textarea = textareaDomRef.current
    const preview = previewContainerRef.current
    if (!textarea || !preview || !previewOpen) return

    let activeElement: 'editor' | 'preview' | null = null
    let rafId: number | null = null

    const lineStartOffsets: number[] = [0]
    for (let i = 0; i < value.length; i++) {
      if (value.charCodeAt(i) === 10) lineStartOffsets.push(i + 1)
    }
    const offsetOfLine = (line: number): number => {
      const idx = Math.max(0, Math.min(line - 1, lineStartOffsets.length - 1))
      return lineStartOffsets[idx]
    }

    const collectPreviewAnchors = (): { line: number; top: number }[] => {
      const nodes = preview.querySelectorAll<HTMLElement>('[data-source-line]')
      const previewRect = preview.getBoundingClientRect()
      const anchors: { line: number; top: number }[] = []
      nodes.forEach((el) => {
        const line = Number(el.getAttribute('data-source-line'))
        if (!Number.isFinite(line)) return
        const top = el.getBoundingClientRect().top - previewRect.top + preview.scrollTop
        anchors.push({ line, top })
      })
      anchors.sort((a, b) => a.line - b.line)
      return anchors
    }

    const measureEditorTops = (lines: number[]): number[] =>
      measureLineTops(textarea, lines.map(offsetOfLine))

    const handleEditorScroll = () => {
      if (activeElement === 'preview') return
      if (rafId !== null) return
      rafId = requestAnimationFrame(() => {
        rafId = null
        const previewAnchors = collectPreviewAnchors()
        if (previewAnchors.length < 2) return
        const editorTops = measureEditorTops(previewAnchors.map((a) => a.line))
        const scrollTop = textarea.scrollTop
        const lastIdx = editorTops.length - 1
        if (scrollTop <= editorTops[0]) { preview.scrollTop = 0; return }
        if (scrollTop >= editorTops[lastIdx]) { preview.scrollTop = preview.scrollHeight - preview.clientHeight; return }
        let i = 0
        while (i < lastIdx && editorTops[i + 1] <= scrollTop) i++
        const span = editorTops[i + 1] - editorTops[i]
        const fraction = span > 0 ? (scrollTop - editorTops[i]) / span : 0
        preview.scrollTop = previewAnchors[i].top + fraction * (previewAnchors[i + 1].top - previewAnchors[i].top)
      })
    }

    const handlePreviewScroll = () => {
      if (activeElement === 'editor') return
      if (rafId !== null) return
      rafId = requestAnimationFrame(() => {
        rafId = null
        const previewAnchors = collectPreviewAnchors()
        if (previewAnchors.length < 2) return
        const editorTops = measureEditorTops(previewAnchors.map((a) => a.line))
        const scrollTop = preview.scrollTop
        const lastIdx = previewAnchors.length - 1
        if (scrollTop <= previewAnchors[0].top) { textarea.scrollTop = 0; return }
        if (scrollTop >= previewAnchors[lastIdx].top) { textarea.scrollTop = textarea.scrollHeight - textarea.clientHeight; return }
        let i = 0
        while (i < lastIdx && previewAnchors[i + 1].top <= scrollTop) i++
        const span = previewAnchors[i + 1].top - previewAnchors[i].top
        const fraction = span > 0 ? (scrollTop - previewAnchors[i].top) / span : 0
        textarea.scrollTop = editorTops[i] + fraction * (editorTops[i + 1] - editorTops[i])
      })
    }

    const setEditorActive = () => { activeElement = 'editor' }
    const setPreviewActive = () => { activeElement = 'preview' }

    textarea.addEventListener('mouseenter', setEditorActive)
    textarea.addEventListener('focus', setEditorActive)
    textarea.addEventListener('scroll', handleEditorScroll)
    preview.addEventListener('mouseenter', setPreviewActive)
    preview.addEventListener('scroll', handlePreviewScroll)

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId)
      textarea.removeEventListener('mouseenter', setEditorActive)
      textarea.removeEventListener('focus', setEditorActive)
      textarea.removeEventListener('scroll', handleEditorScroll)
      preview.removeEventListener('mouseenter', setPreviewActive)
      preview.removeEventListener('scroll', handlePreviewScroll)
    }
  }, [value, previewOpen])

  function openAssetPicker(atype: AssetType, e: React.MouseEvent<HTMLButtonElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    setAssetPopup({ atype, position: { x: rect.left, y: rect.bottom + 4 } })
  }

  function handleAssetSelect(val: string) {
    editorRef.current?.insertText(val)
    setAssetPopup(null)
  }

  return (
    <div
      ref={containerRef}
      className="flex border border-gray-200 rounded-lg overflow-hidden bg-gray-100 items-stretch relative h-[65vh] min-h-[420px]"
    >
      <div
        className="bg-white flex flex-col border-r border-gray-200 shrink-0"
        style={{ width: previewOpen ? `${previewWidthPercent}%` : '100%' }}
      >
        <MdEditorToolbar
          editorRef={editorRef}
          previewOpen={previewOpen}
          setPreviewOpen={setPreviewOpen}
          onOpenMedia={() => setMediaOpen(true)}
          onOpenAssetPicker={openAssetPicker}
          value={value}
          onImportContent={onChange}
        />
        <MdTextarea
          ref={editorRef}
          value={value}
          onChange={onChange}
          onSave={onSave}
          onOpenAssetPicker={(atype, position) => setAssetPopup({ atype, position })}
          textareaRef={textareaDomRef}
        />
      </div>

      {previewOpen && (
        <div
          className={`w-1.5 cursor-col-resize hover:bg-indigo-500 border-r border-gray-200 transition-colors shrink-0 flex items-center justify-center z-20 ${
            resizingPreview ? 'bg-indigo-500' : 'bg-transparent'
          }`}
          onMouseDown={() => setResizingPreview(true)}
        >
          <div className="w-0.5 h-4 bg-gray-300 rounded-sm" />
        </div>
      )}

      {previewOpen && (
        <div className="bg-slate-50 flex flex-col flex-1 min-w-0">
          <div className="bg-slate-100 border-b border-gray-200 px-4 py-2 flex items-center text-gray-500 shrink-0">
            <span className="text-[10px] font-mono text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded font-bold tracking-wider">
              LIVE PREVIEW
            </span>
          </div>
          <div ref={previewContainerRef} className="flex-1 p-1 overflow-y-auto custom-scroll bg-slate-50/50">
            <div
              className="markdown-body bg-white p-4 border border-gray-100 rounded-md shadow-xs leading-relaxed min-h-full"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(value) }}
            />
          </div>
        </div>
      )}

      {assetPopup && (
        <AssetPickerPopup
          atype={assetPopup.atype}
          position={assetPopup.position}
          onSelect={handleAssetSelect}
          onClose={() => setAssetPopup(null)}
        />
      )}

      <MediaSelectorModal
        open={mediaOpen}
        onClose={() => setMediaOpen(false)}
        onSelect={(markdown) => {
          editorRef.current?.insertText(markdown, markdown.length, 0)
          setMediaOpen(false)
        }}
      />
    </div>
  )
}
