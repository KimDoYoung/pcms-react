/**
 * 목적: MdTextarea(마크다운 에디터) 전용 툴바. 서식 삽입, 이모지/기호/상용구/템플릿, 이미지·비디오/오디오/유튜브 삽입,
 *       마크다운 복사, ZIP 내보내기/가져오기, HTML 내보내기(pcms_yyyyMMdd_HHmmss.html, 스타일 인라인된 독립 파일),
 *       미리보기 토글, 단축키 도움말을 제공한다.
 *
 * 사용법:
 *   <MdEditorToolbar
 *     editorRef={mdTextareaRef}
 *     previewOpen={previewOpen}
 *     setPreviewOpen={setPreviewOpen}
 *     onOpenMedia={() => setMediaOpen(true)}
 *     onOpenAssetPicker={(atype, e) => openPickerAt(atype, e)}
 *     value={markdownValue}
 *     onImportContent={(content) => setContent(content)}
 *   />
 *   MdSplitEditor 안에서만 사용된다 (MdTextareaHandle에 강하게 결합).
 *
 * props:
 *   - editorRef: MdTextarea의 forwardRef 핸들(MdTextareaHandle) - 서식 액션/텍스트 삽입에 사용
 *   - previewOpen / setPreviewOpen: 미리보기 패널 토글 상태
 *   - onOpenMedia: 비디오/오디오/유튜브 삽입 모달을 여는 콜백(모달 자체는 MdSplitEditor가 소유)
 *   - onOpenAssetPicker: (atype, e) → MdSplitEditor가 picker 팝업 위치/상태를 관리
 *   - value: 현재 마크다운 내용 (복사/ZIP 내보내기에 사용)
 *   - onImportContent: ZIP 가져오기 후 에디터 내용 교체 콜백
 *
 * 단축키: Ctrl+B(굵게) / Ctrl+I(기울임) / Ctrl+Shift+S(취소선) / Ctrl+L(링크)
 *         Ctrl+0(글머리) / Ctrl+9(번호) / Ctrl+8(인용) / Ctrl+,(표)
 *         Ctrl+.(글자색 순환) / Ctrl+/(배경색 순환) / Ctrl+Shift+V(kbd 태그)
 *         Ctrl+1(이모지) / Ctrl+2(특수문자) / Ctrl+3(상용구) / Ctrl+4(템플릿)
 *         Alt+Z(현재 줄 중앙 스크롤)
 */
import { useRef, useState, type RefObject } from 'react'
import { format } from 'date-fns'
import {
  Bold, Italic, Strikethrough, Heading, List, ListOrdered, Quote, Link2,
  Baseline, Highlighter, Image as ImageIcon, Video, Eye, EyeOff, HelpCircle, X,
  FileText, Layout, Copy, Download, Upload, FileCode,
} from 'lucide-react'
import { apiClient } from '@/lib/apiClient'
import { ROTATE_TEXT_COLORS, ROTATE_BG_COLORS } from '@/shared/components/editor/editorColors'
import type { AssetType } from '@/domain/asset/types/asset'
import type { MdTextareaHandle } from '@/shared/components/editor/MdTextarea'
import { renderMarkdown } from '@/lib/markdownRenderer'
import markdownCss from '@/styles/markdown.css?raw'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

// 내보낸 정적 HTML 안에서 .media-card 토글 버튼(비디오/오디오/유튜브 펼치기)을 동작시키는 스크립트.
// useMediaCardToggle.ts의 클릭 위임 로직을 순수 JS로 옮긴 것 — 앱 안에서는 그 훅이 대신 동작하므로
// 이 문자열은 내보내기 결과물(React 번들이 없는 독립 HTML)에서만 쓰인다.
const MEDIA_TOGGLE_SCRIPT = `
document.addEventListener('click', function (e) {
  var btn = e.target.closest('.media-toggle-btn');
  if (!btn) return;
  var card = btn.closest('.media-card');
  var body = card && card.querySelector('.media-card-body');
  if (!card || !body) return;

  var type = card.dataset.mediaType || 'video';
  var openLabel = type === 'youtube' ? '유튜브 숨기기' : type === 'audio' ? '오디오 숨기기' : '비디오 숨기기';
  var closeLabel = type === 'youtube' ? '유튜브 보이기' : type === 'audio' ? '오디오 보이기' : '비디오 보이기';

  if (body.hasAttribute('hidden')) {
    if (body.children.length === 0) {
      var el;
      if (type === 'youtube' && card.dataset.ytId) {
        el = document.createElement('iframe');
        el.src = 'https://www.youtube.com/embed/' + card.dataset.ytId;
        el.allowFullscreen = true;
      } else if (type === 'audio') {
        el = document.createElement('audio');
        el.src = card.dataset.mediaSrc || '';
        el.controls = true;
      } else {
        el = document.createElement('video');
        el.src = card.dataset.mediaSrc || '';
        el.controls = true;
      }
      body.appendChild(el);
    }
    body.removeAttribute('hidden');
    card.classList.add('is-open');
    btn.textContent = openLabel;
  } else {
    body.setAttribute('hidden', '');
    card.classList.remove('is-open');
    body.innerHTML = '';
    btn.textContent = closeLabel;
  }
});
`.trim()

// 내보낸 정적 HTML 안에서 코드블록 우측 상단의 복사 버튼을 동작시키는 스크립트.
// useCodeBlockCopy.ts의 클릭 위임 로직을 순수 JS로 옮긴 것 — 앱 안에서는 그 훅이 대신 동작하므로
// 이 문자열은 내보내기 결과물(React 번들이 없는 독립 HTML)에서만 쓰인다.
const CODE_COPY_SCRIPT = `
document.addEventListener('click', function (e) {
  var btn = e.target.closest('.code-copy-btn');
  if (!btn || btn.dataset.copying) return;
  var code = btn.closest('.code-block');
  code = code && code.querySelector('pre code');
  var text = code ? code.textContent : '';
  if (!text) return;

  navigator.clipboard.writeText(text).then(function () {
    btn.dataset.copying = '1';
    var original = btn.innerHTML;
    btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="code-copy-icon"><polyline points="20 6 9 17 4 12"/></svg>';
    btn.classList.add('is-copied');
    setTimeout(function () {
      btn.innerHTML = original;
      btn.classList.remove('is-copied');
      delete btn.dataset.copying;
    }, 1500);
  });
});
`.trim()

interface Props {
  editorRef: RefObject<MdTextareaHandle | null>
  previewOpen: boolean
  setPreviewOpen: (open: boolean) => void
  onOpenMedia: () => void
  onOpenAssetPicker: (atype: AssetType, e: React.MouseEvent<HTMLButtonElement>) => void
  value: string
  onImportContent: (content: string) => void
}

const HEADING_LEVELS = [1, 2, 3] as const

export default function MdEditorToolbar({
  editorRef, previewOpen, setPreviewOpen, onOpenMedia,
  onOpenAssetPicker, value, onImportContent,
}: Props) {
  const [showHeadings, setShowHeadings] = useState(false)
  const [showColors, setShowColors] = useState(false)
  const [showBgColors, setShowBgColors] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const zipInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)

  async function handleImageFile(file: File) {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await apiClient.post<{ url: string }>('/files/editor-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      editorRef.current?.insertText(`![image](${res.url})\n`, 0, 0)
    } catch {
      alert('이미지 업로드 중 오류가 발생했습니다.')
    } finally {
      setUploading(false)
    }
  }

  async function handleCopyMarkdown() {
    try {
      await navigator.clipboard.writeText(value)
    } catch {
      // fallback: ignore
    }
  }

  async function handleZipExport() {
    setExporting(true)
    try {
      const res = await apiClient.post(
        '/files/markdown-export',
        { content: value },
        { responseType: 'blob' },
      )
      const blob = res as unknown as Blob
      const now = new Date()
      const pad = (n: number) => n.toString().padStart(2, '0')
      const stamp = `${now.getFullYear()}_${pad(now.getMonth() + 1)}_${pad(now.getDate())}_${pad(now.getHours())}_${pad(now.getMinutes())}_${pad(now.getSeconds())}`
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `markdown-export_${stamp}.zip`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('ZIP 내보내기 중 오류가 발생했습니다.')
    } finally {
      setExporting(false)
    }
  }

  function handleHtmlExport() {
    const bodyHtml = renderMarkdown(value)
    const html = `<!doctype html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>PCMS 문서</title>
<style>
${markdownCss}
body {
  margin: 0;
  background: #f1f5f9;
}
.container {
  width: 75%;
  margin: 0 auto;
  padding: 2.5rem 1.5rem;
}
</style>
</head>
<body>
<div class="container">
<div class="markdown-body">
${bodyHtml}
</div>
</div>
<script>
${MEDIA_TOGGLE_SCRIPT}
${CODE_COPY_SCRIPT}
</script>
</body>
</html>
`
    const stamp = format(new Date(), 'yyyyMMdd_HHmmss')
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pcms_${stamp}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleZipImport(file: File) {
    setImporting(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await apiClient.post<{ content: string }>('/files/markdown-import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      onImportContent(res.content)
    } catch {
      alert('ZIP 가져오기 중 오류가 발생했습니다.')
    } finally {
      setImporting(false)
    }
  }

  const btn = (
    content: React.ReactNode,
    onClick: () => void,
    title: string,
    key?: string,
    disabled?: boolean,
  ) => (
    <button
      key={key}
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className="flex items-center justify-center p-1 rounded text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
    >
      {content}
    </button>
  )

  return (
    <div className="flex flex-wrap items-center gap-0.5 px-2.5 py-1 border-b border-gray-200 bg-gray-50 rounded-t-lg">
      {btn(<Bold className="w-4 h-4" />, () => editorRef.current?.applyAction('bold'), '굵게 (Ctrl+B)')}
      {btn(<Italic className="w-4 h-4" />, () => editorRef.current?.applyAction('italic'), '기울임 (Ctrl+I)')}
      {btn(<Strikethrough className="w-4 h-4" />, () => editorRef.current?.applyAction('strike'), '취소선 (Ctrl+Shift+S)')}
      <span className="w-px self-stretch bg-gray-200 mx-0.5" />

      {/* 제목 헤더 */}
      <Popover open={showHeadings} onOpenChange={setShowHeadings}>
        <PopoverTrigger asChild>
          <button
            type="button"
            title="제목 헤더 삽입"
            className="flex items-center justify-center p-1 rounded text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <Heading className="w-4 h-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-32 p-1.5" align="start">
          <div className="flex flex-col gap-0.5">
            {HEADING_LEVELS.map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => { editorRef.current?.applyAction(`h${level}`); setShowHeadings(false) }}
                className="px-2 py-1 text-xs font-bold text-left rounded hover:bg-gray-100"
              >
                제목 {level}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
      <span className="w-px self-stretch bg-gray-300 mx-0.5" />
      {btn(<List className="w-4 h-4" />, () => editorRef.current?.applyAction('bullet'), '글머리 목록 (Ctrl+0)')}
      {btn(<ListOrdered className="w-4 h-4" />, () => editorRef.current?.applyAction('number'), '번호 목록 (Ctrl+9)')}
      {btn(<Quote className="w-4 h-4" />, () => editorRef.current?.applyAction('quote'), '인용구 (Ctrl+8)')}
      {btn(<Link2 className="w-4 h-4" />, () => editorRef.current?.applyAction('link'), '링크 삽입 (Ctrl+L)')}
      <span className="w-px self-stretch bg-gray-300 mx-0.5" />
      {/* 글자 색상 */}
      <Popover open={showColors} onOpenChange={setShowColors}>
        <PopoverTrigger asChild>
          <button
            type="button"
            title="글자 색상 (Ctrl+.)"
            className="flex items-center justify-center p-1 rounded text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <Baseline className="w-4 h-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-44 p-2" align="start">
          <div className="flex flex-wrap gap-1">
            <button
              type="button"
              onClick={() => { editorRef.current?.applyAction('color-text-set:'); setShowColors(false) }}
              className="flex items-center gap-1.5 w-full px-2 py-1 text-xs rounded hover:bg-gray-50 text-left"
            >
              <span className="inline-block w-4 h-4 rounded-sm border border-gray-300 bg-black" />
              기본
            </button>
            {ROTATE_TEXT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => { editorRef.current?.applyAction(`color-text-set:${c}`); setShowColors(false) }}
                className="flex items-center gap-1.5 w-full px-2 py-1 text-xs rounded hover:bg-gray-50 text-left"
              >
                <span className="inline-block w-4 h-4 rounded-sm border border-gray-300" style={{ backgroundColor: c }} />
                {c}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* 배경 색상 */}
      <Popover open={showBgColors} onOpenChange={setShowBgColors}>
        <PopoverTrigger asChild>
          <button
            type="button"
            title="배경 색상 (Ctrl+/)"
            className="flex items-center justify-center p-1 rounded text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <Highlighter className="w-4 h-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-44 p-2" align="start">
          <div className="flex flex-wrap gap-1">
            <button
              type="button"
              onClick={() => { editorRef.current?.applyAction('color-bg-set:'); setShowBgColors(false) }}
              className="flex items-center gap-1.5 w-full px-2 py-1 text-xs rounded hover:bg-gray-50 text-left"
            >
              <span className="inline-block w-4 h-4 rounded-sm border border-gray-300 bg-white" />
              기본
            </button>
            {ROTATE_BG_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => { editorRef.current?.applyAction(`color-bg-set:${c}`); setShowBgColors(false) }}
                className="flex items-center gap-1.5 w-full px-2 py-1 text-xs rounded hover:bg-gray-50 text-left"
              >
                <span className="inline-block w-4 h-4 rounded-sm border border-gray-300" style={{ backgroundColor: c }} />
                {c}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <span className="w-px self-stretch bg-gray-200 mx-0.5" />

      {/* 이모지 / 특수문자 / 상용구 / 템플릿 */}
      <button
        type="button"
        onClick={(e) => onOpenAssetPicker('EMOJI', e)}
        className="flex items-center justify-center p-1 text-base rounded text-gray-600 hover:bg-gray-100 transition-colors"
        title="이모지 삽입 (Ctrl+1)"
      >
        😀
      </button>
      <button
        type="button"
        onClick={(e) => onOpenAssetPicker('SYMBOL', e)}
        className="flex items-center justify-center p-1 text-base rounded text-gray-600 hover:bg-gray-100 transition-colors"
        title="특수문자 삽입 (Ctrl+2)"
      >
        ※
      </button>
      <button
        type="button"
        onClick={(e) => onOpenAssetPicker('PHRASE', e)}
        className="flex items-center justify-center p-1 rounded text-gray-600 hover:bg-gray-100 transition-colors"
        title="상용구 삽입 (Ctrl+3)"
      >
        <FileText className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={(e) => onOpenAssetPicker('TEMPLATE', e)}
        className="flex items-center justify-center p-1 rounded text-gray-600 hover:bg-gray-100 transition-colors"
        title="템플릿 삽입 (Ctrl+4)"
      >
        <Layout className="w-4 h-4" />
      </button>

      <span className="w-px self-stretch bg-gray-200 mx-0.5" />

      {/* 이미지 업로드 */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="flex items-center justify-center p-1 rounded text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
        title="이미지 삽입 (붙여넣기 Ctrl+V도 지원)"
      >
        <ImageIcon className="w-4 h-4" />
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleImageFile(file)
          e.target.value = ''
        }}
      />

      {/* 비디오/오디오/유튜브 삽입 */}
      {btn(<Video className="w-4 h-4" />, onOpenMedia, '비디오·오디오·유튜브 삽입 (Ctrl+Shift+V)')}

      <span className="w-px self-stretch bg-gray-200 mx-0.5" />

      {/* 마크다운 복사 */}
      {btn(<Copy className="w-4 h-4" />, handleCopyMarkdown, '마크다운 복사')}

      {/* ZIP 내보내기 */}
      {btn(<Download className="w-4 h-4" />, handleZipExport, 'ZIP 내보내기', undefined, exporting)}

      {/* ZIP 가져오기 */}
      <button
        type="button"
        onClick={() => zipInputRef.current?.click()}
        disabled={importing}
        className="flex items-center justify-center p-1 rounded text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
        title="ZIP 가져오기"
      >
        <Upload className="w-4 h-4" />
      </button>
      <input
        ref={zipInputRef}
        type="file"
        accept=".zip"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleZipImport(file)
          e.target.value = ''
        }}
      />
      {/* HTML 내보내기 */}
      {btn(<FileCode className="w-4 h-4" />, handleHtmlExport, 'HTML로 내보내기')}

      <span className="flex-1" />

      {/* 도움말 */}
      <button
        type="button"
        onClick={() => setHelpOpen(true)}
        className="p-1 hover:bg-gray-100 rounded text-gray-600 flex items-center justify-center"
        title="단축키 도움말"
      >
        <HelpCircle className="w-4 h-4" />
      </button>

      {/* 미리보기 토글 */}
      <button
        type="button"
        onClick={() => setPreviewOpen(!previewOpen)}
        className="px-2 py-1 bg-white hover:bg-gray-100 border border-gray-200 rounded text-xs font-medium text-gray-600 flex items-center gap-1"
        title="미리보기 토글 (F9)"
      >
        {previewOpen ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
      </button>

      {helpOpen && (
        <div
          onMouseDown={(e) => e.stopPropagation()}
          className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-[9999]"
        >
          <div className="bg-white rounded-lg p-6 max-w-lg w-full shadow-2xl border border-slate-100 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <h3 className="text-sm font-bold text-slate-950 flex items-center gap-1.5">
                <HelpCircle className="w-4.5 h-4.5 text-indigo-650" />
                마크다운 에디터 단축키
              </h3>
              <button onClick={() => setHelpOpen(false)} className="p-1 hover:bg-gray-100 rounded-md text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto pr-1 text-xs text-gray-600">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-100 text-slate-500 font-semibold">
                    <th className="px-3 py-2">기능</th>
                    <th className="px-3 py-2">단축키</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[
                    ['저장', 'Ctrl+S'],
                    ['굵게', 'Ctrl+B'],
                    ['기울임', 'Ctrl+I'],
                    ['취소선', 'Ctrl+Shift+S'],
                    ['글머리 목록', 'Ctrl+0'],
                    ['번호 목록', 'Ctrl+9'],
                    ['인용구', 'Ctrl+8'],
                    ['표 삽입 / 표 ↔ CSV 전환', 'Ctrl+,'],
                    ['링크 삽입', 'Ctrl+L'],
                    ['글자색 순환', 'Ctrl+.'],
                    ['배경색 순환', 'Ctrl+/'],
                    ['줄 바꿈(<br/>)', 'Ctrl+Enter'],
                    ['비디오/오디오/유튜브 삽입', 'Ctrl+Shift+V'],
                    ['kbd 태그 감싸기', 'Ctrl+Shift+K'],
                    ['불여넣기(&nbsp;)', 'Ctrl+Space'],
                    ['들여쓰기', 'Tab'],
                    ['내어쓰기', 'Shift+Tab'],
                    ['이모지 팝업', 'Ctrl+1'],
                    ['특수문자 팝업', 'Ctrl+2'],
                    ['상용구 팝업', 'Ctrl+3'],
                    ['템플릿 팝업', 'Ctrl+4'],
                    ['현재 줄 중앙 스크롤', 'Alt+Z'],
                    ['미리보기 토글', 'F9'],
                  ].map(([name, key]) => (
                    <tr key={name}>
                      <td className="px-3 py-1.5 font-medium text-slate-700">{name}</td>
                      <td className="px-3 py-1.5 font-mono">{key}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-4 text-[11px] text-gray-500 leading-relaxed">
                백틱 안에 <code className="px-1 bg-gray-100 rounded">색상코드:lucide아이콘명:텍스트</code> 형식으로 쓰면
                (예: <code className="px-1 bg-gray-100 rounded">`#456EA6:search:조회`</code>) 미리보기에서 색이 있는 아이콘 뱃지로
                표시됩니다. 형식에 맞지 않는 일반 백틱은 그대로 코드로 표시됩니다.
              </p>
            </div>
            <div className="flex items-center justify-end border-t border-gray-100 pt-3 mt-4">
              <button
                onClick={() => setHelpOpen(false)}
                className="px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
