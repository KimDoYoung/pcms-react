import React from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

interface GroupOption {
  label: string;
  value: string;
}

interface GroupRadioButtonProps {
  options: GroupOption[];
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

export const GroupRadioButton = ({
  options,
  defaultValue,
  onValueChange,
  className,
}: GroupRadioButtonProps) => {
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      defaultValue={defaultValue}
      onValueChange={(val) => {
        // 단일 선택 모드에서 선택 해제 방지 (항상 하나는 선택되어 있게 함)
        if (val && onValueChange) onValueChange(val);
      }}
      className={cn("justify-start w-fit border rounded-lg p-1 bg-background", className)}
    >
      {options.map((option) => (
        <ToggleGroupItem
          key={option.value}
          value={option.value}
          className={cn(
            "px-4 py-2 transition-all data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-sm",
            "hover:bg-muted"
          )}
        >
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
};