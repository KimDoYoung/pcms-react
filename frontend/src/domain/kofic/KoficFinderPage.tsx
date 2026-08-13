/**
 * KoficFinderPage
 * 용도: KOFIC(영화진흥위원회) Open API에서 제목/제작년도/감독/국적으로 영화를 찾아 보여주는
 *      단독 조회 페이지. DB(movie 테이블)와는 무관하게 KOFIC API 결과만 보여준다.
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RefreshCw, Search } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import Toolbar from '@/shared/layout/Toolbar';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import type { KoficMovieDto } from '@/domain/kofic/types/kofic';

interface KoficSearchForm {
  movieNm: string;
  prdtYear: string;
  directorNm: string;
  nara: string;
}

const EMPTY_FORM: KoficSearchForm = { movieNm: '', prdtYear: '', directorNm: '', nara: '' };

export default function KoficFinderPage() {
  const [form, setForm] = useState<KoficSearchForm>(EMPTY_FORM);
  const [query, setQuery] = useState<KoficSearchForm | null>(null);

  const { data: results = [], isFetching } = useQuery<KoficMovieDto[]>({
    queryKey: ['kofic-finder', query],
    queryFn: () => apiClient.get<KoficMovieDto[]>('/kofic/movies', {
      params: {
        movieNm: query?.movieNm || undefined,
        directorNm: query?.directorNm || undefined,
        prdtYear: query?.prdtYear || undefined,
      },
    }),
    enabled: !!query,
  });

  const filtered = query?.nara
    ? results.filter((m) => (m.repNationNm ?? '').includes(query.nara))
    : results;

  function handleSearch() {
    if (!form.movieNm.trim() && !form.directorNm.trim()) return;
    setQuery({ ...form, movieNm: form.movieNm.trim(), directorNm: form.directorNm.trim(), prdtYear: form.prdtYear.trim(), nara: form.nara.trim() });
  }

  function handleReset() {
    setForm(EMPTY_FORM);
    setQuery(null);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toolbar />
      <main className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">🔍 KOFIC 영화찾기</h1>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-wrap gap-4 items-end mb-4">
          <div className="flex flex-col gap-1.5 flex-1 min-w-[160px]">
            <label className="text-xs font-medium text-gray-500">제목</label>
            <Input
              value={form.movieNm}
              onChange={(e) => setForm({ ...form, movieNm: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="영화 제목"
            />
          </div>
          <div className="flex flex-col gap-1.5 w-28">
            <label className="text-xs font-medium text-gray-500">제작년도</label>
            <Input
              value={form.prdtYear}
              onChange={(e) => setForm({ ...form, prdtYear: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="YYYY"
            />
          </div>
          <div className="flex flex-col gap-1.5 w-40">
            <label className="text-xs font-medium text-gray-500">감독</label>
            <Input
              value={form.directorNm}
              onChange={(e) => setForm({ ...form, directorNm: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="감독명"
            />
          </div>
          <div className="flex flex-col gap-1.5 w-28">
            <label className="text-xs font-medium text-gray-500">국적</label>
            <Input
              value={form.nara}
              onChange={(e) => setForm({ ...form, nara: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="국적"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="navy"  onClick={handleSearch} disabled={!form.movieNm.trim() && !form.directorNm.trim()}>
              <Search className="w-4 h-4" />
              찾기
            </Button>
            <Button variant="cancel" onClick={handleReset}><RefreshCw/>초기화</Button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          {!query ? (
            <p className="text-sm text-gray-400 text-center py-20">제목 또는 감독을 입력하고 찾기를 눌러주세요</p>
          ) : isFetching ? (
            <p className="text-sm text-gray-400 text-center py-20">조회 중...</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-20">검색 결과가 없습니다</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-200 border-b border-gray-100">
                <tr>
                  <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">제목(한글)</th>
                  <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">제목(영어)</th>
                  <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase w-20">제작년</th>
                  <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase w-24">분야</th>
                  <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase w-28">감독</th>
                  <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase w-20">국적</th>
                  <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">제작사</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => (
                  <tr key={m.movieCd} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="p-3 text-gray-800">{m.movieNm}</td>
                    <td className="p-3 text-gray-500">{m.movieNmEn}</td>
                    <td className="p-3 text-gray-500">{m.prdtYear}</td>
                    <td className="p-3 text-gray-500">{m.repGenreNm}</td>
                    <td className="p-3 text-gray-500">{m.directorNm}</td>
                    <td className="p-3 text-gray-500">{m.repNationNm}</td>
                    <td className="p-3 text-gray-500">{m.companyNm}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
