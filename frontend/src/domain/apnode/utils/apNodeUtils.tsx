import {
  File,
  FileArchive,
  FileAudio,
  FileCode,
  FileImage,
  FileJson,
  FileSpreadsheet,
  FileText,
  FileVideo,
  Folder,
  Link2,
  Presentation,
} from 'lucide-react'
import type { ApNode } from '../types/apnode'

export function isImage(node: ApNode): boolean {
  return !!node.contentType?.startsWith('image/') || !!node.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)
}

export function canView(node: ApNode): boolean {
  return node.nodeType === 'F' || node.nodeType === 'L'
}

export function getNodeIcon(node: ApNode) {
  if (node.nodeType === 'D') return <Folder className="w-8 h-8 text-yellow-400" />
  if (node.nodeType === 'L') return <Link2 className="w-8 h-8 text-blue-400" />

  if (node.contentType) {
    if (node.contentType.startsWith('image/')) return <FileImage className="w-8 h-8 text-purple-400" />
    if (node.contentType.startsWith('video/')) return <FileVideo className="w-8 h-8 text-pink-400" />
    if (node.contentType.startsWith('audio/')) return <FileAudio className="w-8 h-8 text-yellow-500" />
    if (node.contentType.includes('json')) return <FileJson className="w-8 h-8 text-green-500" />
    if (node.contentType.includes('pdf')) return <FileText className="w-8 h-8 text-red-500" />
    if (node.contentType.includes('presentation') || node.contentType.includes('powerpoint'))
      return <Presentation className="w-8 h-8 text-orange-600" />
    if (node.contentType.includes('zip') || node.contentType.includes('tar') || node.contentType.includes('compressed'))
      return <FileArchive className="w-8 h-8 text-orange-500" />
    if (node.contentType.includes('spreadsheet') || node.contentType.includes('excel') || node.contentType.includes('csv'))
      return <FileSpreadsheet className="w-8 h-8 text-green-600" />
    if (node.contentType.includes('text/')) return <FileText className="w-8 h-8 text-gray-500" />
    if (node.contentType.includes('word') || node.contentType.includes('officedocument.wordprocessingml'))
      return <FileText className="w-8 h-8 text-blue-600" />
  }

  const ext = node.name.split('.').pop()?.toLowerCase()
  if (ext && node.name.includes('.')) {
    switch (ext) {
      case 'js': case 'ts': case 'jsx': case 'tsx':
      case 'html': case 'css': case 'java': case 'py':
      case 'cpp': case 'c': case 'h': case 'go':
      case 'rs': case 'rb': case 'php':
        return <FileCode className="w-8 h-8 text-blue-500" />
      case 'xls': case 'xlsx': case 'csv':
        return <FileSpreadsheet className="w-8 h-8 text-green-600" />
      case 'ppt': case 'pptx':
        return <Presentation className="w-8 h-8 text-orange-600" />
      case 'doc': case 'docx':
        return <FileText className="w-8 h-8 text-blue-600" />
      case 'hwp':
        return <FileText className="w-8 h-8 text-sky-500" />
      case 'zip': case 'tar': case 'gz': case 'rar': case '7z': case 'bz2':
        return <FileArchive className="w-8 h-8 text-orange-500" />
      case 'mp4': case 'mkv': case 'avi': case 'mov': case 'wmv':
        return <FileVideo className="w-8 h-8 text-pink-400" />
      case 'mp3': case 'wav': case 'ogg': case 'flac':
        return <FileAudio className="w-8 h-8 text-yellow-500" />
      case 'jpg': case 'jpeg': case 'png': case 'gif': case 'svg': case 'webp':
        return <FileImage className="w-8 h-8 text-purple-400" />
      case 'json':
        return <FileJson className="w-8 h-8 text-green-500" />
      case 'pdf':
        return <FileText className="w-8 h-8 text-red-500" />
      case 'txt': case 'md':
        return <FileText className="w-8 h-8 text-gray-500" />
    }
  }

  return <File className="w-8 h-8 text-gray-400" />
}
