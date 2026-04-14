import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry, ColDef } from 'ag-grid-community';
import { apiClient } from '@/lib/apiClient';
import { HddDto, HddSearchDto } from './types/movie';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import Toolbar from '@/shared/components/Toolbar';

ModuleRegistry.registerModules([AllCommunityModule]);

/**
 * HddPage 컴포넌트
 * 용도: 하드디스크 내 파일 목록(HDD)을 AG Grid를 사용하여 목록으로 표시하고 검색 기능을 제공함
 */
const HddPage = () => {
  const [searchParams, setSearchParams] = useState<HddSearchDto>({
    page: 1,
    size: 100,
    keyword: '',
    volumnName: '',
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['hdds', searchParams],
    queryFn: async () => {
      return await apiClient.get('/movie/hdd', { params: searchParams });
    },
  });

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

  const handleSearch = () => {
    refetch();
  };

  const handleReset = () => {
    setSearchParams({ page: 1, size: 100, keyword: '', volumnName: '' });
  };

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

export default HddPage;
