import { useState, useMemo, useRef } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import type { ColDef, GridReadyEvent, IDatasource, IGetRowsParams, GridApi } from 'ag-grid-community';
import { apiClient } from '@/lib/apiClient';
import type { MovieReviewDto, MovieReviewSearchDto } from './types/movie';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { formatDate } from '@/lib/utils';
import Toolbar from '@/shared/layout/Toolbar';

ModuleRegistry.registerModules([AllCommunityModule]);

const PAGE_SIZE = 10;

/**
 * MovieReviewPage 컴포넌트
 * 용도: 영화 감상평(Review) 데이터를 AG Grid의 Infinite Row Model을 사용하여 내장 페이징과 함께 표시함
 */
const MovieReviewPage = () => {
  const gridApiRef = useRef<GridApi | null>(null);
  const [searchParams, setSearchParams] = useState<MovieReviewSearchDto>({
    keyword: '',
  });

  const dataSource: IDatasource = useMemo(() => ({
    getRows: async (params: IGetRowsParams) => {
      try {
        const page = Math.floor(params.startRow / PAGE_SIZE) + 1;
        const response = await apiClient.get<any>('/movie/review', { 
          params: { ...searchParams, page, size: PAGE_SIZE } 
        });
        params.successCallback(response.dtoList, response.total);
      } catch (e) {
        console.error('Fetch error', e);
        params.failCallback();
      }
    }
  }), [searchParams]);

  const onGridReady = (params: GridReadyEvent) => {
    gridApiRef.current = params.api;
    params.api.setGridOption('datasource', dataSource);
  };

  const handleSearch = () => {
    gridApiRef.current?.setGridOption('datasource', dataSource);
  };

  const handleReset = () => {
    setSearchParams({ keyword: '' });
  };

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
          <div className="ag-theme-alpine w-full">
            <AgGridReact
              columnDefs={columnDefs}
              rowModelType="infinite"
              pagination={true}
              paginationPageSize={PAGE_SIZE}
              paginationPageSizeSelector={[10, 20, 50, 100]}
              cacheBlockSize={PAGE_SIZE}
              onGridReady={onGridReady}
              domLayout="autoHeight"
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default MovieReviewPage;
