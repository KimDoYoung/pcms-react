/**
 * DatePicker 컴포넌트 연습 페이지
 *
 * 세 가지 returnFormat 모드를 나란히 놓고 동작을 확인한다.
 *   1. returnFormat 없음  → Date 객체 반환
 *   2. returnFormat="yyyy-MM-dd" → "2026-04-16" 형식 문자열 반환
 *   3. returnFormat="yyyyMMdd"   → "20260416" 형식 문자열 반환
 */
import { useState } from 'react'
import { DatePicker } from '@/shared/components/DatePicker'
import Toolbar from '@/shared/layout/Toolbar'

// ──────────────────────────────────────────
// 실습 1: Date 반환 (기본)
// ──────────────────────────────────────────
function DateModeExample() {
  const [date, setDate] = useState<Date | undefined>()

  return (
    <section className="p-6 border rounded-xl bg-white shadow-sm space-y-3">
      <h2 className="font-semibold text-base">1. 기본 모드 — Date 반환</h2>
      <p className="text-sm text-muted-foreground">
        <code>returnFormat</code> 없이 사용. <code>onChange</code>는{' '}
        <code>Date | undefined</code>를 받는다.
      </p>
      <DatePicker value={date} onChange={setDate} />
      <p className="text-sm">
        선택값:{' '}
        <span className="font-mono text-primary">
          {date ? date.toISOString() : '(없음)'}
        </span>
      </p>
    </section>
  )
}

// ──────────────────────────────────────────
// 실습 2: "yyyy-MM-dd" 문자열 반환
// ──────────────────────────────────────────
function StringDashModeExample() {
  const [dateStr, setDateStr] = useState<string | undefined>()

  return (
    <section className="p-6 border rounded-xl bg-white shadow-sm space-y-3">
      <h2 className="font-semibold text-base">2. 문자열 모드 — yyyy-MM-dd</h2>
      <p className="text-sm text-muted-foreground">
        <code>returnFormat="yyyy-MM-dd"</code>. API 파라미터로 바로 사용 가능.
      </p>
      <DatePicker
        returnFormat="yyyy-MM-dd"
        value={dateStr}
        onChange={setDateStr}
        placeholder="yyyy-MM-dd 형식"
      />
      <p className="text-sm">
        선택값:{' '}
        <span className="font-mono text-primary">{dateStr ?? '(없음)'}</span>
      </p>
    </section>
  )
}

// ──────────────────────────────────────────
// 실습 3: "yyyyMMdd" 문자열 반환
// ──────────────────────────────────────────
function StringYmdModeExample() {
  const [ymd, setYmd] = useState<string | undefined>()

  return (
    <section className="p-6 border rounded-xl bg-white shadow-sm space-y-3">
      <h2 className="font-semibold text-base">3. 문자열 모드 — yyyyMMdd</h2>
      <p className="text-sm text-muted-foreground">
        <code>returnFormat="yyyyMMdd"</code>. DB의 Ymd 컬럼에 바로 사용 가능.
      </p>
      <DatePicker
        returnFormat="yyyyMMdd"
        value={ymd}
        onChange={setYmd}
        placeholder="yyyyMMdd 형식"
      />
      <p className="text-sm">
        선택값:{' '}
        <span className="font-mono text-primary">{ymd ?? '(없음)'}</span>
      </p>
    </section>
  )
}

// ──────────────────────────────────────────
// 실습 4: disabled 상태
// ──────────────────────────────────────────
function DisabledExample() {
  const [date] = useState<Date>(new Date())

  return (
    <section className="p-6 border rounded-xl bg-white shadow-sm space-y-3">
      <h2 className="font-semibold text-base">4. disabled 상태</h2>
      <p className="text-sm text-muted-foreground">
        <code>disabled</code> prop. 값은 표시되지만 변경 불가.
      </p>
      <DatePicker value={date} onChange={() => {}} disabled />
    </section>
  )
}

// ──────────────────────────────────────────
// 페이지
// ──────────────────────────────────────────
export default function ComponentTest1() {
  return (
    <>
      <Toolbar title="DatePicker 컴포넌트 연습" />
      <main className="container mx-auto px-4 py-6 space-y-6">
        <DateModeExample />
        <StringDashModeExample />
        <StringYmdModeExample />
        <DisabledExample />
      </main>
    </>
  )
}
