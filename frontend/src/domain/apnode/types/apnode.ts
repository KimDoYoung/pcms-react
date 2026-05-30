export type NodeType = 'F' | 'D' | 'L'

export interface ApNode {
  id: string
  nodeType: NodeType
  parentId: string | null
  name: string
  depth: number
  createDt: string
  modifyDt: string
  // D 전용
  childCount: number
  totalSize: number
  // L 전용
  linkTargetId?: string
  brokenLink?: boolean
  // 검색 결과 전용
  pathStr?: string
  // F / L(resolved) 공통
  fileUrl?: string
  thumbnailUrl?: string
  originalName?: string
  fileSize?: number
  contentType?: string
  width?: number
  height?: number
}

export interface CtxMenu {
  show: boolean
  x: number
  y: number
  node: ApNode | null
}

export interface Clipboard {
  items: { id: string; name: string }[]
  type: 'cut' | 'copy'
}
