/**
 * 목적: ApNode 전체 트리에서 파일/폴더명으로 검색
 * 사용법:
 *   <ApNodeSearchModal open={open} onClose={...} onNavigate={...} />
 * props:
 *   open        - 모달 표시 여부
 *   onClose     - 모달 닫기 콜백
 *   onNavigate  - 결과 클릭 시 이동할 폴더 id (null=루트) 전달 콜백
 */
import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Folder, File, Link } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { apiClient } from '@/lib/apiClient'
import type { ApNode } from '@/domain/apnode/types/apnode'

interface Props {
  open: boolean
  onClose: () => void
  onNavigate: (id: string | null) => void
}

function NodeIcon({ nodeType }: { nodeType: string }) {
  if (nodeType === 'D') return <Folder className="w-4 h-4 text-yellow-500 shrink-0" />
  if (nodeType === 'L') return <Link className="w-4 h-4 text-blue-400 shrink-0" />
  return <File className="w-4 h-4 text-gray-400 shrink-0" />
}

export default function ApNodeSearchModal({ open, onClose, onNavigate }: Props) {
  const [input, setInput] = useState('')
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (open) {
      setInput('')
      setQuery('')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  function handleInputChange(val: string) {
    setInput(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setQuery(val.trim())
    }, 300)
  }

  const { data: results = [], isFetching } = useQuery({
    queryKey: ['apnode-search', query],
    queryFn: () => apiClient.get<ApNode[]>(`/apnode/search?q=${encodeURIComponent(query)}`),
    enabled: query.length >= 2,
    staleTime: 30_000,
  })

  function handleSelect(node: ApNode) {
    if (node.nodeType === 'D') {
      onNavigate(node.id)
    } else {
      onNavigate(node.parentId ?? null)
    }
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>전체 찾기</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="파일/폴더명 검색 (2글자 이상)"
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>

        <div className="mt-2 max-h-80 overflow-y-auto">
          {query.length < 2 && (
            <p className="text-center text-sm text-gray-400 py-8">2글자 이상 입력하세요</p>
          )}
          {query.length >= 2 && isFetching && (
            <p className="text-center text-sm text-gray-400 py-8">검색 중...</p>
          )}
          {query.length >= 2 && !isFetching && results.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-8">검색 결과가 없습니다</p>
          )}
          {results.map((node) => (
            <button
              key={node.id}
              type="button"
              onClick={() => handleSelect(node)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-blue-50 transition-colors text-left"
            >
              <NodeIcon nodeType={node.nodeType} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{node.name}</p>
                {node.pathStr && (
                  <p className="text-xs text-gray-400 truncate">{node.pathStr}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
