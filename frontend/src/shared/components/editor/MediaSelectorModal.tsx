/**
 * 목적: 비디오/오디오/유튜브를 삽입하기 위한 선택 모달. 마크다운 에디터(MdSplitEditor)와
 *       HTML 에디터(TipTapMenuBar) 양쪽에서 공용으로 쓴다. 업로드된 비디오/오디오 목록에서
 *       고르거나 새로 업로드하거나, 유튜브 링크를 붙여넣을 수 있다.
 *       선택 결과는 구조화된 데이터(MediaSelectPayload)로 전달되며, 실제 삽입 포맷(마크다운
 *       문자열 vs TipTap 노드)은 호출부가 알아서 만든다.
 *
 * 사용법:
 *   <MediaSelectorModal open={mediaOpen} onClose={() => setMediaOpen(false)}
 *     onSelect={(payload) => { ... 포맷 변환은 호출부 책임 ... }} />
 *
 * props:
 *   - open: boolean - 모달 표시 여부
 *   - onClose: () => void - 닫기 콜백
 *   - onSelect: (payload: MediaSelectPayload) => void - 선택 결과와 함께 호출 (모달은 호출부에서 닫아야 함)
 */
import { useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Video, Music, Youtube, UploadCloud, AlertCircle } from 'lucide-react'
import { apiClient } from '@/lib/apiClient'
import { formatFileSize } from '@/lib/utils'
import { extractYouTubeId } from '@/lib/youtube'
import { type MediaFile, mediaDownloadUrl, mediaLabel } from '@/lib/mediaFile'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'

export interface MediaSelectPayload {
  type: 'video' | 'audio' | 'youtube'
  url: string
  label: string
  ytId?: string
}

interface Props {
  open: boolean
  onClose: () => void
  onSelect: (payload: MediaSelectPayload) => void
}

type Tab = 'video' | 'audio' | 'youtube'

export default function MediaSelectorModal({ open, onClose, onSelect }: Props) {
  const [tab, setTab] = useState<Tab>('video')
  const [selected, setSelected] = useState<MediaFile | null>(null)
  const [ytUrl, setYtUrl] = useState('')
  const [ytTitle, setYtTitle] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  const mediaType = tab === 'audio' ? 'audio' : 'video'
  const { data: items = [], isLoading } = useQuery<MediaFile[]>({
    queryKey: ['media-files', mediaType],
    queryFn: () => apiClient.get<MediaFile[]>('/files/media', { params: { type: mediaType } }),
    enabled: open && tab !== 'youtube',
  })

  const ytId = extractYouTubeId(ytUrl)

  function switchTab(next: Tab) {
    setTab(next)
    setSelected(null)
  }

  async function handleUpload(file: File) {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      await apiClient.post('/files/media', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      queryClient.invalidateQueries({ queryKey: ['media-files', mediaType] })
    } catch {
      alert('업로드 중 오류가 발생했습니다. (mp4/webm/ogg 또는 mp3/wav/m4a 파일만 가능)')
    } finally {
      setUploading(false)
    }
  }

  function handleInsert() {
    if (tab === 'youtube') {
      if (!ytId) return
      const title = ytTitle.trim() || '유튜브 동영상'
      onSelect({ type: 'youtube', url: `https://www.youtube.com/watch?v=${ytId}`, label: title, ytId })
      return
    }
    if (!selected) return
    onSelect({ type: tab, url: mediaDownloadUrl(selected), label: mediaLabel(selected) })
  }

  const canInsert = tab === 'youtube' ? !!ytId : !!selected

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="w-4 h-4 text-indigo-500" />
            비디오·오디오·유튜브 삽입
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-1 border-b border-gray-200">
          {([
            { key: 'video' as const, label: '비디오', icon: Video },
            { key: 'audio' as const, label: '오디오', icon: Music },
            { key: 'youtube' as const, label: 'YouTube', icon: Youtube },
          ]).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => switchTab(key)}
              className={`px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 border-b-2 -mb-px transition-colors ${
                tab === key ? 'border-indigo-600 text-indigo-650' : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {tab !== 'youtube' ? (
          <div className="flex flex-col gap-3">
            <div>
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
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="gap-1.5"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                {uploading ? '업로드 중...' : `${tab === 'video' ? '비디오' : '오디오'} 파일 업로드`}
              </Button>
            </div>

            <div className="max-h-72 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
              {isLoading ? (
                <div className="p-6 text-center text-xs text-gray-400">불러오는 중...</div>
              ) : items.length === 0 ? (
                <div className="p-6 text-center text-xs text-gray-400">
                  업로드된 {tab === 'video' ? '비디오' : '오디오'} 파일이 없습니다.
                </div>
              ) : (
                items.map((item) => (
                  <button
                    key={item.fileId}
                    type="button"
                    onClick={() => setSelected(item)}
                    className={`w-full flex items-center justify-between gap-3 px-3 py-2 text-left transition-colors ${
                      selected?.fileId === item.fileId ? 'bg-indigo-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-xs font-mono text-gray-700 truncate">{item.orgFileName}</span>
                    <span className="text-[10px] text-gray-400 shrink-0">{formatFileSize(item.fileSize)}</span>
                  </button>
                ))
              )}
            </div>

            {selected && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-2">
                {tab === 'video' ? (
                  <video key={selected.fileId} src={mediaDownloadUrl(selected)} controls className="w-full max-h-48 rounded" />
                ) : (
                  <audio key={selected.fileId} src={mediaDownloadUrl(selected)} controls className="w-full" />
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <Input
              placeholder="YouTube URL (watch, youtu.be, shorts 지원)"
              value={ytUrl}
              onChange={(e) => setYtUrl(e.target.value)}
            />
            <Input
              placeholder="제목 (비워두면 '유튜브 동영상')"
              value={ytTitle}
              onChange={(e) => setYtTitle(e.target.value)}
            />
            {ytUrl.trim() && !ytId && (
              <div className="flex items-center gap-1.5 text-[11px] text-red-500">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                유효한 YouTube 링크가 아닙니다.
              </div>
            )}
            {ytId && (
              <div className="aspect-video rounded-lg overflow-hidden border border-gray-200">
                <iframe src={`https://www.youtube.com/embed/${ytId}`} className="w-full h-full border-none" allowFullScreen />
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
          <Button type="button" variant="outline" onClick={onClose}>취소</Button>
          <Button type="button" disabled={!canInsert} onClick={handleInsert}>삽입</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
