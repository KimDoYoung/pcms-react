// Calendar1Page - API 응답
export interface CalendarEvent {
  id: string
  type: 'HOLIDAY' | 'EVENT' | 'SEASONAL'
  ymd: string
  content: string
  gubun?: string
  color?: string
}

// Calendar1Page - 뷰 모델 (API 데이터 가공 후)
export interface CalendarDay {
  ymd: string
  day: number
  isToday: boolean
  isThisMonth: boolean
  isHoliday: boolean
  isSunday: boolean
  isSaturday: boolean
  holidays: CalendarEvent[]
  seasonal: CalendarEvent[]
  events: CalendarEvent[]
}

// AnniversaryPage - 기념일 목록 아이템
export interface CalendarEventItem {
  id: number
  gubun: string
  sorl: string
  ymd: string
  content: string
  color: string
}

// toLunar API 응답
export interface LunarDateDto {
  solar: string
  lunar: string
  display: string
  leapMonth: boolean
}

// AnniversaryPage - 기념일 등록/수정 폼
export interface CalendarFormValues {
  gubun: string
  sorl: string
  ymd: string
  content: string
  color: string
}
