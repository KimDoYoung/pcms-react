import { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * CountrySelectPanel 컴포넌트
 * 용도: 국가 이모지 목록을 패널로 표시하여 선택하는 컴포넌트.
 *       hover 시 국가명 툴팁 표시. single/multi 모드 지원.
 * 사용법:
 *   // single (default): 클릭 즉시 선택 후 패널 닫힘
 *   <CountrySelectPanel onSelect={(c) => setNara(c[0])} onClose={close} />
 *
 *   // multi: 아래 선택 목록 표시 후 확인 버튼으로 닫힘
 *   <CountrySelectPanel multi onSelect={(c) => setNara(c.join(', '))} onClose={close} />
 */

interface Country {
  name: string;
  emoji: string | null;
  badge?: string;
}

const COUNTRIES: Country[] = [
  { name: '한국', emoji: '🇰🇷' },
  { name: '태국', emoji: '🇹🇭' },
  { name: '캐나다', emoji: '🇨🇦' },
  { name: '멕시코', emoji: '🇲🇽' },
  { name: '독일', emoji: '🇩🇪' },
  { name: '대만', emoji: '🇹🇼' },
  { name: '체코', emoji: '🇨🇿' },
  { name: '헝가리', emoji: '🇭🇺' },
  { name: '이탈리아', emoji: '🇮🇹' },
  { name: '인도', emoji: '🇮🇳' },
  { name: '홍콩', emoji: '🇭🇰' },
  { name: '네덜란드', emoji: '🇳🇱' },
  { name: '그리스', emoji: '🇬🇷' },
  { name: '영국', emoji: '🇬🇧' },
  { name: '소련', emoji: null, badge: 'СССР' },
  { name: '뉴질랜드', emoji: '🇳🇿' },
  { name: '이란', emoji: '🇮🇷' },
  { name: '프랑스', emoji: '🇫🇷' },
  { name: '스웨덴', emoji: '🇸🇪' },
  { name: '중국', emoji: '🇨🇳' },
  { name: '미국', emoji: '🇺🇸' },
  { name: '일본', emoji: '🇯🇵' },
  { name: '덴마크', emoji: '🇩🇰' },
  { name: '러시아', emoji: '🇷🇺' },
  { name: '스페인', emoji: '🇪🇸' },
];

interface CountrySelectPanelProps {
  multi?: boolean;
  onSelect: (countries: string[]) => void;
  onClose: () => void;
  className?: string;
}

const CountrySelectPanel = ({ multi = false, onSelect, onClose, className }: CountrySelectPanelProps) => {
  const [selected, setSelected] = useState<string[]>([]);

  const handleClick = (name: string) => {
    if (!multi) {
      onSelect([name]);
      onClose();
      return;
    }
    setSelected((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const handleConfirm = () => {
    onSelect(selected);
    onClose();
  };

  return (
    <>
      {/* 외부 클릭 오버레이 */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      <div
        className={cn(
          'relative z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-3 w-72',
          className
        )}
      >
        {/* 국가 이모지 그리드 */}
        <div className="flex flex-wrap gap-1">
          {COUNTRIES.map((country) => {
            const isSelected = selected.includes(country.name);
            return (
              <div key={country.name} className="relative group">
                <button
                  type="button"
                  onClick={() => handleClick(country.name)}
                  className={cn(
                    'w-9 h-9 flex items-center justify-center rounded cursor-pointer transition-colors hover:bg-gray-100',
                    isSelected && 'ring-2 ring-primary bg-primary/10'
                  )}
                >
                  {country.emoji ? (
                    <span className="text-2xl leading-none">{country.emoji}</span>
                  ) : (
                    <span className="text-[10px] font-bold text-red-700 bg-red-100 rounded px-0.5 leading-tight">
                      {country.badge}
                    </span>
                  )}
                </button>
                {/* hover 툴팁 */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-0.5 bg-gray-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  {country.name}
                </div>
              </div>
            );
          })}
        </div>

        {/* multi 모드: 선택 목록 + 확인 버튼 */}
        {multi && (
          <div className="mt-3 border-t border-gray-100 pt-2">
            <div className="min-h-6 text-sm text-gray-600 flex flex-wrap gap-1">
              {selected.length === 0 ? (
                <span className="text-gray-400 text-xs">선택된 국가 없음</span>
              ) : (
                selected.map((name) => (
                  <span
                    key={name}
                    className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full"
                  >
                    {name}
                    <button
                      type="button"
                      onClick={() => setSelected((prev) => prev.filter((n) => n !== name))}
                      className="hover:text-destructive leading-none"
                    >
                      ×
                    </button>
                  </span>
                ))
              )}
            </div>
            <div className="flex justify-end mt-2">
              <Button size="sm" onClick={handleConfirm}>확인</Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export { CountrySelectPanel };
