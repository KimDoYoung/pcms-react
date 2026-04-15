import { useState } from 'react'
import { cn } from '@/lib/utils'

/**
 * 목적:
 * 사용자가 별(★)을 클릭하거나 드래그(호버)하여 점수를 입력할 수 있는 대화형 컴포넌트입니다.
 *
 * 사용법:
 * - value: 현재 선택된 점수
 * - onChange: 점수가 변경될 때 호출되는 콜백 함수
 * - max: 전체 별 개수 (기본값: 5)
 * - size: 별 크기 ('sm' | 'md' | 'lg', 기본값: 'md')
 * - disabled: true면 읽기 전용으로 동작
 *
 * 예시:
 * <StarRatingInput value={rating} onChange={setRating} max={5} size="lg" />
 */

interface StarRatingInputProps {
  value: number
  onChange: (value: number) => void
  max?: number
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  className?: string
}

export default function StarRatingInput({
  value,
  onChange,
  max = 5,
  size = 'md',
  disabled = false,
  className,
}: StarRatingInputProps) {
  // 마우스 호버 중인 별의 인덱스 (1부터 시작)
  const [hoverValue, setHoverValue] = useState<number | null>(null)

  const sizeClass = 
    size === 'sm' ? 'text-lg' : 
    size === 'lg' ? 'text-3xl' : 
    'text-2xl'

  const activeValue = hoverValue ?? value

  return (
    <div
      className={cn(
        'inline-flex gap-1 select-none',
        !disabled && 'cursor-pointer',
        className
      )}
      onMouseLeave={() => !disabled && setHoverValue(null)}
    >
      {Array.from({ length: max }, (_, i) => {
        const starValue = i + 1
        const isFilled = starValue <= activeValue

        return (
          <span
            key={i}
            className={cn(
              sizeClass,
              'transition-all duration-150 transform',
              isFilled ? 'text-amber-400' : 'text-gray-300',
              !disabled && 'hover:scale-125 active:scale-95',
              !disabled && starValue <= (hoverValue ?? 0) && 'brightness-110'
            )}
            onMouseEnter={() => !disabled && setHoverValue(starValue)}
            onClick={() => !disabled && onChange(starValue)}
          >
            ★
          </span>
        )
      })}
    </div>
  )
}
