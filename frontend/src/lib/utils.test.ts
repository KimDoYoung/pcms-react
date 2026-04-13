import { describe, it, expect } from 'vitest'
import { formatDate, getDayOfWeek, formatFileSize, formatCount } from './utils'

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
