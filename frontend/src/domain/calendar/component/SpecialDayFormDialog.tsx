/**
 * 특정 날짜(S타입) 일정 추가/수정 다이얼로그
 *
 * 사용법:
 *   // 추가
 *   <SpecialDayFormDialog open={open} onOpenChange={...} selectedYmd="20260414" onSuccess={...} />
 *   // 수정
 *   <SpecialDayFormDialog open={open} onOpenChange={...} selectedYmd="20260414" editTarget={event} onSuccess={...} />
 *
 * props:
 *   editTarget - 수정할 기존 이벤트. 전달 시 수정 모드(PUT), 없으면 추가 모드(POST)
 */
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { apiClient } from '@/lib/apiClient'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/shared/components/ui/dialog'
import { EVENT_COLORS, DEFAULT_COLOR } from '@/domain/calendar/component/eventColors'
import type { EventColorName } from '@/domain/calendar/component/eventColors'
import type { CalendarEvent } from '@/domain/calendar/types/calendar'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedYmd: string
  editTarget?: CalendarEvent | null
  onSuccess: () => void
}

function SpecialDayFormDialog({ open, onOpenChange, selectedYmd, editTarget, onSuccess }: Props) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<{ content: string }>()
  const [selectedColor, setSelectedColor] = useState<EventColorName>(DEFAULT_COLOR)
  const isEdit = !!editTarget

  useEffect(() => {
    if (open) {
      reset({ content: editTarget?.content ?? '' })
      setSelectedColor((editTarget?.color as EventColorName) ?? DEFAULT_COLOR)
    }
  }, [open, editTarget, reset])

  async function onSubmit(data: { content: string }) {
    if (isEdit) {
      const numericId = editTarget!.id.replace(/^C_/, '')
      await apiClient.put(`/calendar/my/${numericId}`, {
        gubun: editTarget!.gubun ?? 'S',
        sorl: 'S',
        ymd: editTarget!.ymd,
        content: data.content,
        color: selectedColor,
      })
    } else {
      await apiClient.post('/calendar/my', {
        gubun: 'S', sorl: 'S', ymd: selectedYmd, content: data.content, color: selectedColor,
      })
    }
    onSuccess()
    onOpenChange(false)
  }

  const dateStr = selectedYmd
    ? `${selectedYmd.substring(0, 4)}-${selectedYmd.substring(4, 6)}-${selectedYmd.substring(6, 8)}`
    : ''

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEdit ? '일정 수정' : `일정 추가 — ${dateStr}`}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">내용</label>
            <Input
              placeholder="일정 내용을 입력하세요"
              autoFocus
              {...register('content', { required: '내용을 입력하세요' })}
            />
            {errors.content && <p className="text-xs text-red-500">{errors.content.message}</p>}
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">색상</label>
            <div className="flex flex-wrap gap-2">
              {EVENT_COLORS.map(c => (
                <button
                  key={c.name}
                  type="button"
                  title={c.name}
                  onClick={() => setSelectedColor(c.name)}
                  className={`w-6 h-6 rounded-full ${c.dot} transition-all ${
                    selectedColor === c.name ? 'ring-2 ring-offset-2 ring-gray-500 scale-110' : 'opacity-70 hover:opacity-100'
                  }`}
                />
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>취소</Button>
            <Button type="submit">{isEdit ? '수정' : '추가'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default SpecialDayFormDialog
