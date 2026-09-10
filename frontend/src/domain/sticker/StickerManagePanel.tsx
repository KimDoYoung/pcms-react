/**
 * 목적: 마크다운 에디터 및 본문에서 사용할 수 있는 작은 이미지(PNG, SVG, 주식 짤, 스티커 등)를
 *       다중 업로드(multi file upload, 드래그 앤 드롭 지원)/삭제/조회하고 태그 및 파일명을 변경하며
 *       마크다운 삽입 태그를 복사하는 관리 패널.
 *       갤러리 카드 뷰와 AG Grid 테이블 뷰를 모두 지원하여 시각적 확인과 데이터 관리를 동시에 제공한다.
 *
 * 사용법:
 *   <StickerManagePanel />
 *   StickerManagePage 안에서 사용된다.
 *
 * props: 없음
 */
import { useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AgGridReact } from 'ag-grid-react'
import { AllCommunityModule, ModuleRegistry, type ColDef, type ICellRendererParams } from 'ag-grid-community'
import {
  Upload,
  Trash2,
  Copy,
  Pencil,
  Download,
  LayoutGrid,
  Table as TableIcon,
  Tag as TagIcon,
  Search,
  RotateCcw,
  Sparkles,
} from 'lucide-react'
import { apiClient } from '@/lib/apiClient'
import { formatFileSize, copyTextToClipboard } from '@/lib/utils'
import { type StickerFile, mediaDownloadUrl, mediaLabel } from '@/lib/mediaFile'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { useMessage } from '@/shared/hooks/useMessage'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'

ModuleRegistry.registerModules([AllCommunityModule])

function getExt(filename: string): string {
  const idx = filename.lastIndexOf('.')
  return idx > 0 ? filename.slice(idx) : ''
}

export default function StickerManagePanel() {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [uploading, setUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadTag, setUploadTag] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  const [renameItem, setRenameItem] = useState<StickerFile | null>(null)
  const [newName, setNewName] = useState('')
  const [tagEditItem, setTagEditItem] = useState<StickerFile | null>(null)
  const [newTag, setNewTag] = useState('')
  const [previewItem, setPreviewItem] = useState<StickerFile | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()
  const { showMessage } = useMessage()

  const { data: items = [], isLoading } = useQuery<StickerFile[]>({
    queryKey: ['stickers', searchKeyword],
    queryFn: () =>
      apiClient.get<StickerFile[]>('/files/stickers', {
        params: searchKeyword ? { keyword: searchKeyword } : {},
      }),
  })

  const { data: allTags = [] } = useQuery<string[]>({
    queryKey: ['sticker-tags'],
    queryFn: () => apiClient.get<string[]>('/files/sticker-tags'),
  })

  // 태그 필터링 (클라이언트 보조 필터)
  const filteredItems = selectedTag
    ? items.filter((item) => item.tag && item.tag.toLowerCase().includes(selectedTag.toLowerCase()))
    : items

  async function handleUpload(files: FileList | File[] | null) {
    if (!files || files.length === 0) return
    setUploading(true)
    const formData = new FormData()
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i])
    }
    if (uploadTag.trim()) {
      formData.append('tag', uploadTag.trim())
    }

    try {
      await apiClient.post('/files/stickers', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      queryClient.invalidateQueries({ queryKey: ['stickers'] })
      queryClient.invalidateQueries({ queryKey: ['sticker-tags'] })
      showMessage(`${files.length}개 파일이 업로드되었습니다.`, 'success')
      setUploadTag('')
    } catch {
      showMessage('업로드 중 오류가 발생했습니다. (PNG, SVG, WEBP, GIF, JPG 다중 지원)', 'error')
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(item: StickerFile) {
    if (!confirm(`"${item.orgFileName}"을(를) 삭제하시겠습니까?`)) return
    try {
      await apiClient.delete(`/files/${item.fileId}`)
      queryClient.invalidateQueries({ queryKey: ['stickers'] })
      queryClient.invalidateQueries({ queryKey: ['sticker-tags'] })
      showMessage('삭제되었습니다.', 'success')
      if (previewItem?.fileId === item.fileId) setPreviewItem(null)
    } catch {
      showMessage('삭제 중 오류가 발생했습니다.', 'error')
    }
  }

  function openRename(item: StickerFile) {
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
      queryClient.invalidateQueries({ queryKey: ['stickers'] })
      showMessage('이름이 변경되었습니다.', 'success')
      setRenameItem(null)
    } catch {
      showMessage('이름 변경 중 오류가 발생했습니다.', 'error')
    }
  }

  function openTagEdit(item: StickerFile) {
    setTagEditItem(item)
    setNewTag(item.tag || '')
  }

  async function handleTagEdit() {
    if (!tagEditItem) return
    try {
      await apiClient.patch(`/files/${tagEditItem.fileId}/tag`, { tag: newTag.trim() })
      queryClient.invalidateQueries({ queryKey: ['stickers'] })
      queryClient.invalidateQueries({ queryKey: ['sticker-tags'] })
      showMessage('태그가 수정되었습니다.', 'success')
      setTagEditItem(null)
    } catch {
      showMessage('태그 수정 중 오류가 발생했습니다.', 'error')
    }
  }

  async function handleCopyTag(item: StickerFile) {
    const label = mediaLabel(item)
    const url = mediaDownloadUrl(item)
    const tag = `![${label}](${url})`
    try {
      await copyTextToClipboard(tag)
      showMessage('마크다운 태그가 복사되었습니다.', 'success')
    } catch {
      showMessage('복사에 실패했습니다.', 'error')
    }
  }

  async function handleDownload(item: StickerFile) {
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

  const columnDefs: ColDef<StickerFile>[] = [
    {
      headerName: '미리보기',
      width: 90,
      sortable: false,
      filter: false,
      cellRenderer: (params: ICellRendererParams<StickerFile>) => {
        const item = params.data
        if (!item) return null
        return (
          <div className="flex items-center justify-center h-full">
            <img
              src={mediaDownloadUrl(item)}
              alt={item.orgFileName}
              className="w-9 h-9 object-contain rounded border border-gray-200 bg-white cursor-pointer"
              onClick={() => setPreviewItem(item)}
            />
          </div>
        )
      },
    },
    {
      field: 'orgFileName',
      headerName: '파일명',
      flex: 2,
      minWidth: 150,
      filter: 'agTextColumnFilter',
    },
    {
      field: 'tag',
      headerName: '태그',
      flex: 1.5,
      minWidth: 120,
      cellRenderer: (params: ICellRendererParams<StickerFile>) => {
        const tag = params.value
        if (!tag) return <span className="text-gray-400 text-xs">-</span>
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
            {tag}
          </span>
        )
      },
    },
    {
      field: 'fileSize',
      headerName: '크기',
      width: 100,
      valueFormatter: (params) => formatFileSize(params.value ?? 0),
    },
    {
      field: 'mimeType',
      headerName: '형식',
      width: 120,
    },
    {
      headerName: '관리',
      width: 180,
      sortable: false,
      filter: false,
      cellRenderer: (params: ICellRendererParams<StickerFile>) => {
        const item = params.data
        if (!item) return null
        return (
          <div className="flex items-center gap-1 h-full">
            <button
              onClick={() => handleCopyTag(item)}
              title="마크다운 태그 복사"
              className="p-1 text-gray-500 hover:text-indigo-600 rounded"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={() => openRename(item)}
              title="이름 수정"
              className="p-1 text-gray-500 hover:text-blue-600 rounded"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => openTagEdit(item)}
              title="태그 수정"
              className="p-1 text-gray-500 hover:text-amber-600 rounded"
            >
              <TagIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDownload(item)}
              title="다운로드"
              className="p-1 text-gray-500 hover:text-green-600 rounded"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDelete(item)}
              title="삭제"
              className="p-1 text-gray-500 hover:text-red-600 rounded"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      {/* 헤더 & 소개 */}
      <div className="flex items-center justify-between pb-4 border-b">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-500" />
            스티커 및 작은 이미지 관리
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            PNG, SVG, 주식 짤, 밈, 아이콘 등을 보관하고 마크다운/HTML 편집기에서 바로 꺼내쓸 수 있습니다.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className="flex items-center gap-1.5"
          >
            <LayoutGrid className="w-4 h-4" />
            그리드
          </Button>
          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('table')}
            className="flex items-center gap-1.5"
          >
            <TableIcon className="w-4 h-4" />
            목록
          </Button>
        </div>
      </div>

      {/* 업로드 존 (드래그 앤 드롭 및 다중 파일 지원) */}
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setIsDragging(false)
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleUpload(e.dataTransfer.files)
          }
        }}
        className={`p-4 border-2 border-dashed rounded-lg transition-colors flex flex-col md:flex-row items-center justify-between gap-4 ${
          isDragging ? 'border-amber-500 bg-amber-100/70' : 'border-amber-300 bg-amber-50/50'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-100 rounded-full text-amber-600">
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-800">
              새 스티커/짤 업로드 (드래그 앤 드롭 & 다중 파일 지원)
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              PNG, SVG, WEBP, GIF, JPG 파일을 여러 개 드래그하여 놓거나 선택해 일괄 업로드할 수 있습니다.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Input
            placeholder="업로드 태그 (예: 주식, 떡상)"
            value={uploadTag}
            onChange={(e) => setUploadTag(e.target.value)}
            className="w-48 h-9 text-sm bg-white"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            size="sm"
            className="whitespace-nowrap bg-amber-600 hover:bg-amber-700 text-white"
          >
            {uploading ? '업로드 중...' : '파일 선택'}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/png,image/svg+xml,image/webp,image/gif,image/jpeg"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleUpload(e.target.files)
              }
              e.target.value = ''
            }}
          />
        </div>
      </div>

      {/* 검색 & 태그 필터 영역 */}
      <div className="space-y-3 bg-white p-4 rounded-lg border">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
            <Input
              placeholder="파일명 또는 태그 검색..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="pl-9 h-9 text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  queryClient.invalidateQueries({ queryKey: ['stickers'] })
                }
              }}
            />
          </div>
          <Button
            size="sm"
            variant="default"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['stickers'] })}
          >
            찾기
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSearchKeyword('')
              setSelectedTag(null)
              queryClient.invalidateQueries({ queryKey: ['stickers'] })
            }}
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            초기화
          </Button>
        </div>

        {/* 태그 뱃지 목록 */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t text-xs">
            <span className="text-gray-500 font-medium mr-1">태그별 보기:</span>
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-2.5 py-1 rounded-full transition-colors ${
                selectedTag === null
                  ? 'bg-gray-800 text-white font-medium'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              전체 ({items.length})
            </button>
            {allTags.map((tag) => {
              const count = items.filter((i) => i.tag && i.tag.includes(tag)).length
              return (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                  className={`px-2.5 py-1 rounded-full transition-colors flex items-center gap-1 ${
                    selectedTag === tag
                      ? 'bg-amber-600 text-white font-medium'
                      : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                  }`}
                >
                  #{tag} {count > 0 && <span className="opacity-75">({count})</span>}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* 본문: 그리드 또는 테이블 뷰 */}
      {isLoading ? (
        <div className="h-64 flex items-center justify-center text-gray-500">불러오는 중...</div>
      ) : filteredItems.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-gray-400 border border-dashed rounded-lg bg-white">
          <Sparkles className="w-10 h-10 text-gray-300 mb-2" />
          <p>등록된 스티커/작은 이미지가 없습니다.</p>
          <p className="text-xs mt-1">상단에서 이미지 파일을 업로드해 보세요.</p>
        </div>
      ) : viewMode === 'grid' ? (
        /* 카드 그리드 뷰 */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.fileId}
              className="group relative bg-white rounded-lg border border-gray-200 hover:border-amber-400 hover:shadow-md transition-all flex flex-col overflow-hidden"
            >
              {/* 이미지 영역 */}
              <div
                className="w-full aspect-square p-3 flex items-center justify-center bg-checkered bg-gray-50 cursor-pointer overflow-hidden"
                onClick={() => setPreviewItem(item)}
              >
                <img
                  src={mediaDownloadUrl(item)}
                  alt={item.orgFileName}
                  className="max-w-full max-h-full object-contain transition-transform group-hover:scale-105"
                  loading="lazy"
                />
              </div>

              {/* 메타데이터 영역 */}
              <div className="p-2.5 flex-1 flex flex-col justify-between border-t bg-white">
                <div>
                  <p className="text-xs font-semibold text-gray-800 truncate" title={item.orgFileName}>
                    {mediaLabel(item)}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-gray-400 mt-1">
                    <span>{formatFileSize(item.fileSize)}</span>
                    {item.tag ? (
                      <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded text-[10px] font-medium truncate max-w-[90px]">
                        #{item.tag}
                      </span>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </div>
                </div>

                {/* 하단 액션 버튼 */}
                <div className="flex items-center justify-between pt-2 mt-2 border-t text-gray-500">
                  <button
                    onClick={() => handleCopyTag(item)}
                    title="마크다운 태그 복사"
                    className="p-1 hover:text-indigo-600 hover:bg-gray-100 rounded"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => openRename(item)}
                    title="이름 수정"
                    className="p-1 hover:text-blue-600 hover:bg-gray-100 rounded"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => openTagEdit(item)}
                    title="태그 수정"
                    className="p-1 hover:text-amber-600 hover:bg-gray-100 rounded"
                  >
                    <TagIcon className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDownload(item)}
                    title="다운로드"
                    className="p-1 hover:text-green-600 hover:bg-gray-100 rounded"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(item)}
                    title="삭제"
                    className="p-1 hover:text-red-600 hover:bg-gray-100 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* AG Grid 목록 뷰 */
        <div className="ag-theme-alpine w-full h-[520px] rounded-lg border overflow-hidden bg-white">
          <AgGridReact
            rowData={filteredItems}
            columnDefs={columnDefs}
            rowHeight={48}
            animateRows
            pagination
            paginationPageSize={20}
          />
        </div>
      )}

      {/* 이름 변경 다이얼로그 */}
      <Dialog open={!!renameItem} onOpenChange={(open) => !open && setRenameItem(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>파일명 수정</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-xs text-gray-500">확장자는 자동으로 유지됩니다.</p>
            <div className="flex items-center gap-1">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                className="flex-1"
                autoFocus
              />
              <span className="text-sm text-gray-500 font-mono">
                {renameItem ? getExt(renameItem.orgFileName) : ''}
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setRenameItem(null)}>
              취소
            </Button>
            <Button size="sm" onClick={handleRename}>
              수정
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 태그 변경 다이얼로그 */}
      <Dialog open={!!tagEditItem} onOpenChange={(open) => !open && setTagEditItem(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>태그 수정</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-xs text-gray-500">쉼표 또는 키워드로 구분하여 입력할 수 있습니다 (예: 주식, 떡상, 삼성전자).</p>
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTagEdit()}
              placeholder="태그 입력"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setTagEditItem(null)}>
              취소
            </Button>
            <Button size="sm" onClick={handleTagEdit}>
              수정
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 미리보기 다이얼로그 */}
      <Dialog open={!!previewItem} onOpenChange={(open) => !open && setPreviewItem(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="truncate">{previewItem?.orgFileName}</DialogTitle>
          </DialogHeader>
          {previewItem && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="p-4 border rounded-lg bg-gray-50 flex items-center justify-center max-h-[360px] w-full">
                <img
                  src={mediaDownloadUrl(previewItem)}
                  alt={previewItem.orgFileName}
                  className="max-h-[320px] max-w-full object-contain"
                />
              </div>
              <div className="text-xs text-gray-500 flex items-center justify-between w-full">
                <span>크기: {formatFileSize(previewItem.fileSize)}</span>
                {previewItem.tag && <span className="text-amber-700 font-medium">#{previewItem.tag}</span>}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => previewItem && handleCopyTag(previewItem)}
              className="flex items-center gap-1"
            >
              <Copy className="w-3.5 h-3.5" />
              마크다운 태그 복사
            </Button>
            <Button size="sm" onClick={() => setPreviewItem(null)}>
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
