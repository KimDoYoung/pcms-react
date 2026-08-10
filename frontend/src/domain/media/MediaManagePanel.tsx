/**
 * 목적: 마크다운 에디터에서 삽입할 수 있는 비디오/오디오 파일을 업로드/삭제/조회하고
 *       마크다운 삽입 태그(`![이름](url)`)를 복사하거나 파일 이름을 변경하는 관리 패널.
 *
 * 사용법:
 *   <MediaManagePanel />
 *   SettingsPage 안에 섹션으로 삽입해 사용한다 (독립 라우트 없음, AssetManagePanel과 동일한 톤).
 *
 * props: 없음
 */
import { useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Upload, Trash2, Copy, Video, Music, Pencil } from 'lucide-react'
import { apiClient } from '@/lib/apiClient'
import { formatFileSize } from '@/lib/utils'
import { type MediaFile, mediaDownloadUrl, mediaLabel } from '@/lib/mediaFile'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { useMessage } from '@/shared/hooks/useMessage'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type Tab = 'video' | 'audio'

function getExt(filename: string): string {
  const idx = filename.lastIndexOf('.')
  return idx > 0 ? filename.slice(idx) : ''
}

export default function MediaManagePanel() {
  const [tab, setTab] = useState<Tab>('video')
  const [uploading, setUploading] = useState(false)
  const [renameItem, setRenameItem] = useState<MediaFile | null>(null)
  const [newName, setNewName] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()
  const { showMessage } = useMessage()

  const { data: items = [], isLoading } = useQuery<MediaFile[]>({
    queryKey: ['media-files', tab],
    queryFn: () => apiClient.get<MediaFile[]>('/files/media', { params: { type: tab } }),
  })

  async function handleUpload(file: File) {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      await apiClient.post('/files/media', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      queryClient.invalidateQueries({ queryKey: ['media-files', tab] })
      showMessage('업로드되었습니다.', 'success')
    } catch {
      showMessage('업로드 중 오류가 발생했습니다. (mp4/webm/ogg 또는 mp3/wav/m4a 파일만 가능)', 'error')
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(item: MediaFile) {
    if (!confirm(`"${item.orgFileName}"을(를) 삭제하시겠습니까?`)) return
    try {
      await apiClient.delete(`/files/${item.fileId}`)
      queryClient.invalidateQueries({ queryKey: ['media-files', tab] })
      showMessage('삭제되었습니다.', 'success')
    } catch {
      showMessage('삭제 중 오류가 발생했습니다.', 'error')
    }
  }

  function openRename(item: MediaFile) {
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
      queryClient.invalidateQueries({ queryKey: ['media-files', tab] })
      showMessage('이름이 변경되었습니다.', 'success')
      setRenameItem(null)
    } catch {
      showMessage('이름 변경 중 오류가 발생했습니다.', 'error')
    }
  }

  async function handleCopyTag(item: MediaFile) {
    const tag = `![${mediaLabel(item)}](${mediaDownloadUrl(item)})`
    try {
      await navigator.clipboard.writeText(tag)
      showMessage('마크다운 태그가 복사되었습니다.', 'success')
    } catch {
      showMessage('복사에 실패했습니다.', 'error')
    }
  }

  return (
    <div className="p-6 bg-white rounded-xl border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">미디어 관리 (비디오 · 오디오)</h3>
          <p className="text-sm text-gray-500">마크다운 에디터에 삽입할 수 있는 비디오/오디오 파일을 관리합니다.</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept={tab === 'video' ? '.mp4,.webm,.ogg' : '.mp3,.wav,.m4a,.ogg'}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleUpload(file)
              e.target.value = ''
            }}
          />
          <Button size="sm" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-4 h-4 mr-1" /> {uploading ? '업로드 중...' : '업로드'}
          </Button>
        </div>
      </div>

      <div className="flex gap-2 p-0.5 bg-gray-100 rounded-md border border-gray-200 text-xs w-fit mb-4">
        <button
          type="button"
          onClick={() => setTab('video')}
          className={`px-3 py-1.5 rounded flex items-center gap-1.5 font-medium transition-colors ${
            tab === 'video' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <Video className="w-3.5 h-3.5" /> 비디오
        </button>
        <button
          type="button"
          onClick={() => setTab('audio')}
          className={`px-3 py-1.5 rounded flex items-center gap-1.5 font-medium transition-colors ${
            tab === 'audio' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <Music className="w-3.5 h-3.5" /> 오디오
        </button>
      </div>

      {isLoading ? (
        <p className="text-center py-10 text-gray-400 text-sm">불러오는 중...</p>
      ) : (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500">
                <th className="px-4 py-2 text-left font-medium">파일명</th>
                <th className="px-4 py-2 text-right font-medium w-28">크기</th>
                <th className="px-4 py-2 text-center font-medium w-28"></th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-center py-10 text-gray-400">
                    업로드된 {tab === 'video' ? '비디오' : '오디오'} 파일이 없습니다.
                  </td>
                </tr>
              )}
              {items.map((item) => (
                <tr key={item.fileId} className="border-b border-gray-100 hover:bg-gray-50/60">
                  <td className="px-4 py-2 text-gray-700 font-mono truncate max-w-xs">{item.orgFileName}</td>
                  <td className="px-4 py-2 text-right text-gray-500">{formatFileSize(item.fileSize)}</td>
                  <td className="px-4 py-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleCopyTag(item)}
                        className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"
                        title="마크다운 태그 복사"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openRename(item)}
                        className="p-1.5 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 rounded transition-colors"
                        title="이름 바꾸기"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                        title="삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={!!renameItem} onOpenChange={(open) => { if (!open) setRenameItem(null) }}>
        <DialogContent className="max-w-sm" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>이름 바꾸기</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <label className="text-xs text-gray-500 mb-1 block">새 파일명</label>
            <div className="flex items-center gap-1">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleRename() }}
                placeholder="확장자 제외한 이름"
                className="flex-1"
              />
              {renameItem && (
                <span className="text-sm text-gray-500 font-mono shrink-0">
                  {getExt(renameItem.orgFileName)}
                </span>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameItem(null)}>취소</Button>
            <Button onClick={handleRename}>확인</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
