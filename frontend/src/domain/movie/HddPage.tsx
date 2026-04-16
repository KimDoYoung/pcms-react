import { useState, useMemo, useRef } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import type { ColDef, GridReadyEvent, IDatasource, IGetRowsParams, GridApi } from 'ag-grid-community';
import { apiClient } from '@/lib/apiClient';
import type { HddDto, HddSearchDto, PagedResponse } from './types/movie';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import Toolbar from '@/shared/layout/Toolbar';

ModuleRegistry.registerModules([AllCommunityModule]);

const PAGE_SIZE = 10;

/**
 * HddPage 컴포넌트
 * 용도: 하드디스크 내 파일 목록(HDD)을 AG Grid의 Infinite Row Model을 사용하여 내장 페이징과 함께 표시함
 */
const HddPage = () => {
  const gridApiRef = useRef<GridApi | null>(null);
  const [searchParams, setSearchParams] = useState<HddSearchDto>({
    keyword: '',
    volumnName: '',
  });

  const dataSource: IDatasource = useMemo(() => ({
    getRows: async (params: IGetRowsParams) => {
      try {
        const page = Math.floor(params.startRow / PAGE_SIZE) + 1;
        const response = await apiClient.get<PagedResponse<HddDto>>('/movie/hdd', {
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
    setSearchParams({ keyword: '', volumnName: '' });
  };

  const columnDefs = useMemo<ColDef<HddDto>[]>(() => [
    { field: 'id', headerName: 'ID', width: 80 },
    { field: 'volumnName', headerName: '볼륨명', width: 120 },
    { field: 'name', headerName: '이름', flex: 1, minWidth: 200 },
    { field: 'fileName', headerName: '파일명', flex: 1, minWidth: 200 },
    { field: 'extension', headerName: '확장자', width: 100 },
    { 
      field: 'size', 
      headerName: '크기(GB)', 
      width: 120,
      valueFormatter: (params) => params.value ? (params.value / (1024 * 1024 * 1024)).toFixed(2) : '0'
    },
    { field: 'path', headerName: '경로', flex: 1, minWidth: 300 },
    { field: 'lastModifiedYmd', headerName: '수정일', width: 120 },
  ], []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Toolbar />
      <main className="container mx-auto px-4 py-6">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">🎞️ 하드디스크 파일 목록</h1>
          </div>

          {/* 검색 영역 */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex gap-2 items-center">
            <Input
              placeholder="파일명, 이름 등 검색어 입력"
              value={searchParams.keyword}
              onChange={(e) => setSearchParams({ ...searchParams, keyword: e.target.value })}
              className="max-w-xs"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Input
              placeholder="볼륨명"
              value={searchParams.volumnName}
              onChange={(e) => setSearchParams({ ...searchParams, volumnName: e.target.value })}
              className="max-w-[120px]"
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

export default HddPage;
