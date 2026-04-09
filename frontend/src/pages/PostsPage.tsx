import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Plus, Paperclip, Trash2, Search, ChevronDown } from 'lucide-react'
import { apiClient } from '@/lib/apiClient'
import Toolbar from '@/components/Toolbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface BoardDto {
  id: number
  boardCode: string
  boardNameKor: string
  contentType: string
}

interface PostDto {
  id: number
  boardId: number
  title: string
  author: string | null
  viewCount: number
  baseYmd: string
  createdAt: string | null
  attachmentCount: number
}

interface PageResponse {
  dtoList: PostDto[]
  total: number
  page: number
  size: number
}

const PAGE_SIZE = 20

function formatDate(dt: string | null) {
  if (!dt) return ''
  const d = new Date(dt)
  const today = new Date()
  const isToday = d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate()
  if (isToday) return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

export default function PostsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const boardId = searchParams.get('boardId') ? Number(searchParams.get('boardId')) : null

  const [keyword, setKeyword] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [page, setPage] = useState(1)
  const [showBoardDropdown, setShowBoardDropdown] = useState(false)

  const { data: boards = [] } = useQuery<BoardDto[]>({
    queryKey: ['boards'],
    queryFn: () => apiClient.get<BoardDto[]>('/boards'),
  })

  const currentBoard = boards.find((b) => b.id === boardId)

  const { data, isLoading } = useQuery<PageResponse>({
    queryKey: ['posts', boardId, searchKeyword, page],
    queryFn: () => {
      const params: Record<string, string | number> = { page, size: PAGE_SIZE }
      if (searchKeyword) params.keyword = searchKeyword
      return apiClient.get<PageResponse>(`/boards/${boardId}/posts`, { params })
    },
    enabled: !!boardId,
  })

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0

  function handleSearch() {
    setSearchKeyword(keyword)
    setPage(1)
  }

  function selectBoard(id: number) {
    setSearchParams({ boardId: String(id) })
    setSearchKeyword('')
    setKeyword('')
    setPage(1)
    setShowBoardDropdown(false)
  }

  async function handleDelete(post: PostDto) {
    if (!confirm(`"${post.title}"을(를) 삭제하시겠습니까?`)) return
    try {
      await apiClient.delete(`/boards/${post.boardId}/posts/${post.id}`)
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    } catch {
      alert('삭제 중 오류가 발생했습니다.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toolbar />
      <main className="container mx-auto px-6 py-6">

        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/boards')}
              className="p-1.5 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
              title="게시판 목록"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            {/* 게시판명 + 드롭다운 */}
            <div className="relative">
              <button
                onClick={() => setShowBoardDropdown((v) => !v)}
                className="flex items-center gap-1.5 text-xl font-bold text-gray-800 hover:text-blue-600 transition-colors"
              >
                <span>{currentBoard?.boardNameKor ?? '게시판 선택'}</span>
                <ChevronDown className="w-5 h-5 text-gray-400" />
              </button>

              {showBoardDropdown && (
                <div className="absolute left-0 mt-2 w-60 bg-white rounded-xl shadow-xl border border-gray-100 z-20 py-2">
                  <p className="px-4 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-50">게시판 목록</p>
                  <div className="max-h-60 overflow-y-auto">
                    {boards.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => selectBoard(b.id)}
                        className={`w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-colors ${b.id === boardId ? 'bg-blue-50/60 text-blue-700' : 'text-gray-700'}`}
                      >
                        <p className="text-sm font-medium">{b.boardNameKor}</p>
                        <p className="text-xs text-gray-400">{b.boardCode}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {boardId && (
            <Button size="sm" onClick={() => navigate(`/posts/new?boardId=${boardId}`)}>
              <Plus className="w-4 h-4 mr-1" /> 새 글 쓰기
            </Button>
          )}
        </div>

        {/* 검색 */}
        {boardId && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3 mb-4 flex gap-3 items-center">
            <Input
              placeholder="제목 검색"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="text-sm"
            />
            <Button onClick={handleSearch} className="shrink-0">
              <Search className="w-4 h-4 mr-1" /> 검색
            </Button>
          </div>
        )}

        {/* 게시판 미선택 */}
        {!boardId && (
          <div className="text-center py-20 text-gray-400">
            <p>게시판을 선택해주세요.</p>
          </div>
        )}

        {/* 목록 */}
        {boardId && (
          isLoading ? (
            <p className="text-center py-10 text-gray-400 text-sm">불러오는 중...</p>
          ) : (
            <>
              <p className="text-xs text-gray-400 mb-2 px-1">총 {data?.total ?? 0}건</p>

              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500">
                      <th className="px-4 py-3 text-center font-medium w-14">No</th>
                      <th className="px-4 py-3 text-left font-medium">제목</th>
                      <th className="px-4 py-3 text-center font-medium w-24">작성자</th>
                      <th className="px-4 py-3 text-center font-medium w-16">조회</th>
                      <th className="px-4 py-3 text-center font-medium w-28">작성일</th>
                      <th className="px-4 py-3 text-center font-medium w-14">삭제</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(!data?.dtoList || data.dtoList.length === 0) && (
                      <tr>
                        <td colSpan={6} className="text-center py-14 text-gray-400">게시글이 없습니다.</td>
                      </tr>
                    )}
                    {data?.dtoList.map((post, idx) => {
                      const no = (data.total) - ((page - 1) * PAGE_SIZE) - idx
                      return (
                        <tr
                          key={post.id}
                          className="border-b border-gray-100 hover:bg-blue-50/40 transition-colors cursor-pointer group"
                          onClick={() => navigate(`/posts/${post.id}`, { state: { boardId } })}
                        >
                          <td className="px-4 py-3 text-center text-xs text-gray-400">{no}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-800 group-hover:text-blue-600 transition-colors">{post.title}</span>
                              {post.attachmentCount > 0 && <Paperclip className="w-3.5 h-3.5 text-gray-400 shrink-0" />}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center text-gray-500">{post.author || '관리자'}</td>
                          <td className="px-4 py-3 text-center text-gray-400 text-xs">{post.viewCount}</td>
                          <td className="px-4 py-3 text-center text-gray-400 text-xs">{formatDate(post.createdAt)}</td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDelete(post) }}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                              title="삭제"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* 페이징 */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-1 mt-6">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>이전</Button>
                  <span className="px-3 py-1 text-sm text-gray-600 flex items-center">{page} / {totalPages}</span>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>다음</Button>
                </div>
              )}
            </>
          )
        )}
      </main>
    </div>
  )
}
