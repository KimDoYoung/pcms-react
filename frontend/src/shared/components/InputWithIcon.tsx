import { LucideIcon, Search } from 'lucide-react';
import { Input } from '@/shared/components/ui/input';
import { cn } from '@/lib/utils';

/**
 * InputWithIcon 컴포넌트
 * 용도: 오른쪽에 아이콘이 내장된 Input. 아이콘 클릭 또는 Enter 키로 이벤트를 발생시킨다.
 * 사용법:
 *   <InputWithIcon value={keyword} onChange={setKeyword} onIconClick={handleSearch} />
 *   <InputWithIcon value={keyword} onChange={setKeyword} onIconClick={handleSearch} icon={Filter} />
 */

interface InputWithIconProps {
  value: string;
  onChange: (value: string) => void;
  onIconClick?: () => void;
  icon?: LucideIcon;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const InputWithIcon = ({
  value,
  onChange,
  onIconClick,
  icon: Icon = Search,
  placeholder,
  className,
  disabled,
}: InputWithIconProps) => {
  const iconEl = <Icon className="w-4 h-4" />;

  return (
    <div className="relative">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onIconClick?.()}
        className={cn('pr-9', className)}
        placeholder={placeholder}
        disabled={disabled}
      />
      {onIconClick ? (
        <button
          type="button"
          onClick={onIconClick}
          disabled={disabled}
          tabIndex={-1}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:opacity-50"
        >
          {iconEl}
        </button>
      ) : (
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
          {iconEl}
        </span>
      )}
    </div>
  );
};

export { InputWithIcon };
