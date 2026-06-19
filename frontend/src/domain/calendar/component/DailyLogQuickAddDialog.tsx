/**
 * 습관추가 다이얼로그 (day cell 전용 빠른 기록, 다중 선택)
 *
 * 목적: 캘린더 day cell 호버 시 나오는 "습관추가" 버튼으로 열어, 이미 등록된 습관
 *       (daily_logs에 있는 title)들을 체크박스로 여러 개 동시에 선택해서 그 날짜에
 *       한 번에 기록한다. 새 습관을 만드는 곳이 아니라 — 새 습관 등록은 헤더의
 *       "습관등록"(DailyLogCrudDialog)에서 한다.
 *
 *       각 title 옆에는 그 title로 처음 기록했던 value가 "템플릿"으로 미리 채워진
 *       입력칸이 있다 — 그대로 두면 템플릿 value를 쓰고, 직접 고치면 입력값을 쓴다.
 *       color는 체크된 모든 title에 대해 항상 템플릿 color를 따른다.
 *       (예: '아침체조'는 체크만 하면 항상 같은 이모지/색. '혈압측정'은 체크 후
 *       value 칸에 그날 측정값만 고쳐 입력)
 *
 *       그 날짜에 이미 기록된 습관은 열 때 체크된 상태 + 그날의 실제 value로 미리 채워진다.
 *       저장 시에는 그 날짜의 daily_logs를 전부 삭제하고 현재 체크된 것만 다시 저장한다
 *       (diff 없이 통째로 동기화 — 체크 해제 = 삭제, 새로 체크 = 추가).
 *
 * 사용법:
 *   <DailyLogQuickAddDialog
 *     open={quickAddOpen}
 *     onOpenChange={setQuickAddOpen}
 *     ymd={quickAddYmd}
 *   />
 *
 * props:
 *   open, onOpenChange - 다이얼로그 열림 상태
 *   ymd                - 기록할 날짜(yyyyMMdd, day cell에서 클릭한 그 날짜로 고정)
 */
import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import { apiClient } from '@/lib/apiClient'
import { formatDate } from '@/lib/utils'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/shared/components/ui/dialog'
import { useMessage } from '@/shared/hooks/useMessage'
import { DEFAULT_COLOR } from '@/domain/calendar/component/eventColors'
import type { DailyLogDto, TitleTemplateDto } from '@/domain/dailyLog/types/dailyLog'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  ymd: string
}

interface Selection {
  checked: boolean
  value: string
}

const EMPTY_TEMPLATES: TitleTemplateDto[] = []
const EMPTY_DAY_LOGS: DailyLogDto[] = []

export default function DailyLogQuickAddDialog({ open, onOpenChange, ymd }: Props) {
  const queryClient = useQueryClient()
  const { showMessage } = useMessage()

  const [selections, setSelections] = useState<Record<string, Selection>>({})

  const { data: templates = EMPTY_TEMPLATES } = useQuery<TitleTemplateDto[]>({
    queryKey: ['daily-log-title-templates'],
    queryFn: () => apiClient.get<TitleTemplateDto[]>('/daily-logs/title-templates'),
    enabled: open,
  })

  const { data: dayLogs = EMPTY_DAY_LOGS } = useQuery<DailyLogDto[]>({
    queryKey: ['daily-logs-range', ymd, ymd],
    queryFn: () => apiClient.get<DailyLogDto[]>(`/daily-logs/range/${ymd}/${ymd}`),
    enabled: open && !!ymd,
  })

  useEffect(() => {
    if (open && templates.length > 0) {
      setSelections(
        Object.fromEntries(
          templates.map((t) => {
            const existing = dayLogs.find((l) => l.title === t.title)
            return [t.title, { checked: !!existing, value: existing?.value ?? t.value }]
          }),
        ),
      )
    }
  }, [open, templates, dayLogs])

  function toggleChecked(title: string) {
    setSelections((s) => ({ ...s, [title]: { ...s[title], checked: !s[title].checked } }))
  }

  function setValue(title: string, value: string) {
    setSelections((s) => ({ ...s, [title]: { ...s[title], value } }))
  }

  async function handleSave() {
    const checkedTitles = Object.entries(selections).filter(([, sel]) => sel.checked)
    try {
      await apiClient.delete(`/daily-logs/by-ymd/${ymd}`)
      await Promise.all(
        checkedTitles.map(([title, sel]) => {
          const template = templates.find((t) => t.title === title)
          const finalValue = sel.value.trim() || template?.value || ''
          const finalColor = template?.color ?? DEFAULT_COLOR
          return apiClient.post('/daily-logs', { ymd, title, value: finalValue, color: finalColor })
        }),
      )
      queryClient.invalidateQueries({ queryKey: ['daily-logs-range'] })
      queryClient.invalidateQueries({ queryKey: ['daily-log-title-templates'] })
      onOpenChange(false)
    } catch {
      showMessage('저장 중 오류가 발생했습니다.', 'error')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>습관추가 — {formatDate(ymd, false)}</DialogTitle>
        </DialogHeader>

        <div className="space-y-2 pt-2 max-h-80 overflow-y-auto">
          {templates.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-6">등록된 습관이 없습니다. 먼저 "습관등록"에서 추가하세요.</p>
          )}
          {templates.map((t) => {
            const sel = selections[t.title] ?? { checked: false, value: t.value }
            return (
              <label key={t.title} className="flex items-center gap-2 px-1">
                <input
                  type="checkbox"
                  checked={sel.checked}
                  onChange={() => toggleChecked(t.title)}
                  className="w-4 h-4 accent-indigo-600 shrink-0"
                />
                <span className="text-sm text-gray-700 min-w-16 shrink-0">{t.title}</span>
                <Input
                  value={sel.value}
                  onChange={(e) => setValue(t.title, e.target.value)}
                  disabled={!sel.checked}
                  className="h-8 text-sm flex-1"
                />
              </label>
            )
          })}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>취소</Button>
          <Button type="button" onClick={handleSave}>저장</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
