/**
 * DatePicker 컴포넌트
 *
 * 목적: shadcn Calendar + Popover를 조합한 한국어 날짜 선택 컴포넌트.
 *       "오늘" 버튼으로 빠르게 오늘 날짜를 선택할 수 있다.
 *       returnFormat prop으로 onChange의 반환 타입을 Date 또는 문자열로 선택할 수 있다.
 *
 * 사용법:
 * ```tsx
 * // Date 반환 (기본)
 * const [date, setDate] = useState<Date>()
 * <DatePicker value={date} onChange={setDate} />
 *
 * // "yyyy-MM-dd" 문자열 반환
 * const [dateStr, setDateStr] = useState<string>()
 * <DatePicker returnFormat="yyyy-MM-dd" value={dateStr} onChange={setDateStr} />
 *
 * // "yyyyMMdd" 문자열 반환 (API 전송용)
 * const [ymd, setYmd] = useState<string>()
 * <DatePicker returnFormat="yyyyMMdd" value={ymd} onChange={setYmd} />
 *
 * // 기타 옵션
 * <DatePicker value={date} onChange={setDate} placeholder="출발일을 선택하세요" />
 * <DatePicker value={date} onChange={setDate} disabled />
 * ```
 */
import * as React from "react"
import { format, parse, isValid } from "date-fns"
import { ko } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button, buttonVariants } from "@/shared/components/ui/button"
import { type VariantProps } from "class-variance-authority"

type ButtonSize = VariantProps<typeof buttonVariants>["size"]

type DatePickerBaseProps = {
  placeholder?: string
  disabled?: boolean
  className?: string
  buttonSize?: ButtonSize
}

// returnFormat 미지정 → Date 기반
type DatePickerDateProps = DatePickerBaseProps & {
  returnFormat?: undefined
  value?: Date
  onChange?: (date: Date | undefined) => void
}

// returnFormat 지정 → 문자열 기반 (예: "yyyy-MM-dd", "yyyyMMdd")
type DatePickerStringProps = DatePickerBaseProps & {
  returnFormat: string
  value?: string
  onChange?: (dateStr: string) => void
}

type DatePickerProps = DatePickerDateProps | DatePickerStringProps

export function DatePicker({
  value,
  onChange,
  placeholder = "날짜를 선택하세요",
  disabled = false,
  className,
  buttonSize = "default",
  ...rest
}: DatePickerProps) {
  const returnFormat = (rest as DatePickerStringProps).returnFormat

  // 내부 선택값은 항상 Date로 관리
  const selectedDate: Date | undefined = React.useMemo(() => {
    if (!value) return undefined
    if (value instanceof Date) return value
    const parsed = parse(value, returnFormat, new Date())
    return isValid(parsed) ? parsed : undefined
  }, [value, returnFormat])

  const [open, setOpen] = React.useState(false)

  const handleSelect = (date: Date | undefined) => {
    if (returnFormat) {
      ;(onChange as DatePickerStringProps["onChange"])?.(
        date ? format(date, returnFormat) : ""
      )
    } else {
      ;(onChange as DatePickerDateProps["onChange"])?.(date)
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
            "w-[240px] justify-start text-left font-normal",
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
