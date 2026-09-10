/**
 * 목적: 비디오/오디오/유튜브/스티커를 삽입하기 위한 선택 모달. 마크다운 에디터(MdSplitEditor)와
 *       HTML 에디터(TipTapMenuBar) 양쪽에서 공용으로 쓴다. 비디오/오디오/스티커 파일 목록에서
 *       고르거나 다중 업로드(multi file upload)할 수 있고, 유튜브 링크를 붙여넣을 수 있다.
 *       선택 결과는 구조화된 데이터(MediaSelectPayload)로 전달되며, 실제 삽입 포맷(마크다운
 *       문자열 vs TipTap 노드)은 호출부가 생성한다.
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
import { Video, Music, Youtube, UploadCloud, AlertCircle, Sparkles, Search } from 'lucide-react'
import { apiClient } from '@/lib/apiClient'
import { formatFileSize } from '@/lib/utils'
import { extractYouTubeId } from '@/lib/youtube'
import { type MediaFile, type StickerFile, mediaDownloadUrl, mediaLabel } from '@/lib/mediaFile'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { useMessage } from '@/shared/hooks/useMessage'

export type WrapMode = 'none' | 'left' | 'right'

export interface MediaSelectPayload {
  type: 'video' | 'audio' | 'youtube' | 'sticker'
  url: string
  label: string
  ytId?: string
  wrap?: WrapMode
}

interface Props {
  open: boolean
  onClose: () => void
  onSelect: (payload: MediaSelectPayload) => void
}

type Tab = 'video' | 'audio' | 'youtube' | 'sticker'

export default function MediaSelectorModal({ open, onClose, onSelect }: Props) {
  const [tab, setTab] = useState<Tab>('video')
  const [selected, setSelected] = useState<MediaFile | null>(null)
  const [selectedSticker, setSelectedSticker] = useState<StickerFile | null>(null)
  const [wrapMode, setWrapMode] = useState<WrapMode>('none')
  const [stickerSearch, setStickerSearch] = useState('')
  const [selectedStickerTag, setSelectedStickerTag] = useState<string | null>(null)
  const [uploadStickerTag, setUploadStickerTag] = useState('')
  const [isDraggingSticker, setIsDraggingSticker] = useState(false)
  const [ytUrl, setYtUrl] = useState('')
  const [ytTitle, setYtTitle] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const stickerFileInputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()
  const { showMessage } = useMessage()

  const mediaType = tab === 'audio' ? 'audio' : 'video'
  const { data: items = [], isLoading } = useQuery<MediaFile[]>({
    queryKey: ['media-files', mediaType],
    queryFn: () => apiClient.get<MediaFile[]>('/files/media', { params: { type: mediaType } }),
    enabled: open && (tab === 'video' || tab === 'audio'),
  })

  const { data: stickers = [], isLoading: isLoadingStickers } = useQuery<StickerFile[]>({
    queryKey: ['stickers', stickerSearch],
    queryFn: () =>
      apiClient.get<StickerFile[]>('/files/stickers', {
        params: stickerSearch ? { keyword: stickerSearch } : {},
      }),
    enabled: open && tab === 'sticker',
  })

  const { data: stickerTags = [] } = useQuery<string[]>({
    queryKey: ['sticker-tags'],
    queryFn: () => apiClient.get<string[]>('/files/sticker-tags'),
    enabled: open && tab === 'sticker',
  })

  const ytId = extractYouTubeId(ytUrl)

  const filteredStickers = selectedStickerTag
    ? stickers.filter((item) => item.tag && item.tag.toLowerCase().includes(selectedStickerTag.toLowerCase()))
    : stickers

  function switchTab(next: Tab) {
    setTab(next)
    setSelected(null)
    setSelectedSticker(null)
  }

  async function handleUpload(file: File) {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      await apiClient.post('/files/media', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      queryClient.invalidateQueries({ queryKey: ['media-files', mediaType] })
    } catch {
      showMessage('업로드 중 오류가 발생했습니다. (mp4/webm/ogg 또는 mp3/wav/m4a 파일만 가능)', 'error')
    } finally {
      setUploading(false)
    }
  }

  async function handleStickerUpload(files: FileList | File[]) {
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      const formData = new FormData()
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i])
      }
      if (uploadStickerTag.trim()) {
        formData.append('tag', uploadStickerTag.trim())
      }
      await apiClient.post('/files/stickers', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      queryClient.invalidateQueries({ queryKey: ['stickers'] })
      queryClient.invalidateQueries({ queryKey: ['sticker-tags'] })
      showMessage(`${files.length}개 스티커 파일이 업로드되었습니다.`, 'success')
      setUploadStickerTag('')
    } catch {
      showMessage('스티커 업로드 중 오류가 발생했습니다. (PNG, SVG, WEBP, GIF, JPG 지원)', 'error')
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
    if (tab === 'sticker') {
      if (!selectedSticker) return
      onSelect({
        type: 'sticker',
        url: mediaDownloadUrl(selectedSticker),
        label: mediaLabel(selectedSticker),
        wrap: wrapMode,
      })
      return
    }
    if (!selected) return
    onSelect({ type: tab, url: mediaDownloadUrl(selected), label: mediaLabel(selected) })
  }

  const canInsert = tab === 'youtube' ? !!ytId : tab === 'sticker' ? !!selectedSticker : !!selected

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="w-4 h-4 text-indigo-500" />
            비디오·오디오·유튜브·스티커 삽입
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-1 border-b border-gray-200">
          {([
            { key: 'video' as const, label: '비디오', icon: Video },
            { key: 'audio' as const, label: '오디오', icon: Music },
            { key: 'sticker' as const, label: '스티커', icon: Sparkles },
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

        <div className="flex-1 overflow-y-auto custom-scroll pr-1">
          {tab === 'sticker' && (
            <div className="flex flex-col gap-3">
              {/* 검색 및 태그 필터 */}
              <div className="flex flex-col gap-1.5">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-gray-400" />
                  <Input
                    placeholder="스티커/태그 검색..."
                    value={stickerSearch}
                    onChange={(e) => setStickerSearch(e.target.value)}
                    className="pl-8 h-8 text-xs bg-white"
                  />
                </div>
                {stickerTags.length > 0 && (
                  <div className="flex items-center gap-1 overflow-x-auto py-0.5 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setSelectedStickerTag(null)}
                      className={`px-2 py-0.5 rounded-full whitespace-nowrap transition-colors ${
                        selectedStickerTag === null
                          ? 'bg-amber-600 text-white font-medium'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      전체
                    </button>
                    {stickerTags.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setSelectedStickerTag(selectedStickerTag === t ? null : t)}
                        className={`px-2 py-0.5 rounded-full whitespace-nowrap transition-colors ${
                          selectedStickerTag === t
                            ? 'bg-amber-600 text-white font-medium'
                            : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                        }`}
                      >
                        #{t}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 멀티 파일 업로드 존 (드래그 앤 드롭 지원) */}
              <div
                onDragOver={(e) => {
                  e.preventDefault()
                  setIsDraggingSticker(true)
                }}
                onDragLeave={() => setIsDraggingSticker(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setIsDraggingSticker(false)
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    handleStickerUpload(e.dataTransfer.files)
                  }
                }}
                className={`p-3 border-2 border-dashed rounded-lg transition-colors flex flex-col sm:flex-row items-center justify-between gap-2 ${
                  isDraggingSticker
                    ? 'border-amber-500 bg-amber-100/70'
                    : 'border-amber-300 bg-amber-50/50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-amber-100 rounded-full text-amber-600 shrink-0">
                    <UploadCloud className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-800">
                      새 스티커/짤 다중 업로드 (드래그 앤 드롭 지원)
                    </p>
                    <p className="text-[10px] text-gray-500">
                      PNG, SVG, WEBP, GIF, JPG 여러 장을 한 번에 올릴 수 있습니다.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 w-full sm:w-auto">
                  <Input
                    placeholder="태그 (예: 주식)"
                    value={uploadStickerTag}
                    onChange={(e) => setUploadStickerTag(e.target.value)}
                    className="h-7 text-xs w-28 bg-white"
                  />
                  <input
                    ref={stickerFileInputRef}
                    type="file"
                    multiple
                    accept="image/png,image/svg+xml,image/webp,image/gif,image/jpeg"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleStickerUpload(e.target.files)
                      }
                      e.target.value = ''
                    }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    disabled={uploading}
                    onClick={() => stickerFileInputRef.current?.click()}
                    className="h-7 text-xs whitespace-nowrap bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    {uploading ? '업로드 중...' : '파일 선택'}
                  </Button>
                </div>
              </div>

              {/* 스티커 그리드 */}
              <div className="max-h-56 overflow-y-auto border border-gray-200 rounded-lg p-2 min-h-[140px] bg-slate-50/30">
                {isLoadingStickers ? (
                  <div className="p-8 text-center text-xs text-gray-400">불러오는 중...</div>
                ) : filteredStickers.length === 0 ? (
                  <div className="p-8 text-center text-xs text-gray-400">
                    {stickerSearch || selectedStickerTag
                      ? '검색 결과와 일치하는 스티커가 없습니다.'
                      : '등록된 스티커가 없습니다. 위 업로드 존에서 스티커를 등록해 보세요.'}
                  </div>
                ) : (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {filteredStickers.map((item) => {
                      const isSelected = selectedSticker?.fileId === item.fileId
                      return (
                        <button
                          key={item.fileId}
                          type="button"
                          onClick={() => setSelectedSticker(item)}
                          onDoubleClick={() => {
                            setSelectedSticker(item)
                            onSelect({
                              type: 'sticker',
                              url: mediaDownloadUrl(item),
                              label: mediaLabel(item),
                              wrap: wrapMode,
                            })
                          }}
                          title={`${mediaLabel(item)}${item.tag ? ` (#${item.tag})` : ''} - 더블클릭 시 바로 삽입`}
                          className={`group relative aspect-square p-2 rounded-lg border transition-all flex flex-col items-center justify-center bg-white ${
                            isSelected
                              ? 'border-indigo-600 ring-2 ring-indigo-500/20 shadow-xs'
                              : 'border-gray-200 hover:border-amber-400 hover:bg-amber-50/30'
                          }`}
                        >
                          <img
                            src={mediaDownloadUrl(item)}
                            alt={item.orgFileName}
                            className="max-w-full max-h-full object-contain transition-transform group-hover:scale-105"
                            loading="lazy"
                          />
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* 텍스트 감싸기(Wrap) 옵션 */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  텍스트 감싸기:
                </span>
                <div className="flex items-center gap-1 bg-white p-0.5 rounded-md border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setWrapMode('none')}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      wrapMode === 'none'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    ⏹ 기본 (인라인)
                  </button>
                  <button
                    type="button"
                    onClick={() => setWrapMode('left')}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      wrapMode === 'left'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    👈 좌측 감싸기
                  </button>
                  <button
                    type="button"
                    onClick={() => setWrapMode('right')}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      wrapMode === 'right'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    👉 우측 감싸기
                  </button>
                </div>
              </div>

              {/* 선택된 스티커 정보 */}
              {selectedSticker && (
                <div className="flex items-center gap-3 p-2 bg-indigo-50/60 border border-indigo-100 rounded-lg">
                  <img
                    src={mediaDownloadUrl(selectedSticker)}
                    alt={selectedSticker.orgFileName}
                    className="w-10 h-10 object-contain bg-white rounded border border-indigo-100 p-0.5 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-gray-800 truncate">{selectedSticker.orgFileName}</p>
                    <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-0.5">
                      <span>{formatFileSize(selectedSticker.fileSize)}</span>
                      {selectedSticker.tag && (
                        <span className="text-indigo-600 font-medium bg-indigo-100/70 px-1 rounded">
                          #{selectedSticker.tag}
                        </span>
                      )}
                      <span className="text-slate-400">|</span>
                      <span className="text-indigo-700 font-medium">
                        {wrapMode === 'left' ? '👈 좌측 감싸기' : wrapMode === 'right' ? '👉 우측 감싸기' : '⏹ 기본(인라인)'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab !== 'youtube' && tab !== 'sticker' && (
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
          )}

          {tab === 'youtube' && (
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
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
          <Button type="button" variant="outline" onClick={onClose}>취소</Button>
          <Button type="button" disabled={!canInsert} onClick={handleInsert}>삽입</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
