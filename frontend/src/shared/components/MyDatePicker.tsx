/**
 * MyDatePicker 컴포넌트
 *
 * 1. 목적(용도):
 *    - 키보드 숫자 입력 기반으로 날짜(YYYY-MM-DD)를 빠르고 직관적으로 입력할 수 있는 재사용 가능한 공통 날짜 입력 컴포넌트.
 *    - 입력된 숫자 자릿수에 맞춰 자동으로 하이픈(-)을 붙여 마스킹하며, 유효하지 않은 날짜인 경우 시각적(빨간색) 경고를 표시한다.
 *    - 우측 달력 아이콘 버튼을 통해 팝오버 달력에서 마우스로 날짜를 직접 선택할 수 있다.
 *    - 다양한 키보드 단축키(Delete: 전체 삭제, Home: 오늘 날짜, ←/→: 하루 전/후, PageUp/PageDown: 이전달/다음달)를 지원하여 빠른 날짜 조작이 가능하다.
 *
 * 2. 사용법:
 *    ```tsx
 *    // 기본 사용 (반환 포맷: 'yyyy-MM-dd')
 *    <MyDatePicker
 *      value={date}
 *      onChange={(val) => setDate(val)}
 *    />
 *
 *    // 'yyyyMMdd' 포맷으로 값 주고받기
 *    <MyDatePicker
 *      value={ymd}
 *      returnFormat="yyyyMMdd"
 *      onChange={(val) => setYmd(val)}
 *      placeholder="시작일"
 *    />
 *    ```
 *
 * 3. props:
 *    - value?: string - 날짜 문자열 ('yyyy-MM-dd' 또는 'yyyyMMdd')
 *    - onChange: (value: string) => void - 날짜 변경 콜백
 *    - returnFormat?: 'yyyy-MM-dd' | 'yyyyMMdd' - 부모에게 전달할 날짜 포맷 (기본값: 'yyyy-MM-dd')
 *    - placeholder?: string - 입력창 placeholder (기본값: 'YYYY-MM-DD')
 *    - disabled?: boolean - 비활성화 여부
 *    - className?: string - Input 요소에 추가할 Tailwind CSS 클래스
 *    - containerClassName?: string - 컴포넌트 루트 래퍼에 추가할 클래스
 *    - onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void - 커스텀 키다운 이벤트 핸들러
 *    - id?: string - input 요소 id
 *    - name?: string - input 요소 name
 */
import * as React from "react"
import { format, parse, isValid, addDays, subDays, addMonths, subMonths } from "date-fns"
import { ko } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Input } from "@/shared/components/ui/input"
import { Calendar } from "@/shared/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/components/ui/popover"

export interface MyDatePickerProps {
  value?: string
  onChange: (value: string) => void
  returnFormat?: "yyyy-MM-dd" | "yyyyMMdd"
  placeholder?: string
  disabled?: boolean
  className?: string
  containerClassName?: string
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
  id?: string
  name?: string
}

/** 숫자만 추출 (최대 8자리) */
function extractDigits(val: string): string {
  return val.replace(/\D/g, "").slice(0, 8)
}

/** 자릿수에 따라 YYYY, YYYY-MM, YYYY-MM-DD 형태로 변환 */
function formatDigitsToDateString(digits: string): string {
  if (!digits) return ""
  if (digits.length <= 4) return digits
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`
}

/**
 * 날짜 유효성 검사
 * - 6자리 이상 시 월(01~12) 검사
 * - 8자리 완성 시 실제 달력 일자 유효성 검사
 */
function validateDateDigits(digits: string): { isValid: boolean; date?: Date } {
  if (!digits) return { isValid: true }

  if (digits.length >= 6) {
    const month = parseInt(digits.slice(4, 6), 10)
    if (month < 1 || month > 12) return { isValid: false }
  }

  if (digits.length === 8) {
    const month = parseInt(digits.slice(4, 6), 10)
    const day = parseInt(digits.slice(6, 8), 10)
    if (month < 1 || month > 12 || day < 1 || day > 31) {
      return { isValid: false }
    }
    const parsed = parse(digits, "yyyyMMdd", new Date())
    if (!isValid(parsed) || format(parsed, "yyyyMMdd") !== digits) {
      return { isValid: false }
    }
    return { isValid: true, date: parsed }
  }

  // 1~5자리, 7자리 등 입력 중인 상태
  return { isValid: true }
}

export function MyDatePicker({
  value = "",
  onChange,
  returnFormat = "yyyy-MM-dd",
  placeholder = "YYYY-MM-DD",
  disabled = false,
  className,
  containerClassName,
  onKeyDown,
  id,
  name,
}: MyDatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState(() => {
    const digits = extractDigits(value)
    return formatDigitsToDateString(digits)
  })

  // 외부 value 동기화
  React.useEffect(() => {
    const digits = extractDigits(value ?? "")
    setInputValue(formatDigitsToDateString(digits))
  }, [value])

  const digits = extractDigits(inputValue)
  const validation = validateDateDigits(digits)
  const isInvalid = !validation.isValid
  const validDate = validation.date

  const emitDate = (date: Date | undefined) => {
    if (!date) {
      setInputValue("")
      onChange("")
      return
    }
    const displayStr = format(date, "yyyy-MM-dd")
    const emittedStr = returnFormat === "yyyyMMdd" ? format(date, "yyyyMMdd") : displayStr
    setInputValue(displayStr)
    onChange(emittedStr)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextDigits = extractDigits(e.target.value)
    const formatted = formatDigitsToDateString(nextDigits)
    setInputValue(formatted)

    if (!nextDigits) {
      onChange("")
      return
    }

    if (returnFormat === "yyyyMMdd") {
      onChange(nextDigits)
    } else {
      onChange(formatted)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) {
      onKeyDown?.(e)
      return
    }

    // 1. Delete 키: 모든 숫자 지움
    if (e.key === "Delete") {
      e.preventDefault()
      emitDate(undefined)
      return
    }

    // 2. Home 키: 오늘의 날짜로 세팅
    if (e.key === "Home") {
      e.preventDefault()
      emitDate(new Date())
      return
    }

    // 3. 방향키 및 PgUp/PgDn 단축키 (Modifier 키 없는 경우)
    if (!e.ctrlKey && !e.altKey && !e.metaKey && !e.shiftKey) {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "PageUp" || e.key === "PageDown") {
        e.preventDefault()
        const baseDate = validDate ?? new Date()
        let nextDate: Date

        if (e.key === "ArrowLeft") {
          nextDate = subDays(baseDate, 1)
        } else if (e.key === "ArrowRight") {
          nextDate = addDays(baseDate, 1)
        } else if (e.key === "PageUp") {
          nextDate = subMonths(baseDate, 1)
        } else {
          nextDate = addMonths(baseDate, 1)
        }

        emitDate(nextDate)
        return
      }
    }

    onKeyDown?.(e)
  }

  const handleCalendarSelect = (selected: Date | undefined) => {
    emitDate(selected)
    setOpen(false)
  }

  return (
    <div className={cn("relative inline-flex items-center", containerClassName)}>
      <Input
        id={id}
        name={name}
        type="text"
        inputMode="numeric"
        disabled={disabled}
        placeholder={placeholder}
        value={inputValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className={cn(
          "font-mono pr-8 text-sm",
          isInvalid && "border-destructive text-destructive focus-visible:ring-destructive",
          className
        )}
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            tabIndex={-1}
            aria-label="달력 열기"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors"
          >
            <CalendarIcon className="size-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="single"
            selected={validDate}
            onSelect={handleCalendarSelect}
            locale={ko}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
