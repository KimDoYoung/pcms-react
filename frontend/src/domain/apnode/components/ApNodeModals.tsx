/**
 * 목적: ApNode 폴더 생성 및 이름 변경 모달
 * 사용법: createFolderOpen 또는 renameOpen 상태에 따라 해당 모달이 렌더링됨
 * props:
 *   - createFolderOpen/newFolderName/onNewFolderNameChange/onCreateFolder/onCreateFolderClose/isCreating: 폴더 생성 관련
 *   - renameOpen/renameNode/renameName/onRenameNameChange/onRename/onRenameClose/isRenaming: 이름 변경 관련
 */
import { X } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import type { ApNode } from '../types/apnode'

interface ApNodeModalsProps {
  createFolderOpen: boolean
  newFolderName: string
  onNewFolderNameChange: (name: string) => void
  onCreateFolder: () => void
  onCreateFolderClose: () => void
  isCreating: boolean

  renameOpen: boolean
  renameNode: ApNode | null
  renameName: string
  onRenameNameChange: (name: string) => void
  onRename: () => void
  onRenameClose: () => void
  isRenaming: boolean
}

export default function ApNodeModals({
  createFolderOpen,
  newFolderName,
  onNewFolderNameChange,
  onCreateFolder,
  onCreateFolderClose,
  isCreating,
  renameOpen,
  renameNode,
  renameName,
  onRenameNameChange,
  onRename,
  onRenameClose,
  isRenaming,
}: ApNodeModalsProps) {
  return (
    <>
      {createFolderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={onCreateFolderClose} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 z-10">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-800">새 폴더</h2>
              <button onClick={onCreateFolderClose} className="text-gray-400 hover:text-gray-600 p-1 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 py-5">
              <Input
                placeholder="폴더 이름"
                value={newFolderName}
                autoFocus
                onChange={(e) => onNewFolderNameChange(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && newFolderName.trim()) onCreateFolder() }}
              />
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100">
              <Button variant="outline" size="sm" onClick={onCreateFolderClose}>취소</Button>
              <Button
                size="sm"
                disabled={!newFolderName.trim() || isCreating}
                onClick={onCreateFolder}
              >
                {isCreating ? '생성 중...' : '생성'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {renameOpen && renameNode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={onRenameClose} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 z-10">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-800">이름 변경</h2>
              <button onClick={onRenameClose} className="text-gray-400 hover:text-gray-600 p-1 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 py-5">
              <Input
                value={renameName}
                autoFocus
                onChange={(e) => onRenameNameChange(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && renameName.trim()) onRename() }}
              />
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100">
              <Button variant="outline" size="sm" onClick={onRenameClose}>취소</Button>
              <Button
                size="sm"
                disabled={!renameName.trim() || isRenaming}
                onClick={onRename}
              >
                {isRenaming ? '변경 중...' : '변경'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
