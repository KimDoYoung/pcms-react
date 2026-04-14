import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * BadgeSelectPanel 컴포넌트
 * 용도: 옵션 목록을 badge 형태로 표시하여 선택하는 패널. single/multi 모드 지원.
 * 사용법:
 *   // single (default): 클릭 즉시 [value] 반환 후 패널 닫힘
 *   <BadgeSelectPanel options={opts} onSelect={(v) => console.log(v)} onClose={close} />
 *
 *   // multi: 확인 버튼으로 [value1, value2, ...] 반환 후 패널 닫힘
 *   <BadgeSelectPanel options={opts} multi onSelect={(v) => console.log(v)} onClose={close} />
 */

interface BadgeOption {
  label: string;
  value: string;
}

interface BadgeSelectPanelProps {
  options: BadgeOption[];
  multi?: boolean;
  onSelect: (values: string[]) => void;
  onClose: () => void;
  className?: string;
}

const BadgeSelectPanel = ({ options, multi = false, onSelect, onClose, className }: BadgeSelectPanelProps) => {
  const [selected, setSelected] = useState<string[]>([]);

  const handleClick = (value: string) => {
    if (!multi) {
      onSelect([value]);
      onClose();
      return;
    }
    setSelected((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
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
          'relative z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-48 max-w-xs',
          className
        )}
      >
        {/* 상단 X 버튼 */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* 뱃지 목록 */}
        <div className="flex flex-wrap gap-1.5 pr-5">
          {options.map((opt) => {
            const isSelected = selected.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleClick(opt.value)}
                className={cn(
                  'px-2.5 py-0.5 rounded-full text-sm border transition-colors cursor-pointer',
                  isSelected || (!multi)
                    ? 'border-primary text-primary hover:bg-primary hover:text-primary-foreground'
                    : 'border-gray-300 text-gray-600 hover:border-primary hover:text-primary',
                  isSelected && 'bg-primary/10'
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* multi 모드: 확인/취소 버튼 */}
        {multi && (
          <div className="flex justify-end gap-2 mt-3 pt-2 border-t border-gray-100">
            <Button size="sm" variant="outline" onClick={onClose}>취소</Button>
            <Button size="sm" onClick={handleConfirm}>확인</Button>
          </div>
        )}
      </div>
    </>
  );
};

export { BadgeSelectPanel, type BadgeOption };
