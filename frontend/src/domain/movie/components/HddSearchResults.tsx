/**
 * HddSearchResults
 * 목적: 하드디스크 전체 볼륨을 대상으로 파일 이름(name/fileName/path)을 검색한 결과를 보여준다.
 * 사용법: HddPage에서 검색어가 활성화되면 트리+파일목록 대신 렌더링한다.
 *        keyword가 바뀌면 부모가 컴포넌트를 key={keyword}로 재마운트해 페이지를 1로 리셋한다.
 * props:
 *   - keyword: 검색어 (필수, gubun='F'로 파일만 조회)
 */
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FileVideo } from 'lucide-react'
import { apiClient } from '@/lib/apiClient'
import { formatFileSize, formatDate } from '@/lib/utils'
import { Button } from '@/shared/components/ui/button'
import type { HddDto, PagedResponse } from '@/domain/movie/types/movie'

const PAGE_SIZE = 50

interface HddSearchResultsProps {
  keyword: string
}

// pdir 컬럼은 첫 단계 폴더만 기록된 경우가 있어(수집 스크립트 이슈) 신뢰할 수 없다.
// path(파일명 포함 전체 경로)에서 마지막 세그먼트(파일명)를 제거해 전체 폴더 경로를 구한다.
function dirOf(path?: string): string {
  if (!path) return ''
  const idx = path.lastIndexOf('/')
  return idx >= 0 ? path.slice(0, idx) : ''
}

export default function HddSearchResults({ keyword }: HddSearchResultsProps) {
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery<PagedResponse<HddDto>>({
    queryKey: ['hdd-search', keyword, page],
    queryFn: () => apiClient.get<PagedResponse<HddDto>>('/movie/hdd', {
      params: { keyword, gubun: 'F', page, size: PAGE_SIZE },
    }),
  })

  const files = data?.dtoList ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      <div className="px-4 py-2 border-b border-gray-100 text-sm text-gray-500 truncate flex-shrink-0">
        &apos;{keyword}&apos; 검색 결과 <span className="text-gray-300 mx-1">·</span> 전체 {total}건
      </div>
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-100 border-t-blue-400" />
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-20 text-gray-400 text-sm">검색 결과가 없습니다</div>
        ) : (
          <table className="w-full table-fixed text-sm">
            <thead className="bg-gray-50 border-b border-gray-100 sticky top-0">
              <tr>
                <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase w-4/12">이름</th>
                <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase w-1/12">볼륨명</th>
                <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase w-3/12">경로명</th>
                <th className="text-right p-3 text-xs font-semibold text-gray-500 uppercase w-2/12">크기</th>
                <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase w-2/12">수정일</th>
              </tr>
            </thead>
            <tbody>
              {files.map((f) => {
                const dir = dirOf(f.path)
                return (
                  <tr key={f.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <FileVideo className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                        <span className="truncate text-gray-800" title={f.name}>{f.name}</span>
                      </div>
                    </td>
                    <td className="p-3 text-gray-500 truncate" title={f.volumnName}>{f.volumnName}</td>
                    <td className="p-3 text-gray-500 truncate" title={dir}>{dir}</td>
                    <td className="p-3 text-right text-gray-500">{formatFileSize(f.size ?? 0)}</td>
                    <td className="p-3 text-gray-500">{formatDate(f.lastModifiedYmd?.slice(0, 8), false)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 py-2 border-t border-gray-100 flex-shrink-0">
          <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>이전</Button>
          <span className="text-xs text-gray-500">{page} / {totalPages}</span>
          <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>다음</Button>
        </div>
      )}
    </div>
  )
}
