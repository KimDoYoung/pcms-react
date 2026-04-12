export interface AttachmentDto {
  fileId: number
  orgFileName: string
  fileSize: number
  mimeType?: string
}

// 상세 조회 DTO (ViewPage, EditPage)
export interface JangbiDto {
  id: number
  ymd: string
  item: string
  location: string | null
  cost: number | null
  spec: string | null
  lvl: string
  modifyDt?: string | null
  attachments: AttachmentDto[]
}

// 목록 조회 DTO (JangbiPage)
export interface JangbiListDto {
  id: number
  ymd: string
  item: string
  location: string | null
  cost: number | null
  lvl: string
  attachmentCount: number
}

export interface JangbiPageResponse {
  dtoList: JangbiListDto[]
  total: number
  page: number
  size: number
}
