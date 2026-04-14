import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry, ColDef } from 'ag-grid-community';
import { apiClient } from '@/lib/apiClient';
import { MovieDto, MovieSearchDto } from './types/movie';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import Toolbar from '@/shared/components/Toolbar';

ModuleRegistry.registerModules([AllCommunityModule]);

/**
 * MoviePage 컴포넌트
 * 용도: 영화 수집 데이터(DVD 등)를 AG Grid를 사용하여 목록으로 표시하고 검색 기능을 제공함
 */
const MoviePage = () => {
  const [searchParams, setSearchParams] = useState<MovieSearchDto>({
    page: 1,
    size: 100,
    keyword: '',
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['movies', searchParams],
    queryFn: async () => {
      return await apiClient.get('/movie', { params: searchParams });
    },
  });

  const columnDefs = useMemo<ColDef<MovieDto>[]>(() => [
    { field: 'id', headerName: 'ID', width: 80 },
    { field: 'mid', headerName: '영화ID', width: 100 },
    { field: 'title1', headerName: '제목(한글)', flex: 1, minWidth: 200 },
    { field: 'title2', headerName: '제목(영어)', flex: 1, minWidth: 200 },
    { field: 'category', headerName: '분야', width: 120 },
    { field: 'gamdok', headerName: '감독', width: 150 },
    { field: 'makeYear', headerName: '제작년', width: 100 },
    { field: 'nara', headerName: '국적', width: 100 },
    { field: 'dvdId', headerName: 'DVD ID', width: 100 },
  ], []);

  const handleSearch = () => {
    refetch();
  };

  const handleReset = () => {
    setSearchParams({ page: 1, size: 100, keyword: '' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toolbar />
      <main className="container mx-auto px-4 py-6">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">📀 영화 수집 목록</h1>
          </div>

          {/* 검색 영역 */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex gap-2 items-center">
            <Input
              placeholder="제목, 감독 등 검색어 입력"
              value={searchParams.keyword}
              onChange={(e) => setSearchParams({ ...searchParams, keyword: e.target.value })}
              className="max-w-xs"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch}>찾기</Button>
            <Button variant="outline" onClick={handleReset}>초기화</Button>
          </div>

          {/* 그리드 영역 */}
          <div className="ag-theme-alpine w-full h-[600px]">
            <AgGridReact
              rowData={data?.dtoList || []}
              columnDefs={columnDefs}
              loading={isLoading}
              pagination={true}
              paginationPageSize={100}
              domLayout="normal"
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default MoviePage;
