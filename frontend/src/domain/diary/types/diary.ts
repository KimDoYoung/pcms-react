export interface AttachmentDto {
  fileId: number
  orgFileName: string
  fileSize: number
  mimeType: string
}

// 상세 조회 DTO (DiaryViewPage)
export interface DiaryDto {
  id: number
  ymd: string
  summary: string | null
  content: string | null
  attachments: AttachmentDto[]
}

// 목록 조회 DTO (DiaryPage)
export interface DiaryListDto {
  id: number
  ymd: string
  summary: string | null
  content: string | null
  attachmentCount: number
}

export interface DiaryPageResponse {
  dtoList: DiaryListDto[]
  total: number
  page: number
  size: number
}

export interface DiarySearchParams {
  startYmd: string
  endYmd: string
  keyword: string
  page: number
}

// 사이드바 요약 DTO (DiarySummaryList)
export interface DiarySummaryDto {
  id: number
  ymd: string
  summary: string | null
}

export interface DiarySummaryPageResponse {
  dtoList: DiarySummaryDto[]
}
