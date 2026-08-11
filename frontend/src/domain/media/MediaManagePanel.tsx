/**
 * 목적: 마크다운 에디터에서 삽입할 수 있는 비디오/오디오 파일을 업로드/삭제/조회하고
 *       마크다운 삽입 태그(`![이름](url)`)를 복사하거나 파일 이름을 변경하는 관리 패널.
 *       파일이 많아질 때를 대비해 AG Grid로 목록을 표시하며 검색/미리보기/다운로드를 지원한다.
 *
 * 사용법:
 *   <MediaManagePanel />
 *   SettingsPage 안에 섹션으로 삽입해 사용한다 (독립 라우트 없음, AssetManagePanel과 동일한 톤).
 *
 * props: 없음
 */
import { useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AgGridReact } from 'ag-grid-react'
import { AllCommunityModule, ModuleRegistry, type ColDef, type ICellRendererParams } from 'ag-grid-community'
import { Upload, Trash2, Copy, Video, Music, Pencil, Play, Download } from 'lucide-react'
import { apiClient } from '@/lib/apiClient'
import { formatFileSize } from '@/lib/utils'
import { type MediaFile, mediaDownloadUrl, mediaLabel } from '@/lib/mediaFile'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { useMessage } from '@/shared/hooks/useMessage'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

ModuleRegistry.registerModules([AllCommunityModule])

type Tab = 'video' | 'audio'

function getExt(filename: string): string {
  const idx = filename.lastIndexOf('.')
  return idx > 0 ? filename.slice(idx) : ''
}

export default function MediaManagePanel() {
  const [tab, setTab] = useState<Tab>('video')
  const [uploading, setUploading] = useState(false)
  const [renameItem, setRenameItem] = useState<MediaFile | null>(null)
  const [newName, setNewName] = useState('')
  const [previewItem, setPreviewItem] = useState<MediaFile | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()
  const { showMessage } = useMessage()

  const { data: items = [], isLoading } = useQuery<MediaFile[]>({
    queryKey: ['media-files', tab],
    queryFn: () => apiClient.get<MediaFile[]>('/files/media', { params: { type: tab } }),
  })

  async function handleUpload(file: File) {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      await apiClient.post('/files/media', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      queryClient.invalidateQueries({ queryKey: ['media-files', tab] })
      showMessage('업로드되었습니다.', 'success')
    } catch {
      showMessage('업로드 중 오류가 발생했습니다. (mp4/webm/ogg 또는 mp3/wav/m4a 파일만 가능)', 'error')
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(item: MediaFile) {
    if (!confirm(`"${item.orgFileName}"을(를) 삭제하시겠습니까?`)) return
    try {
      await apiClient.delete(`/files/${item.fileId}`)
      queryClient.invalidateQueries({ queryKey: ['media-files', tab] })
      showMessage('삭제되었습니다.', 'success')
      if (previewItem?.fileId === item.fileId) setPreviewItem(null)
    } catch {
      showMessage('삭제 중 오류가 발생했습니다.', 'error')
    }
  }

  function openRename(item: MediaFile) {
    setRenameItem(item)
    const ext = getExt(item.orgFileName)
    setNewName(item.orgFileName.slice(0, item.orgFileName.length - ext.length))
  }

  async function handleRename() {
    if (!renameItem || !newName.trim()) return
    const trimmed = newName.trim()
    if (trimmed.includes('..') || trimmed.includes('/') || trimmed.includes('\\')) {
      showMessage('파일명에 사용할 수 없는 문자가 포함되어 있습니다.', 'error')
      return
    }
    const ext = getExt(renameItem.orgFileName)
    const finalName = trimmed + ext
    try {
      await apiClient.patch(`/files/${renameItem.fileId}/rename`, { newName: finalName })
      queryClient.invalidateQueries({ queryKey: ['media-files', tab] })
      showMessage('이름이 변경되었습니다.', 'success')
      setRenameItem(null)
    } catch {
      showMessage('이름 변경 중 오류가 발생했습니다.', 'error')
    }
  }

  async function handleCopyTag(item: MediaFile) {
    const tag = `![${mediaLabel(item)}](${mediaDownloadUrl(item)})`
    try {
      await navigator.clipboard.writeText(tag)
      showMessage('마크다운 태그가 복사되었습니다.', 'success')
    } catch {
      showMessage('복사에 실패했습니다.', 'error')
    }
  }

  async function handleDownload(item: MediaFile) {
    try {
      const res = await fetch(mediaDownloadUrl(item))
      if (!res.ok) throw new Error('download failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = item.orgFileName
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      showMessage('다운로드 중 오류가 발생했습니다.', 'error')
    }
  }

  const columnDefs: ColDef<MediaFile>[] = [
    {
      headerName: '미리보기',
      width: 90,
      sortable: false,
      filter: false,
      cellRenderer: (params: ICellRendererParams<MediaFile>) => (
        <button
          type="button"
          onClick={() => params.data && setPreviewItem(params.data)}
          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
          title="즉시 재생"
        >
          <Play className="w-4 h-4" />
        </button>
      ),
    },
    {
      field: 'orgFileName',
      headerName: '파일명',
      flex: 2,
      minWidth: 220,
      cellClass: 'font-mono text-gray-700 text-[13px]',
    },
    {
      field: 'fileSize',
      headerName: '크기',
      width: 120,
      cellClass: 'text-gray-500 text-[13px]',
      valueFormatter: (params) => formatFileSize(params.value as number),
    },
    {
      headerName: '액션',
      width: 260,
      sortable: false,
      filter: false,
      cellRenderer: (params: ICellRendererParams<MediaFile>) => {
        const item = params.data
        if (!item) return null
        return (
          <div className="flex items-center gap-1 h-full">
            <button
              type="button"
              onClick={() => handleCopyTag(item)}
              className="px-2 py-1 bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 rounded text-[11px] font-bold inline-flex items-center gap-1"
              title="마크다운 태그 복사"
            >
              <Copy className="w-3 h-3" /> 태그복사
            </button>
            <button
              type="button"
              onClick={() => openRename(item)}
              className="px-2 py-1 bg-white hover:bg-gray-100 border border-gray-200 text-amber-600 rounded text-[11px] font-bold inline-flex items-center gap-1"
              title="이름 바꾸기"
            >
              <Pencil className="w-3 h-3" /> 이름변경
            </button>
            <button
              type="button"
              onClick={() => handleDownload(item)}
              className="px-2 py-1 bg-white hover:bg-gray-100 border border-gray-200 text-indigo-600 rounded text-[11px] font-bold inline-flex items-center gap-1"
              title="다운로드"
            >
              <Download className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => handleDelete(item)}
              className="px-2 py-1 bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 rounded text-[11px] font-bold inline-flex items-center gap-1"
              title="삭제"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )
      },
    },
  ]

  return (
    <div className="p-6 bg-white rounded-xl border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">미디어 관리 (비디오 · 오디오)</h3>
          <p className="text-sm text-gray-500">마크다운 에디터에 삽입할 수 있는 비디오/오디오 파일을 관리합니다.</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept={tab === 'video' ? '.mp4,.webm,.ogg' : '.mp3,.wav,.m4a,.ogg'}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleUpload(file)
              e.target.value = ''
            }}
          />
          <Button size="sm" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-4 h-4 mr-1" /> {uploading ? '업로드 중...' : '업로드'}
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex gap-2 p-0.5 bg-gray-100 rounded-md border border-gray-200 text-xs w-fit">
          <button
            type="button"
            onClick={() => setTab('video')}
            className={`px-3 py-1.5 rounded flex items-center gap-1.5 font-medium transition-colors ${
              tab === 'video' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Video className="w-3.5 h-3.5" /> 비디오
          </button>
          <button
            type="button"
            onClick={() => setTab('audio')}
            className={`px-3 py-1.5 rounded flex items-center gap-1.5 font-medium transition-colors ${
              tab === 'audio' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Music className="w-3.5 h-3.5" /> 오디오
          </button>
        </div>
        <Input
          placeholder="파일명 검색..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-60"
        />
      </div>

      {isLoading ? (
        <p className="text-center py-10 text-gray-400 text-sm">불러오는 중...</p>
      ) : (
        <div className="ag-theme-alpine w-full">
          <AgGridReact
            rowData={items}
            columnDefs={columnDefs}
            quickFilterText={searchTerm}
            rowHeight={48}
            domLayout="autoHeight"
            defaultColDef={{ resizable: true, sortable: true }}
            overlayNoRowsTemplate={`업로드된 ${tab === 'video' ? '비디오' : '오디오'} 파일이 없습니다.`}
          />
        </div>
      )}

      {/* 미디어 미리보기 모달 */}
      <Dialog open={!!previewItem} onOpenChange={(open) => { if (!open) setPreviewItem(null) }}>
        <DialogContent className="max-w-2xl" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {tab === 'video' ? <Video className="w-4 h-4 text-indigo-500" /> : <Music className="w-4 h-4 text-indigo-500" />}
              <span className="truncate">{previewItem?.orgFileName}</span>
            </DialogTitle>
          </DialogHeader>
          {previewItem && (
            <div className="bg-black rounded-lg flex items-center justify-center p-4">
              {tab === 'video' ? (
                <video src={mediaDownloadUrl(previewItem)} controls autoPlay className="max-w-full max-h-[440px] rounded" />
              ) : (
                <audio src={mediaDownloadUrl(previewItem)} controls autoPlay className="w-full" />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!renameItem} onOpenChange={(open) => { if (!open) setRenameItem(null) }}>
        <DialogContent className="max-w-sm" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>이름 바꾸기</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <label className="text-xs text-gray-500 mb-1 block">새 파일명</label>
            <div className="flex items-center gap-1">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleRename() }}
                placeholder="확장자 제외한 이름"
                className="flex-1"
              />
              {renameItem && (
                <span className="text-sm text-gray-500 font-mono shrink-0">
                  {getExt(renameItem.orgFileName)}
                </span>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameItem(null)}>취소</Button>
            <Button onClick={handleRename}>확인</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
