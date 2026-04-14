/**
 * 특정 날짜(S타입) 일정 빠른 추가 다이얼로그
 *
 * 사용법:
 *   <SpecialDayFormDialog
 *     open={addDialogOpen}
 *     onOpenChange={setAddDialogOpen}
 *     selectedYmd="20260414"
 *     onSuccess={() => queryClient.invalidateQueries({ queryKey: ['calendar-events'] })}
 *   />
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

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedYmd: string
  onSuccess: () => void
}

function SpecialDayFormDialog({ open, onOpenChange, selectedYmd, onSuccess }: Props) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<{ content: string }>()
  const [selectedColor, setSelectedColor] = useState<EventColorName>(DEFAULT_COLOR)

  // 다이얼로그가 열릴 때마다 폼·색상 초기화
  useEffect(() => {
    if (open) {
      reset({ content: '' })
      setSelectedColor(DEFAULT_COLOR)
    }
  }, [open, reset])

  async function onSubmit(data: { content: string }) {
    await apiClient.post('/calendar/my', {
      gubun: 'S', sorl: 'S', ymd: selectedYmd, content: data.content, color: selectedColor,
    })
    onSuccess()
    onOpenChange(false)
  }

  const title = selectedYmd
    ? `${selectedYmd.substring(0, 4)}-${selectedYmd.substring(4, 6)}-${selectedYmd.substring(6, 8)}`
    : ''

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>일정 추가 — {title}</DialogTitle>
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
            <Button type="submit">추가</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default SpecialDayFormDialog
