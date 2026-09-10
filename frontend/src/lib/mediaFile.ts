import { getApiFullBaseUrl } from '@/lib/apiClient'

export interface MediaFile {
  fileId: number
  orgFileName: string
  fileSize: number
  mimeType: string
  fileCategory?: string
  tag?: string
  createdAt?: string
}

export interface StickerFile {
  fileId: number
  orgFileName: string
  fileSize: number
  mimeType: string
  fileCategory?: string
  tag?: string
  createdAt?: string
}

export function mediaDownloadUrl(item: MediaFile | StickerFile): string {
  return `${getApiFullBaseUrl()}/files/${item.fileId}/download/${encodeURIComponent(item.orgFileName)}`
}

export function mediaLabel(item: MediaFile | StickerFile): string {
  const dot = item.orgFileName.lastIndexOf('.')
  return dot > 0 ? item.orgFileName.slice(0, dot) : item.orgFileName
}
