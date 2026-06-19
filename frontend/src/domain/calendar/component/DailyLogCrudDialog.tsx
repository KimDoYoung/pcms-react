/**
 * 습관등록 다이얼로그 (daily_logs CRUD)
 *
 * 목적: 캘린더 헤더의 "습관등록" 버튼으로 열어, 새로운 습관을 처음 등록하거나
 *       기존 daily_logs 기록을 조회·수정·삭제하는 관리 화면. 새 습관을 만들 때 쓰는
 *       곳이라 제목/값/색상을 모두 직접 입력한다(기존 습관을 매일 빠르게 기록하려면
 *       day cell의 "습관추가" 버튼 → DailyLogQuickAddDialog를 사용).
 *
 * 사용법:
 *   <DailyLogCrudDialog
 *     open={dailyLogModalOpen}
 *     onOpenChange={setDailyLogModalOpen}
 *     startYmd={startYmd}
 *     endYmd={endYmd}
 *   />
 *
 * props:
 *   open, onOpenChange - 다이얼로그 열림 상태
 *   startYmd, endYmd   - 현재 캘린더가 보고 있는 기간(yyyyMMdd). 이 기간의 기록만 목록에 표시.
 */
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Trash2, X } from 'lucide-react'

import { apiClient } from '@/lib/apiClient'
import { formatYmd } from '@/lib/utils'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/shared/components/ui/dialog'
import { useMessage } from '@/shared/hooks/useMessage'
import { EVENT_COLORS, COLOR_MAP, DEFAULT_COLOR } from '@/domain/calendar/component/eventColors'
import type { DailyLogDto } from '@/domain/dailyLog/types/dailyLog'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  startYmd: string
  endYmd: string
}

const EMPTY_FORM = { ymd: '', title: '', value: '', color: DEFAULT_COLOR as string }

function ColorPicker({ value, onChange }: { value: string; onChange: (color: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {EVENT_COLORS.map(c => (
        <button
          key={c.name}
          type="button"
          title={c.name}
          onClick={() => onChange(c.name)}
          className={`w-5 h-5 rounded-full ${c.dot} transition-all ${
            value === c.name ? 'ring-2 ring-offset-1 ring-gray-500 scale-110' : 'opacity-70 hover:opacity-100'
          }`}
        />
      ))}
    </div>
  )
}

function toInputDate(ymd: string): string {
  return ymd ? `${ymd.substring(0, 4)}-${ymd.substring(4, 6)}-${ymd.substring(6, 8)}` : ''
}

export default function DailyLogCrudDialog({ open, onOpenChange, startYmd, endYmd }: Props) {
  const queryClient = useQueryClient()
  const { showMessage } = useMessage()

  const [form, setForm] = useState({ ...EMPTY_FORM, ymd: toInputDate(formatYmd(new Date())) })
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState(EMPTY_FORM)

  const { data: logs = [] } = useQuery<DailyLogDto[]>({
    queryKey: ['daily-logs-range', startYmd, endYmd],
    queryFn: () => apiClient.get<DailyLogDto[]>(`/daily-logs/range/${startYmd}/${endYmd}`),
    enabled: open,
  })

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['daily-logs-range'] })
    queryClient.invalidateQueries({ queryKey: ['daily-log-title-templates'] })
  }

  async function handleAdd() {
    if (!form.ymd || !form.title.trim() || !form.value.trim()) {
      showMessage('날짜, 제목, 값을 모두 입력하세요.', 'error')
      return
    }
    try {
      await apiClient.post('/daily-logs', {
        ymd: formatYmd(form.ymd),
        title: form.title.trim(),
        value: form.value.trim(),
        color: form.color,
      })
      setForm({ ...form, title: '', value: '' })
      invalidate()
    } catch {
      showMessage('추가 중 오류가 발생했습니다.', 'error')
    }
  }

  function startEdit(log: DailyLogDto) {
    setEditingId(log.id)
    setEditForm({ ymd: toInputDate(log.ymd), title: log.title, value: log.value, color: log.color ?? DEFAULT_COLOR })
  }

  async function saveEdit(id: number) {
    if (!editForm.ymd || !editForm.title.trim() || !editForm.value.trim()) {
      showMessage('날짜, 제목, 값을 모두 입력하세요.', 'error')
      return
    }
    try {
      await apiClient.put(`/daily-logs/${id}`, {
        ymd: formatYmd(editForm.ymd),
        title: editForm.title.trim(),
        value: editForm.value.trim(),
        color: editForm.color,
      })
      setEditingId(null)
      invalidate()
    } catch {
      showMessage('수정 중 오류가 발생했습니다.', 'error')
    }
  }

  async function handleDelete(id: number, title: string) {
    if (!confirm(`"${title}" 기록을 삭제하시겠습니까?`)) return
    try {
      await apiClient.delete(`/daily-logs/${id}`)
      invalidate()
    } catch {
      showMessage('삭제 중 오류가 발생했습니다.', 'error')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>습관등록</DialogTitle>
        </DialogHeader>

        <div className="flex flex-wrap gap-2 items-end pt-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">날짜</label>
            <Input type="date" value={form.ymd} onChange={(e) => setForm((f) => ({ ...f, ymd: e.target.value }))} className="w-36" />
          </div>
          <div className="flex flex-col gap-1 flex-1 min-w-24">
            <label className="text-xs text-gray-500">제목</label>
            <Input placeholder="예: 아침체조" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          </div>
          <div className="flex flex-col gap-1 flex-1 min-w-24">
            <label className="text-xs text-gray-500">값</label>
            <Input placeholder="예: 🤸 또는 150/80" value={form.value} onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">색상</label>
            <ColorPicker value={form.color} onChange={(color) => setForm((f) => ({ ...f, color }))} />
          </div>
          <Button variant="action" size="sm" onClick={handleAdd}>추가</Button>
        </div>

        <div className="mt-3 max-h-72 overflow-y-auto border border-gray-200 rounded-lg">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 sticky top-0">
                <th className="px-3 py-2 text-left font-medium">날짜</th>
                <th className="px-3 py-2 text-left font-medium">제목</th>
                <th className="px-3 py-2 text-left font-medium">값</th>
                <th className="px-3 py-2 text-left font-medium">색상</th>
                <th className="px-3 py-2 text-center font-medium">액션</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-400">기록이 없습니다.</td>
                </tr>
              )}
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-gray-100">
                  {editingId === log.id ? (
                    <>
                      <td className="px-2 py-1.5">
                        <Input type="date" value={editForm.ymd} onChange={(e) => setEditForm((f) => ({ ...f, ymd: e.target.value }))} className="h-8 text-xs" />
                      </td>
                      <td className="px-2 py-1.5">
                        <Input value={editForm.title} onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))} className="h-8 text-xs" />
                      </td>
                      <td className="px-2 py-1.5">
                        <Input value={editForm.value} onChange={(e) => setEditForm((f) => ({ ...f, value: e.target.value }))} className="h-8 text-xs" />
                      </td>
                      <td className="px-2 py-1.5">
                        <ColorPicker value={editForm.color} onChange={(color) => setEditForm((f) => ({ ...f, color }))} />
                      </td>
                      <td className="px-2 py-1.5">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="action" size="sm" className="h-7 px-2 text-xs" onClick={() => saveEdit(log.id)}>저장</Button>
                          <button onClick={() => setEditingId(null)} className="p-1 text-gray-400 hover:text-gray-600" title="취소">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-3 py-2 text-gray-500 font-mono text-xs">{toInputDate(log.ymd)}</td>
                      <td className="px-3 py-2">{log.title}</td>
                      <td className="px-3 py-2">{log.value}</td>
                      <td className="px-3 py-2">
                        <span className={`inline-block w-3.5 h-3.5 rounded-full ${COLOR_MAP[log.color ?? DEFAULT_COLOR]?.dot ?? COLOR_MAP[DEFAULT_COLOR].dot}`} />
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => startEdit(log)} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors" title="수정">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDelete(log.id, log.title)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors" title="삭제">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  )
}
