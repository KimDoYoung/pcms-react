import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, RefreshCw } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import Toolbar from '@/shared/layout/Toolbar';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import HddTree, { type HddSelectedNode } from '@/domain/movie/components/HddTree';
import HddFileList from '@/domain/movie/components/HddFileList';
import HddSearchResults from '@/domain/movie/components/HddSearchResults';

/**
 * HddPage 컴포넌트
 * 용도: 하드디스크(볼륨)에 수집한 영화 파일을 폴더 트리 + 파일 목록 형태로 탐색.
 *      좌측 트리와 우측 파일 목록 사이에 드래그로 너비 조절 가능한 스플리터를 둔다.
 */
const HddPage = () => {
  const [selected, setSelected] = useState<HddSelectedNode | null>(null);
  const [keyword, setKeyword] = useState('');
  const [activeKeyword, setActiveKeyword] = useState('');
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const containerRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);

  const { data: volumes } = useQuery<string[]>({
    queryKey: ['hdd-volumes'],
    queryFn: () => apiClient.get<string[]>('/movie/hdd/volumes'),
    staleTime: 5 * 60 * 1000,
  });

  const startResizing = useCallback(() => {
    isResizing.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  const stopResizing = useCallback(() => {
    isResizing.current = false;
    document.body.style.cursor = 'default';
    document.body.style.userSelect = 'auto';
  }, []);

  const resize = useCallback((e: MouseEvent) => {
    if (!isResizing.current || !containerRef.current) return;
    const left = containerRef.current.getBoundingClientRect().left;
    const w = e.clientX - left;
    if (w > 160 && w < 600) setSidebarWidth(w);
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [resize, stopResizing]);

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <Toolbar />
      <main className="flex-1 flex flex-col overflow-hidden px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4 flex-shrink-0">🎞️ 하드디스크 파일 탐색기</h1>
        <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 flex gap-2 items-center mb-4 flex-shrink-0">
          <Input
            placeholder="파일 이름으로 찾기 (전체 볼륨 대상)"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && setActiveKeyword(keyword)}
            className="max-w-sm"
          />
          <Button onClick={() => setActiveKeyword(keyword)} variant="navy"><Search />찾기</Button>
          <Button variant="outline" onClick={() => { setKeyword(''); setActiveKeyword(''); }}><RefreshCw />초기화</Button>
        </div>
        <div ref={containerRef} className="flex-1 flex bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          {activeKeyword ? (
            <HddSearchResults key={activeKeyword} keyword={activeKeyword} />
          ) : (
            <>
              <aside style={{ width: `${sidebarWidth}px` }} className="border-r border-gray-100 overflow-y-auto flex-shrink-0">
                <HddTree volumes={volumes ?? []} selected={selected} onSelect={setSelected} />
              </aside>
              <div
                className="w-1 hover:w-1.5 hover:bg-blue-300 bg-transparent transition-all cursor-col-resize flex-shrink-0 z-10 active:bg-blue-500 active:w-1.5"
                onMouseDown={startResizing}
              />
              <HddFileList selected={selected} />
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default HddPage;
