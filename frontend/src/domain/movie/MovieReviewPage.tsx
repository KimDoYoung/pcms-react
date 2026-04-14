import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry, ColDef } from 'ag-grid-community';
import { apiClient } from '@/lib/apiClient';
import { MovieReviewDto, MovieReviewSearchDto } from './types/movie';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { formatDate } from '@/lib/utils';
import Toolbar from '@/shared/components/Toolbar';

ModuleRegistry.registerModules([AllCommunityModule]);

/**
 * MovieReviewPage 컴포넌트
 * 용도: 영화 감상평(Review) 데이터를 CRUD 관리함. AG Grid로 목록을 표시하고 검색 기능 제공함
 */
const MovieReviewPage = () => {
  const [searchParams, setSearchParams] = useState<MovieReviewSearchDto>({
    page: 1,
    size: 100,
    keyword: '',
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['movieReviews', searchParams],
    queryFn: async () => {
      return await apiClient.get('/movie/review', { params: searchParams });
    },
  });

  const columnDefs = useMemo<ColDef<MovieReviewDto>[]>(() => [
    { field: 'id', headerName: 'ID', width: 80 },
    { field: 'title', headerName: '제목', flex: 1, minWidth: 200 },
    { field: 'nara', headerName: '국가', width: 100 },
    { field: 'year', headerName: '제작년도', width: 100 },
    { field: 'lvl', headerName: '평점', width: 80 },
    { 
      field: 'ymd', 
      headerName: '본일자', 
      width: 120,
      valueFormatter: (params) => params.value ? formatDate(params.value) : '' 
    },
    {
      headerName: '조작',
      width: 150,
      cellRenderer: () => (
        <div className="flex gap-1 h-full items-center">
          <Button size="sm" variant="outline" className="h-7">수정</Button>
          <Button size="sm" variant="destructive" className="h-7">삭제</Button>
        </div>
      )
    }
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
            <h1 className="text-2xl font-bold text-gray-800">🎬 영화 감상평 관리</h1>
            <Button>신규 등록</Button>
          </div>

          {/* 검색 영역 */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex gap-2 items-center">
            <Input
              placeholder="제목, 내용 등 검색어 입력"
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

export default MovieReviewPage;
