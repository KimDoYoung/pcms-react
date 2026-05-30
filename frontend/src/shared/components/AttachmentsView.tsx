/**
 * 목적: 첨부파일을 3열 썸네일 그리드로 표시. 이미지는 썸네일, 비이미지는 아이콘.
 *       호버 시 보기/다운로드 오버레이. 이미지 클릭 시 라이트박스 확대.
 * 사용법: <AttachmentsView attachments={post.attachments} />
 * props:
 *   - attachments: AttachmentItem[] - 첨부파일 목록 (fileId, orgFileName, fileSize)
 *   - className?: string - 추가 CSS 클래스
 */
import { useState } from 'react'
import { Download, Eye, File, FileArchive, FileAudio, FileCode, FileSpreadsheet, FileText, FileVideo, Paperclip } from 'lucide-react'
import { formatFileSize } from '@/lib/utils'
import { Dialog, DialogContent } from '@/shared/components/ui/dialog'

export interface AttachmentItem {
  fileId: number
  orgFileName: string
  fileSize: number
}

interface Props {
  attachments: AttachmentItem[]
  className?: string
}

const IMAGE_EXTS = /\.(jpg|jpeg|png|gif|webp|svg)$/i
const AVIEW_BASE = 'http://jskn.iptime.org/aview/view'

function getApiBase(): string {
  return import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.PROD ? '/pcms' : 'http://localhost:8585/pcms')
}

function getDownloadUrl(fileId: number, orgFileName: string): string {
  return `${getApiBase()}/files/${fileId}/download/${encodeURIComponent(orgFileName)}`
}

function getAviewUrl(fileId: number, orgFileName: string): string {
  const origin = import.meta.env.PROD ? window.location.origin : 'http://jskn.iptime.org'
  const fileUrl = `${origin}/pcms/files/${fileId}/download/${encodeURIComponent(orgFileName)}`
  return `${AVIEW_BASE}?url=${encodeURIComponent(fileUrl)}&onm=${encodeURIComponent(orgFileName)}`
}

function FileTypeIcon({ name }: { name: string }) {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  const cls = 'w-10 h-10'
  if (/^(pdf)$/.test(ext)) return <FileText className={`${cls} text-red-400`} />
  if (/^(doc|docx|hwp)$/.test(ext)) return <FileText className={`${cls} text-blue-500`} />
  if (/^(xls|xlsx|csv)$/.test(ext)) return <FileSpreadsheet className={`${cls} text-green-500`} />
  if (/^(ppt|pptx)$/.test(ext)) return <FileText className={`${cls} text-orange-500`} />
  if (/^(zip|tar|gz|rar|7z)$/.test(ext)) return <FileArchive className={`${cls} text-yellow-500`} />
  if (/^(mp4|mkv|avi|mov|wmv)$/.test(ext)) return <FileVideo className={`${cls} text-pink-400`} />
  if (/^(mp3|wav|ogg|flac)$/.test(ext)) return <FileAudio className={`${cls} text-purple-400`} />
  if (/^(js|ts|jsx|tsx|html|css|java|py|go|rs)$/.test(ext)) return <FileCode className={`${cls} text-blue-400`} />
  return <File className={`${cls} text-gray-400`} />
}

export default function AttachmentsView({ attachments, className = '' }: Props) {
  const [lightbox, setLightbox] = useState<{ url: string; name: string } | null>(null)

  if (attachments.length === 0) return null

  return (
    <>
      <div className={`bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-5 ${className}`}>
        <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1">
          <Paperclip className="w-4 h-4" /> 첨부파일 ({attachments.length})
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {attachments.map((att) => {
            const isImage = IMAGE_EXTS.test(att.orgFileName)
            const downloadUrl = getDownloadUrl(att.fileId, att.orgFileName)
            const aviewUrl = getAviewUrl(att.fileId, att.orgFileName)
            return (
              <div key={att.fileId} className="group relative border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                {/* 썸네일 영역 */}
                <div
                  className="h-28 flex items-center justify-center cursor-pointer"
                  onClick={() => isImage && setLightbox({ url: downloadUrl, name: att.orgFileName })}
                >
                  {isImage ? (
                    <img
                      src={downloadUrl}
                      alt={att.orgFileName}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <FileTypeIcon name={att.orgFileName} />
                  )}
                </div>

                {/* 호버 오버레이 */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                  <a
                    href={aviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-white bg-indigo-500 hover:bg-indigo-600 px-3 py-1.5 rounded-full transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Eye className="w-3.5 h-3.5" /> 보기
                  </a>
                  <a
                    href={downloadUrl}
                    className="flex items-center gap-1 text-xs text-white bg-gray-600 hover:bg-gray-700 px-3 py-1.5 rounded-full transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Download className="w-3.5 h-3.5" /> 다운로드
                  </a>
                </div>

                {/* 파일명 + 용량 */}
                <div className="px-2 py-1.5 bg-white border-t border-gray-100">
                  <p className="text-xs text-gray-700 truncate" title={att.orgFileName}>{att.orgFileName}</p>
                  <p className="text-[10px] text-gray-400">{formatFileSize(att.fileSize)}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <Dialog open={!!lightbox} onOpenChange={(open) => !open && setLightbox(null)}>
        <DialogContent
          className="max-w-[90vw] max-h-[90vh] p-2 flex items-center justify-center bg-black/90 border-none"
          showCloseButton={true}
        >
          {lightbox && (
            <img
              src={lightbox.url}
              alt={lightbox.name}
              className="max-w-full max-h-[85vh] object-contain rounded"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
