/**
 * HddTree
 * 목적: HDD 볼륨 → 폴더(gubun='D') 계층을 트리로 보여준다. 볼륨 하나가 통째로 4TB급이라
 *      트리 전체를 한 번에 가져오면 안 되고, 노드를 클릭할 때마다 그 노드의 자식만 조회한다.
 * 사용법: HddPage 좌측 사이드바에서 사용. 노드를 클릭하면 (펼침/접힘 토글 + 선택)이 동시에 일어나고,
 *        그 시점에 자식 목록 1건만 조회한다. 응답 중 gubun='D'는 트리 하위 노드로, gubun='F'는
 *        같은 조회 결과를 공유하는 HddFileList가 오른쪽 파일 목록으로 사용한다(queryKey 공유로 중복 요청 없음).
 *        pid가 null이면 볼륨 루트, 그 외에는 선택된 폴더(cms.hdd.id)를 의미한다.
 *        일부 폴더는 자식이 수만 개(예: 잘못 매핑된 루트 폴더)라 한 번에 렌더링하면 브라우저가 멎는다 —
 *        자식이 많으면(PAGE_THRESHOLD 초과) 검색창과 "더보기" 버튼으로 화면에 그리는 개수를 제한한다.
 * props:
 *   - volumes: 볼륨명 목록 (최상위 트리 노드)
 *   - selected: 현재 선택된 노드 (하이라이트 표시용)
 *   - onSelect: 노드 선택 콜백
 */
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { HardDrive, Folder, FolderOpen, ChevronRight, ChevronDown, Search } from 'lucide-react'
import { apiClient } from '@/lib/apiClient'
import type { HddDto } from '@/domain/movie/types/movie'

export interface HddSelectedNode {
  volumnName: string
  pid: number | null
  name: string
}

const PAGE_SIZE = 200
const PAGE_THRESHOLD = 200

interface HddDirChildrenProps {
  volumnName: string
  dirs: HddDto[]
  selected: HddSelectedNode | null
  onSelect: (node: HddSelectedNode) => void
}

/** 폴더 자식 목록 렌더링 — 개수가 많으면 검색 + "더보기"로 나눠 그린다 (전부 한 번에 마운트하면 브라우저가 멎음) */
function HddDirChildren({ volumnName, dirs, selected, onSelect }: HddDirChildrenProps) {
  const [filter, setFilter] = useState('')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const filtered = useMemo(() => {
    if (!filter.trim()) return dirs
    const lower = filter.toLowerCase()
    return dirs.filter((d) => d.name.toLowerCase().includes(lower))
  }, [dirs, filter])

  const visible = filtered.slice(0, visibleCount)
  const showTools = dirs.length > PAGE_THRESHOLD

  return (
    <div className="ml-4 border-l border-gray-100 pl-1">
      {showTools && (
        <div className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400">
          <Search className="w-3 h-3 flex-shrink-0" />
          <input
            value={filter}
            onChange={(e) => { setFilter(e.target.value); setVisibleCount(PAGE_SIZE) }}
            placeholder={`${dirs.length}개 중 검색`}
            className="w-full bg-transparent outline-none placeholder:text-gray-300"
          />
        </div>
      )}
      {visible.map((child) => (
        <HddDirNode key={child.id} volumnName={volumnName} node={child} selected={selected} onSelect={onSelect} />
      ))}
      {filtered.length > visibleCount && (
        <button
          className="w-full text-left px-2 py-1 text-xs text-blue-500 hover:bg-gray-100 rounded"
          onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
        >
          {filtered.length - visibleCount}개 더보기...
        </button>
      )}
    </div>
  )
}

interface HddDirNodeProps {
  volumnName: string
  node: HddDto
  selected: HddSelectedNode | null
  onSelect: (node: HddSelectedNode) => void
}

function HddDirNode({ volumnName, node, selected, onSelect }: HddDirNodeProps) {
  const [expanded, setExpanded] = useState(false)
  const isSelected = selected != null && selected.pid === node.id && selected.volumnName === volumnName

  const { data: children } = useQuery<HddDto[]>({
    queryKey: ['hdd-children', volumnName, node.id],
    queryFn: () => apiClient.get<HddDto[]>('/movie/hdd/children', { params: { volumnName, pid: node.id } }),
    enabled: expanded,
    staleTime: 5 * 60 * 1000,
  })

  const dirs = (children ?? []).filter((c) => c.gubun === 'D')
  const FolderIcon = expanded ? FolderOpen : Folder

  const handleClick = () => {
    setExpanded((v) => !v)
    onSelect({ volumnName, pid: node.id!, name: node.name })
  }

  return (
    <div>
      <div
        className={`flex items-center gap-1 px-2 py-1 rounded-lg cursor-pointer select-none text-sm transition-colors ${
          isSelected ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-100'
        }`}
        onClick={handleClick}
      >
        <span className="p-0.5 rounded text-gray-400">
          {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </span>
        <FolderIcon className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-blue-500' : 'text-yellow-400'}`} />
        <span className="truncate">{node.name}</span>
      </div>
      {expanded && dirs.length > 0 && (
        <HddDirChildren volumnName={volumnName} dirs={dirs} selected={selected} onSelect={onSelect} />
      )}
    </div>
  )
}

interface HddVolumeNodeProps {
  volumnName: string
  selected: HddSelectedNode | null
  onSelect: (node: HddSelectedNode) => void
}

function HddVolumeNode({ volumnName, selected, onSelect }: HddVolumeNodeProps) {
  const [expanded, setExpanded] = useState(false)
  const isSelected = selected != null && selected.volumnName === volumnName && selected.pid === null

  const { data: children } = useQuery<HddDto[]>({
    queryKey: ['hdd-children', volumnName, null],
    queryFn: () => apiClient.get<HddDto[]>('/movie/hdd/children', { params: { volumnName } }),
    enabled: expanded,
    staleTime: 5 * 60 * 1000,
  })

  const dirs = (children ?? []).filter((c) => c.gubun === 'D')

  const handleClick = () => {
    setExpanded((v) => !v)
    onSelect({ volumnName, pid: null, name: volumnName })
  }

  return (
    <div>
      <div
        className={`flex items-center gap-1 px-2 py-1 rounded-lg cursor-pointer select-none text-sm font-medium transition-colors ${
          isSelected ? 'bg-blue-100 text-blue-700' : 'text-gray-800 hover:bg-gray-100'
        }`}
        onClick={handleClick}
      >
        <span className="p-0.5 rounded text-gray-400">
          {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </span>
        <HardDrive className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-blue-500' : 'text-gray-500'}`} />
        <span className="truncate">{volumnName}</span>
      </div>
      {expanded && dirs.length > 0 && (
        <HddDirChildren volumnName={volumnName} dirs={dirs} selected={selected} onSelect={onSelect} />
      )}
    </div>
  )
}

interface HddTreeProps {
  volumes: string[]
  selected: HddSelectedNode | null
  onSelect: (node: HddSelectedNode) => void
}

export default function HddTree({ volumes, selected, onSelect }: HddTreeProps) {
  return (
    <div className="p-2">
      {volumes.map((v) => (
        <HddVolumeNode key={v} volumnName={v} selected={selected} onSelect={onSelect} />
      ))}
    </div>
  )
}
