import { Paperclip, Download } from 'lucide-react'
import { formatFileSize } from '@/lib/utils'

export interface AttachmentItem {
  fileId: number
  orgFileName: string
  fileSize: number
}

interface Props {
  attachments: AttachmentItem[]
  className?: string
  hideIfEmpty?: boolean
}

export default function AttachmentList({ attachments, className = '', hideIfEmpty = false }: Props) {
  if (hideIfEmpty && attachments.length === 0) return null

  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-5 ${className}`}>
      <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1">
        <Paperclip className="w-4 h-4" /> 첨부파일
      </h2>
      {attachments.length === 0 ? (
        <p className="text-sm text-gray-400">첨부된 파일이 없습니다.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {attachments.map((att) => (
            <li
              key={att.fileId}
              className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg border border-gray-200"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Paperclip className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span className="text-sm text-gray-700 truncate">{att.orgFileName}</span>
                <span className="text-xs text-gray-400 shrink-0">({formatFileSize(att.fileSize)})</span>
              </div>
              <a
                href={`/pcms/file/download/${att.fileId}`}
                className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 shrink-0 ml-2"
              >
                <Download className="w-3.5 h-3.5" /> 다운로드
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
