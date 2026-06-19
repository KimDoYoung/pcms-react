import { useState, useRef, useCallback, useEffect } from 'react'
import { ChevronDown, ChevronRight, ClipboardPaste, Download, FolderPlus, Grid3X3, List, Pencil, Search, Trash2, Upload, X } from 'lucide-react'
import { apiClient } from '@/lib/apiClient'
import Toolbar from '@/shared/layout/Toolbar'
import { Button } from '@/shared/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import { useMessage } from '@/shared/hooks/useMessage'
import ApNodeSidebar from '@/domain/apnode/components/ApNodeSidebar'
import ApNodeContextMenu from '@/domain/apnode/components/ApNodeContextMenu'
import ApNodeModals from '@/domain/apnode/components/ApNodeModals'
import ApNodeSearchModal from '@/domain/apnode/components/ApNodeSearchModal'
import ApNodeFileArea from '@/domain/apnode/components/ApNodeFileArea'
import { useApNodeData } from '@/domain/apnode/hooks/useApNodeData'
import { useApNodeMutations } from '@/domain/apnode/hooks/useApNodeMutations'
import { canView } from '@/domain/apnode/utils/apNodeUtils'
import type { ApNode, Clipboard, CtxMenu } from '@/domain/apnode/types/apnode'

export default function ApNodePage() {
  const { showMessage } = useMessage()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragCounter = useRef(0)
  const isResizing = useRef(false)

  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isDragging, setIsDragging] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [sidebarWidth, setSidebarWidth] = useState(240)

  const [filterText, setFilterText] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)

  const [createFolderOpen, setCreateFolderOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [renameOpen, setRenameOpen] = useState(false)
  const [renameNode, setRenameNode] = useState<ApNode | null>(null)
  const [renameName, setRenameName] = useState('')
  const [clipboard, setClipboard] = useState<Clipboard | null>(null)
  const [ctxMenu, setCtxMenu] = useState<CtxMenu>({ show: false, x: 0, y: 0, node: null })

  // ── 사이드바 너비 조절 ──
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
    const w = e.clientX
    if (w > 150 && w < 600) setSidebarWidth(w)
  }, [])

  useEffect(() => {
    window.addEventListener('mousemove', resize)
    window.addEventListener('mouseup', stopResizing)
    return () => {
      window.removeEventListener('mousemove', resize)
      window.removeEventListener('mouseup', stopResizing)
    }
  }, [resize, stopResizing])

  // ── 데이터 ──
  const { currentItems, breadcrumb, ancestorIds, isLoading, rootDirs } = useApNodeData(currentFolderId)

  const displayItems = filterText.trim()
    ? currentItems.filter((n) => n.name.toLowerCase().includes(filterText.toLowerCase()))
    : currentItems

  // ── 네비게이션 ──
  const navigate = useCallback((id: string | null) => {
    setCurrentFolderId(id)
    setSelectedIds(new Set())
    setCtxMenu((m) => ({ ...m, show: false }))
    setFilterText('')
  }, [])

  // ── Mutations ──
  const { createDirMutation, renameMutation, deleteMutation, invalidate } =
    useApNodeMutations({
      currentFolderId,
      breadcrumb,
      onNavigate: navigate,
      onFolderCreated: (newNode) => {
        setCreateFolderOpen(false)
        setNewFolderName('')
        navigate(newNode.id)
      },
      onRenamed: () => { setRenameOpen(false); setRenameNode(null) },
    })

  // ── 핸들러 ──
  function openRename(node: ApNode) {
    setRenameNode(node)
    setRenameName(node.name)
    setRenameOpen(true)
  }

  function handleDelete(node: ApNode) {
    if (!confirm(`"${node.name}" 및 하위 모든 항목을 삭제하시겠습니까?`)) return
    deleteMutation.mutate(node.id)
  }

  async function handleDeleteSelected() {
    if (selectedIds.size === 0) return
    if (!confirm(`선택된 ${selectedIds.size}개 항목을 삭제하시겠습니까?`)) return
    try {
      await Promise.all(Array.from(selectedIds).map((id) => apiClient.delete(`/apnode/${id}`)))
      setSelectedIds(new Set())
      invalidate()
    } catch {
      showMessage('삭제에 실패했습니다.', 'error')
    }
  }

  async function handleDownloadSelected() {
    if (selectedIds.size === 0) {
      showMessage('선택된 파일이 없습니다.', 'error')
      return
    }
    try {
      const ids = Array.from(selectedIds)
      const folderName = breadcrumb.length > 0 ? breadcrumb[breadcrumb.length - 1].name : 'root'
      const blob = await apiClient.post<Blob>(
        `/apnode/download-zip?folderName=${encodeURIComponent(folderName)}`,
        ids,
        { responseType: 'blob' }
      )
      const now = new Date()
      const ts = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}_${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}${String(now.getSeconds()).padStart(2,'0')}`
      const url = window.URL.createObjectURL(blob as unknown as Blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${folderName}_${ts}.zip`)
      document.body.appendChild(link)
      link.click()
      link.parentNode?.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch {
      showMessage('다운로드에 실패했습니다.', 'error')
    }
  }

  async function handleDownload(node: ApNode) {
    try {
      const response = await apiClient.get<Blob>(`/apnode/${node.id}/download`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', node.name)
      document.body.appendChild(link)
      link.click()
      link.parentNode?.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch {
      showMessage('다운로드에 실패했습니다.', 'error')
    }
  }

  async function handleView(node: ApNode) {
    try {
      const data = await apiClient.get<{ url: string }>(`/apnode/${node.id}/view-url`)
      window.open(data.url, '_blank')
    } catch {
      showMessage('파일 보기에 실패했습니다.', 'error')
    }
  }

  async function handlePaste() {
    if (!clipboard) return
    try {
      if (clipboard.type === 'cut') {
        await Promise.all(
          clipboard.items.map((item) =>
            apiClient.put(`/apnode/${item.id}/move`, { targetParentId: currentFolderId })
          )
        )
      } else {
        await Promise.all(
          clipboard.items.map((item) =>
            apiClient.post('/apnode/links', {
              name: `${item.name} 링크`,
              targetId: item.id,
              parentId: currentFolderId,
            })
          )
        )
      }
      setClipboard(null)
      invalidate()
    } catch {
      showMessage('붙여넣기에 실패했습니다.', 'error')
    }
  }

  function showCtxMenu(e: React.MouseEvent, node: ApNode | null) {
    e.preventDefault()
    e.stopPropagation()
    setCtxMenu({ show: true, x: e.clientX, y: e.clientY, node })
  }

  async function uploadFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    for (const file of Array.from(files)) {
      const fd = new FormData()
      fd.append('file', file)
      if (currentFolderId) fd.append('parentId', currentFolderId)
      try {
        await apiClient.post('/apnode/files', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      } catch {
        showMessage(`"${file.name}" 업로드 실패`, 'error')
      }
    }
    invalidate()
  }

  // ── 드래그 앤 드롭 ──
  function onDragEnter(e: React.DragEvent) { e.preventDefault(); dragCounter.current++; setIsDragging(true) }
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

  // ── 아이템 이벤트 ──
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

  async function handleDblClick(node: ApNode) {
    if (node.nodeType === 'D') {
      navigate(node.id)
    } else if (node.nodeType === 'L') {
      if (node.linkTargetId) {
        try {
          const target = await apiClient.get<ApNode>(`/apnode/${node.linkTargetId}`)
          if (target.nodeType === 'D') navigate(target.id)
          else if (canView(node)) handleView(node)
          else handleDownload(node)
        } catch {
          showMessage('링크 대상을 찾을 수 없습니다.', 'error')
        }
      }
    } else {
      if (canView(node)) handleView(node)
      else handleDownload(node)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Toolbar />

      <div className="container mx-auto px-4 flex flex-col flex-1" style={{ height: 'calc(100vh - 64px)' }}>

        {/* 상단 헤더 */}
        <header className="bg-white border-b border-gray-100 px-6 py-3 flex items-center gap-4">
          <nav className="hidden sm:flex items-center gap-1 text-sm flex-1 min-w-0">
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
                    idx === breadcrumb.length - 1 ? 'font-semibold text-gray-800' : 'text-gray-500'
                  }`}
                >
                  {item.name}
                </button>
              </span>
            ))}
          </nav>

          <div className="hidden sm:flex items-center gap-1.5">
            {selectedIds.size > 0 && (
              <label className="flex items-center gap-1.5 cursor-pointer select-none text-sm text-blue-600 font-medium px-2 py-1 bg-blue-50 rounded-md whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={selectedIds.size > 0}
                  onChange={() => setSelectedIds(new Set())}
                  className="accent-blue-600 cursor-pointer"
                />
                {selectedIds.size}개 선택됨
              </label>
            )}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                placeholder="현재 폴더 필터..."
                className="pl-8 pr-7 py-1 text-sm border border-gray-200 rounded-lg w-44 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              {filterText && (
                <button
                  type="button"
                  onClick={() => setFilterText('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {clipboard && (
              <Button size="sm" variant="ghost" className="text-blue-600 hover:bg-blue-50" onClick={handlePaste}>
                <ClipboardPaste className="w-4 h-4 mr-1" />
                붙여넣기{clipboard.items.length > 1 ? ` ${clipboard.items.length}개` : ''} ({clipboard.type === 'cut' ? '이동' : '링크'})
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline">
                  액션 <ChevronDown className="w-3.5 h-3.5 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSearchOpen(true)}>
                  <Search className="w-4 h-4 mr-2 text-purple-500" /> 찾기
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                  <Upload className="w-4 h-4 mr-2 text-green-500" /> 업로드
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCreateFolderOpen(true)}>
                  <FolderPlus className="w-4 h-4 mr-2 text-blue-500" /> 새 폴더
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={selectedIds.size === 0}
                  onClick={handleDownloadSelected}
                  className="text-green-700 focus:text-green-700"
                >
                  <Download className="w-4 h-4 mr-2" /> 선택파일 다운로드 {selectedIds.size > 0 && `(${selectedIds.size}개)`}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  disabled={!currentFolderId}
                  onClick={() => { const n = breadcrumb[breadcrumb.length - 1]; if (n) openRename(n) }}
                >
                  <Pencil className="w-4 h-4 mr-2 text-gray-400" /> 이름 변경
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={selectedIds.size === 0}
                  className="text-red-600 focus:text-red-600"
                  onClick={handleDeleteSelected}
                >
                  <Trash2 className="w-4 h-4 mr-2" /> 선택항목 삭제 {selectedIds.size > 0 && `(${selectedIds.size}개)`}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
          <ApNodeSidebar
            rootDirs={rootDirs}
            currentFolderId={currentFolderId}
            ancestorIds={ancestorIds}
            sidebarWidth={sidebarWidth}
            onNavigate={navigate}
            onContextMenu={showCtxMenu}
            onCreateFolder={() => setCreateFolderOpen(true)}
            onRenameCurrent={() => { const n = breadcrumb[breadcrumb.length - 1]; if (n) openRename(n) }}
            onDeleteCurrent={() => { const n = breadcrumb[breadcrumb.length - 1]; if (n) handleDelete(n) }}
            onUpload={() => fileInputRef.current?.click()}
            onResizeStart={startResizing}
          />

          <ApNodeFileArea
            currentItems={displayItems}
            isLoading={isLoading}
            viewMode={viewMode}
            selectedIds={selectedIds}
            isDragging={isDragging}
            onDragEnter={onDragEnter}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onContextMenu={showCtxMenu}
            onClick={() => setCtxMenu((m) => ({ ...m, show: false }))}
            onItemClick={handleItemClick}
            onItemDblClick={handleDblClick}
            onSelectAll={handleSelectAll}
            onSetSelectedIds={setSelectedIds}
            onRename={openRename}
            onView={handleView}
            onDownload={handleDownload}
            onDelete={handleDelete}
          />
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => { uploadFiles(e.target.files); e.target.value = '' }}
      />

      <ApNodeContextMenu
        ctxMenu={ctxMenu}
        clipboard={clipboard}
        selectedCount={selectedIds.size}
        isMultiSelected={!!(ctxMenu.node && selectedIds.has(ctxMenu.node.id) && selectedIds.size > 1)}
        onClose={() => setCtxMenu((m) => ({ ...m, show: false }))}
        onDownloadSelected={handleDownloadSelected}
        onRename={openRename}
        onView={handleView}
        onCut={(node) => {
          const useSelected = selectedIds.has(node.id) && selectedIds.size > 1
          const items = useSelected
            ? Array.from(selectedIds).flatMap((id) => {
                const n = currentItems.find((x) => x.id === id)
                return n ? [{ id: n.id, name: n.name }] : []
              })
            : [{ id: node.id, name: node.name }]
          setClipboard({ items, type: 'cut' })
        }}
        onCopy={(node) => {
          const useSelected = selectedIds.has(node.id) && selectedIds.size > 1
          const items = useSelected
            ? Array.from(selectedIds).flatMap((id) => {
                const n = currentItems.find((x) => x.id === id)
                return n ? [{ id: n.id, name: n.name }] : []
              })
            : [{ id: node.id, name: node.name }]
          setClipboard({ items, type: 'copy' })
        }}
        onDownload={handleDownload}
        onDelete={(node) => {
          if (selectedIds.has(node.id) && selectedIds.size > 1) handleDeleteSelected()
          else handleDelete(node)
        }}
        onCreateFolder={() => setCreateFolderOpen(true)}
        onPaste={handlePaste}
      />

      <ApNodeSearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onNavigate={(id) => { navigate(id); setSearchOpen(false) }}
      />

      <ApNodeModals
        createFolderOpen={createFolderOpen}
        newFolderName={newFolderName}
        onNewFolderNameChange={setNewFolderName}
        onCreateFolder={() => createDirMutation.mutate(newFolderName.trim())}
        onCreateFolderClose={() => setCreateFolderOpen(false)}
        isCreating={createDirMutation.isPending}
        renameOpen={renameOpen}
        renameNode={renameNode}
        renameName={renameName}
        onRenameNameChange={setRenameName}
        onRename={() => renameNode && renameMutation.mutate({ id: renameNode.id, name: renameName.trim() })}
        onRenameClose={() => setRenameOpen(false)}
        isRenaming={renameMutation.isPending}
      />
    </div>
  )
}
