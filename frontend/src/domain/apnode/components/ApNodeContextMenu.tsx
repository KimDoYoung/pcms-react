/**
 * 목적: ApNode 파일/폴더에 대한 우클릭 컨텍스트 메뉴
 * 사용법: ctxMenu.show가 true일 때 해당 좌표에 렌더링됨
 * props:
 *   - ctxMenu: 메뉴 표시 여부, 좌표, 대상 노드
 *   - clipboard: 현재 클립보드 상태 (이동/링크용)
 *   - selectedCount: 현재 선택된 아이템 수
 *   - totalCount: 현재 폴더(필터 적용된)에 보이는 전체 아이템 수 (모두 선택 활성/비활성 판단용)
 *   - isMultiSelected: 우클릭 노드가 다중 선택에 포함된 경우 true
 *   - onClose: 메뉴 닫기 콜백
 *   - onRename/onView/onCut/onCopy/onDownload/onDelete: 노드 액션 콜백 (선택항목 0개면 onDelete 비활성)
 *   - onCreateFolder: 빈 공간 우클릭 시 새 폴더 생성
 *   - onUpload: 빈 공간 우클릭 시 파일 업로드
 *   - onPaste: 클립보드 붙여넣기
 *   - onCancelClipboard: 클립보드 취소
 *   - onDownloadSelected: 선택된 파일들 zip 다운로드
 *   - onSelectAll: 현재 폴더의 전체 항목 선택 (totalCount === 0이면 비활성)
 *   - onDeselectAll: 선택된 항목 전체 해제 (selectedCount > 0일 때만 노출)
 */
import { ClipboardPaste, ClipboardX, Copy, Download, Eye, FolderPlus, Pencil, Scissors, Square, SquareCheck, Trash2, Upload } from 'lucide-react'
import type { ApNode, Clipboard, CtxMenu } from '../types/apnode'
import { canView } from '../utils/apNodeUtils'

interface ApNodeContextMenuProps {
  ctxMenu: CtxMenu
  clipboard: Clipboard | null
  selectedCount: number
  totalCount: number
  isMultiSelected: boolean
  onClose: () => void
  onRename: (node: ApNode) => void
  onView: (node: ApNode) => void
  onCut: (node: ApNode) => void
  onCopy: (node: ApNode) => void
  onDownload: (node: ApNode) => void
  onDelete: (node: ApNode) => void
  onCreateFolder: () => void
  onUpload: () => void
  onPaste: () => void
  onCancelClipboard: () => void
  onDownloadSelected: () => void
  onSelectAll: () => void
  onDeselectAll: () => void
}

export default function ApNodeContextMenu({
  ctxMenu,
  clipboard,
  selectedCount,
  totalCount,
  isMultiSelected,
  onClose,
  onRename,
  onView,
  onCut,
  onCopy,
  onDownload,
  onDelete,
  onCreateFolder,
  onUpload,
  onPaste,
  onCancelClipboard,
  onDownloadSelected,
  onSelectAll,
  onDeselectAll,
}: ApNodeContextMenuProps) {
  if (!ctxMenu.show) return null

  const itemCls = 'flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-gray-700 transition-colors'
  const disabledCls = 'flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-gray-300 opacity-40 cursor-not-allowed'
  const n = selectedCount

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed bg-white shadow-xl rounded-lg border border-gray-100 py-1 z-50 min-w-[160px]"
        style={{ top: ctxMenu.y, left: ctxMenu.x }}
        onClick={(e) => e.stopPropagation()}
      >
      {totalCount === 0 ? (
        <span className={disabledCls}>
          <SquareCheck className="w-4 h-4" /> 모두 선택
        </span>
      ) : (
        <button className={itemCls} onClick={() => { onSelectAll(); onClose() }}>
          <SquareCheck className="w-4 h-4 text-blue-400" /> 모두 선택
        </button>
      )}
      {selectedCount > 0 && (
        <>
          <button
            className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-green-50 text-green-700 transition-colors"
            onClick={() => { onDownloadSelected(); onClose() }}
          >
            <Download className="w-4 h-4" /> 선택파일 다운로드 ({selectedCount}개)
          </button>
          <button className={itemCls} onClick={() => { onDeselectAll(); onClose() }}>
            <Square className="w-4 h-4 text-gray-400" /> 모두 해제
          </button>
        </>
      )}
      <hr className="my-1 border-gray-100" />
      {ctxMenu.node ? (
        <>
          {isMultiSelected ? (
            <span className={disabledCls}>
              <Pencil className="w-4 h-4" /> 이름 변경 (1개만 가능)
            </span>
          ) : (
            <button className={itemCls} onClick={() => { onRename(ctxMenu.node!); onClose() }}>
              <Pencil className="w-4 h-4 text-gray-400" /> 이름 변경
            </button>
          )}
          {!isMultiSelected && canView(ctxMenu.node) && (
            <button className={itemCls + ' !text-indigo-700'} onClick={() => { onView(ctxMenu.node!); onClose() }}>
              <Eye className="w-4 h-4 text-indigo-400" /> 보기 (AView)
            </button>
          )}
          <button className={itemCls} onClick={() => { onCut(ctxMenu.node!); onClose() }}>
            <Scissors className="w-4 h-4 text-gray-400" />
            {isMultiSelected ? `${n}개 이동 (잘라내기)` : '이동 (잘라내기)'}
          </button>
          <button className={itemCls} onClick={() => { onCopy(ctxMenu.node!); onClose() }}>
            <Copy className="w-4 h-4 text-gray-400" />
            {isMultiSelected ? `${n}개 링크 복사` : '링크 복사'}
          </button>
          {!isMultiSelected && (ctxMenu.node.nodeType === 'F' || ctxMenu.node.nodeType === 'L') && (
            <button className={itemCls} onClick={() => { onDownload(ctxMenu.node!); onClose() }}>
              <Download className="w-4 h-4 text-gray-400" /> 다운로드
            </button>
          )}
          <hr className="my-1 border-gray-100" />
          {selectedCount === 0 ? (
            <span className={disabledCls}>
              <Trash2 className="w-4 h-4" /> 삭제 (선택 필요)
            </span>
          ) : (
            <button
              className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-600 transition-colors"
              onClick={() => { onDelete(ctxMenu.node!); onClose() }}
            >
              <Trash2 className="w-4 h-4" /> {selectedCount > 1 ? `${selectedCount}개 삭제` : '삭제'}
            </button>
          )}
        </>
      ) : (
        <>
          <button className={itemCls} onClick={() => { onCreateFolder(); onClose() }}>
            <FolderPlus className="w-4 h-4 text-gray-400" /> 새 폴더
          </button>
          <button className={itemCls} onClick={() => { onUpload(); onClose() }}>
            <Upload className="w-4 h-4 text-gray-400" /> 업로드
          </button>
          {clipboard && (
            <>
              <button
                className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-blue-700 transition-colors"
                onClick={() => { onPaste(); onClose() }}
              >
                <ClipboardPaste className="w-4 h-4" />
                붙여넣기{clipboard.items.length > 1 ? ` ${clipboard.items.length}개` : ''} ({clipboard.type === 'cut' ? '이동' : '링크'})
              </button>
              <button
                className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-gray-400 transition-colors"
                onClick={() => { onCancelClipboard(); onClose() }}
              >
                <ClipboardX className="w-4 h-4" /> 클립보드 취소
              </button>
            </>
          )}
        </>
      )}
      </div>
    </>
  )
}
