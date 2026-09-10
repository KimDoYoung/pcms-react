/**
 * DateRangePicker 컴포넌트
 *
 * 목적: 시작일 ~ 종료일을 선택하는 날짜 범위 입력 컴포넌트.
 *       자체 내장된 단일 날짜 선택 팝업과 아이콘 클릭 시 열리는 빠른 범위 선택 팝업(DateRangeSetter)을 제공한다.
 *       외부 DatePicker 컴포넌트에 의존하지 않고 자체 완결적으로 동작한다.
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
 * // 문자열 반환 (예: "yyyy-MM-dd" 또는 "yyyyMMdd")
 * <DateRangePicker
 *   returnFormat="yyyy-MM-dd"
 *   startDate={startStr}
 *   endDate={endStr}
 *   onChange={(s, e) => { setStart(s); setEnd(e) }}
 * />
 * ```
 *
 * props:
 *   - title?: 라벨 텍스트
 *   - layout?: "column" (기본: title 위 + picker 아래) | "row" (한 줄 배치)
 *   - disabled?: 비활성화 여부
 *   - className?: 추가 스타일 클래스
 *   - buttonSize?: 버튼 크기 ("default" | "sm" | "lg" | "icon")
 *   - returnFormat?: 문자열 반환 포맷 (미지정 시 Date 객체 반환)
 *   - startDate?: 시작일 (Date 또는 string)
 *   - endDate?: 종료일 (Date 또는 string)
 *   - onChange: 시작일/종료일 변경 콜백
 */
import * as React from "react"
import { format, parse, isValid } from "date-fns"
import { ko } from "date-fns/locale"
import { CalendarDays, CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Calendar } from "@/shared/components/ui/calendar"
import { DateRangeSetter } from "@/shared/components/DateRangeSetter"
import { Button, buttonVariants } from "@/shared/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/components/ui/popover"
import { type VariantProps } from "class-variance-authority"

type ButtonSize = VariantProps<typeof buttonVariants>["size"]

// ── 내부 단일 날짜 입력 버튼 ──────────────────────────────────
type DateInputBaseProps = {
  placeholder?: string
  disabled?: boolean
  className?: string
  buttonSize?: ButtonSize
}

type DateInputDateProps = DateInputBaseProps & {
  returnFormat?: undefined
  value?: Date
  onChange: (val: Date | undefined) => void
}

type DateInputStringProps = DateInputBaseProps & {
  returnFormat: string
  value?: string
  onChange: (val: string) => void
}

function DateInputButton(props: DateInputDateProps): React.JSX.Element
function DateInputButton(props: DateInputStringProps): React.JSX.Element
function DateInputButton({
  value,
  onChange,
  returnFormat,
  placeholder = "날짜 선택",
  disabled = false,
  className,
  buttonSize = "default",
}: DateInputDateProps | DateInputStringProps) {
  const [open, setOpen] = React.useState(false)

  const selectedDate: Date | undefined = React.useMemo(() => {
    if (!value) return undefined
    if (value instanceof Date) return value
    if (!returnFormat) return undefined
    const parsed = parse(value as string, returnFormat, new Date())
    return isValid(parsed) ? parsed : undefined
  }, [value, returnFormat])

  const handleSelect = (date: Date | undefined) => {
    if (returnFormat) {
      (onChange as (s: string) => void)?.(date ? format(date, returnFormat) : "")
    } else {
      (onChange as (d: Date | undefined) => void)?.(date)
    }
    setOpen(false)
  }

  const handleToday = () => {
    handleSelect(new Date())
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size={buttonSize}
          disabled={disabled}
          className={cn(
            returnFormat === "yyyyMMdd"
              ? "w-[120px]"
              : returnFormat === "yyyy-MM-dd"
                ? "w-[150px]"
                : "w-[200px]",
            "justify-start text-left font-normal",
            !selectedDate && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 size-4" />
          {selectedDate
            ? returnFormat
              ? format(selectedDate, returnFormat)
              : format(selectedDate, "yyyy년 MM월 dd일 (eee)", { locale: ko })
            : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          locale={ko}
          captionLayout="dropdown"
          footer={
            <div className="flex justify-end px-3 pb-3">
              <Button size="sm" variant="action" onClick={handleToday}>
                오늘
              </Button>
            </div>
          }
        />
      </PopoverContent>
    </Popover>
  )
}

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

  const commonProps = { disabled, buttonSize }

  const pickers = returnFormat ? (
    <>
      <DateInputButton
        returnFormat={returnFormat}
        value={startDate as string | undefined}
        onChange={(val) => (onChange as (s: string, e: string) => void)?.(val, endDate as string)}
        placeholder="시작일"
        {...commonProps}
      />
      <span className="text-muted-foreground select-none">~</span>
      <DateInputButton
        returnFormat={returnFormat}
        value={endDate as string | undefined}
        onChange={(val) => (onChange as (s: string, e: string) => void)?.(startDate as string, val)}
        placeholder="종료일"
        {...commonProps}
      />
      {quickPopover}
    </>
  ) : (
    <>
      <DateInputButton
        value={startDate as Date | undefined}
        onChange={(val) => (onChange as (s: Date | undefined, e: Date | undefined) => void)?.(val, endDate as Date | undefined)}
        placeholder="시작일"
        {...commonProps}
      />
      <span className="text-muted-foreground select-none">~</span>
      <DateInputButton
        value={endDate as Date | undefined}
        onChange={(val) => (onChange as (s: Date | undefined, e: Date | undefined) => void)?.(startDate as Date | undefined, val)}
        placeholder="종료일"
        {...commonProps}
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
