/**
 * 목적: ApNode 파일/폴더 목록 영역 (그리드/리스트 뷰 + 드래그 앤 드롭)
 * 사용법: ApNodePage 의 메인 콘텐츠 영역으로 사용. viewMode에 따라 그리드/리스트 전환
 * props:
 *   - currentItems: 현재 폴더의 노드 목록
 *   - isLoading: 로딩 상태
 *   - viewMode: 'grid' | 'list'
 *   - selectedIds: 선택된 노드 ID Set
 *   - isDragging: 드래그 오버 상태
 *   - onDrag*: 드래그 이벤트 핸들러
 *   - onContextMenu: 우클릭 메뉴 핸들러
 *   - onClick: 배경 클릭 (선택 해제 등)
 *   - onItemClick/onItemDblClick: 아이템 클릭/더블클릭
 *   - onSelectAll: 전체 선택 토글
 *   - onSetSelectedIds: 선택 상태 업데이트 (그리드/리스트 체크박스 공통)
 *   - onRename/onView/onDownload/onDelete: 아이템 액션 콜백
 */
import { Download, Eye, Folder, Pencil, Trash2, Upload } from 'lucide-react'
import { formatDate, formatFileSize } from '@/lib/utils'
import type { ApNode } from '../types/apnode'
import { canView, getNodeIcon, isImage } from '../utils/apNodeUtils'

interface ApNodeFileAreaProps {
  currentItems: ApNode[]
  isLoading: boolean
  viewMode: 'grid' | 'list'
  selectedIds: Set<string>
  isDragging: boolean
  onDragEnter: (e: React.DragEvent) => void
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  onContextMenu: (e: React.MouseEvent, node: ApNode | null) => void
  onClick: () => void
  onItemClick: (e: React.MouseEvent, id: string) => void
  onItemDblClick: (node: ApNode) => void
  onSelectAll: () => void
  onSetSelectedIds: React.Dispatch<React.SetStateAction<Set<string>>>
  onRename: (node: ApNode) => void
  onView: (node: ApNode) => void
  onDownload: (node: ApNode) => void
  onDelete: (node: ApNode) => void
}

export default function ApNodeFileArea({
  currentItems,
  isLoading,
  viewMode,
  selectedIds,
  isDragging,
  onDragEnter,
  onDragOver,
  onDragLeave,
  onDrop,
  onContextMenu,
  onClick,
  onItemClick,
  onItemDblClick,
  onSelectAll,
  onSetSelectedIds,
  onRename,
  onView,
  onDownload,
  onDelete,
}: ApNodeFileAreaProps) {
  return (
    <section
      className="flex-1 flex flex-col min-w-0 bg-white relative overflow-hidden"
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={onClick}
      onContextMenu={(e) => onContextMenu(e, null)}
    >
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
          <GridView
            items={currentItems}
            selectedIds={selectedIds}
            onItemClick={onItemClick}
            onItemDblClick={onItemDblClick}
            onContextMenu={onContextMenu}
            onSetSelectedIds={onSetSelectedIds}
            onRename={onRename}
            onView={onView}
            onDownload={onDownload}
            onDelete={onDelete}
          />
        ) : (
          <ListView
            items={currentItems}
            selectedIds={selectedIds}
            onItemClick={onItemClick}
            onItemDblClick={onItemDblClick}
            onContextMenu={onContextMenu}
            onSelectAll={onSelectAll}
            onSetSelectedIds={onSetSelectedIds}
            onRename={onRename}
            onView={onView}
            onDownload={onDownload}
            onDelete={onDelete}
          />
        )}
      </div>

      <div className="bg-gray-50 border-t border-gray-100 px-4 py-1.5 text-xs text-gray-400 flex justify-between">
        <span>
          전체 {currentItems.length}개 항목
          {selectedIds.size > 0 && (
            <span className="ml-2 font-medium text-blue-600">({selectedIds.size}개 선택됨)</span>
          )}
        </span>
      </div>
    </section>
  )
}

// ── Grid View ──────────────────────────────────────────────────────────────

interface GridViewProps {
  items: ApNode[]
  selectedIds: Set<string>
  onItemClick: (e: React.MouseEvent, id: string) => void
  onItemDblClick: (node: ApNode) => void
  onContextMenu: (e: React.MouseEvent, node: ApNode) => void
  onSetSelectedIds: React.Dispatch<React.SetStateAction<Set<string>>>
  onRename: (node: ApNode) => void
  onView: (node: ApNode) => void
  onDownload: (node: ApNode) => void
  onDelete: (node: ApNode) => void
}

function GridView({ items, selectedIds, onItemClick, onItemDblClick, onContextMenu, onSetSelectedIds, onRename, onView, onDownload, onDelete }: GridViewProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
      {items.map((item) => {
        const isSelected = selectedIds.has(item.id)
        return (
          <div
            key={item.id}
            onDoubleClick={() => onItemDblClick(item)}
            onContextMenu={(e) => onContextMenu(e, item)}
            onClick={(e) => onItemClick(e, item.id)}
            className={`group relative border rounded-2xl p-4 cursor-pointer hover:shadow-md transition-all flex flex-col items-center gap-2 h-40 ${
              isSelected ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200' : 'bg-white border-gray-100 hover:border-gray-200'
            }`}
          >
            <div className="absolute top-2 left-2 z-10" onClick={(e) => e.stopPropagation()}>
              <input
                type="checkbox"
                className={`rounded border-gray-300 cursor-pointer transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                checked={isSelected}
                onChange={() => onSetSelectedIds((prev) => {
                  const next = new Set(prev)
                  if (next.has(item.id)) next.delete(item.id)
                  else next.add(item.id)
                  return next
                })}
              />
            </div>
            <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <button
                onClick={(e) => { e.stopPropagation(); onRename(item) }}
                className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
                title="이름 변경"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              {canView(item) && (
                <button
                  onClick={(e) => { e.stopPropagation(); onView(item) }}
                  className="p-1.5 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-full transition-colors"
                  title="보기"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
              )}
              {(item.nodeType === 'F' || item.nodeType === 'L') && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDownload(item) }}
                  className="p-1.5 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded-full transition-colors"
                  title="다운로드"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(item) }}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                title="삭제"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

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

            <div className="w-full text-center px-1">
              <p className="text-xs font-medium text-gray-700 truncate" title={item.name}>
                {item.name}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                {item.nodeType === 'D' ? `${item.childCount}개 항목` : formatFileSize(item.fileSize ?? 0)}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── List View ──────────────────────────────────────────────────────────────

interface ListViewProps {
  items: ApNode[]
  selectedIds: Set<string>
  onItemClick: (e: React.MouseEvent, id: string) => void
  onItemDblClick: (node: ApNode) => void
  onContextMenu: (e: React.MouseEvent, node: ApNode) => void
  onSelectAll: () => void
  onSetSelectedIds: React.Dispatch<React.SetStateAction<Set<string>>>
  onRename: (node: ApNode) => void
  onView: (node: ApNode) => void
  onDownload: (node: ApNode) => void
  onDelete: (node: ApNode) => void
}

function ListView({ items, selectedIds, onItemClick, onItemDblClick, onContextMenu, onSelectAll, onSetSelectedIds, onRename, onView, onDownload, onDelete }: ListViewProps) {
  return (
    <div className="rounded-lg border border-gray-100 overflow-hidden">
      <table className="w-full table-fixed text-sm">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            <th className="p-3 w-10 text-center">
              <input
                type="checkbox"
                className="rounded border-gray-300"
                checked={items.length > 0 && selectedIds.size === items.length}
                onChange={onSelectAll}
              />
            </th>
            <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase w-7/12">이름</th>
            <th className="text-right p-3 text-xs font-semibold text-gray-500 uppercase w-2/12">크기</th>
            <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase w-3/12">수정일</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const isSelected = selectedIds.has(item.id)
            return (
              <tr
                key={item.id}
                onDoubleClick={() => onItemDblClick(item)}
                onContextMenu={(e) => onContextMenu(e, item)}
                onClick={(e) => onItemClick(e, item.id)}
                className={`border-b transition-colors group cursor-pointer ${
                  isSelected ? 'bg-blue-50 border-blue-100' : 'border-gray-50 hover:bg-gray-50'
                }`}
              >
                <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    className="rounded border-gray-300"
                    checked={isSelected}
                    onChange={() => onSetSelectedIds((prev) => {
                      const next = new Set(prev)
                      if (next.has(item.id)) next.delete(item.id)
                      else next.add(item.id)
                      return next
                    })}
                  />
                </td>
                <td className="p-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-shrink-0">{getNodeIcon(item)}</div>
                    <span className="font-medium text-gray-800 truncate">{item.name}</span>
                    <div className="ml-auto hidden group-hover:flex items-center gap-1 pr-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); onRename(item) }}
                        className="p-1 text-gray-400 hover:text-blue-500 rounded"
                        title="이름 변경"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      {canView(item) && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onView(item) }}
                          className="p-1 text-gray-400 hover:text-indigo-500 rounded"
                          title="보기"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {(item.nodeType === 'F' || item.nodeType === 'L') && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onDownload(item) }}
                          className="p-1 text-gray-400 hover:text-green-500 rounded"
                          title="다운로드"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); onDelete(item) }}
                        className="p-1 text-gray-400 hover:text-red-500 rounded"
                        title="삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </td>
                <td className="p-3 text-gray-500 text-right">
                  {item.nodeType === 'D' ? '-' : formatFileSize(item.fileSize ?? 0)}
                </td>
                <td className="p-3 text-gray-500">
                  {formatDate(item.modifyDt ?? item.createDt ?? undefined, false)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
