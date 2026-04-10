import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface DiaryDto {
  id: number
  ymd: string
  summary: string | null
}

interface PageResponse {
  dtoList: DiaryDto[]
}

const DAY_KO = ['일', '월', '화', '수', '목', '금', '토']

// 표시용: yyyy-mm-dd
function formatDisplay(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// API/DB용: yyyymmdd
function formatYmd(date: Date): string {
  return formatDisplay(date).replace(/-/g, '')
}

function buildRange(weekOffset: number): { startYmd: string; endYmd: string; days: Date[] } {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const end = new Date(today)
  end.setDate(today.getDate() + weekOffset * 14)

  const start = new Date(end)
  start.setDate(end.getDate() - 13)

  const days: Date[] = []
  const cur = new Date(start)
  while (cur <= end) {
    days.push(new Date(cur))
    cur.setDate(cur.getDate() + 1)
  }

  return { startYmd: formatYmd(start), endYmd: formatYmd(end), days }
}

interface Props {
  onSelect?: (ymd: string, id?: number) => void
}

export default function DiarySummaryList({ onSelect }: Props) {
  const [weekOffset, setWeekOffset] = useState(0)

  const { startYmd, endYmd, days } = buildRange(weekOffset)

  const { data, isLoading } = useQuery<PageResponse>({
    queryKey: ['diary-summary', startYmd, endYmd],
    queryFn: () =>
      apiClient.get<PageResponse>('/diary', {
        params: { startYmd, endYmd, size: 14, page: 1 },
      }),
  })

  const entryMap = new Map<string, DiaryDto>()
  data?.dtoList?.forEach((d) => entryMap.set(d.ymd, d))

  return (
    <div className="flex flex-col gap-1">
      <div className="text-xs text-muted-foreground mb-1 px-1">
        {startYmd.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')} ~ {endYmd.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')}
      </div>

      <ul className="flex flex-col">
        {days.map((day) => {
          const ymd = formatYmd(day)          // yyyymmdd (API/map key)
          const display = formatDisplay(day)  // yyyy-mm-dd (화면 표시)
          const entry = entryMap.get(ymd)
          const dayName = DAY_KO[day.getDay()]
          const isSun = day.getDay() === 0
          const isSat = day.getDay() === 6

          return (
            <li
              key={ymd}
              onClick={() => onSelect?.(display, entry?.id)}
              className={[
                'flex items-baseline gap-2 px-2 py-1 rounded text-sm cursor-pointer',
                'hover:bg-accent transition-colors',
                !entry && 'text-muted-foreground',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <span
                className={[
                  'shrink-0 font-mono text-xs w-[120px]',
                  isSun && 'text-red-500',
                  isSat && 'text-blue-500',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {display} ({dayName})
              </span>
              <span className="truncate text-xs">
                {entry?.summary ?? ''}
              </span>
            </li>
          )
        })}
      </ul>

      {isLoading && (
        <p className="text-xs text-muted-foreground text-center py-2">불러오는 중...</p>
      )}

      <div className="flex justify-between mt-2">
        <Button variant="outline" size="sm" onClick={() => setWeekOffset((o) => o - 1)}>
          <ChevronLeft className="w-4 h-4" />
          이전
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setWeekOffset((o) => o + 1)}
          disabled={weekOffset >= 0}
        >
          이후
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
