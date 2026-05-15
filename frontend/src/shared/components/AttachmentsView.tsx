/**
 * 목적: 첨부파일 목록을 표시하되, 이미지는 인라인 미리보기 제공하고
 *       모든 파일에 aview 연동 보기 링크와 다운로드 링크를 제공
 * 사용법: <AttachmentsView attachments={post.attachments} />
 * props:
 *   - attachments: AttachmentItem[] - 첨부파일 목록 (fileId, orgFileName, fileSize)
 *   - className?: string - 추가 CSS 클래스
 */
import { Paperclip, Download, Eye } from 'lucide-react'
import { formatFileSize } from '@/lib/utils'

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

function getDownloadUrl(fileId: number): string {
  return `${getApiBase()}/file/download/${fileId}`
}

function getAviewUrl(fileId: number, orgFileName: string): string {
  // aview 서버가 접근 가능한 절대 URL 필요
  const origin = import.meta.env.PROD ? window.location.origin : 'http://jskn.iptime.org'
  const fileUrl = `${origin}/pcms/file/download/${fileId}`
  return `${AVIEW_BASE}?url=${encodeURIComponent(fileUrl)}&onm=${encodeURIComponent(orgFileName)}`
}

export default function AttachmentsView({ attachments, className = '' }: Props) {
  if (attachments.length === 0) return null

  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-5 ${className}`}>
      <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1">
        <Paperclip className="w-4 h-4" /> 첨부파일 ({attachments.length})
      </h2>
      <ul className="flex flex-col gap-3">
        {attachments.map((att) => {
          const isImage = IMAGE_EXTS.test(att.orgFileName)
          const downloadUrl = getDownloadUrl(att.fileId)
          const aviewUrl = getAviewUrl(att.fileId, att.orgFileName)
          return (
            <li key={att.fileId} className="border border-gray-200 rounded-lg overflow-hidden">
              {isImage && (
                <div className="bg-gray-50 flex items-center justify-center p-3 border-b border-gray-200">
                  <img
                    src={downloadUrl}
                    alt={att.orgFileName}
                    className="max-h-64 max-w-full object-contain rounded"
                    loading="lazy"
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
  )
}
