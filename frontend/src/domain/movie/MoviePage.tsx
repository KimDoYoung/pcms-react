import { useState, useMemo, useRef } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { 
  AllCommunityModule, 
  ModuleRegistry, 
  ColDef, 
  GridReadyEvent, 
  IDatasource, 
  IGetRowsParams,
  GridApi
} from 'ag-grid-community';
import { apiClient } from '@/lib/apiClient';
import { MovieDto, MovieSearchDto } from './types/movie';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import Toolbar from '@/shared/components/Toolbar';

ModuleRegistry.registerModules([AllCommunityModule]);

const PAGE_SIZE = 10;

/**
 * MoviePage 컴포넌트
 * 용도: 영화 수집 데이터(DVD 등)를 AG Grid의 Infinite Row Model을 사용하여 내장 페이징과 함께 표시함
 */
const MoviePage = () => {
  const gridApiRef = useRef<GridApi | null>(null);
  const [searchParams, setSearchParams] = useState<MovieSearchDto>({
    keyword: '',
    gubun: '',
    gamdok: '',
    nara: '',
    category: '',
  });

  // AG Grid 데이터 소스 정의
  const dataSource: IDatasource = useMemo(() => ({
    getRows: async (params: IGetRowsParams) => {
      try {
        const page = Math.floor(params.startRow / PAGE_SIZE) + 1;
        const response = await apiClient.get<any>('/movie', { 
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
    setSearchParams({ keyword: '', gubun: '', gamdok: '', nara: '', category: '' });
  };

  const columnDefs = useMemo<ColDef<MovieDto>[]>(() => [
    { field: 'id', headerName: 'ID', width: 80 },
    { field: 'gubun', headerName: '구분', width: 80, valueFormatter: (params) => params.value === 'D' ? '드라마' : params.value === 'M' ? '영화' : params.value },
    { field: 'mid', headerName: '영화ID', width: 100 },
    { field: 'title1', headerName: '제목(한글)', flex: 1, minWidth: 200 },
    { field: 'title2', headerName: '제목(영어)', flex: 1, minWidth: 200 },
    { field: 'category', headerName: '분야', width: 120 },
    { field: 'gamdok', headerName: '감독', width: 150 },
    { field: 'makeYear', headerName: '제작년', width: 100 },
    { field: 'nara', headerName: '국적', width: 100 },
    { field: 'dvdId', headerName: 'DVD ID', width: 100 },
  ], []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Toolbar />
      <main className="container mx-auto px-4 py-6">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">📀 영화 수집 목록</h1>
          </div>

          {/* 검색 영역 */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-wrap gap-4 items-end">
            <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
              <label className="text-xs font-medium text-gray-500">검색어</label>
              <Input
                placeholder="제목 등 검색어 입력"
                value={searchParams.keyword}
                onChange={(e) => setSearchParams({ ...searchParams, keyword: e.target.value })}
                className="w-full"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500">구분</label>
              <Select 
                value={searchParams.gubun} 
                onValueChange={(v) => setSearchParams({ ...searchParams, gubun: v })}
              >
                <SelectTrigger className="w-24">
                  <SelectValue placeholder="전체" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">전체</SelectItem>
                  <SelectItem value="D">드라마</SelectItem>
                  <SelectItem value="M">영화</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500">감독</label>
              <Input
                placeholder="감독명"
                value={searchParams.gamdok}
                onChange={(e) => setSearchParams({ ...searchParams, gamdok: e.target.value })}
                className="w-32"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500">제작국가</label>
              <Input
                placeholder="국가"
                value={searchParams.nara}
                onChange={(e) => setSearchParams({ ...searchParams, nara: e.target.value })}
                className="w-24"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500">장르</label>
              <Input
                placeholder="장르"
                value={searchParams.category}
                onChange={(e) => setSearchParams({ ...searchParams, category: e.target.value })}
                className="w-24"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div className="flex gap-2 ml-auto">
              <Button onClick={handleSearch}>찾기</Button>
              <Button variant="outline" onClick={handleReset}>초기화</Button>
            </div>
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

export default MoviePage;
