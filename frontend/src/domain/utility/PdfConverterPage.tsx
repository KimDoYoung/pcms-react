/**
 * 목적: 다양한 포맷(HTML, Markdown, Office Word/PPT/Excel, Text, Image 등)의 문서를
 *       Gotenberg 서버를 통해 PDF로 변환하여 다운로드하는 범용 유틸리티 페이지.
 *
 * 사용법:
 *   라우터에서 /utility/pdf-converter 경로로 연결하여 사용.
 */
import { useState, useRef } from 'react'
import Toolbar from '@/shared/layout/Toolbar'
import { Button } from '@/shared/components/ui/button'
import { useMessage } from '@/shared/hooks/useMessage'
import { apiClient } from '@/lib/apiClient'
import { formatFileSize } from '@/lib/utils'
import {
  UploadCloud,
  FileText,
  FileCode,
  FileSpreadsheet,
  Presentation,
  Image as ImageIcon,
  File,
  Download,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RotateCw,
} from 'lucide-react'

interface UploadItem {
  id: string
  file: File
  status: 'idle' | 'converting' | 'done' | 'error'
  pdfBlob?: Blob
  pdfFilename?: string
  errorMessage?: string
}

const SUPPORTED_EXTS = [
  'docx', 'doc', 'pptx', 'ppt', 'xlsx', 'xls',
  'html', 'htm', 'md', 'markdown',
  'txt', 'rtf', 'csv', 'odt', 'ods', 'odp',
  'png', 'jpg', 'jpeg', 'webp',
]

export default function PdfConverterPage() {
  const [items, setItems] = useState<UploadItem[]>([])
  const [landscape, setLandscape] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [isAllConverting, setIsAllConverting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { showMessage } = useMessage()

  function getFileIcon(filename: string) {
    const ext = filename.split('.').pop()?.toLowerCase() || ''
    if (['docx', 'doc', 'odt', 'rtf', 'txt'].includes(ext)) {
      return <FileText className="w-6 h-6 text-blue-600" />
    }
    if (['pptx', 'ppt', 'odp'].includes(ext)) {
      return <Presentation className="w-6 h-6 text-orange-600" />
    }
    if (['xlsx', 'xls', 'ods', 'csv'].includes(ext)) {
      return <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
    }
    if (['html', 'htm', 'md', 'markdown'].includes(ext)) {
      return <FileCode className="w-6 h-6 text-indigo-600" />
    }
    if (['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext)) {
      return <ImageIcon className="w-6 h-6 text-purple-600" />
    }
    return <File className="w-6 h-6 text-gray-500" />
  }

  function handleAddFiles(files: FileList | File[]) {
    const newFiles: UploadItem[] = []
    Array.from(files).forEach((file) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || ''
      if (!SUPPORTED_EXTS.includes(ext)) {
        showMessage(`지원하지 않는 파일 형식입니다: ${file.name}`, 'error')
        return
      }
      newFiles.push({
        id: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        file,
        status: 'idle',
      })
    })

    if (newFiles.length > 0) {
      setItems((prev) => [...prev, ...newFiles])
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragOver(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleAddFiles(e.dataTransfer.files)
    }
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragOver(true)
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragOver(false)
  }

  function handleRemoveItem(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  function handleReset() {
    setItems([])
    showMessage('파일 목록이 초기화되었습니다.', 'info')
  }

  async function convertSingleItem(item: UploadItem): Promise<boolean> {
    setItems((prev) =>
      prev.map((it) => (it.id === item.id ? { ...it, status: 'converting', errorMessage: undefined } : it)),
    )

    try {
      const formData = new FormData()
      formData.append('file', item.file)
      formData.append('landscape', String(landscape))

      const res = await apiClient.post('/files/pdf-convert/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        responseType: 'blob',
      })

      const blob = res as unknown as Blob
      const originalName = item.file.name
      const dotIdx = originalName.lastIndexOf('.')
      const baseName = dotIdx > 0 ? originalName.substring(0, dotIdx) : originalName
      const targetPdfName = `${baseName}.pdf`

      setItems((prev) =>
        prev.map((it) =>
          it.id === item.id
            ? {
                ...it,
                status: 'done',
                pdfBlob: blob,
                pdfFilename: targetPdfName,
              }
            : it,
        ),
      )

      // 자동 다운로드
      downloadBlob(blob, targetPdfName)
      return true
    } catch (err) {
      const msg = err instanceof Error ? err.message : '변환에 실패했습니다.'
      setItems((prev) =>
        prev.map((it) =>
          it.id === item.id
            ? {
                ...it,
                status: 'error',
                errorMessage: msg,
              }
            : it,
        ),
      )
      return false
    }
  }

  function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  async function handleConvertAll() {
    if (items.length === 0) {
      showMessage('변환할 파일을 추가해 주세요.', 'error')
      return
    }

    setIsAllConverting(true)
    let successCount = 0
    let failCount = 0

    for (const item of items) {
      if (item.status === 'done') continue
      const ok = await convertSingleItem(item)
      if (ok) successCount++
      else failCount++
    }

    setIsAllConverting(false)

    if (failCount === 0 && successCount > 0) {
      showMessage(`모든 파일(${successCount}개)이 PDF로 변환되어 다운로드되었습니다.`, 'success')
    } else if (successCount > 0 && failCount > 0) {
      showMessage(`변환 완료: ${successCount}개, 실패: ${failCount}개`, 'info')
    } else if (failCount > 0 && successCount === 0) {
      showMessage('PDF 변환 중 오류가 발생했습니다.', 'error')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toolbar />
      <main className="container mx-auto px-4 py-6 max-w-5xl">
        {/* 헤더 */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                <span>📑 PDF 변환 유틸리티</span>
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Word, PowerPoint, Excel, HTML, Markdown, 텍스트, 이미지 문서를 고품질 PDF로 변환합니다.
              </p>
            </div>

            {/* 옵션: 가로 방향 */}
            <div className="flex items-center gap-2 bg-gray-50 px-3.5 py-2 rounded-lg border border-gray-200">
              <input
                id="landscape-check"
                type="checkbox"
                checked={landscape}
                onChange={(e) => setLandscape(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <label htmlFor="landscape-check" className="text-sm font-medium text-gray-700 cursor-pointer select-none">
                가로 방향 (Landscape)
              </label>
            </div>
          </div>
        </div>

        {/* 드래그 & 드롭 업로드 영역 */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`border-2 border-dashed rounded-xl p-8 mb-6 text-center transition-all duration-200 bg-white ${
            isDragOver ? 'border-blue-500 bg-blue-50/50 scale-[1.005]' : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={SUPPORTED_EXTS.map((ext) => `.${ext}`).join(',')}
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleAddFiles(e.target.files)
                e.target.value = ''
              }
            }}
          />

          <div className="flex flex-col items-center justify-center gap-3">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-full">
              <UploadCloud className="w-8 h-8" />
            </div>
            <div>
              <p className="text-base font-semibold text-gray-800">
                변환할 문서를 이곳으로 드래그하거나 선택하세요
              </p>
              <p className="text-xs text-gray-500 mt-1">
                지원 형식: Word(.docx, .doc), PPT(.pptx), Excel(.xlsx), HTML(.html), Markdown(.md), Text(.txt, .csv), Image(.png, .jpg)
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="mt-1"
            >
              파일 찾기
            </Button>
          </div>
        </div>

        {/* 파일 목록 */}
        {items.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-800">
                선택된 파일 목록 ({items.length}개)
              </h2>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  disabled={isAllConverting}
                >
                  초기화
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleConvertAll}
                  disabled={isAllConverting}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isAllConverting ? (
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  ) : (
                    <RotateCw className="w-4 h-4 mr-1.5" />
                  )}
                  전체 변환
                </Button>
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 hover:bg-gray-50/70 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="shrink-0 p-2 bg-gray-50 rounded-lg border border-gray-100">
                      {getFileIcon(item.file.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate" title={item.file.name}>
                        {item.file.name}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatFileSize(item.file.size)}
                      </p>
                    </div>
                  </div>

                  {/* 상태 배지 */}
                  <div className="flex items-center gap-3 shrink-0">
                    {item.status === 'idle' && (
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                        대기 중
                      </span>
                    )}
                    {item.status === 'converting' && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-600">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        변환 중...
                      </span>
                    )}
                    {item.status === 'done' && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-green-50 text-green-700">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        변환 완료
                      </span>
                    )}
                    {item.status === 'error' && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-red-50 text-red-600" title={item.errorMessage}>
                        <AlertCircle className="w-3.5 h-3.5" />
                        변환 실패
                      </span>
                    )}

                    {/* 액션 버튼 */}
                    <div className="flex items-center gap-1.5">
                      {item.status === 'done' && item.pdfBlob && item.pdfFilename && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadBlob(item.pdfBlob!, item.pdfFilename!)}
                          title="다운로드"
                        >
                          <Download className="w-3.5 h-3.5 mr-1" />
                          다운로드
                        </Button>
                      )}
                      {item.status !== 'converting' && item.status !== 'done' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => convertSingleItem(item)}
                          disabled={isAllConverting}
                        >
                          변환
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={item.status === 'converting'}
                        className="text-gray-400 hover:text-red-600"
                        title="목록에서 삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
