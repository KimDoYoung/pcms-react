/**
 * KoficSearchPopup
 * 목적: KOFIC(영화진흥위원회) Open API "영화목록 조회"로 제목/연도를 검색해
 *       분야(repGenreNm)/감독(directorNm)/국적(repNationNm) 등의 값을 찾아 선택할 수 있게 한다.
 * 사용법: <KoficSearchPopup open={open} onClose={...} initialTitle={row.title1} initialYear={row.makeYear} onFill={(m) => ...} />
 *        열리면 제목/연도로 자동 조회한다. 결과 리스트에서 행을 클릭해 선택한 뒤 "채우기" 버튼을 누르면
 *        onFill이 호출되고 팝업이 닫힌다. 저장 여부(그리드만 채울지, 즉시 DB 저장할지)는 호출부(onFill)에서 결정한다.
 * props:
 *   - open: 팝업 표시 여부
 *   - onClose: 닫기 콜백
 *   - initialTitle: 최초 검색어로 쓸 제목
 *   - initialYear: 최초 검색어로 쓸 제작년도
 *   - onFill: "채우기" 클릭 시 선택된 KoficMovieDto를 전달하는 콜백
 * 그 외: 헤더(제목) 영역을 마우스로 드래그하면 팝업 위치를 이동할 수 있다(AG Grid를 가리는 것을
 *        피하기 위함). 다시 열릴 때 위치는 초기화된다. 제작년도 입력창 오른쪽 x 아이콘을 누르면
 *        제작년도를 비운다.
 */
import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, X } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Button } from '@/shared/components/ui/button'
import { apiClient } from '@/lib/apiClient'
import type { KoficMovieDto } from '@/domain/kofic/types/kofic'

interface KoficSearchPopupProps {
  open: boolean
  onClose: () => void
  initialTitle?: string
  initialYear?: string
  onFill: (movie: KoficMovieDto) => void
}

export default function KoficSearchPopup({ open, onClose, initialTitle, initialYear, onFill }: KoficSearchPopupProps) {
  const [movieNm, setMovieNm] = useState('')
  const [prdtYear, setPrdtYear] = useState('')
  const [query, setQuery] = useState<{ movieNm: string; prdtYear: string } | null>(null)
  const [selected, setSelected] = useState<KoficMovieDto | null>(null)
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 })
  const dragStateRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null)

  useEffect(() => {
    if (open) {
      const title = initialTitle ?? ''
      const year = initialYear ?? ''
      setMovieNm(title)
      setPrdtYear(year)
      setSelected(null)
      setQuery(title ? { movieNm: title, prdtYear: year } : null)
      setDragPos({ x: 0, y: 0 })
    }
  }, [open, initialTitle, initialYear])

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!dragStateRef.current) return
      const { startX, startY, origX, origY } = dragStateRef.current
      setDragPos({ x: origX + (e.clientX - startX), y: origY + (e.clientY - startY) })
    }
    function onMouseUp() {
      dragStateRef.current = null
    }
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  function handleHeaderMouseDown(e: ReactMouseEvent) {
    dragStateRef.current = { startX: e.clientX, startY: e.clientY, origX: dragPos.x, origY: dragPos.y }
  }

  const { data: results = [], isFetching } = useQuery<KoficMovieDto[]>({
    queryKey: ['kofic-movies', query?.movieNm, query?.prdtYear],
    queryFn: () => apiClient.get<KoficMovieDto[]>('/kofic/movies', {
      params: { movieNm: query?.movieNm, prdtYear: query?.prdtYear || undefined },
    }),
    enabled: !!query?.movieNm,
  })

  function handleSearch() {
    setSelected(null)
    setQuery({ movieNm: movieNm.trim(), prdtYear: prdtYear.trim() })
  }

  function handleFill() {
    if (!selected) return
    onFill(selected)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-w-2xl"
        style={{ transform: `translate(calc(-50% + ${dragPos.x}px), calc(-50% + ${dragPos.y}px))` }}
      >
        <DialogHeader className="cursor-move select-none" onMouseDown={handleHeaderMouseDown}>
          <DialogTitle>KOFIC 영화 찾기</DialogTitle>
        </DialogHeader>

        <div className="flex gap-2">
          <Input
            value={movieNm}
            onChange={(e) => setMovieNm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="영화 제목"
            className="flex-1"
          />
          <div className="relative w-28">
            <Input
              value={prdtYear}
              onChange={(e) => setPrdtYear(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="제작년도"
              className="pr-7"
            />
            {prdtYear && (
              <button
                type="button"
                onClick={() => setPrdtYear('')}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <Button onClick={handleSearch} disabled={!movieNm.trim()}>
            <Search />
            찾기
          </Button>
        </div>

        <div className="max-h-96 overflow-y-auto border border-gray-100 rounded-md">
          {!query && (
            <p className="text-center text-sm text-gray-400 py-8">제목을 입력하고 찾기를 눌러주세요</p>
          )}
          {query && isFetching && (
            <p className="text-center text-sm text-gray-400 py-8">조회 중...</p>
          )}
          {query && !isFetching && results.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-8">검색 결과가 없습니다</p>
          )}
          {results.map((m) => (
            <button
              key={m.movieCd}
              type="button"
              onClick={() => setSelected(m)}
              className={`w-full text-left px-3 py-2.5 border-b border-gray-50 last:border-b-0 transition-colors ${
                selected?.movieCd === m.movieCd ? 'bg-blue-50' : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-baseline gap-2">
                <span className="font-medium text-gray-800">{m.movieNm}</span>
                {m.movieNmEn && <span className="text-xs text-gray-400">{m.movieNmEn}</span>}
                <span className="text-xs text-gray-400 ml-auto">{m.prdtYear}</span>
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                {m.repGenreNm && <span>분야: {m.repGenreNm}</span>}
                {m.directorNm && <span className="ml-3">감독: {m.directorNm}</span>}
                {m.repNationNm && <span className="ml-3">국적: {m.repNationNm}</span>}
              </div>
            </button>
          ))}
        </div>

        <DialogFooter>
          <Button variant="cancel" onClick={onClose}>취소</Button>
          <Button variant="navy" onClick={handleFill} disabled={!selected}>채우기</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
