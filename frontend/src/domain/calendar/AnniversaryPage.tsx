import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { apiClient } from '@/lib/apiClient'
import Toolbar from '@/shared/components/Toolbar'
import { Button } from '@/shared/components/ui/button'
import AnniversaryFormDialog from '@/domain/calendar/component/AnniversaryFormDialog'
import { COLOR_MAP, DEFAULT_COLOR } from '@/domain/calendar/component/eventColors'
import type { CalendarEventItem } from '@/domain/calendar/types/calendar'

const GUBUN_LABEL: Record<string, string> = { Y: '매년', M: '매달', S: '특정일' }
const GUBUN_COLOR: Record<string, string> = {
  Y: 'bg-green-100 text-green-700',
  M: 'bg-blue-100 text-blue-700',
  S: 'bg-gray-100 text-gray-600',
}
const SORL_LABEL: Record<string, string> = { S: '양력', L: '음력' }
const SORL_COLOR: Record<string, string> = {
  S: 'bg-orange-50 text-orange-500',
  L: 'bg-purple-50 text-purple-500',
}

function formatYmd(gubun: string, ymd: string): string {
  if (gubun === 'Y') return `${ymd.substring(0, 2)}월 ${ymd.substring(2, 4)}일`
  if (gubun === 'M') return `매월 ${ymd}일`
  return `${ymd.substring(0, 4)}-${ymd.substring(4, 6)}-${ymd.substring(6, 8)}`
}

export default function AnniversaryPage() {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<CalendarEventItem | null>(null)

  const { data: items = [] } = useQuery<CalendarEventItem[]>({
    queryKey: ['calendar-my-list'],
    queryFn: () => apiClient.get('/calendar/my/list'),
  })

  function openAdd() {
    setEditTarget(null)
    setDialogOpen(true)
  }

  function openEdit(item: CalendarEventItem) {
    setEditTarget(item)
    setDialogOpen(true)
  }

  async function onDelete(id: number) {
    if (!confirm('삭제하시겠습니까?')) return
    await apiClient.delete(`/calendar/my/${id}`)
    queryClient.invalidateQueries({ queryKey: ['calendar-my-list'] })
  }

  const grouped = ['Y', 'M', 'S'].reduce<Record<string, CalendarEventItem[]>>((acc, g) => {
    acc[g] = items.filter(i => i.gubun === g)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <Toolbar />
      <main className="container mx-auto px-4 mt-6 max-w-2xl">
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white flex items-center justify-between">
            <h1 className="text-xl font-bold">기념일 관리</h1>
            <Button
              size="sm"
              variant="secondary"
              onClick={openAdd}
              className="bg-white/20 border-white/30 text-white hover:bg-white/40 h-8"
            >
              <Plus className="w-4 h-4 mr-1" /> 추가
            </Button>
          </div>

          <div className="p-4 space-y-6">
            {(['Y', 'M', 'S'] as const).map(g => (
              grouped[g].length > 0 && (
                <div key={g}>
                  <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    {GUBUN_LABEL[g]}
                  </h2>
                  <div className="space-y-1">
                    {grouped[g].map(item => (
                      <div key={item.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 group">
                        <span className={`w-3 h-3 rounded-full shrink-0 ${(COLOR_MAP[item.color ?? DEFAULT_COLOR] ?? COLOR_MAP[DEFAULT_COLOR]).dot}`} />
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${GUBUN_COLOR[item.gubun]}`}>
                          {GUBUN_LABEL[item.gubun]}
                        </span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${SORL_COLOR[item.sorl] ?? SORL_COLOR['S']}`}>
                          {SORL_LABEL[item.sorl] ?? '양력'}
                        </span>
                        <span className="text-sm text-gray-500 w-28 shrink-0">{formatYmd(item.gubun, item.ymd)}</span>
                        <span className="text-sm font-medium text-gray-800 flex-1">{item.content}</span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEdit(item)} className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-indigo-600">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => onDelete(item.id)} className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-red-600">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            ))}
            {items.length === 0 && (
              <p className="text-center text-sm text-gray-400 py-10">등록된 기념일이 없습니다.</p>
            )}
          </div>
        </div>
      </main>

      <AnniversaryFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editTarget={editTarget}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['calendar-my-list'] })}
      />
    </div>
  )
}
