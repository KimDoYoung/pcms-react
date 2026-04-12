export interface AttachmentDto {
  fileId: number
  orgFileName: string
  fileSize: number
}

// PostViewPage, PostNewPage, PostEditPage 공통 (boardCode 불필요)
export interface BoardDto {
  id: number
  boardNameKor: string
  contentType: string
}

// PostsPage - 게시판 선택 드롭다운 (boardCode 포함)
export interface BoardWithCodeDto {
  id: number
  boardCode: string
  boardNameKor: string
  contentType: string
}

// BoardsPage - 게시판 관리 목록 (full)
export interface BoardDetailDto {
  id: number
  boardCode: string
  boardNameKor: string
  contentType: string
  description: string | null
  createdAt: string | null
}

// PostsPage - 게시글 목록 아이템
export interface PostListDto {
  id: number
  boardId: number
  title: string
  author: string | null
  viewCount: number
  baseYmd: string
  createdAt: string | null
  attachmentCount: number
}

export interface PostsPageResponse {
  dtoList: PostListDto[]
  total: number
  page: number
  size: number
}

// PostViewPage - 게시글 상세
export interface PostDto {
  id: number
  boardId: number
  title: string
  author: string | null
  content: string | null
  viewCount?: number
  baseYmd: string
  createdAt?: string | null
  attachments: AttachmentDto[]
}
