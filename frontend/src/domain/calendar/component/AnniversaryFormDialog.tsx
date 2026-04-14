/**
 * 기념일/일정 추가·수정 다이얼로그
 *
 * 사용법:
 *   <AnniversaryFormDialog
 *     open={open}
 *     onOpenChange={setOpen}
 *     editTarget={null}           // null → 추가 모드
 *     onSuccess={handleSuccess}   // 저장 후 콜백 (쿼리 무효화 등)
 *   />
 *   <AnniversaryFormDialog
 *     open={open}
 *     onOpenChange={setOpen}
 *     editTarget={item}           // CalendarEventItem → 수정 모드
 *     onSuccess={handleSuccess}
 *   />
 */
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { apiClient } from '@/lib/apiClient'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/shared/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/shared/components/ui/select'
import { EVENT_COLORS, DEFAULT_COLOR } from '@/domain/calendar/component/eventColors'
import type { CalendarEventItem, CalendarFormValues } from '@/domain/calendar/types/calendar'

const YMD_PLACEHOLDER: Record<string, string> = {
  Y: 'MMDD (예: 0405)',
  M: 'DD (예: 01)',
  S: 'YYYYMMDD (예: 20260420)',
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  editTarget?: CalendarEventItem | null
  onSuccess?: () => void
}

export default function AnniversaryFormDialog({ open, onOpenChange, editTarget, onSuccess }: Props) {
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<CalendarFormValues>({
    defaultValues: { gubun: 'Y', sorl: 'S', ymd: '', content: '', color: DEFAULT_COLOR },
  })
  const gubun = watch('gubun')
  const sorl = watch('sorl')
  const color = watch('color')

  useEffect(() => {
    if (open) {
      reset(editTarget
        ? { gubun: editTarget.gubun, sorl: editTarget.sorl, ymd: editTarget.ymd, content: editTarget.content, color: editTarget.color ?? DEFAULT_COLOR }
        : { gubun: 'Y', sorl: 'S', ymd: '', content: '', color: DEFAULT_COLOR }
      )
    }
  }, [open, editTarget, reset])

  async function onSubmit(data: CalendarFormValues) {
    if (editTarget) {
      await apiClient.put(`/calendar/my/${editTarget.id}`, data)
    } else {
      await apiClient.post('/calendar/my', data)
    }
    onOpenChange(false)
    onSuccess?.()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{editTarget ? '기념일 수정' : '기념일 추가'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">유형</label>
            <Select value={gubun} onValueChange={v => setValue('gubun', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Y">매년</SelectItem>
                <SelectItem value="M">매달</SelectItem>
                <SelectItem value="S">특정일</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">양/음력</label>
            <div className="flex gap-4 pt-1">
              {[{ value: 'S', label: '양력' }, { value: 'L', label: '음력' }].map(({ value, label }) => (
                <label key={value} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    value={value}
                    checked={sorl === value}
                    onChange={() => setValue('sorl', value)}
                    className="accent-indigo-600"
                  />
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">날짜</label>
            <Input
              placeholder={YMD_PLACEHOLDER[gubun]}
              {...register('ymd', { required: '날짜를 입력하세요' })}
            />
            {errors.ymd && <p className="text-xs text-red-500">{errors.ymd.message}</p>}
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">내용</label>
            <Input
              placeholder="내용을 입력하세요"
              autoFocus
              {...register('content', { required: '내용을 입력하세요' })}
            />
            {errors.content && <p className="text-xs text-red-500">{errors.content.message}</p>}
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">색상</label>
            <div className="flex flex-wrap gap-2 pt-1">
              {EVENT_COLORS.map(c => (
                <button
                  key={c.name}
                  type="button"
                  title={c.name}
                  onClick={() => setValue('color', c.name)}
                  className={`w-6 h-6 rounded-full ${c.dot} transition-transform
                    ${color === c.name ? 'ring-2 ring-offset-1 ring-gray-500 scale-110' : 'hover:scale-110'}`}
                />
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>취소</Button>
            <Button type="submit">{editTarget ? '수정' : '추가'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
