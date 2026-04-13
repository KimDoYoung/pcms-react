import { Paperclip, Plus, X } from 'lucide-react'
import { formatFileSize } from '@/lib/utils'

interface AttachmentItem {
  fileId: number
  orgFileName: string
  fileSize: number
}

interface Props {
  attachments: AttachmentItem[]
  newFiles: File[]
  onRemoveAttachment: (fileId: number) => void
  onAddFiles: (files: File[]) => void
  onRemoveNewFile: (index: number) => void
  inputId: string
}

export default function AttachmentUploader({
  attachments,
  newFiles,
  onRemoveAttachment,
  onAddFiles,
  onRemoveNewFile,
  inputId,
}: Props) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <h3 className="text-sm font-medium text-gray-700 flex items-center gap-1">
          <Paperclip className="w-4 h-4" /> 첨부파일
        </h3>
        <button
          type="button"
          onClick={() => document.getElementById(inputId)?.click()}
          className="px-3 py-1 text-xs font-medium bg-white border border-gray-300 rounded-md hover:bg-gray-100 text-gray-600 transition-colors shadow-sm inline-flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" /> 파일 추가
        </button>
        <input
          id={inputId}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              onAddFiles(Array.from(e.target.files))
            }
            e.target.value = ''
          }}
        />
      </div>

      <div className="flex flex-wrap gap-2 min-h-[40px]">
        {attachments.length === 0 && newFiles.length === 0 && (
          <span className="text-xs text-gray-300 italic py-2">첨부된 파일이 없습니다.</span>
        )}

        {attachments.map((att) => (
          <div
            key={att.fileId}
            className="flex items-center gap-2 text-sm text-gray-600 bg-white px-2.5 py-1.5 border border-gray-200 rounded-md shadow-sm"
          >
            <Paperclip className="w-3 h-3 text-gray-400" />
            <span className="truncate max-w-[160px]" title={att.orgFileName}>{att.orgFileName}</span>
            <span className="text-xs text-gray-400">({formatFileSize(att.fileSize)})</span>
            <button
              type="button"
              onClick={() => onRemoveAttachment(att.fileId)}
              className="text-gray-400 hover:text-red-500 p-0.5 rounded transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {newFiles.map((file, idx) => (
          <div
            key={`${file.name}-${idx}`}
            className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 px-2.5 py-1.5 border border-blue-200 rounded-md"
          >
            <Paperclip className="w-3 h-3 text-blue-400" />
            <span className="truncate max-w-[160px]" title={file.name}>{file.name}</span>
            <span className="text-[10px] text-blue-500 bg-blue-100 px-1 rounded font-bold">NEW</span>
            <button
              type="button"
              onClick={() => onRemoveNewFile(idx)}
              className="text-blue-400 hover:text-red-500 p-0.5 rounded transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
