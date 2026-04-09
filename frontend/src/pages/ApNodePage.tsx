import { useState, useRef, useCallback } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { Folder, File, ChevronRight, ChevronDown, Upload, FolderPlus, Download, Pencil, Trash2, X, List, Grid3X3, Link2 } from 'lucide-react'
import { apiClient } from '@/lib/apiClient'
import Toolbar from '@/components/Toolbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface ApNodeDto {
  id: string
  nodeType: 'F' | 'D' | 'L'
  parentId: string | null
  name: string
  depth: number
  createDt: string
  modifyDt: string
  childCount: number
  totalSize: number
  linkTargetId: string | null
  brokenLink: boolean
  fileUrl: string | null
  originalName: string | null
  fileSize: number | null
  contentType: string | null
  width: number | null
  height: number | null
}

// ──── utils ────────────────────────────────────────────────────────────────

function formatSize(bytes: number | null): string {
  if (bytes == null) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`
}

function formatDate(dt: string | null): string {
  if (!dt) return '-'
  return new Date(dt).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

function isImage(node: ApNodeDto): boolean {
  return !!node.contentType?.startsWith('image/')
}

function getNodeIcon(node: ApNodeDto) {
  if (node.nodeType === 'D') return <Folder className="w-8 h-8 text-yellow-400" />
  if (node.nodeType === 'L') return <Link2 className="w-8 h-8 text-blue-400" />
  return <File className="w-8 h-8 text-gray-400" />
}

// ──── Tree Sidebar ──────────────────────────────────────────────────────────

interface TreeNodeProps {
  node: ApNodeDto
  currentFolderId: string | null
  onNavigate: (id: string) => void
}

function TreeNode({ node, currentFolderId, onNavigate }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(false)

  const { data: children } = useQuery<ApNodeDto[]>({
    queryKey: ['apnode-children', node.id],
    queryFn: () => apiClient.get<ApNodeDto[]>(`/apnode/${node.id}/children`),
    enabled: expanded,
  })

  const dirs = (children ?? []).filter((c) => c.nodeType === 'D')
  const isCurrent = currentFolderId === node.id

  return (
    <div>
      <div
        className={`flex items-center gap-1 px-2 py-1 rounded-lg cursor-pointer select-none text-sm transition-colors ${
          isCurrent ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-100'
        }`}
        onClick={() => onNavigate(node.id)}
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
        <Folder className={`w-4 h-4 flex-shrink-0 ${isCurrent ? 'text-blue-500' : 'text-yellow-400'}`} />
        <span className="truncate">{node.name}</span>
      </div>
      {expanded && dirs.length > 0 && (
        <div className="ml-4 border-l border-gray-100 pl-1">
          {dirs.map((child) => (
            <TreeNode key={child.id} node={child} currentFolderId={currentFolderId} onNavigate={onNavigate} />
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
  node: ApNodeDto | null
}

// ──── Main Page ─────────────────────────────────────────────────────────────

export default function ApNodePage() {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isDragging, setIsDragging] = useState(false)
  const dragCounter = useRef(0)

  // 모달 상태
  const [createFolderOpen, setCreateFolderOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [renameOpen, setRenameOpen] = useState(false)
  const [renameNode, setRenameNode] = useState<ApNodeDto | null>(null)
  const [renameName, setRenameName] = useState('')

  // 컨텍스트 메뉴
  const [ctxMenu, setCtxMenu] = useState<CtxMenu>({ show: false, x: 0, y: 0, node: null })

  // ── 데이터 조회 ──
  const rootsQuery = useQuery<ApNodeDto[]>({
    queryKey: ['apnode-roots'],
    queryFn: () => apiClient.get<ApNodeDto[]>('/apnode'),
  })

  const childrenQuery = useQuery<ApNodeDto[]>({
    queryKey: ['apnode-children', currentFolderId],
    queryFn: () =>
      currentFolderId
        ? apiClient.get<ApNodeDto[]>(`/apnode/${currentFolderId}/children`)
        : Promise.resolve([]),
    enabled: currentFolderId != null,
  })

  const pathQuery = useQuery<ApNodeDto[]>({
    queryKey: ['apnode-path', currentFolderId],
    queryFn: () =>
      currentFolderId
        ? apiClient.get<ApNodeDto[]>(`/apnode/${currentFolderId}/path`)
        : Promise.resolve([]),
    enabled: currentFolderId != null,
  })

  const currentItems: ApNodeDto[] =
    currentFolderId == null
      ? (rootsQuery.data ?? [])
      : (childrenQuery.data ?? [])

  const breadcrumb: ApNodeDto[] = pathQuery.data ?? []
  const isLoading = currentFolderId == null ? rootsQuery.isLoading : childrenQuery.isLoading

  // ── mutations ──
  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['apnode-children', currentFolderId] })
    queryClient.invalidateQueries({ queryKey: ['apnode-roots'] })
  }, [queryClient, currentFolderId])

  const createDirMutation = useMutation({
    mutationFn: (name: string) =>
      apiClient.post<ApNodeDto>('/apnode/directories', { name, parentId: currentFolderId }),
    onSuccess: () => { invalidate(); setCreateFolderOpen(false); setNewFolderName('') },
    onError: () => alert('폴더 생성 실패'),
  })

  const renameMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      apiClient.put<ApNodeDto>(`/apnode/${id}/rename`, { name }),
    onSuccess: () => { invalidate(); setRenameOpen(false); setRenameNode(null) },
    onError: () => alert('이름 변경 실패'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/apnode/${id}`),
    onSuccess: invalidate,
    onError: () => alert('삭제 실패'),
  })

  // ── 이벤트 핸들러 ──
  function navigate(id: string | null) {
    setCurrentFolderId(id)
    setCtxMenu((m) => ({ ...m, show: false }))
  }

  function openRename(node: ApNodeDto) {
    setRenameNode(node)
    setRenameName(node.name)
    setRenameOpen(true)
    setCtxMenu((m) => ({ ...m, show: false }))
  }

  function handleDelete(node: ApNodeDto) {
    if (!confirm(`"${node.name}"을(를) 삭제하시겠습니까?`)) return
    deleteMutation.mutate(node.id)
    setCtxMenu((m) => ({ ...m, show: false }))
  }

  function handleDownload(node: ApNodeDto) {
    window.open(`http://localhost:8585/pcms/apnode/${node.id}/download`, '_blank')
    setCtxMenu((m) => ({ ...m, show: false }))
  }

  function showCtxMenu(e: React.MouseEvent, node: ApNodeDto) {
    e.preventDefault()
    setCtxMenu({ show: true, x: e.clientX, y: e.clientY, node })
  }

  async function uploadFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    for (const file of Array.from(files)) {
      const fd = new FormData()
      fd.append('file', file)
      if (currentFolderId) fd.append('parentId', currentFolderId)
      try {
        await (apiClient as any).post('/apnode/files', fd, {
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

  // 폴더 더블클릭으로 진입
  function handleDblClick(node: ApNodeDto) {
    if (node.nodeType === 'D') navigate(node.id)
    else if (node.nodeType === 'F') handleDownload(node)
  }

  const rootDirs = (rootsQuery.data ?? []).filter((n) => n.nodeType === 'D')

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Toolbar />

      <div className="flex flex-col flex-1" style={{ height: 'calc(100vh - 64px)' }}>

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
            <Button size="sm" variant="outline" onClick={() => setCreateFolderOpen(true)}>
              <FolderPlus className="w-4 h-4 mr-1" /> 새 폴더
            </Button>
            <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-4 h-4 mr-1" /> 업로드
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => uploadFiles(e.target.files)}
            />
            {/* 뷰 전환 */}
            <div className="flex border border-gray-200 rounded-lg overflow-hidden">
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
          <aside className="w-56 border-r border-gray-100 bg-gray-50/50 overflow-y-auto flex-shrink-0 hidden md:block">
            <div className="p-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">폴더</p>
              {rootDirs.map((node) => (
                <TreeNode
                  key={node.id}
                  node={node}
                  currentFolderId={currentFolderId}
                  onNavigate={navigate}
                />
              ))}
            </div>
          </aside>

          {/* 파일 영역 */}
          <section
            className="flex-1 flex flex-col min-w-0 bg-white relative overflow-hidden"
            onDragEnter={onDragEnter}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => setCtxMenu((m) => ({ ...m, show: false }))}
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
                  {currentItems.map((item) => (
                    <div
                      key={item.id}
                      onDoubleClick={() => handleDblClick(item)}
                      onContextMenu={(e) => showCtxMenu(e, item)}
                      onClick={(e) => e.stopPropagation()}
                      className="group relative border border-gray-100 rounded-2xl p-4 cursor-pointer hover:shadow-md hover:border-gray-200 transition-all bg-white flex flex-col items-center gap-2 h-40"
                    >
                      {/* 삭제 버튼 */}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(item) }}
                        className="absolute top-1.5 right-1.5 p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 rounded-full hover:bg-red-50 transition-all"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>

                      {/* 아이콘 / 썸네일 */}
                      <div className="flex-1 flex items-center justify-center w-full">
                        {item.nodeType === 'F' && item.fileUrl && isImage(item) ? (
                          <img
                            src={item.fileUrl}
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
                      <div className="w-full text-center">
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
                  ))}
                </div>
              ) : (
                // ── List View ──
                <div className="rounded-lg border border-gray-100 overflow-hidden">
                  <table className="w-full table-fixed text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase w-7/12">이름</th>
                        <th className="text-right p-3 text-xs font-semibold text-gray-500 uppercase w-2/12">크기</th>
                        <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase w-3/12">수정일</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.map((item) => (
                        <tr
                          key={item.id}
                          onDoubleClick={() => handleDblClick(item)}
                          onContextMenu={(e) => showCtxMenu(e, item)}
                          onClick={(e) => e.stopPropagation()}
                          className="border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors group"
                        >
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
                                {item.nodeType === 'F' && (
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
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* 상태 바 */}
            <div className="bg-gray-50 border-t border-gray-100 px-4 py-1.5 text-xs text-gray-400 flex justify-between">
              <span>전체 {currentItems.length}개 항목</span>
            </div>
          </section>
        </div>
      </div>

      {/* ── 컨텍스트 메뉴 ── */}
      {ctxMenu.show && ctxMenu.node && (
        <div
          className="fixed bg-white shadow-xl rounded-lg border border-gray-100 py-1 z-50 min-w-[160px]"
          style={{ top: ctxMenu.y, left: ctxMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => openRename(ctxMenu.node!)}
            className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-gray-700 transition-colors"
          >
            <Pencil className="w-4 h-4 text-gray-400" /> 이름 변경
          </button>
          {ctxMenu.node.nodeType === 'F' && (
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
