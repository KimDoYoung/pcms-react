import { useState, useRef, useCallback, useEffect } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { Folder, FolderOpen, File, ChevronRight, ChevronDown, Upload, FolderPlus, Download, Pencil, Trash2, X, List, Grid3X3, Link2, Copy, Scissors, ClipboardPaste, FileText, FileImage, FileAudio, FileVideo, FileArchive, FileCode, FileSpreadsheet, FileJson, Presentation } from 'lucide-react'
import { apiClient } from '@/lib/apiClient'
import Toolbar from '@/components/Toolbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { ApNode } from '@/types/apnode'

// ──── utils ────────────────────────────────────────────────────────────────

function formatSize(bytes: number | null | undefined): string {
  if (bytes == null) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`
}

function formatDate(dt: string | null | undefined): string {
  if (!dt) return '-'
  return new Date(dt).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

function isImage(node: ApNode): boolean {
  return !!node.contentType?.startsWith('image/') || !!node.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)
}

function getNodeIcon(node: ApNode) {
  if (node.nodeType === 'D') return <Folder className="w-8 h-8 text-yellow-400" />
  if (node.nodeType === 'L') return <Link2 className="w-8 h-8 text-blue-400" />
  
  // Content-Type 기반 판별
  if (node.contentType) {
    if (node.contentType.startsWith('image/')) return <FileImage className="w-8 h-8 text-purple-400" />
    if (node.contentType.startsWith('video/')) return <FileVideo className="w-8 h-8 text-pink-400" />
    if (node.contentType.startsWith('audio/')) return <FileAudio className="w-8 h-8 text-yellow-500" />
    if (node.contentType.includes('json')) return <FileJson className="w-8 h-8 text-green-500" />
    if (node.contentType.includes('pdf')) return <FileText className="w-8 h-8 text-red-500" />
    if (node.contentType.includes('presentation') || node.contentType.includes('powerpoint')) return <Presentation className="w-8 h-8 text-orange-600" />
    if (node.contentType.includes('zip') || node.contentType.includes('tar') || node.contentType.includes('compressed')) return <FileArchive className="w-8 h-8 text-orange-500" />
    if (node.contentType.includes('spreadsheet') || node.contentType.includes('excel') || node.contentType.includes('csv')) return <FileSpreadsheet className="w-8 h-8 text-green-600" />
    if (node.contentType.includes('text/')) return <FileText className="w-8 h-8 text-gray-500" />
    if (node.contentType.includes('word') || node.contentType.includes('officedocument.wordprocessingml')) return <FileText className="w-8 h-8 text-blue-600" />
  }

  // 확장자 기반 판별 (Content-Type이 모호한 경우 대비)
  const ext = node.name.split('.').pop()?.toLowerCase()
  if (ext && node.name.includes('.')) {
    switch (ext) {
      case 'js': case 'ts': case 'jsx': case 'tsx': case 'html': case 'css': case 'java': case 'py': case 'cpp': case 'c': case 'h': case 'go': case 'rs': case 'rb': case 'php':
        return <FileCode className="w-8 h-8 text-blue-500" />
      case 'xls': case 'xlsx': case 'csv':
        return <FileSpreadsheet className="w-8 h-8 text-green-600" />
      case 'ppt': case 'pptx':
        return <Presentation className="w-8 h-8 text-orange-600" />
      case 'doc': case 'docx':
        return <FileText className="w-8 h-8 text-blue-600" />
      case 'hwp':
        return <FileText className="w-8 h-8 text-sky-500" />
      case 'zip': case 'tar': case 'gz': case 'rar': case '7z': case 'bz2':
        return <FileArchive className="w-8 h-8 text-orange-500" />
      case 'mp4': case 'mkv': case 'avi': case 'mov': case 'wmv':
        return <FileVideo className="w-8 h-8 text-pink-400" />
      case 'mp3': case 'wav': case 'ogg': case 'flac':
        return <FileAudio className="w-8 h-8 text-yellow-500" />
      case 'jpg': case 'jpeg': case 'png': case 'gif': case 'svg': case 'webp':
        return <FileImage className="w-8 h-8 text-purple-400" />
      case 'json':
        return <FileJson className="w-8 h-8 text-green-500" />
      case 'pdf':
        return <FileText className="w-8 h-8 text-red-500" />
      case 'txt': case 'md':
        return <FileText className="w-8 h-8 text-gray-500" />
    }
  }

  return <File className="w-8 h-8 text-gray-400" />
}

// ──── Tree Sidebar ──────────────────────────────────────────────────────────

interface TreeNodeProps {
  node: ApNode
  currentFolderId: string | null
  onNavigate: (id: string) => void
  ancestorIds: string[]
  onContextMenu: (e: React.MouseEvent, node: ApNode) => void
}

function TreeNode({ node, currentFolderId, onNavigate, ancestorIds, onContextMenu }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(false)

  // 조상 경로에 포함되어 있으면 자동 확장
  useEffect(() => {
    if (ancestorIds.includes(node.id)) {
      setExpanded(true)
    }
  }, [ancestorIds, node.id])

  const { data: children } = useQuery<ApNode[]>({
    queryKey: ['apnode-children', node.id],
    queryFn: () => apiClient.get<ApNode[]>(`/apnode/${node.id}/children`),
    enabled: expanded,
  })

  const dirs = (children ?? []).filter((c) => c.nodeType === 'D')
  const isCurrent = currentFolderId === node.id

  // 상태에 따른 아이콘 결정
  const FolderIcon = expanded ? FolderOpen : Folder

  return (
    <div>
      <div
        className={`flex items-center gap-1 px-2 py-1 rounded-lg cursor-pointer select-none text-sm transition-colors ${
          isCurrent ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-100'
        }`}
        onClick={() => onNavigate(node.id)}
        onContextMenu={(e) => onContextMenu(e, node)}
      >
        {node.childCount > 0 ? (
          <button
            className="p-0.5 rounded hover:bg-gray-200"
            onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v) }}
          >
            {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        ) : (
          <span className="w-5" />
        )}
        <FolderIcon className={`w-4 h-4 flex-shrink-0 ${isCurrent ? 'text-blue-500' : 'text-yellow-400'}`} />
        <span className="truncate">{node.name}</span>
      </div>
      {expanded && dirs.length > 0 && (
        <div className="ml-4 border-l border-gray-100 pl-1">
          {dirs.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              currentFolderId={currentFolderId}
              onNavigate={onNavigate}
              ancestorIds={ancestorIds}
              onContextMenu={onContextMenu}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ──── Context Menu ──────────────────────────────────────────────────────────

interface CtxMenu {
  show: boolean
  x: number
  y: number
  node: ApNode | null
}

interface Clipboard {
  id: string
  name: string
  type: 'cut' | 'copy'
}

// ──── Main Page ─────────────────────────────────────────────────────────────

export default function ApNodePage() {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isDragging, setIsDragging] = useState(false)
  const dragCounter = useRef(0)

  // 선택 상태
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // 사이드바 너비 조절 상태
  const [sidebarWidth, setSidebarWidth] = useState(240)
  const isResizing = useRef(false)

  const startResizing = useCallback(() => {
    isResizing.current = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [])

  const stopResizing = useCallback(() => {
    isResizing.current = false
    document.body.style.cursor = 'default'
    document.body.style.userSelect = 'auto'
  }, [])

  const resize = useCallback((e: MouseEvent) => {
    if (!isResizing.current) return
    const newWidth = e.clientX
    if (newWidth > 150 && newWidth < 600) {
      setSidebarWidth(newWidth)
    }
  }, [])

  useEffect(() => {
    window.addEventListener('mousemove', resize)
    window.addEventListener('mouseup', stopResizing)
    return () => {
      window.removeEventListener('mousemove', resize)
      window.removeEventListener('mouseup', stopResizing)
    }
  }, [resize, stopResizing])

  // 모달 상태
  const [createFolderOpen, setCreateFolderOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [renameOpen, setRenameOpen] = useState(false)
  const [renameNode, setRenameNode] = useState<ApNode | null>(null)
  const [renameName, setRenameName] = useState('')

  // 클립보드 (이동/링크용)
  const [clipboard, setClipboard] = useState<Clipboard | null>(null)

  // 컨텍스트 메뉴
  const [ctxMenu, setCtxMenu] = useState<CtxMenu>({ show: false, x: 0, y: 0, node: null })

  // ── 데이터 조회 ──
  const rootsQuery = useQuery<ApNode[]>({
    queryKey: ['apnode-roots'],
    queryFn: () => apiClient.get<ApNode[]>('/apnode'),
  })

  const childrenQuery = useQuery<ApNode[]>({
    queryKey: ['apnode-children', currentFolderId],
    queryFn: () =>
      currentFolderId
        ? apiClient.get<ApNode[]>(`/apnode/${currentFolderId}/children`)
        : Promise.resolve([]),
    enabled: currentFolderId != null,
  })

  const pathQuery = useQuery<ApNode[]>({
    queryKey: ['apnode-path', currentFolderId],
    queryFn: () =>
      currentFolderId
        ? apiClient.get<ApNode[]>(`/apnode/${currentFolderId}/path`)
        : Promise.resolve([]),
    enabled: currentFolderId != null,
  })

  const currentItems: ApNode[] =
    currentFolderId == null
      ? (rootsQuery.data ?? [])
      : (childrenQuery.data ?? [])

  const breadcrumb: ApNode[] = pathQuery.data ?? []
  const ancestorIds = breadcrumb.map((n) => n.id)
  const isLoading = currentFolderId == null ? rootsQuery.isLoading : childrenQuery.isLoading

  // ── mutations ──
  const invalidate = useCallback(() => {
    // 트리 전체 갱신을 위해 apnode-children의 모든 하위 쿼리 무효화
    queryClient.invalidateQueries({ queryKey: ['apnode-children'] })
    queryClient.invalidateQueries({ queryKey: ['apnode-roots'] })
    // 상단 경로(Breadcrumb) 정보도 무효화하여 즉시 갱신
    queryClient.invalidateQueries({ queryKey: ['apnode-path'] })
  }, [queryClient])

  const createDirMutation = useMutation({
    mutationFn: (name: string) =>
      apiClient.post<ApNode>('/apnode/directories', { name, parentId: currentFolderId }),
    onSuccess: (newNode) => {
      invalidate()
      setCreateFolderOpen(false)
      setNewFolderName('')
      // 새로 생성된 폴더로 자동 이동
      navigate(newNode.id)
    },
    onError: () => alert('폴더 생성 실패'),
  })

  const renameMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      apiClient.put<ApNode>(`/apnode/${id}/rename`, { name }),
    onSuccess: () => { invalidate(); setRenameOpen(false); setRenameNode(null) },
    onError: () => alert('이름 변경 실패'),
  })

  const moveMutation = useMutation({
    mutationFn: ({ id, targetParentId }: { id: string; targetParentId: string | null }) =>
      apiClient.put<ApNode>(`/apnode/${id}/move`, { targetParentId }),
    onSuccess: () => { invalidate(); setClipboard(null) },
    onError: () => alert('이동 실패'),
  })

  const createLinkMutation = useMutation({
    mutationFn: ({ name, targetId, parentId }: { name: string; targetId: string; parentId: string | null }) =>
      apiClient.post<ApNode>('/apnode/links', { name, targetId, parentId }),
    onSuccess: () => { invalidate(); setClipboard(null) },
    onError: () => alert('링크 생성 실패'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/apnode/${id}`),
    onSuccess: (_, deletedId) => {
      invalidate()
      // 현재 폴더를 삭제했다면 부모 폴더로 이동
      if (deletedId === currentFolderId) {
        const parentId = breadcrumb.length > 1 ? breadcrumb[breadcrumb.length - 2].id : null
        setCurrentFolderId(parentId)
      }
    },
    onError: () => alert('삭제 실패'),
  })

  // ── 이벤트 핸들러 ──
  function navigate(id: string | null) {
    setCurrentFolderId(id)
    setSelectedIds(new Set()) // 폴더 이동 시 선택 초기화
    setCtxMenu((m) => ({ ...m, show: false }))
  }

  function handleItemClick(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    const isMulti = e.ctrlKey || e.metaKey || e.shiftKey
    setSelectedIds((prev) => {
      const next = new Set(isMulti ? prev : [])
      if (next.has(id) && isMulti) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleSelectAll() {
    setSelectedIds((prev) => {
      if (prev.size === currentItems.length && currentItems.length > 0) return new Set()
      return new Set(currentItems.map((item) => item.id))
    })
  }

  function openRename(node: ApNode) {
    setRenameNode(node)
    setRenameName(node.name)
    setRenameOpen(true)
    setCtxMenu((m) => ({ ...m, show: false }))
  }

  function handleDelete(node: ApNode) {
    if (!confirm(`"${node.name}" 및 하위 모든 항목을 삭제하시겠습니까?`)) return
    deleteMutation.mutate(node.id)
    setCtxMenu((m) => ({ ...m, show: false }))
  }

  async function handleDownload(node: ApNode) {
    try {
      // apiClient를 사용하여 blob 형태로 데이터 요청 (토큰 헤더 자동 포함됨)
      const response = await (apiClient as any).get(`/apnode/${node.id}/download`, {
        responseType: 'blob',
      })

      // 파일 다운로드를 위한 임시 URL 생성
      const url = window.URL.createObjectURL(new Blob([response]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', node.name) // 다운로드될 파일명 설정
      document.body.appendChild(link)
      link.click()

      // 정리
      link.parentNode?.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download failed:', error)
      alert('다운로드에 실패했습니다.')
    } finally {
      setCtxMenu((m) => ({ ...m, show: false }))
    }
  }

  function handlePaste() {
    if (!clipboard) return
    if (clipboard.type === 'cut') {
      moveMutation.mutate({ id: clipboard.id, targetParentId: currentFolderId })
    } else {
      createLinkMutation.mutate({
        name: `${clipboard.name} 링크`,
        targetId: clipboard.id,
        parentId: currentFolderId,
      })
    }
  }

  function showCtxMenu(e: React.MouseEvent, node: ApNode | null) {
    e.preventDefault()
    e.stopPropagation() // 이벤트 전파 차단 (배경 우클릭 방지)
    setCtxMenu({ show: true, x: e.clientX, y: e.clientY, node })
  }

  async function uploadFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    for (const file of Array.from(files)) {
      const fd = new FormData()
      fd.append('file', file)
      if (currentFolderId) fd.append('parentId', currentFolderId)
      try {
        await apiClient.post('/apnode/files', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      } catch {
        alert(`"${file.name}" 업로드 실패`)
      }
    }
    invalidate()
  }

  // drag & drop
  function onDragEnter(e: React.DragEvent) {
    e.preventDefault()
    dragCounter.current++
    setIsDragging(true)
  }
  function onDragOver(e: React.DragEvent) { e.preventDefault() }
  function onDragLeave(e: React.DragEvent) {
    e.preventDefault()
    dragCounter.current--
    if (dragCounter.current === 0) setIsDragging(false)
  }
  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    dragCounter.current = 0
    setIsDragging(false)
    uploadFiles(e.dataTransfer.files)
  }

  // 더블클릭 핸들러
  async function handleDblClick(node: ApNode) {
    if (node.nodeType === 'D') {
      navigate(node.id)
    } else if (node.nodeType === 'L') {
      if (node.linkTargetId) {
        // 링크 대상이 디렉토리인지 확인하기 위해 정보를 가져옴
        try {
          const targetNode = await apiClient.get<ApNode>(`/apnode/${node.linkTargetId}`)
          if (targetNode.nodeType === 'D') {
            navigate(targetNode.id)
          } else {
            handleDownload(node)
          }
        } catch {
          alert('링크 대상을 찾을 수 없습니다.')
        }
      }
    } else if (node.nodeType === 'F') {
      handleDownload(node)
    }
  }

  const rootDirs = (rootsQuery.data ?? []).filter((n) => n.nodeType === 'D')

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Toolbar />

      <div className="container mx-auto px-4 flex flex-col flex-1" style={{ height: 'calc(100vh - 64px)' }}>

        {/* 상단 헤더 */}
        <header className="bg-white border-b border-gray-100 px-6 py-3 flex items-center gap-4">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-1 text-sm flex-1 min-w-0">
            <button
              onClick={() => navigate(null)}
              className="px-2 py-1 rounded hover:bg-blue-50 hover:text-blue-600 transition-colors text-gray-500 font-medium"
            >
              /
            </button>
            {breadcrumb.map((item, idx) => (
              <span key={item.id} className="flex items-center gap-1">
                <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                <button
                  onClick={() => navigate(item.id)}
                  className={`px-2 py-1 rounded hover:bg-blue-50 hover:text-blue-600 transition-colors ${
                    idx === breadcrumb.length - 1
                      ? 'font-semibold text-gray-800'
                      : 'text-gray-500'
                  }`}
                >
                  {item.name}
                </button>
              </span>
            ))}
          </nav>

          {/* 액션 */}
          <div className="flex items-center gap-2">
            {clipboard && (
              <Button size="sm" variant="ghost" className="text-blue-600 hover:bg-blue-50" onClick={handlePaste}>
                <ClipboardPaste className="w-4 h-4 mr-1" /> 붙여넣기 ({clipboard.type === 'cut' ? '이동' : '링크'})
              </Button>
            )}
            {/* 뷰 전환 */}
            <div className="flex border border-gray-200 rounded-lg overflow-hidden ml-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:bg-gray-50'}`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:bg-gray-50'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* 본문: 사이드바 + 파일 영역 */}
        <div className="flex flex-1 min-h-0">

          {/* 트리 사이드바 */}
          <aside
            style={{ width: `${sidebarWidth}px` }}
            className="border-r border-gray-100 bg-gray-50/50 overflow-y-auto flex-shrink-0 hidden md:block"
          >
            <div className="p-4 flex flex-col gap-2">
              <div className="flex flex-row gap-2">
                <Button size="sm" variant="outline" className="flex-1 justify-start bg-white px-2" onClick={() => setCreateFolderOpen(true)}>
                  <FolderPlus className="w-4 h-4 mr-1.5 text-blue-500 flex-shrink-0" /> <span className="truncate">새 폴더</span>
                </Button>
                <Button size="sm" variant="outline" className="flex-1 justify-start bg-white px-2" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="w-4 h-4 mr-1.5 text-green-500 flex-shrink-0" /> <span className="truncate">업로드</span>
                </Button>
              </div>
              <div className="flex flex-row gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 justify-start bg-white px-2"
                  disabled={!currentFolderId || breadcrumb.length === 0}
                  onClick={() => {
                    const currentFolderNode = breadcrumb[breadcrumb.length - 1]
                    if (currentFolderNode) openRename(currentFolderNode)
                  }}
                >
                  <Pencil className="w-4 h-4 mr-1.5 text-blue-500 flex-shrink-0" /> <span className="truncate">이름 변경</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 justify-start bg-white px-2 text-red-500 hover:text-red-600 hover:bg-red-50"
                  disabled={!currentFolderId || breadcrumb.length === 0}
                  onClick={() => {
                    const currentFolderNode = breadcrumb[breadcrumb.length - 1]
                    if (currentFolderNode) handleDelete(currentFolderNode)
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-1.5 flex-shrink-0" /> <span className="truncate">삭제</span>
                </Button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => uploadFiles(e.target.files)}
              />
            </div>
            <div className="p-3 pt-0">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">폴더</p>
              {rootDirs.map((node) => (
                <TreeNode
                  key={node.id}
                  node={node}
                  currentFolderId={currentFolderId}
                  onNavigate={navigate}
                  ancestorIds={ancestorIds}
                  onContextMenu={showCtxMenu}
                />
              ))}
            </div>
          </aside>

          {/* 리사이즈 바 */}
          <div
            className="w-1 hover:w-1.5 hover:bg-blue-300 bg-transparent transition-all cursor-col-resize flex-shrink-0 z-10 active:bg-blue-500 active:w-1.5"
            onMouseDown={startResizing}
          />

          {/* 파일 영역 */}
          <section
            className="flex-1 flex flex-col min-w-0 bg-white relative overflow-hidden"
            onDragEnter={onDragEnter}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => setCtxMenu((m) => ({ ...m, show: false }))}
            onContextMenu={(e) => showCtxMenu(e, null)}
          >
            {/* Drag overlay */}
            {isDragging && (
              <div className="absolute inset-0 bg-blue-50/90 z-50 flex items-center justify-center border-2 border-dashed border-blue-400 m-2 rounded-xl pointer-events-none">
                <div className="text-center">
                  <Upload className="w-16 h-16 text-blue-400 mx-auto mb-3" />
                  <p className="text-xl font-bold text-blue-600">파일을 여기에 놓으세요</p>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-100 border-t-blue-400" />
                </div>
              ) : currentItems.length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                  <Folder className="w-16 h-16 mx-auto mb-3 text-gray-200" />
                  <p className="font-medium">이 폴더는 비어 있습니다</p>
                  <p className="text-sm mt-1 text-gray-300">파일을 드래그하거나 업로드하세요</p>
                </div>
              ) : viewMode === 'grid' ? (
                // ── Grid View ──
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                  {currentItems.map((item) => {
                    const isSelected = selectedIds.has(item.id)
                    return (
                      <div
                        key={item.id}
                        onDoubleClick={() => handleDblClick(item)}
                        onContextMenu={(e) => showCtxMenu(e, item)}
                        onClick={(e) => handleItemClick(e, item.id)}
                        className={`group relative border rounded-2xl p-4 cursor-pointer hover:shadow-md transition-all flex flex-col items-center gap-2 h-40 ${
                          isSelected ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200' : 'bg-white border-gray-100 hover:border-gray-200'
                        }`}
                      >
                        {/* 액션 버튼 그룹 */}
                        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                          <button
                            onClick={(e) => { e.stopPropagation(); openRename(item) }}
                            className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
                            title="이름 변경"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          {(item.nodeType === 'F' || item.nodeType === 'L') && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDownload(item) }}
                              className="p-1.5 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded-full transition-colors"
                              title="다운로드"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(item) }}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                            title="삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* 아이콘 / 썸네일 */}
                        <div className="flex-1 flex items-center justify-center w-full">
                          {item.thumbnailUrl || (item.fileUrl && isImage(item)) ? (
                            <img
                              src={item.thumbnailUrl || item.fileUrl}
                              className="max-h-20 max-w-full object-contain rounded"
                              loading="lazy"
                            />
                          ) : (
                            <div className="scale-100 group-hover:scale-110 transition-transform duration-200">
                              {getNodeIcon(item)}
                            </div>
                          )}
                        </div>

                        {/* 이름 */}
                        <div className="w-full text-center px-1">
                          <p className="text-xs font-medium text-gray-700 truncate" title={item.name}>
                            {item.name}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {item.nodeType === 'D'
                              ? `${item.childCount}개 항목`
                              : formatSize(item.fileSize)}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                // ── List View ──
                <div className="rounded-lg border border-gray-100 overflow-hidden">
                  <table className="w-full table-fixed text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="p-3 w-10 text-center">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300"
                            checked={currentItems.length > 0 && selectedIds.size === currentItems.length}
                            onChange={handleSelectAll}
                          />
                        </th>
                        <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase w-7/12">이름</th>
                        <th className="text-right p-3 text-xs font-semibold text-gray-500 uppercase w-2/12">크기</th>
                        <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase w-3/12">수정일</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.map((item) => {
                        const isSelected = selectedIds.has(item.id)
                        return (
                          <tr
                            key={item.id}
                            onDoubleClick={() => handleDblClick(item)}
                            onContextMenu={(e) => showCtxMenu(e, item)}
                            onClick={(e) => handleItemClick(e, item.id)}
                            className={`border-b transition-colors group cursor-pointer ${
                              isSelected ? 'bg-blue-50 border-blue-100' : 'border-gray-50 hover:bg-gray-50'
                            }`}
                          >
                            <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                className="rounded border-gray-300"
                                checked={isSelected}
                                onChange={(e) => handleItemClick(e as any, item.id)}
                              />
                            </td>
                            <td className="p-2">
                              <div className="flex items-center gap-2">
                                <div className="flex-shrink-0">{getNodeIcon(item)}</div>
                                <span className="font-medium text-gray-800 truncate">{item.name}</span>
                                {/* 호버 액션 */}
                                <div className="ml-auto hidden group-hover:flex items-center gap-1 pr-2">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); openRename(item) }}
                                    className="p-1 text-gray-400 hover:text-blue-500 rounded"
                                    title="이름 변경"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  {(item.nodeType === 'F' || item.nodeType === 'L') && (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleDownload(item) }}
                                      className="p-1 text-gray-400 hover:text-green-500 rounded"
                                      title="다운로드"
                                    >
                                      <Download className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleDelete(item) }}
                                    className="p-1 text-gray-400 hover:text-red-500 rounded"
                                    title="삭제"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </td>
                            <td className="p-3 text-gray-500 text-right">
                              {item.nodeType === 'D' ? '-' : formatSize(item.fileSize)}
                            </td>
                            <td className="p-3 text-gray-500">
                              {formatDate(item.modifyDt || item.createDt)}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )
}
            </div>

            {/* 상태 바 */}
            <div className="bg-gray-50 border-t border-gray-100 px-4 py-1.5 text-xs text-gray-400 flex justify-between">
              <span>
                전체 {currentItems.length}개 항목
                {selectedIds.size > 0 && (
                  <span className="ml-2 font-medium text-blue-600">
                    ({selectedIds.size}개 선택됨)
                  </span>
                )}
              </span>
            </div>
          </section>
        </div>
      </div>

      {/* ── 컨텍스트 메뉴 ── */}
      {ctxMenu.show && (
        <div
          className="fixed bg-white shadow-xl rounded-lg border border-gray-100 py-1 z-50 min-w-[160px]"
          style={{ top: ctxMenu.y, left: ctxMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          {ctxMenu.node ? (
            <>
              <button
                onClick={() => openRename(ctxMenu.node!)}
                className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-gray-700 transition-colors"
              >
                <Pencil className="w-4 h-4 text-gray-400" /> 이름 변경
              </button>
              <button
                onClick={() => { setClipboard({ id: ctxMenu.node!.id, name: ctxMenu.node!.name, type: 'cut' }); setCtxMenu((m) => ({ ...m, show: false })) }}
                className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-gray-700 transition-colors"
              >
                <Scissors className="w-4 h-4 text-gray-400" /> 이동 (잘라내기)
              </button>
              <button
                onClick={() => { setClipboard({ id: ctxMenu.node!.id, name: ctxMenu.node!.name, type: 'copy' }); setCtxMenu((m) => ({ ...m, show: false })) }}
                className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-gray-700 transition-colors"
              >
                <Copy className="w-4 h-4 text-gray-400" /> 링크 복사
              </button>
              {(ctxMenu.node.nodeType === 'F' || ctxMenu.node.nodeType === 'L') && (
                <button
                  onClick={() => handleDownload(ctxMenu.node!)}
                  className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-gray-700 transition-colors"
                >
                  <Download className="w-4 h-4 text-gray-400" /> 다운로드
                </button>
              )}
              <hr className="my-1 border-gray-100" />
              <button
                onClick={() => handleDelete(ctxMenu.node!)}
                className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-600 transition-colors"
              >
                <Trash2 className="w-4 h-4" /> 삭제
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => { setCreateFolderOpen(true); setCtxMenu((m) => ({ ...m, show: false })) }}
                className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-gray-700 transition-colors"
              >
                <FolderPlus className="w-4 h-4 text-gray-400" /> 새 폴더
              </button>
              {clipboard && (
                <button
                  onClick={() => { handlePaste(); setCtxMenu((m) => ({ ...m, show: false })) }}
                  className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-blue-700 transition-colors"
                >
                  <ClipboardPaste className="w-4 h-4" /> 붙여넣기 ({clipboard.type === 'cut' ? '이동' : '링크'})
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* ── 새 폴더 모달 ── */}
      {createFolderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setCreateFolderOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 z-10">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-800">새 폴더</h2>
              <button onClick={() => setCreateFolderOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 py-5">
              <Input
                placeholder="폴더 이름"
                value={newFolderName}
                autoFocus
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && newFolderName.trim()) createDirMutation.mutate(newFolderName.trim()) }}
              />
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100">
              <Button variant="outline" size="sm" onClick={() => setCreateFolderOpen(false)}>취소</Button>
              <Button
                size="sm"
                disabled={!newFolderName.trim() || createDirMutation.isPending}
                onClick={() => createDirMutation.mutate(newFolderName.trim())}
              >
                {createDirMutation.isPending ? '생성 중...' : '생성'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── 이름 변경 모달 ── */}
      {renameOpen && renameNode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setRenameOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 z-10">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-800">이름 변경</h2>
              <button onClick={() => setRenameOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 py-5">
              <Input
                value={renameName}
                autoFocus
                onChange={(e) => setRenameName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && renameName.trim())
                    renameMutation.mutate({ id: renameNode.id, name: renameName.trim() })
                }}
              />
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100">
              <Button variant="outline" size="sm" onClick={() => setRenameOpen(false)}>취소</Button>
              <Button
                size="sm"
                disabled={!renameName.trim() || renameMutation.isPending}
                onClick={() => renameMutation.mutate({ id: renameNode.id, name: renameName.trim() })}
              >
                {renameMutation.isPending ? '변경 중...' : '변경'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
