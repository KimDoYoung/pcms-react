/**
 * 목적: 첨부파일 목록을 표시하되, 이미지는 인라인 미리보기 및 클릭 시 라이트박스 확대,
 *       모든 파일에 aview 연동 보기 링크와 다운로드 링크를 제공
 * 사용법: <AttachmentsView attachments={post.attachments} />
 * props:
 *   - attachments: AttachmentItem[] - 첨부파일 목록 (fileId, orgFileName, fileSize)
 *   - className?: string - 추가 CSS 클래스
 */
import { useState } from 'react'
import { Paperclip, Download, Eye } from 'lucide-react'
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

export default function AttachmentsView({ attachments, className = '' }: Props) {
  const [lightbox, setLightbox] = useState<{ url: string; name: string } | null>(null)

  if (attachments.length === 0) return null

  return (
    <>
      <div className={`bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-5 ${className}`}>
        <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1">
          <Paperclip className="w-4 h-4" /> 첨부파일 ({attachments.length})
        </h2>
        <ul className="flex flex-col gap-3">
          {attachments.map((att) => {
            const isImage = IMAGE_EXTS.test(att.orgFileName)
            const downloadUrl = getDownloadUrl(att.fileId, att.orgFileName)
            const aviewUrl = getAviewUrl(att.fileId, att.orgFileName)
            return (
              <li key={att.fileId} className="border border-gray-200 rounded-lg overflow-hidden">
                {isImage && (
                  <div className="bg-gray-50 flex items-center justify-center p-3 border-b border-gray-200">
                    <img
                      src={downloadUrl}
                      alt={att.orgFileName}
                      className="max-h-64 max-w-full object-contain rounded cursor-zoom-in"
                      loading="lazy"
                      onClick={() => setLightbox({ url: downloadUrl, name: att.orgFileName })}
                    />
                  </div>
                )}
                <div className="flex items-center justify-between px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Paperclip className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="text-sm text-gray-700 truncate">{att.orgFileName}</span>
                    <span className="text-xs text-gray-400 shrink-0">({formatFileSize(att.fileSize)})</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-2">
                    <a
                      href={aviewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" /> 보기
                    </a>
                    <a
                      href={downloadUrl}
                      className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" /> 다운로드
                    </a>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
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
