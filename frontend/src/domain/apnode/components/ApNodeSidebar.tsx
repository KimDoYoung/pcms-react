import { useState, useEffect } from 'react'
import { Folder, FolderOpen, ChevronRight, ChevronDown, FolderPlus, Pencil, Trash2, Upload } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import { Button } from '@/shared/components/ui/button'
import type { ApNode } from '@/domain/apnode/types/apnode'

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

interface ApNodeSidebarProps {
  rootDirs: ApNode[]
  currentFolderId: string | null
  ancestorIds: string[]
  sidebarWidth: number
  onNavigate: (id: string | null) => void
  onContextMenu: (e: React.MouseEvent, node: ApNode | null) => void
  onCreateFolder: () => void
  onRenameCurrent: () => void
  onDeleteCurrent: () => void
  onUpload: () => void
  onResizeStart: () => void
}

export default function ApNodeSidebar({
  rootDirs,
  currentFolderId,
  ancestorIds,
  sidebarWidth,
  onNavigate,
  onContextMenu,
  onCreateFolder,
  onRenameCurrent,
  onDeleteCurrent,
  onUpload,
  onResizeStart,
}: ApNodeSidebarProps) {
  return (
    <>
      <aside
        style={{ width: `${sidebarWidth}px` }}
        className="border-r border-gray-100 bg-gray-50/50 overflow-y-auto flex-shrink-0 hidden md:block"
      >
        <div className="p-4 flex flex-col gap-2">
          <div className="flex flex-row gap-2">
            <Button size="sm" variant="outline" className="flex-1 justify-start bg-white px-2" onClick={onCreateFolder}>
              <FolderPlus className="w-4 h-4 mr-1.5 text-blue-500 flex-shrink-0" /> <span className="truncate">새 폴더</span>
            </Button>
            <Button size="sm" variant="outline" className="flex-1 justify-start bg-white px-2" onClick={onUpload}>
              <Upload className="w-4 h-4 mr-1.5 text-green-500 flex-shrink-0" /> <span className="truncate">업로드</span>
            </Button>
          </div>
          <div className="flex flex-row gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 justify-start bg-white px-2"
              disabled={!currentFolderId}
              onClick={onRenameCurrent}
            >
              <Pencil className="w-4 h-4 mr-1.5 text-blue-500 flex-shrink-0" /> <span className="truncate">이름 변경</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 justify-start bg-white px-2 text-red-500 hover:text-red-600 hover:bg-red-50"
              disabled={!currentFolderId}
              onClick={onDeleteCurrent}
            >
              <Trash2 className="w-4 h-4 mr-1.5 flex-shrink-0" /> <span className="truncate">삭제</span>
            </Button>
          </div>
        </div>
        <div className="p-3 pt-0">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">폴더</p>
          {rootDirs.map((node) => (
            <TreeNode
              key={node.id}
              node={node}
              currentFolderId={currentFolderId}
              onNavigate={onNavigate}
              ancestorIds={ancestorIds}
              onContextMenu={onContextMenu}
            />
          ))}
        </div>
      </aside>

      {/* 리사이즈 바 */}
      <div
        className="w-1 hover:w-1.5 hover:bg-blue-300 bg-transparent transition-all cursor-col-resize flex-shrink-0 z-10 active:bg-blue-500 active:w-1.5"
        onMouseDown={onResizeStart}
      />
    </>
  )
}