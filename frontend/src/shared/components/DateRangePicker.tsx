/**
 * DateRangePicker 컴포넌트
 *
 * 목적: 시작일 ~ 종료일을 선택하는 날짜 범위 입력 컴포넌트.
 *       두 개의 DatePicker와 아이콘 클릭 시 열리는 빠른 범위 선택 팝업을 제공한다.
 *
 * 사용법:
 * ```tsx
 * // 2라인(기본): title 위, picker 아래
 * <DateRangePicker
 *   title="조회기간"
 *   startDate={start}
 *   endDate={end}
 *   onChange={(s, e) => { setStart(s); setEnd(e) }}
 * />
 *
 * // 1라인: title과 picker 같은 행
 * <DateRangePicker
 *   layout="row"
 *   title="조회기간"
 *   startDate={start}
 *   endDate={end}
 *   onChange={(s, e) => { setStart(s); setEnd(e) }}
 * />
 *
 * // 문자열 반환
 * <DateRangePicker
 *   returnFormat="yyyy-MM-dd"
 *   startDate={startStr}
 *   endDate={endStr}
 *   onChange={(s, e) => { setStart(s); setEnd(e) }}
 * />
 * ```
 */
import * as React from "react"
import { format } from "date-fns"
import { CalendarDays } from "lucide-react"

import { cn } from "@/lib/utils"
import { DatePicker } from "@/shared/components/DatePicker"
import { DateRangeSetter } from "@/shared/components/DateRangeSetter"
import { Button, buttonVariants } from "@/shared/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { type VariantProps } from "class-variance-authority"

type ButtonSize = VariantProps<typeof buttonVariants>["size"]

// ── 공통 props ─────────────────────────────────────────────
type DateRangePickerBaseProps = {
  title?: string
  layout?: "column" | "row"   // column(기본): title 위 + picker 아래 / row: 한 줄
  disabled?: boolean
  className?: string
  buttonSize?: ButtonSize
}

// returnFormat 미지정 → Date 기반
type DateRangePickerDateProps = DateRangePickerBaseProps & {
  returnFormat?: undefined
  startDate?: Date
  endDate?: Date
  onChange?: (start: Date | undefined, end: Date | undefined) => void
}

// returnFormat 지정 → 문자열 기반
type DateRangePickerStringProps = DateRangePickerBaseProps & {
  returnFormat: string
  startDate?: string
  endDate?: string
  onChange?: (start: string, end: string) => void
}

// ── 메인 컴포넌트 ──────────────────────────────────────────
export function DateRangePicker(props: DateRangePickerDateProps): React.JSX.Element
export function DateRangePicker(props: DateRangePickerStringProps): React.JSX.Element
export function DateRangePicker({
  title,
  layout = "column",
  disabled = false,
  className,
  buttonSize = "default",
  returnFormat,
  startDate,
  endDate,
  onChange,
}: DateRangePickerDateProps | DateRangePickerStringProps) {

  const [quickOpen, setQuickOpen] = React.useState(false)

  // quick select는 항상 Date를 주므로 여기서만 format 변환
  const handleQuickSelect = (start: Date, end: Date) => {
    if (returnFormat) {
      (onChange as (s: string, e: string) => void)?.(
        format(start, returnFormat),
        format(end, returnFormat)
      )
    } else {
      (onChange as (s: Date | undefined, e: Date | undefined) => void)?.(start, end)
    }
    setQuickOpen(false)
  }

  const quickPopover = (
    <Popover open={quickOpen} onOpenChange={setQuickOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" disabled={disabled} aria-label="빠른 날짜 범위 선택">
          <CalendarDays className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-3">
        <DateRangeSetter
          onRangeChange={handleQuickSelect}
          onClose={() => setQuickOpen(false)}
          className="w-full"
        />
      </PopoverContent>
    </Popover>
  )

  const pickers = (
    <>
      <DatePicker
        returnFormat={returnFormat as any}
        value={startDate as any}
        onChange={(val: any) => (onChange as any)?.(val, endDate)}
        placeholder="시작일"
        disabled={disabled}
        buttonSize={buttonSize}
      />
      <span className="text-muted-foreground select-none">~</span>
      <DatePicker
        returnFormat={returnFormat as any}
        value={endDate as any}
        onChange={(val: any) => (onChange as any)?.(startDate, val)}
        placeholder="종료일"
        disabled={disabled}
        buttonSize={buttonSize}
      />
      {quickPopover}
    </>
  )

  if (layout === "row") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {title && (
          <span className="text-sm font-medium text-foreground whitespace-nowrap">{title}</span>
        )}
        {pickers}
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {title && (
        <span className="text-sm font-medium text-foreground">{title}</span>
      )}
      <div className="flex items-center gap-2">
        {pickers}
      </div>
    </div>
  )
}
