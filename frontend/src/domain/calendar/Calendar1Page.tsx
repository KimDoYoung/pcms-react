import { useState, useMemo, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { apiClient } from '@/lib/apiClient'
import Toolbar from '@/shared/components/Toolbar'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/shared/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/shared/components/ui/select'
import type { CalendarEvent, CalendarDay } from '@/domain/calendar/types/calendar'

const YMD_PLACEHOLDER: Record<string, string> = {
  Y: 'MMDD (예: 0405)',
  M: 'DD (예: 01)',
  S: 'YYYYMMDD (예: 20260420)',
}

function zeroPad(num: number): string {
  return num < 10 ? '0' + num : num.toString()
}

function getStartEndYmd(year: number, month: number): [string, string] {
  const firstDate = new Date(year, month - 1, 1)
  const startYoil = firstDate.getDay() // 0=Sunday

  const lastDate = new Date(year, month, 0)
  const endYoil = lastDate.getDay()

  const tempStart = new Date(firstDate)
  tempStart.setDate(tempStart.getDate() - startYoil)
  const startYmd = tempStart.getFullYear() + zeroPad(tempStart.getMonth() + 1) + zeroPad(tempStart.getDate())

  const tempEnd = new Date(lastDate)
  tempEnd.setDate(tempEnd.getDate() + (6 - endYoil))
  const endYmd = tempEnd.getFullYear() + zeroPad(tempEnd.getMonth() + 1) + zeroPad(tempEnd.getDate())

  return [startYmd, endYmd]
}

function Calendar1Page() {
  const queryClient = useQueryClient()
  const todayDate = new Date()
  const [currentYear, setCurrentYear] = useState(todayDate.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(todayDate.getMonth() + 1)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [selectedYmd, setSelectedYmd] = useState('')

  // 날짜 셀 클릭 - 특정일(S) 빠른 추가
  const { register, handleSubmit, reset, formState: { errors } } = useForm<{ content: string }>()

  function openAddDialog(ymd: string) {
    setSelectedYmd(ymd)
    reset({ content: '' })
    setAddDialogOpen(true)
  }

  async function onAddSubmit(data: { content: string }) {
    await apiClient.post('/calendar/my', { gubun: 'S', sorl: 'S', ymd: selectedYmd, content: data.content })
    queryClient.invalidateQueries({ queryKey: ['calendar-events'] })
    setAddDialogOpen(false)
  }

  // 헤더 추가 버튼 - 전체 폼 (Y/M/S)
  const [fullDialogOpen, setFullDialogOpen] = useState(false)
  const { register: regFull, handleSubmit: handleFull, reset: resetFull,
          watch: watchFull, setValue: setValueFull, formState: { errors: errorsFull },
        } = useForm<{ gubun: string; ymd: string; content: string }>({
    defaultValues: { gubun: 'Y', ymd: '', content: '' },
  })
  const fullGubun = watchFull('gubun')

  function openFullDialog() {
    resetFull({ gubun: 'Y', ymd: '', content: '' })
    setFullDialogOpen(true)
  }

  async function onFullSubmit(data: { gubun: string; ymd: string; content: string }) {
    await apiClient.post('/calendar/my', { ...data, sorl: 'S' })
    queryClient.invalidateQueries({ queryKey: ['calendar-events'] })
    setFullDialogOpen(false)
  }

  const [startYmd, endYmd] = useMemo(() => getStartEndYmd(currentYear, currentMonth), [currentYear, currentMonth])

  // 해당 월 표시될 때 공휴일 자동 Fetch
  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        await apiClient.post(`/calendar/fetch-public-holiday/${currentYear}/${currentMonth}`)
        // 데이터가 새로 들어왔을 수 있으므로 쿼리 무효화
        queryClient.invalidateQueries({ queryKey: ['calendar-events'] })
      } catch (error) {
        console.error('Auto holiday fetch failed:', error)
      }
    }
    fetchHolidays()
  }, [currentYear, currentMonth, queryClient])

  const { data: events = [] } = useQuery<CalendarEvent[]>({
    queryKey: ['calendar-events', startYmd, endYmd],
    queryFn: () => apiClient.get<CalendarEvent[]>(`/calendar/${startYmd}/${endYmd}`),
  })

  const days = useMemo(() => {
    const result: CalendarDay[] = []
    let currentDate = new Date(
      parseInt(startYmd.substring(0, 4)),
      parseInt(startYmd.substring(4, 6)) - 1,
      parseInt(startYmd.substring(6, 8))
    )
    const endDt = new Date(
      parseInt(endYmd.substring(0, 4)),
      parseInt(endYmd.substring(4, 6)) - 1,
      parseInt(endYmd.substring(6, 8))
    )

    const todayYmd = todayDate.getFullYear() + zeroPad(todayDate.getMonth() + 1) + zeroPad(todayDate.getDate())
    const thisYm = currentYear + zeroPad(currentMonth)

    let index = 0
    while (currentDate <= endDt) {
      const ymd = currentDate.getFullYear() + zeroPad(currentDate.getMonth() + 1) + zeroPad(currentDate.getDate())
      
      const dayEvents = events.filter(e => e.ymd === ymd)
      const holidays = dayEvents.filter(e => e.type === 'HOLIDAY')
      const normalEvents = dayEvents.filter(e => e.type !== 'HOLIDAY')

      const isHoliday = holidays.length > 0
      const isSunday = index % 7 === 0
      const isSaturday = index % 7 === 6
      const isThisMonth = ymd.startsWith(thisYm)
      const isToday = ymd === todayYmd

      result.push({
        ymd,
        day: currentDate.getDate(),
        isToday,
        isThisMonth,
        isHoliday,
        isSunday,
        isSaturday,
        holidays,
        events: normalEvents
      })

      currentDate.setDate(currentDate.getDate() + 1)
      index++
    }
    return result
  }, [currentYear, currentMonth, startYmd, endYmd, events])

  const prevMonth = () => {
    if (currentMonth === 1) {
      setCurrentYear(v => v - 1)
      setCurrentMonth(12)
    } else {
      setCurrentMonth(v => v - 1)
    }
  }

  const nextMonth = () => {
    if (currentMonth === 12) {
      setCurrentYear(v => v + 1)
      setCurrentMonth(1)
    } else {
      setCurrentMonth(v => v + 1)
    }
  }

  const goToday = () => {
    const today = new Date()
    setCurrentYear(today.getFullYear())
    setCurrentMonth(today.getMonth() + 1)
  }

  return (
    <>
    <div className="min-h-screen bg-gray-50 pb-10">
      <Toolbar />
      <main className="container mx-auto px-4 mt-6">
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          {/* Header - 연/월 부분 높이와 폰트 크기 확대 */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white">
            <div className="flex justify-center items-center gap-6">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={prevMonth}
                className="text-white hover:bg-white/20 rounded-full h-9 w-9"
                title="이전 달"
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>

              <h1 className="text-2xl font-bold tracking-tight min-w-[160px] text-center">
                {currentYear}년 {currentMonth}월
              </h1>

              <div className="flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={nextMonth}
                  className="text-white hover:bg-white/20 rounded-full h-9 w-9"
                  title="다음 달"
                >
                  <ChevronRight className="w-6 h-6" />
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={goToday}
                  className="bg-white/20 border-white/30 text-white hover:bg-white/40 px-4 py-1.5 h-8 text-sm font-bold shadow-inner"
                >
                  오늘
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={openFullDialog}
                  className="bg-white/20 border-white/30 text-white hover:bg-white/40 px-3 py-1.5 h-8 text-sm font-bold shadow-inner"
                >
                  <Plus className="w-4 h-4 mr-1" />추가
                </Button>
              </div>
            </div>
          </div>

          <div className="p-0">
            {/* Week Header - 요일 부분 높이 추가 확대 (py-2 -> py-3.5) */}
            <div className="grid grid-cols-7 border-b border-gray-200">
              {['일', '월', '화', '수', '목', '금', '토'].map((w, i) => (
                <div 
                  key={w} 
                  className={`py-3.5 text-center font-bold text-sm bg-gray-50 border-r border-gray-100 last:border-0
                    ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-600'}`}
                >
                  {w}
                </div>
              ))}
            </div>

            {/* Grid Body - 최소 높이 소폭 확대 (min-h-[105px] -> min-h-[125px]) */}
            <div className="grid grid-cols-7 gap-px bg-gray-200 border-x border-b border-gray-200">
              {days.map((day) => (
                <div 
                  key={day.ymd} 
                  className={`min-h-[125px] bg-white p-2 transition-all duration-200 hover:bg-indigo-50/30 group relative
                    ${day.isToday ? 'bg-yellow-50/50' : ''}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full transition-colors
                      ${!day.isThisMonth ? (day.isSunday || day.isHoliday ? 'text-red-200' : day.isSaturday ? 'text-blue-200' : 'text-gray-300') :
                        (day.isSunday || day.isHoliday ? 'text-red-500' : day.isSaturday ? 'text-blue-500' : 'text-gray-700')}
                      ${day.isToday ? 'bg-indigo-600 text-white shadow-md' : ''}`}
                    >
                      {day.day}
                    </span>
                    <button
                      onClick={() => openAddDialog(day.ymd)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5 rounded-full bg-rose-200 hover:bg-rose-300 flex items-center justify-center"
                      title="일정 추가"
                    >
                      <Plus className="w-3 h-3 text-rose-500" />
                    </button>
                  </div>

                  {/* Holidays */}
                  <div className="space-y-1">
                    {day.holidays.map(h => (
                      <div key={h.id} className="text-[12px] font-semibold bg-red-100 text-red-700 px-1.5 py-0.5 rounded truncate leading-tight">
                        {h.content}
                      </div>
                    ))}
                  </div>

                  {/* Events */}
                  <div className="space-y-1 mt-1.5">
                    {day.events.map(e => (
                      <div key={e.id} className="text-[12px] font-medium bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded truncate border border-blue-100 leading-tight">
                        {e.content}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              일정 추가 — {selectedYmd.substring(0,4)}-{selectedYmd.substring(4,6)}-{selectedYmd.substring(6,8)}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onAddSubmit)} className="space-y-4 pt-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">내용</label>
              <Input
                placeholder="일정 내용을 입력하세요"
                autoFocus
                {...register('content', { required: '내용을 입력하세요' })}
              />
              {errors.content && <p className="text-xs text-red-500">{errors.content.message}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)}>취소</Button>
              <Button type="submit">추가</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={fullDialogOpen} onOpenChange={setFullDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>기념일 추가</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleFull(onFullSubmit)} className="space-y-4 pt-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">유형</label>
              <Select value={fullGubun} onValueChange={v => setValueFull('gubun', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Y">매년</SelectItem>
                  <SelectItem value="M">매달</SelectItem>
                  <SelectItem value="S">특정일</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">날짜</label>
              <Input
                placeholder={YMD_PLACEHOLDER[fullGubun]}
                {...regFull('ymd', { required: '날짜를 입력하세요' })}
              />
              {errorsFull.ymd && <p className="text-xs text-red-500">{errorsFull.ymd.message}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">내용</label>
              <Input
                placeholder="내용을 입력하세요"
                autoFocus
                {...regFull('content', { required: '내용을 입력하세요' })}
              />
              {errorsFull.content && <p className="text-xs text-red-500">{errorsFull.content.message}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFullDialogOpen(false)}>취소</Button>
              <Button type="submit">추가</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default Calendar1Page
