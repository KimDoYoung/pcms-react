export interface SnoteDto {
  id: number
  title: string | null
  note: string
  createDt: string
}

export interface SnotePageResponse {
  dtoList: SnoteDto[]
  total: number
  page: number
  size: number
}

export interface RandomHintResponse {
  hint: string
  password: string
}
