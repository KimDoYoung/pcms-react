/**
 * HddFileList
 * 목적: HddTree에서 선택된 볼륨/폴더 안의 파일(gubun='F') 목록을 보여준다.
 * 사용법: HddPage 우측 영역에서 사용. selected가 null이면 안내 문구를 보여준다.
 *        HddTree가 같은 노드를 클릭할 때 쓰는 queryKey(['hdd-children', volumnName, pid])를 그대로 사용해
 *        React Query 캐시를 공유한다 — 트리 펼침과 파일 목록 갱신이 한 번의 네트워크 요청으로 끝난다.
 * props:
 *   - selected: 현재 선택된 노드 { volumnName, pid, name } (HddTree와 동일한 타입)
 */
import { useQuery } from '@tanstack/react-query'
import { FileVideo } from 'lucide-react'
import { apiClient } from '@/lib/apiClient'
import { formatFileSize, formatDate } from '@/lib/utils'
import type { HddDto } from '@/domain/movie/types/movie'
import type { HddSelectedNode } from '@/domain/movie/components/HddTree'

interface HddFileListProps {
  selected: HddSelectedNode | null
}

export default function HddFileList({ selected }: HddFileListProps) {
  const { data, isLoading } = useQuery<HddDto[]>({
    queryKey: ['hdd-children', selected?.volumnName, selected?.pid ?? null],
    queryFn: () => apiClient.get<HddDto[]>('/movie/hdd/children', {
      params: { volumnName: selected?.volumnName, pid: selected?.pid ?? undefined },
    }),
    enabled: !!selected,
  })
  const files = (data ?? []).filter((c) => c.gubun === 'F')

  if (!selected) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
        왼쪽에서 볼륨 또는 폴더를 선택하세요
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      <div className="px-4 py-2 border-b border-gray-100 text-sm text-gray-500 truncate flex-shrink-0">
        {selected.name} <span className="text-gray-300 mx-1">·</span> 파일 {files.length}개
      </div>
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-100 border-t-blue-400" />
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-20 text-gray-400 text-sm">파일이 없습니다</div>
        ) : (
          <table className="w-full table-fixed text-sm">
            <thead className="bg-gray-50 border-b border-gray-100 sticky top-0">
              <tr>
                <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase w-7/12">이름</th>
                <th className="text-right p-3 text-xs font-semibold text-gray-500 uppercase w-2/12">크기</th>
                <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase w-3/12">수정일</th>
              </tr>
            </thead>
            <tbody>
              {files.map((f) => (
                <tr key={f.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="p-2">
                    <div className="flex items-center gap-2">
                      <FileVideo className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                      <span className="truncate text-gray-800" title={f.name}>{f.name}</span>
                    </div>
                  </td>
                  <td className="p-3 text-right text-gray-500">{formatFileSize(f.size ?? 0)}</td>
                  <td className="p-3 text-gray-500">{formatDate(f.lastModifiedYmd?.slice(0, 8), false)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
