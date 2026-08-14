/**
 * TmdbSearchPopup
 * 목적: TMDB(The Movie Database) API로 한글제목+연도 → 영어제목+연도 → 제목만 순서로 영화를 검색해
 *       최상위 1건을 팝업에 표시하고(포스터/줄거리/평점/인기도/제작국가 등), 그 자리에서 movie_review
 *       테이블에 감상문을 저장하거나 포스터 이미지를 PC로 다운로드할 수 있게 한다.
 *       감상문저장 시 content는 HTML(<img>+<p>)로 구성되고(원래제목이 다르면 원래제목도 포함),
 *       nara는 original_language(ko/ja/en)를
 *       한국/일본/미국으로 매핑해 채우며, lvl은 voteAverage(0~10)를 반올림해 1~5로 환산한다.
 * 사용법: <TmdbSearchPopup open={open} onClose={...} titleKo={row.title1} titleEn={row.title2} year={row.makeYear} />
 *        열리면 자동으로 조회한다. KOFIC 팝업과 달리 결과 선택 UI 없이 최상위 1건만 보여주며,
 *        그리드 값을 채우지 않고 팝업 안에서 바로 저장/다운로드까지 처리한다.
 * props:
 *   - open: 팝업 표시 여부
 *   - onClose: 닫기 콜백
 *   - titleKo: 검색에 사용할 한글 제목
 *   - titleEn: 검색에 사용할 영어 제목(폴백용)
 *   - year: 검색에 사용할 제작년도(폴백용)
 */
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { apiClient } from '@/lib/apiClient'
import { formatYmd } from '@/lib/utils'
import { useMessage } from '@/shared/hooks/useMessage'
import type { TmdbMovieDto } from '@/domain/tmdb/types/tmdb'

interface TmdbSearchPopupProps {
  open: boolean
  onClose: () => void
  titleKo?: string
  titleEn?: string
  year?: string
}

const ORIGINAL_LANGUAGE_COUNTRY: Record<string, string> = {
  ko: '한국',
  ja: '일본',
  en: '미국',
}

function mapCountry(originalLanguage?: string): string | undefined {
  return originalLanguage ? ORIGINAL_LANGUAGE_COUNTRY[originalLanguage] : undefined
}

export default function TmdbSearchPopup({ open, onClose, titleKo, titleEn, year }: TmdbSearchPopupProps) {
  const { showMessage } = useMessage()

  const { data: movie, isFetching } = useQuery<TmdbMovieDto | null>({
    queryKey: ['tmdb-search', titleKo, titleEn, year],
    queryFn: async () => {
      try {
        return await apiClient.get<TmdbMovieDto>('/tmdb/search', {
          params: { titleKo, titleEn, year: year || undefined },
        })
      } catch (e) {
        if (axios.isAxiosError(e) && e.response?.status === 404) {
          return null
        }
        throw e
      }
    },
    enabled: open && !!titleKo,
  })

  async function handleSaveReview() {
    if (!movie) return
    try {
      const parts: string[] = []
      if (movie.originalTitle && movie.originalTitle !== movie.title) {
        parts.push(`<p>원래제목: ${movie.originalTitle}</p>`)
      }
      parts.push(`<p><strong>개봉일: ${movie.releaseDate ?? '-'} / 평점: ${movie.voteAverage ?? '-'} / 인기도: ${movie.popularity ?? '-'}</strong></p>`)
      if (movie.posterUrl) parts.push(`<img src="${movie.posterUrl}" alt="${movie.title} poster" style="max-width:300px" />`)
      if (movie.overview) parts.push(`<p>${movie.overview}</p>`)
      const content = parts.join('\n')

      await apiClient.post('/movie/review', {
        title: `TMDB-${movie.title}`,
        nara: mapCountry(movie.originalLanguage),
        year: movie.releaseDate?.slice(0, 4),
        lvl: movie.voteAverage !== undefined ? Math.min(5, Math.max(1, Math.round(movie.voteAverage / 2))) : undefined,
        content,
        ymd: formatYmd(new Date()),
      })
      showMessage('감상문이 저장되었습니다', 'success')
      onClose()
    } catch (e) {
      console.error('감상문 저장 실패', e)
      showMessage('감상문 저장에 실패했습니다', 'error')
    }
  }

  async function handleSavePoster() {
    if (!movie?.posterPath) return
    try {
      const blob = await apiClient.get<Blob>('/tmdb/poster', {
        params: { path: movie.posterPath },
        responseType: 'blob',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${movie.title}_poster.jpg`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error('포스터 저장 실패', e)
      showMessage('포스터 저장에 실패했습니다', 'error')
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-[54.6rem]">
        <DialogHeader>
          <DialogTitle>TMDB 정보 찾기</DialogTitle>
        </DialogHeader>

        {isFetching && (
          <p className="text-center text-sm text-gray-400 py-8">조회 중...</p>
        )}
        {!isFetching && !movie && (
          <p className="text-center text-sm text-gray-400 py-8">TMDB에서 찾을 수 없습니다</p>
        )}
        {!isFetching && movie && (
          <div className="flex gap-4">
            <div className="w-40 shrink-0">
              {movie.posterUrl ? (
                <img src={movie.posterUrl} alt={movie.title} className="w-full rounded-md border border-gray-100" />
              ) : (
                <div className="w-full aspect-2/3 rounded-md border border-gray-100 bg-gray-50 flex items-center justify-center text-xs text-gray-400">
                  포스터 없음
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-gray-800">{movie.title}</div>
              {movie.originalTitle && movie.originalTitle !== movie.title && (
                <div className="text-xs text-gray-400">{movie.originalTitle}</div>
              )}
              <div className="text-xs text-gray-500 mt-1">
                {movie.releaseDate && <span>개봉일: {movie.releaseDate}</span>}
                {movie.voteAverage !== undefined && <span className="ml-3">평점: {movie.voteAverage}</span>}
                {movie.popularity !== undefined && <span className="ml-3">인기도: {movie.popularity}</span>}
                {mapCountry(movie.originalLanguage) && <span className="ml-3">제작국가: {mapCountry(movie.originalLanguage)}</span>}
              </div>
              <p className="text-sm text-gray-700 mt-3 whitespace-pre-wrap">{movie.overview || '줄거리 정보가 없습니다'}</p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="cancel" onClick={onClose}>취소</Button>
          <Button variant="outline" onClick={handleSavePoster} disabled={!movie?.posterPath}>포스터저장</Button>
          <Button variant="navy" onClick={handleSaveReview} disabled={!movie}>감상문저장</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
