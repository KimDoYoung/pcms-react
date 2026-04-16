import { describe, it, expect } from 'vitest'
import { cn, formatDate, getDayOfWeek, formatYmd, formatFileSize, addYmd, addDate, formatCount, formatCost, formatRelativeDateTime } from './utils'

// 테스트 기준일: 2026-04-12 (일요일)
const DATE_YYYY_MM_DD = '2026-04-12'
const DATE_YYYYMMDD   = '20260412'

// ────────────────────────────────────────────────────────────────
// formatDate
// 시그니처: formatDate(dateInput, dayofweek=true, short=true, english=false, time_display=false)
// ────────────────────────────────────────────────────────────────
describe('formatDate', () => {
  it('undefined 입력 → "-"', () => {
    expect(formatDate(undefined)).toBe('-')
  })

  it('빈 문자열 → "-"', () => {
    expect(formatDate('')).toBe('-')
  })

  it('잘못된 문자열 → "Invalid Date : ..."', () => {
    expect(formatDate('invalid')).toBe('Invalid Date : invalid')
  })

  it('yyyymmdd 형식 정규화 (8자리)', () => {
    // dayofweek=true, short=true 기본값
    expect(formatDate(DATE_YYYYMMDD)).toBe('2026-04-12 (일)')
  })

  it('yyyy-mm-dd 형식', () => {
    expect(formatDate(DATE_YYYY_MM_DD)).toBe('2026-04-12 (일)')
  })

  it('dayofweek=false → 요일 없음', () => {
    expect(formatDate(DATE_YYYY_MM_DD, false)).toBe('2026-04-12')
  })

  it('short=false → 전체 요일', () => {
    expect(formatDate(DATE_YYYY_MM_DD, true, false)).toBe('2026-04-12 (일요일)')
  })

  it('english=true, short=true → 영어 단축 요일', () => {
    expect(formatDate(DATE_YYYY_MM_DD, true, true, true)).toBe('2026-04-12 (Sun)')
  })

  it('english=true, short=false → 영어 전체 요일', () => {
    expect(formatDate(DATE_YYYY_MM_DD, true, false, true)).toBe('2026-04-12 (Sunday)')
  })

  it('Date 객체 입력', () => {
    const d = new Date('2026-04-12T00:00:00')
    expect(formatDate(d, false)).toBe('2026-04-12')
  })
})

// ────────────────────────────────────────────────────────────────
// getDayOfWeek
// 시그니처: getDayOfWeek(dateStr, short=false, english=false)
// ────────────────────────────────────────────────────────────────
describe('getDayOfWeek', () => {
  it('yyyymmdd → 한국어 전체 요일', () => {
    expect(getDayOfWeek(DATE_YYYYMMDD)).toBe('일요일')
  })

  it('yyyy-mm-dd → 한국어 전체 요일', () => {
    expect(getDayOfWeek(DATE_YYYY_MM_DD)).toBe('일요일')
  })

  it('short=true → 한국어 단축 요일', () => {
    expect(getDayOfWeek(DATE_YYYY_MM_DD, true)).toBe('일')
  })

  it('english=true → 영어 전체 요일', () => {
    expect(getDayOfWeek(DATE_YYYY_MM_DD, false, true)).toBe('Sunday')
  })

  it('english=true, short=true → 영어 단축 요일', () => {
    expect(getDayOfWeek(DATE_YYYY_MM_DD, true, true)).toBe('Sun')
  })
})

// ────────────────────────────────────────────────────────────────
// formatFileSize
// ────────────────────────────────────────────────────────────────
describe('formatFileSize', () => {
  it('0 바이트', () => {
    expect(formatFileSize(0)).toBe('0 B')
  })

  it('1 바이트', () => {
    expect(formatFileSize(1)).toBe('1.0 B')
  })

  it('1 KB (1024 bytes)', () => {
    expect(formatFileSize(1024)).toBe('1.0 KB')
  })

  it('1.5 KB (1536 bytes)', () => {
    expect(formatFileSize(1536)).toBe('1.5 KB')
  })

  it('1 MB (1024^2 bytes)', () => {
    expect(formatFileSize(1024 ** 2)).toBe('1.0 MB')
  })

  it('1 GB (1024^3 bytes)', () => {
    expect(formatFileSize(1024 ** 3)).toBe('1.0 GB')
  })
})

describe('formatCount', () => {
  it('undefined 입력 → "-"', () => {
    expect(formatCount(undefined)).toBe('-')
  })

  it('0은 콤마 없이 표시', () => {
    expect(formatCount(0)).toBe('0')
  })

  it('천 단위 콤마 표시', () => {
    expect(formatCount(1234567)).toBe('1,234,567')
  })

  it('음수도 콤마 표시', () => {
    expect(formatCount(-9876543)).toBe('-9,876,543')
  })
})

describe('formatRelativeDateTime', () => {
  it('null 입력 → 빈 문자열', () => {
    expect(formatRelativeDateTime(null)).toBe('')
  })

  it('잘못된 문자열 → 빈 문자열', () => {
    expect(formatRelativeDateTime('invalid')).toBe('')
  })

  it('오늘 날짜 입력 → HH:mm 형식', () => {
    const nowIso = new Date().toISOString()
    expect(formatRelativeDateTime(nowIso)).toMatch(/^\d{2}:\d{2}$/)
  })

  it('오늘이 아닌 날짜 입력 → yyyy. MM. dd. 형식', () => {
    expect(formatRelativeDateTime('2026-04-12T10:20:30')).toBe('2026. 04. 12.')
  })
})

// ────────────────────────────────────────────────────────────────
// cn
// ────────────────────────────────────────────────────────────────
describe('cn', () => {
  it('단일 클래스', () => {
    expect(cn('foo')).toBe('foo')
  })

  it('여러 클래스 합치기', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('조건부 클래스 - falsy는 제외', () => {
    expect(cn('foo', false && 'bar', undefined, 'baz')).toBe('foo baz')
  })

  it('Tailwind 충돌 클래스 제거 (twMerge)', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4')
  })
})

// ────────────────────────────────────────────────────────────────
// formatDate - time_display
// ────────────────────────────────────────────────────────────────
describe('formatDate (time_display)', () => {
  it('time_display=true → 날짜 + 시간 + 요일', () => {
    const d = new Date('2026-04-12T14:30:00')
    expect(formatDate(d, true, true, false, true)).toBe('2026-04-12 14:30:00 (일)')
  })

  it('time_display=true, dayofweek=false → 날짜 + 시간만', () => {
    const d = new Date('2026-04-12T09:05:03')
    expect(formatDate(d, false, true, false, true)).toBe('2026-04-12 09:05:03')
  })
})

// ────────────────────────────────────────────────────────────────
// getDayOfWeek - 추가 케이스
// ────────────────────────────────────────────────────────────────
describe('getDayOfWeek (추가)', () => {
  it('잘못된 날짜 → 빈 문자열', () => {
    expect(getDayOfWeek('invalid')).toBe('')
  })
})

// ────────────────────────────────────────────────────────────────
// formatYmd
// ────────────────────────────────────────────────────────────────
describe('formatYmd', () => {
  it('Date 객체 → yyyyMMdd', () => {
    expect(formatYmd(new Date('2026-04-12T00:00:00'))).toBe('20260412')
  })

  it('yyyy-MM-dd 문자열 → yyyyMMdd', () => {
    expect(formatYmd('2026-04-12')).toBe('20260412')
  })

  it('yyyyMMdd 문자열 → 그대로 반환', () => {
    expect(formatYmd('20260412')).toBe('20260412')
  })
})

// ────────────────────────────────────────────────────────────────
// addDate
// ────────────────────────────────────────────────────────────────
describe('addDate', () => {
  it('yyyyMMdd + 1일', () => {
    const result = addDate('20260412', 1)
    expect(result.getFullYear()).toBe(2026)
    expect(result.getMonth()).toBe(3) // 0-indexed: 3 = 4월
    expect(result.getDate()).toBe(13)
  })

  it('yyyy-MM-dd - 1일', () => {
    const result = addDate('2026-04-12', -1)
    expect(result.getDate()).toBe(11)
  })

  it('Date 객체 + 7일', () => {
    const result = addDate(new Date('2026-04-12T00:00:00'), 7)
    expect(result.getDate()).toBe(19)
  })

  it('잘못된 입력 → Invalid Date', () => {
    const result = addDate('invalid', 1)
    expect(isNaN(result.getTime())).toBe(true)
  })
})

// ────────────────────────────────────────────────────────────────
// addYmd
// ────────────────────────────────────────────────────────────────
describe('addYmd', () => {
  it('yyyyMMdd + 1일 → yyyyMMdd 문자열', () => {
    expect(addYmd('20260412', 1)).toBe('20260413')
  })

  it('yyyy-MM-dd - 1일 → yyyyMMdd 문자열', () => {
    expect(addYmd('2026-04-12', -1)).toBe('20260411')
  })

  it('월 경계 이동', () => {
    expect(addYmd('20260430', 1)).toBe('20260501')
  })

  it('잘못된 입력 → 빈 문자열', () => {
    expect(addYmd('invalid', 1)).toBe('')
  })
})

// ────────────────────────────────────────────────────────────────
// formatCount - 추가 케이스
// ────────────────────────────────────────────────────────────────
describe('formatCount (추가)', () => {
  it('null 입력 → "-"', () => {
    expect(formatCount(null as unknown as undefined)).toBe('-')
  })

  it('defaultValue 지정', () => {
    expect(formatCount(undefined, '없음')).toBe('없음')
  })
})

// ────────────────────────────────────────────────────────────────
// formatCost
// ────────────────────────────────────────────────────────────────
describe('formatCost', () => {
  it('undefined 입력 → "0"', () => {
    expect(formatCost(undefined)).toBe('0')
  })

  it('null 입력 → "0"', () => {
    expect(formatCost(null)).toBe('0')
  })

  it('0 입력 → "0"', () => {
    expect(formatCost(0)).toBe('0')
  })

  it('천 단위 콤마 표시', () => {
    expect(formatCost(1500000)).toBe('1,500,000')
  })

  it('defaultValue 지정', () => {
    expect(formatCost(null, '-')).toBe('-')
  })
})
