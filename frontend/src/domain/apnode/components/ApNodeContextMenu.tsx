/**
 * 목적: ApNode 파일/폴더에 대한 우클릭 컨텍스트 메뉴
 * 사용법: ctxMenu.show가 true일 때 해당 좌표에 렌더링됨
 * props:
 *   - ctxMenu: 메뉴 표시 여부, 좌표, 대상 노드
 *   - clipboard: 현재 클립보드 상태 (이동/링크용)
 *   - onClose: 메뉴 닫기 콜백
 *   - onRename/onView/onCut/onCopy/onDownload/onDelete: 노드 액션 콜백
 *   - onCreateFolder: 빈 공간 우클릭 시 새 폴더 생성
 *   - onPaste: 클립보드 붙여넣기
 */
import { ClipboardPaste, Copy, Download, Eye, FolderPlus, Pencil, Scissors, Trash2 } from 'lucide-react'
import type { ApNode, Clipboard, CtxMenu } from '../types/apnode'
import { canView } from '../utils/apNodeUtils'

interface ApNodeContextMenuProps {
  ctxMenu: CtxMenu
  clipboard: Clipboard | null
  onClose: () => void
  onRename: (node: ApNode) => void
  onView: (node: ApNode) => void
  onCut: (node: ApNode) => void
  onCopy: (node: ApNode) => void
  onDownload: (node: ApNode) => void
  onDelete: (node: ApNode) => void
  onCreateFolder: () => void
  onPaste: () => void
}

export default function ApNodeContextMenu({
  ctxMenu,
  clipboard,
  onClose,
  onRename,
  onView,
  onCut,
  onCopy,
  onDownload,
  onDelete,
  onCreateFolder,
  onPaste,
}: ApNodeContextMenuProps) {
  if (!ctxMenu.show) return null

  const itemCls = 'flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-gray-700 transition-colors'

  return (
    <div
      className="fixed bg-white shadow-xl rounded-lg border border-gray-100 py-1 z-50 min-w-[160px]"
      style={{ top: ctxMenu.y, left: ctxMenu.x }}
      onClick={(e) => e.stopPropagation()}
    >
      {ctxMenu.node ? (
        <>
          <button className={itemCls} onClick={() => { onRename(ctxMenu.node!); onClose() }}>
            <Pencil className="w-4 h-4 text-gray-400" /> 이름 변경
          </button>
          {canView(ctxMenu.node) && (
            <button className={itemCls + ' !text-indigo-700'} onClick={() => { onView(ctxMenu.node!); onClose() }}>
              <Eye className="w-4 h-4 text-indigo-400" /> 보기 (AView)
            </button>
          )}
          <button className={itemCls} onClick={() => { onCut(ctxMenu.node!); onClose() }}>
            <Scissors className="w-4 h-4 text-gray-400" /> 이동 (잘라내기)
          </button>
          <button className={itemCls} onClick={() => { onCopy(ctxMenu.node!); onClose() }}>
            <Copy className="w-4 h-4 text-gray-400" /> 링크 복사
          </button>
          {(ctxMenu.node.nodeType === 'F' || ctxMenu.node.nodeType === 'L') && (
            <button className={itemCls} onClick={() => { onDownload(ctxMenu.node!); onClose() }}>
              <Download className="w-4 h-4 text-gray-400" /> 다운로드
            </button>
          )}
          <hr className="my-1 border-gray-100" />
          <button
            className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-600 transition-colors"
            onClick={() => { onDelete(ctxMenu.node!); onClose() }}
          >
            <Trash2 className="w-4 h-4" /> 삭제
          </button>
        </>
      ) : (
        <>
          <button className={itemCls} onClick={() => { onCreateFolder(); onClose() }}>
            <FolderPlus className="w-4 h-4 text-gray-400" /> 새 폴더
          </button>
          {clipboard && (
            <button
              className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-blue-700 transition-colors"
              onClick={() => { onPaste(); onClose() }}
            >
              <ClipboardPaste className="w-4 h-4" /> 붙여넣기 ({clipboard.type === 'cut' ? '이동' : '링크'})
            </button>
          )}
        </>
      )}
    </div>
  )
}
