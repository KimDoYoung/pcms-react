import { ToggleGroup, ToggleGroupItem } from "@/shared/components/ui/toggle-group";
import { cn } from "@/lib/utils";

/**
 * 라디오 버튼 형태의 단일 선택 토글 그룹 컴포넌트.
 * 항상 하나의 항목이 선택된 상태를 유지하며, 선택 해제가 불가능하다.
 *
 * @example
 * const options = [
 *   { label: "전체", value: "all" },
 *   { label: "공개", value: "public" },
 *   { label: "비공개", value: "private" },
 * ];
 *
 * <GroupRadioButton
 *   options={options}
 *   defaultValue="all"
 *   onValueChange={(val) => console.log(val)}
 * />
 */

interface GroupOption {
  label: string;
  value: string;
}

interface GroupRadioButtonProps {
  options: GroupOption[];
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

export const GroupRadioButton = ({
  options,
  defaultValue,
  value,
  onValueChange,
  className,
}: GroupRadioButtonProps) => {
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      spacing={0}
      defaultValue={defaultValue}
      value={value}
      onValueChange={(val) => {
        // 단일 선택 모드에서 선택 해제 방지: options에 없는 값(빈 문자열 등)은 무시
        if (onValueChange && options.some((opt) => opt.value === val)) onValueChange(val);
      }}
      className={cn("justify-start w-fit", className)}
    >
      {options.map((option) => (
        <ToggleGroupItem
          key={option.value}
          value={option.value}
          className={cn(
            "px-4 transition-all data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-sm",
          )}
        >
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
};