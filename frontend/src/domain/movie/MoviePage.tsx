import { useState, useMemo, useRef, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import {
  AllCommunityModule,
  ModuleRegistry,
  ColDef,
  GridReadyEvent,
  IDatasource,
  IGetRowsParams,
  GridApi,
  CellValueChangedEvent,
  RowStyle,
} from 'ag-grid-community';
import { apiClient } from '@/lib/apiClient';
import { MovieDto, MovieSearchDto } from './types/movie';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { GroupRadioButton } from '@/shared/components/GroupRadioButton';
import { InputWithIcon } from '@/shared/components/InputWithIcon';
import { CountrySelectPanel } from '@/shared/components/CountrySelectPanel';
import { BadgeSelectPanel } from '@/shared/components/BadgeSelectPanel';
import Toolbar from '@/shared/components/Toolbar';

ModuleRegistry.registerModules([AllCommunityModule]);

const PAGE_SIZE = 10;

/**
 * MoviePage 컴포넌트
 * 용도: 영화 수집 데이터(DVD 등)를 AG Grid의 Infinite Row Model을 사용하여 내장 페이징과 함께 표시함
 */
const MoviePage = () => {
  const gridApiRef = useRef<GridApi | null>(null);
  const changedRowsRef = useRef<Map<number, MovieDto>>(new Map());
  const [changedCount, setChangedCount] = useState(0);
  const [showCountryPanel, setShowCountryPanel] = useState(false);
  const [showGenrePanel, setShowGenrePanel] = useState(false);

  const GENRE_OPTIONS = [
    { label: '액션', value: '액션' },
    { label: '드라마', value: '드라마' },
    { label: '코미디', value: '코미디' },
    { label: '스릴러', value: '스릴러' },
    { label: '범죄', value: '범죄' },
    { label: 'SF', value: 'SF' },
    { label: '로맨스', value: '로맨스' },
    { label: '공포', value: '공포' },
    { label: '판타지', value: '판타지' },
    { label: '모험', value: '모험' },
    { label: '미스터리', value: '미스터리' },
    { label: '전쟁', value: '전쟁' },
    { label: '애니메이션', value: '애니메이션' },
    { label: '다큐멘터리', value: '다큐멘터리' },
    { label: '뮤지컬', value: '뮤지컬' },
    { label: '가족', value: '가족' },
    { label: '역사', value: '역사' },
    { label: '서부', value: '서부' },
    { label: '스포츠', value: '스포츠' },
    { label: '에로', value: '에로' },
  ];
  const [searchParams, setSearchParams] = useState<MovieSearchDto>({
    keyword: '',
    gubun: 'ALL',
    gamdok: '',
    nara: '',
    category: '',
  });
  // dataSource가 항상 최신 searchParams를 참조하도록 ref로 관리
  const searchParamsRef = useRef(searchParams);
  searchParamsRef.current = searchParams;

  // 한 번만 생성되며 searchParamsRef를 통해 항상 최신 값을 읽음
  const dataSource: IDatasource = useMemo(() => ({
    getRows: async (params: IGetRowsParams) => {
      try {
        const sp = searchParamsRef.current;
        const page = Math.floor(params.startRow / PAGE_SIZE) + 1;
        const response = await apiClient.get<any>('/movie', {
          params: { ...sp, gubun: sp.gubun === 'ALL' ? '' : sp.gubun, page, size: PAGE_SIZE }
        });
        params.successCallback(response.dtoList, response.total);
      } catch (e) {
        console.error('Fetch error', e);
        params.failCallback();
      }
    }
  }), []);

  const onGridReady = (params: GridReadyEvent) => {
    gridApiRef.current = params.api;
    params.api.setGridOption('datasource', dataSource);
  };

  const handleSearch = () => {
    gridApiRef.current?.setGridOption('datasource', dataSource);
  };

  const handleReset = () => {
    const reset = { keyword: '', gubun: 'ALL', gamdok: '', nara: '', category: '' };
    searchParamsRef.current = reset;
    setSearchParams(reset);
    gridApiRef.current?.setGridOption('datasource', dataSource);
  };

  const onCellValueChanged = useCallback((params: CellValueChangedEvent<MovieDto>) => {
    changedRowsRef.current.set(params.data.id, { ...params.data });
    setChangedCount(changedRowsRef.current.size);
    params.api.redrawRows({ rowNodes: [params.node] });
  }, []);

  const getRowStyle = useCallback((params: { data?: MovieDto }): RowStyle | undefined => {
    if (params.data && changedRowsRef.current.has(params.data.id)) {
      return { backgroundColor: '#fef9c3' };
    }
  }, []);

  const handleSave = async () => {
    const rows = Array.from(changedRowsRef.current.values());
    if (rows.length === 0) return;
    try {
      await apiClient.put('/movie/batch/update', rows);
      changedRowsRef.current.clear();
      setChangedCount(0);
      gridApiRef.current?.redrawRows();
    } catch (e) {
      console.error('Save error', e);
    }
  };

  const columnDefs = useMemo<ColDef<MovieDto>[]>(() => [
    { field: 'id', headerName: 'ID', width: 80 },
    { field: 'gubun', headerName: '구분', editable: true, width: 80, valueFormatter: (params) => params.value === 'D' ? '드라마' : params.value === 'M' ? '영화' : params.value },
    { field: 'mid', headerName: '영화ID', editable: true, width: 100 },
    { field: 'title1', headerName: '제목(한글)', editable: true, flex: 1, minWidth: 200 },
    { field: 'title2', headerName: '제목(영어)', editable: true, flex: 1, minWidth: 200 },
    { field: 'category', headerName: '분야', editable: true, width: 120 },
    { field: 'gamdok', headerName: '감독', editable: true, width: 150 },
    { field: 'makeYear', headerName: '제작년', editable: true, width: 100 },
    { field: 'nara', headerName: '국적', editable: true, width: 100 },
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
              <GroupRadioButton
                options={[
                  { label: '전체', value: 'ALL' },
                  { label: '드라마', value: 'D' },
                  { label: '영화', value: 'M' },
                ]}
                value={searchParams.gubun}
                onValueChange={(v) => setSearchParams({ ...searchParams, gubun: v })}
              />
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
            <div className="flex flex-col gap-1.5 relative">
              <label className="text-xs font-medium text-gray-500">제작국가</label>
              <InputWithIcon
                placeholder="국가"
                value={searchParams.nara}
                onChange={(nara) => setSearchParams({ ...searchParams, nara })}
                onIconClick={() => setShowCountryPanel((v) => !v)}
                className="w-24"
              />
              {showCountryPanel && (
                <div className="absolute top-full left-0 mt-1">
                  <CountrySelectPanel
                    onSelect={(countries) => setSearchParams({ ...searchParams, nara: countries[0] ?? '' })}
                    onClose={() => setShowCountryPanel(false)}
                  />
                </div>
              )}
            </div>
            <div className="flex flex-col gap-1.5 relative">
              <label className="text-xs font-medium text-gray-500">장르</label>
              <InputWithIcon
                placeholder="장르"
                value={searchParams.category}
                onChange={(category) => setSearchParams({ ...searchParams, category })}
                onIconClick={() => setShowGenrePanel((v) => !v)}
                className="w-24"
              />
              {showGenrePanel && (
                <div className="absolute top-full left-0 mt-1">
                  <BadgeSelectPanel
                    options={GENRE_OPTIONS}
                    onSelect={(values) => {
                      setSearchParams({ ...searchParams, category: values[0] ?? '' });
                      handleSearch();
                    }}
                    onClose={() => setShowGenrePanel(false)}
                  />
                </div>
              )}
            </div>
            <div className="flex gap-2 ml-auto">
              <Button onClick={handleSearch}>찾기</Button>
              <Button variant="outline" onClick={handleReset}>초기화</Button>
              <Button
                variant="default"
                onClick={handleSave}
                disabled={changedCount === 0}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-40"
              >
                저장{changedCount > 0 ? ` (${changedCount}건)` : ''}
              </Button>
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
              onCellValueChanged={onCellValueChanged}
              getRowStyle={getRowStyle}
              domLayout="autoHeight"
              singleClickEdit={false}
              stopEditingWhenCellsLoseFocus={true}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default MoviePage;
