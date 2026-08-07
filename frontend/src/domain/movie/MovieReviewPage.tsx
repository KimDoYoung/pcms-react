import { useState, useMemo, useRef, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import type { ColDef, GridReadyEvent, IDatasource, IGetRowsParams, GridApi, ICellRendererParams } from 'ag-grid-community';
import { useNavigate } from 'react-router-dom';
import { Globe, X } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import type { MovieReviewDto, MovieReviewSearchDto, PagedResponse } from './types/movie';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { formatDate } from '@/lib/utils';
import { useMessage } from '@/shared/hooks/useMessage';
import Toolbar from '@/shared/layout/Toolbar';
import StarRating from '@/shared/components/StarRating';
import StarRatingInput from '@/shared/components/StarRatingInput';
import { CountrySelectPanel } from '@/shared/components/CountrySelectPanel';
import { COUNTRY_EMOJI_MAP } from '@/shared/data/countries';

ModuleRegistry.registerModules([AllCommunityModule]);

const PAGE_SIZE = 10;

/**
 * MovieReviewPage 컴포넌트
 * 용도: 영화 감상평(Review) 데이터를 AG Grid의 Infinite Row Model을 사용하여 내장 페이징과 함께 표시함
 */
const MovieReviewPage = () => {
  const navigate = useNavigate();
  const { showMessage } = useMessage();
  const gridApiRef = useRef<GridApi | null>(null);
  const [showCountryPanel, setShowCountryPanel] = useState(false);
  const [searchParams, setSearchParams] = useState<MovieReviewSearchDto>({
    keyword: '',
    minLvl: undefined,
    nara: '',
    year: '',
  });

  const dataSource: IDatasource = useMemo(() => ({
    getRows: async (params: IGetRowsParams) => {
      try {
        const page = Math.floor(params.startRow / PAGE_SIZE) + 1;
        const response = await apiClient.get<PagedResponse<MovieReviewDto>>('/movie/review', {
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
    setSearchParams({ keyword: '', minLvl: undefined, nara: '', year: '' });
  };

  const buildViewQuery = useCallback(() => {
    const qs = new URLSearchParams();
    if (searchParams.keyword) qs.set('keyword', searchParams.keyword);
    if (searchParams.minLvl) qs.set('minLvl', String(searchParams.minLvl));
    if (searchParams.nara) qs.set('nara', searchParams.nara);
    if (searchParams.year) qs.set('year', searchParams.year);
    const s = qs.toString();
    return s ? `?${s}` : '';
  }, [searchParams]);

  const handleDelete = useCallback(async (id: number) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    try {
      await apiClient.delete(`/movie/review/${id}`);
      showMessage('삭제되었습니다.', 'success');
      gridApiRef.current?.setGridOption('datasource', dataSource);
    } catch (e) {
      console.error('Delete error', e);
      showMessage('삭제 중 오류가 발생했습니다.', 'error');
    }
  }, [showMessage, dataSource]);

  const columnDefs = useMemo<ColDef<MovieReviewDto>[]>(() => [
    { field: 'id', headerName: 'ID', width: 80 },
    { 
      field: 'title', 
      headerName: '제목', 
      flex: 1, 
      minWidth: 150,
      cellRenderer: (params: ICellRendererParams<MovieReviewDto>) => (
        <span
          className="text-blue-600 hover:underline cursor-pointer font-medium"
          onClick={() => navigate(`/movie/review/${params.data?.id}/view${buildViewQuery()}`)}
        >
          {params.value}
        </span>
      )
    },
    {
      field: 'lvl',
      headerName: '평점',
      width: 110,
      cellRenderer: (params: ICellRendererParams<MovieReviewDto>) => (
        <div className="flex h-full items-center">
          <StarRating value={params.value ?? 0} max={5} size="sm" />
        </div>
      )
    },
    { field: 'nara', headerName: '국가', width: 70,
      cellRenderer: (params: ICellRendererParams<MovieReviewDto>) => (
        <span title={params.value}>
          {COUNTRY_EMOJI_MAP.get(params.value) ?? params.value}
        </span>
      )
    },
    { field: 'year', headerName: '제작년도', width: 100 },

    {
      field: 'ymd',
      headerName: '감상일자',
      width: 150,
      valueFormatter: (params) => params.value ? formatDate(params.value) : ''
    },
    {
      headerName: '조작',
      width: 150,
      cellRenderer: (params: ICellRendererParams<MovieReviewDto>) => (
        <div className="flex gap-1 h-full items-center">
          <Button
            size="sm"
            variant="action"
            className="h-7"
            onClick={() => navigate(`/movie/review/${params.data?.id}/edit`)}
          >
            수정
          </Button>
          <Button
            size="sm"
            variant="delete"
            className="h-7"
            onClick={() => params.data?.id !== undefined && handleDelete(params.data.id)}
          >
            삭제
          </Button>
        </div>
      )
    }
  ], [navigate, handleDelete, buildViewQuery]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Toolbar />
      <main className="container mx-auto px-4 py-6">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">🎬 영화 감상평 관리</h1>
            <Button variant="action" size="pill" onClick={() => navigate('/movie/review/register')}>신규 등록</Button>
          </div>

          {/* 검색 영역 */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-wrap gap-2 items-center">
            <Input
              placeholder="제목, 내용 등 검색어 입력"
              value={searchParams.keyword}
              onChange={(e) => setSearchParams({ ...searchParams, keyword: e.target.value })}
              className="max-w-xs"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-400">평점(이상)</span>
              <StarRatingInput
                value={searchParams.minLvl ?? 0}
                onChange={(v) => setSearchParams({ ...searchParams, minLvl: v })}
                size="sm"
              />
              {!!searchParams.minLvl && (
                <button
                  type="button"
                  onClick={() => setSearchParams({ ...searchParams, minLvl: undefined })}
                  className="text-gray-300 hover:text-gray-500"
                  title="평점 조건 해제"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="relative flex gap-1">
              <Input
                placeholder="국가"
                value={searchParams.nara}
                onChange={(e) => setSearchParams({ ...searchParams, nara: e.target.value })}
                className="w-24"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setShowCountryPanel(!showCountryPanel)}
                title="국가 선택"
              >
                <Globe className="w-4 h-4" />
              </Button>
              {showCountryPanel && (
                <div className="absolute left-0 top-11 z-50">
                  <CountrySelectPanel
                    onSelect={(names) => {
                      setSearchParams({ ...searchParams, nara: names.join(', ') });
                      setShowCountryPanel(false);
                    }}
                    onClose={() => setShowCountryPanel(false)}
                  />
                </div>
              )}
            </div>
            <Input
              placeholder="제작년도(YYYY)"
              value={searchParams.year}
              onChange={(e) => setSearchParams({ ...searchParams, year: e.target.value.replace(/\D/g, '').slice(0, 4) })}
              maxLength={4}
              className="w-32"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button variant="action" size="pill" onClick={handleSearch}>찾기</Button>
            <Button variant="init" size="pill" onClick={handleReset}>초기화</Button>
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
