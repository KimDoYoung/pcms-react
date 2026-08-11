import { getApiFullBaseUrl } from '@/lib/apiClient'

export interface MediaFile {
  fileId: number
  orgFileName: string
  fileSize: number
  mimeType: string
}

export function mediaDownloadUrl(item: MediaFile): string {
  return `${getApiFullBaseUrl()}/files/${item.fileId}/download/${encodeURIComponent(item.orgFileName)}`
}

export function mediaLabel(item: MediaFile): string {
  const dot = item.orgFileName.lastIndexOf('.')
  return dot > 0 ? item.orgFileName.slice(0, dot) : item.orgFileName
}
