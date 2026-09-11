/**
 * 목적: 마크다운 에디터 및 본문에서 사용할 수 있는 작은 이미지(PNG, SVG, 주식 짤, 스티커 등)를
 *       다중 업로드(multi file upload, 드래그 앤 드롭 지원)/삭제/조회하고 태그 및 파일명을 변경하며
 *       마크다운 삽입 태그를 복사하는 관리 패널.
 *       갤러리 카드 뷰와 AG Grid 테이블 뷰를 모두 지원하며, 썸네일 멀티 선택을 통한 일괄 태그 수정/삭제 및
 *       호버/선택 단축키(c: 복사, r: 이름수정, t: 태그수정, d: 다운로드, x: 삭제, Space: 선택/해제 토글)를 지원한다.
 *
 * 사용법:
 *   <StickerManagePanel />
 *   StickerManagePage 안에서 사용된다.
 *
 * props: 없음
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AgGridReact } from 'ag-grid-react'
import {
  AllCommunityModule,
  ModuleRegistry,
  type ColDef,
  type ICellRendererParams,
  type SelectionChangedEvent,
} from 'ag-grid-community'
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
  CheckSquare,
  Square,
  X,
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
  const [showUploadZone, setShowUploadZone] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadTag, setUploadTag] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  // 단일 아이템 조작 모달 상태
  const [renameItem, setRenameItem] = useState<StickerFile | null>(null)
  const [newName, setNewName] = useState('')
  const [tagEditItem, setTagEditItem] = useState<StickerFile | null>(null)
  const [newTag, setNewTag] = useState('')
  const [previewItem, setPreviewItem] = useState<StickerFile | null>(null)
  const [singleDeleteItem, setSingleDeleteItem] = useState<StickerFile | null>(null)

  // 멀티 선택 및 일괄 작업 상태
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [hoveredItem, setHoveredItem] = useState<StickerFile | null>(null)
  const [batchTagDialogOpen, setBatchTagDialogOpen] = useState(false)
  const [batchTagValue, setBatchTagValue] = useState('')
  const [batchDeleteDialogOpen, setBatchDeleteDialogOpen] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const renameInputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()
  const { showMessage } = useMessage()

  // 파일명 수정 모달 열림 시 인풋 텍스트 즉시 전체 선택
  useEffect(() => {
    if (renameItem) {
      const timer = setTimeout(() => {
        renameInputRef.current?.focus()
        renameInputRef.current?.select()
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [renameItem])

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

  // 멀티 선택 핸들러
  const toggleSelect = useCallback((fileId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(fileId)) {
        next.delete(fileId)
      } else {
        next.add(fileId)
      }
      return next
    })
  }, [])

  const selectAll = () => {
    setSelectedIds(new Set(filteredItems.map((i) => i.fileId)))
  }

  const clearSelection = () => {
    setSelectedIds(new Set())
  }

  const isAllSelected =
    filteredItems.length > 0 && filteredItems.every((i) => selectedIds.has(i.fileId))

  // 업로드
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

  // 단일 삭제
  async function confirmSingleDelete() {
    if (!singleDeleteItem) return
    try {
      await apiClient.delete(`/files/${singleDeleteItem.fileId}`)
      queryClient.invalidateQueries({ queryKey: ['stickers'] })
      queryClient.invalidateQueries({ queryKey: ['sticker-tags'] })
      showMessage('삭제되었습니다.', 'success')
      if (previewItem?.fileId === singleDeleteItem.fileId) setPreviewItem(null)
      setSelectedIds((prev) => {
        const next = new Set(prev)
        next.delete(singleDeleteItem.fileId)
        return next
      })
      setSingleDeleteItem(null)
    } catch {
      showMessage('삭제 중 오류가 발생했습니다.', 'error')
    }
  }

  // 일괄 삭제
  async function handleBatchDelete() {
    if (selectedIds.size === 0) return
    try {
      await apiClient.post('/files/batch-delete', {
        fileIds: Array.from(selectedIds),
      })
      queryClient.invalidateQueries({ queryKey: ['stickers'] })
      queryClient.invalidateQueries({ queryKey: ['sticker-tags'] })
      showMessage(`${selectedIds.size}개의 파일이 삭제되었습니다.`, 'success')
      setBatchDeleteDialogOpen(false)
      clearSelection()
    } catch {
      showMessage('일괄 삭제 중 오류가 발생했습니다.', 'error')
    }
  }

  // 일괄 태그 수정
  async function handleBatchTag() {
    if (selectedIds.size === 0) return
    try {
      await apiClient.patch('/files/stickers/batch-tag', {
        fileIds: Array.from(selectedIds),
        tag: batchTagValue.trim(),
      })
      queryClient.invalidateQueries({ queryKey: ['stickers'] })
      queryClient.invalidateQueries({ queryKey: ['sticker-tags'] })
      showMessage(`${selectedIds.size}개 파일의 태그가 일괄 수정되었습니다.`, 'success')
      setBatchTagDialogOpen(false)
      setBatchTagValue('')
      clearSelection()
    } catch {
      showMessage('태그 일괄 수정 중 오류가 발생했습니다.', 'error')
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

  const handleCopyTag = useCallback(
    async (item: StickerFile) => {
      const label = mediaLabel(item)
      const url = mediaDownloadUrl(item)
      const tag = `![${label}](${url})`
      try {
        await copyTextToClipboard(tag)
        showMessage(`마크다운 태그가 복사되었습니다: ${label}`, 'success')
      } catch {
        showMessage('복사에 실패했습니다.', 'error')
      }
    },
    [showMessage],
  )

  const handleDownload = useCallback(
    async (item: StickerFile) => {
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
    },
    [showMessage],
  )

  // 키보드 단축키 (hover 상태이거나 1개 선택된 상태에서 동작)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 텍스트 인풋, textarea 포커스 중에는 단축키 무시
      const active = document.activeElement
      if (
        active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement ||
        (active as HTMLElement)?.isContentEditable
      ) {
        return
      }

      // Ctrl, Meta, Alt 조합키는 브라우저/시스템용이므로 무시
      if (e.ctrlKey || e.metaKey || e.altKey) return

      // 열려 있는 모달이 있으면 단축키 무시
      if (
        renameItem ||
        tagEditItem ||
        previewItem ||
        batchTagDialogOpen ||
        batchDeleteDialogOpen ||
        singleDeleteItem
      ) {
        return
      }

      // 스페이스바: 마우스 호버된 썸네일의 선택/해제 토글
      if (e.key === ' ' || e.code === 'Space') {
        if (hoveredItem) {
          e.preventDefault()
          toggleSelect(hoveredItem.fileId)
        }
        return
      }

      // 대상 아이템 결정: 마우스 hover된 아이템 1순위, 또는 선택된 아이템이 1개일 때
      const target =
        hoveredItem ||
        (selectedIds.size === 1
          ? items.find((i) => selectedIds.has(i.fileId))
          : null)

      if (!target) return

      const key = e.key.toLowerCase()
      if (key === 'c') {
        e.preventDefault()
        handleCopyTag(target)
      } else if (key === 'r') {
        e.preventDefault()
        openRename(target)
      } else if (key === 't') {
        e.preventDefault()
        openTagEdit(target)
      } else if (key === 'd') {
        e.preventDefault()
        handleDownload(target)
      } else if (key === 'x') {
        e.preventDefault()
        setSingleDeleteItem(target)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    hoveredItem,
    selectedIds,
    items,
    renameItem,
    tagEditItem,
    previewItem,
    batchTagDialogOpen,
    batchDeleteDialogOpen,
    singleDeleteItem,
    handleCopyTag,
    handleDownload,
    toggleSelect,
  ])

  const columnDefs: ColDef<StickerFile>[] = [
    {
      headerName: '',
      width: 50,
      checkboxSelection: true,
      headerCheckboxSelection: true,
      sortable: false,
      filter: false,
    },
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
              className="w-9 h-9 object-contain rounded border border-gray-200 bg-white cursor-pointer hover:ring-2 hover:ring-amber-400"
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
      headerName: '관리 (단축키)',
      width: 190,
      sortable: false,
      filter: false,
      cellRenderer: (params: ICellRendererParams<StickerFile>) => {
        const item = params.data
        if (!item) return null
        return (
          <div className="flex items-center gap-1 h-full">
            <button
              onClick={() => handleCopyTag(item)}
              title="마크다운 태그 복사 (c)"
              className="p-1 text-gray-500 hover:text-indigo-600 rounded"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={() => openRename(item)}
              title="이름 수정 (r)"
              className="p-1 text-gray-500 hover:text-blue-600 rounded"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => openTagEdit(item)}
              title="태그 수정 (t)"
              className="p-1 text-gray-500 hover:text-amber-600 rounded"
            >
              <TagIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDownload(item)}
              title="다운로드 (d)"
              className="p-1 text-gray-500 hover:text-green-600 rounded"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSingleDeleteItem(item)}
              title="삭제 (x)"
              className="p-1 text-gray-500 hover:text-red-600 rounded"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )
      },
    },
  ]

  const handleGridSelectionChanged = (event: SelectionChangedEvent<StickerFile>) => {
    const selectedRows = event.api.getSelectedRows()
    setSelectedIds(new Set(selectedRows.map((r) => r.fileId)))
  }

  return (
    <div className="space-y-6">
      {/* 헤더 & 소개 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
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
            variant={showUploadZone ? 'navy' : 'outline'}
            size="sm"
            onClick={() => setShowUploadZone((prev) => !prev)}
            className="flex items-center gap-1.5"
          >
            <Upload className="w-4 h-4" />
            업로드
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'navy' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className="flex items-center gap-1.5"
          >
            <LayoutGrid className="w-4 h-4" />
            그리드
          </Button>
          <Button
            variant={viewMode === 'table' ? 'navy' : 'outline'}
            size="sm"
            onClick={() => setViewMode('table')}
            className="flex items-center gap-1.5"
          >
            <TableIcon className="w-4 h-4" />
            목록
          </Button>
        </div>
      </div>

      {/* 업로드 존 (드래그 앤 드롭 및 다중 파일 지원, '업로드' 버튼 클릭 시 토글) */}
      {showUploadZone && (
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
      )}

      {/* 검색 & 태그 필터 영역 */}
      <div className="space-y-3 bg-white p-4 rounded-lg border">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1">
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

      {/* 멀티 선택 일괄 작업 액션 바 */}
      {selectedIds.size > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={isAllSelected ? clearSelection : selectAll}
              className="h-8 bg-white border-amber-300 text-amber-900 hover:bg-amber-100"
            >
              {isAllSelected ? (
                <>
                  <CheckSquare className="w-4 h-4 mr-1.5 text-amber-600" />
                  전체 해제
                </>
              ) : (
                <>
                  <Square className="w-4 h-4 mr-1.5 text-amber-600" />
                  전체 선택 ({filteredItems.length})
                </>
              )}
            </Button>
            <div className="text-sm font-semibold text-amber-900">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-600 text-white mr-1.5">
                {selectedIds.size}개
              </span>
              선택됨
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setBatchTagValue('')
                setBatchTagDialogOpen(true)
              }}
              className="h-8 bg-white border-amber-300 text-amber-900 hover:bg-amber-100 flex items-center gap-1.5"
            >
              <TagIcon className="w-3.5 h-3.5 text-amber-600" />
              태그 일괄 입력
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setBatchDeleteDialogOpen(true)}
              className="h-8 flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              일괄 삭제
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={clearSelection}
              className="h-8 text-gray-500 hover:text-gray-800"
              title="선택 취소"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

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
          {filteredItems.map((item) => {
            const isSelected = selectedIds.has(item.fileId)
            const isHovered = hoveredItem?.fileId === item.fileId

            return (
              <div
                key={item.fileId}
                onMouseEnter={() => setHoveredItem(item)}
                onMouseLeave={() => setHoveredItem(null)}
                className={`group relative bg-white rounded-lg border transition-all flex flex-col overflow-hidden ${
                  isSelected
                    ? 'ring-2 ring-amber-500 border-amber-500 bg-amber-50/20 shadow-md'
                    : isHovered
                    ? 'border-amber-400 shadow-md'
                    : 'border-gray-200 hover:border-amber-300 hover:shadow-sm'
                }`}
              >
                {/* 좌상단 체크박스 (멀티 선택) */}
                <div
                  className={`absolute top-2 left-2 z-10 transition-opacity ${
                    isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => toggleSelect(item.fileId)}
                    className={`w-6 h-6 rounded flex items-center justify-center shadow-xs transition-colors ${
                      isSelected
                        ? 'bg-amber-600 text-white'
                        : 'bg-white/90 border border-gray-300 text-gray-500 hover:border-amber-500'
                    }`}
                    title={isSelected ? '선택 해제' : '선택'}
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* 이미지 영역 */}
                <div
                  className="w-full aspect-square p-3 flex items-center justify-center bg-checkered bg-gray-50 cursor-pointer overflow-hidden relative"
                  onClick={() => setPreviewItem(item)}
                  title="클릭하여 미리보기"
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

                  {/* 하단 액션 버튼 (단축키 힌트 포함) */}
                  <div className="flex items-center justify-between pt-2 mt-2 border-t text-gray-500">
                    <button
                      onClick={() => handleCopyTag(item)}
                      title="마크다운 태그 복사 (c)"
                      className="p-1 hover:text-indigo-600 hover:bg-gray-100 rounded transition-colors relative group/btn"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span className="hidden group-hover/btn:inline-block absolute -bottom-5 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[9px] px-1 rounded">
                        c
                      </span>
                    </button>
                    <button
                      onClick={() => openRename(item)}
                      title="이름 수정 (r)"
                      className="p-1 hover:text-blue-600 hover:bg-gray-100 rounded transition-colors relative group/btn"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span className="hidden group-hover/btn:inline-block absolute -bottom-5 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[9px] px-1 rounded">
                        r
                      </span>
                    </button>
                    <button
                      onClick={() => openTagEdit(item)}
                      title="태그 수정 (t)"
                      className="p-1 hover:text-amber-600 hover:bg-gray-100 rounded transition-colors relative group/btn"
                    >
                      <TagIcon className="w-3.5 h-3.5" />
                      <span className="hidden group-hover/btn:inline-block absolute -bottom-5 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[9px] px-1 rounded">
                        t
                      </span>
                    </button>
                    <button
                      onClick={() => handleDownload(item)}
                      title="다운로드 (d)"
                      className="p-1 hover:text-green-600 hover:bg-gray-100 rounded transition-colors relative group/btn"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span className="hidden group-hover/btn:inline-block absolute -bottom-5 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[9px] px-1 rounded">
                        d
                      </span>
                    </button>
                    <button
                      onClick={() => setSingleDeleteItem(item)}
                      title="삭제 (x)"
                      className="p-1 hover:text-red-600 hover:bg-gray-100 rounded transition-colors relative group/btn"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden group-hover/btn:inline-block absolute -bottom-5 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[9px] px-1 rounded">
                        x
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
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
            rowSelection="multiple"
            onSelectionChanged={handleGridSelectionChanged}
          />
        </div>
      )}

      {/* 이름 변경 다이얼로그 */}
      <Dialog open={!!renameItem} onOpenChange={(open) => !open && setRenameItem(null)}>
        <DialogContent
          className="sm:max-w-md"
          onOpenAutoFocus={(e) => {
            e.preventDefault()
            renameInputRef.current?.focus()
            renameInputRef.current?.select()
          }}
        >
          <DialogHeader>
            <DialogTitle>파일명 수정</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-xs text-gray-500">확장자는 자동으로 유지됩니다.</p>
            <div className="flex items-center gap-1">
              <Input
                ref={renameInputRef}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onFocus={(e) => e.target.select()}
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

      {/* 태그 변경 다이얼로그 (단일) */}
      <Dialog open={!!tagEditItem} onOpenChange={(open) => !open && setTagEditItem(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>태그 수정</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-xs text-gray-500">
              쉼표 또는 키워드로 구분하여 입력할 수 있습니다 (예: 주식, 떡상, 삼성전자).
            </p>
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

      {/* 일괄 태그 입력 다이얼로그 */}
      <Dialog open={batchTagDialogOpen} onOpenChange={setBatchTagDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>선택한 스티커 태그 일괄 수정</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-xs text-gray-600">
              선택한 <strong className="text-amber-700">{selectedIds.size}개</strong> 파일의 태그를
              일괄 설정합니다. (비워두면 태그가 삭제됩니다)
            </p>
            <Input
              value={batchTagValue}
              onChange={(e) => setBatchTagValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleBatchTag()}
              placeholder="일괄 적용할 태그 입력 (예: 주식, 밈)"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setBatchTagDialogOpen(false)}>
              취소
            </Button>
            <Button size="sm" onClick={handleBatchTag} className="bg-amber-600 hover:bg-amber-700 text-white">
              일괄 적용
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 단일 삭제 확인 다이얼로그 */}
      <Dialog open={!!singleDeleteItem} onOpenChange={(open) => !open && setSingleDeleteItem(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>스티커 삭제</DialogTitle>
          </DialogHeader>
          <div className="py-2 text-sm text-gray-600">
            <p>
              &quot;<strong className="text-gray-900">{singleDeleteItem?.orgFileName}</strong>&quot;을(를)
              정말 삭제하시겠습니까?
            </p>
            <p className="text-xs text-gray-400 mt-1">삭제된 파일은 복구할 수 없습니다.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setSingleDeleteItem(null)}>
              취소
            </Button>
            <Button variant="destructive" size="sm" onClick={confirmSingleDelete}>
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 일괄 삭제 확인 다이얼로그 */}
      <Dialog open={batchDeleteDialogOpen} onOpenChange={setBatchDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>선택한 스티커 일괄 삭제</DialogTitle>
          </DialogHeader>
          <div className="py-2 text-sm text-gray-600">
            <p>
              선택한 <strong className="text-red-600">{selectedIds.size}개</strong>의 스티커 파일을
              정말 삭제하시겠습니까?
            </p>
            <p className="text-xs text-gray-400 mt-1">물리 파일과 레코드가 모두 영구적으로 삭제됩니다.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setBatchDeleteDialogOpen(false)}>
              취소
            </Button>
            <Button variant="destructive" size="sm" onClick={handleBatchDelete}>
              {selectedIds.size}개 일괄 삭제
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
