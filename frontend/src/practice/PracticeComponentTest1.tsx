/**
 * 목적: DateRangePicker 컴포넌트 실습 및 테스트 페이지
 *
 * 사용법:
 *   <ComponentTest1 />
 *   /practice/component-test1 라우트에서 렌더링된다.
 *
 * props: 없음
 *
 * 실습 항목:
 *   1. 기본 모드 — Date 객체 반환 (column 레이아웃)
 *   2. 1라인 모드 — layout="row"
 *   3. "yyyy-MM-dd" 문자열 반환
 *   4. "yyyyMMdd" 문자열 반환 (API/DB Ymd 컬럼용)
 *   5. disabled 상태
 */
import { useState } from 'react'
import { DateRangePicker } from '@/shared/components/DateRangePicker'
import Toolbar from '@/shared/layout/Toolbar'

// ──────────────────────────────────────────
// 실습 1: Date 반환 (기본 컬럼 레이아웃)
// ──────────────────────────────────────────
function DateRangeDateModeExample() {
  const [start, setStart] = useState<Date | undefined>()
  const [end, setEnd]     = useState<Date | undefined>()

  return (
    <section className="p-6 border rounded-xl bg-white shadow-sm space-y-3">
      <h2 className="font-semibold text-base">1. 기본 모드 — Date 객체 반환 (column 레이아웃)</h2>
      <p className="text-sm text-muted-foreground">
        <code>returnFormat</code> 없이 사용. <code>onChange</code>는 <code>(Date | undefined, Date | undefined)</code>를 받는다.
      </p>
      <DateRangePicker
        title="조회기간"
        startDate={start}
        endDate={end}
        onChange={(s, e) => { setStart(s); setEnd(e) }}
      />
      <p className="text-sm">
        선택값:{' '}
        <span className="font-mono text-primary">
          {start ? start.toISOString().slice(0, 10) : '(없음)'} ~{' '}
          {end   ? end.toISOString().slice(0, 10)   : '(없음)'}
        </span>
      </p>
    </section>
  )
}

// ──────────────────────────────────────────
// 실습 2: 1라인(row) 레이아웃
// ──────────────────────────────────────────
function DateRangeRowExample() {
  const [start, setStart] = useState<string | undefined>()
  const [end, setEnd]     = useState<string | undefined>()

  return (
    <section className="p-6 border rounded-xl bg-white shadow-sm space-y-3">
      <h2 className="font-semibold text-base">2. 1라인 모드 — layout=&quot;row&quot;</h2>
      <p className="text-sm text-muted-foreground">
        라벨과 날짜 선택기가 가로 한 줄로 나란히 배치된다.
      </p>
      <DateRangePicker
        layout="row"
        title="조회기간"
        returnFormat="yyyy-MM-dd"
        startDate={start}
        endDate={end}
        onChange={(s, e) => { setStart(s); setEnd(e) }}
        buttonSize="sm"
      />
      <p className="text-sm">
        선택값:{' '}
        <span className="font-mono text-primary">
          {start || '(없음)'} ~ {end || '(없음)'}
        </span>
      </p>
    </section>
  )
}

// ──────────────────────────────────────────
// 실습 3: "yyyy-MM-dd" 문자열 반환
// ──────────────────────────────────────────
function DateRangeDashStringExample() {
  const [start, setStart] = useState('2026-04-01')
  const [end, setEnd]     = useState('2026-04-30')

  return (
    <section className="p-6 border rounded-xl bg-white shadow-sm space-y-3">
      <h2 className="font-semibold text-base">3. 문자열 모드 — yyyy-MM-dd 반환</h2>
      <p className="text-sm text-muted-foreground">
        <code>returnFormat=&quot;yyyy-MM-dd&quot;</code>. API 파라미터로 바로 사용 가능.
      </p>
      <DateRangePicker
        title="조회기간"
        returnFormat="yyyy-MM-dd"
        startDate={start}
        endDate={end}
        onChange={(s, e) => { setStart(s); setEnd(e) }}
      />
      <p className="text-sm">
        선택값:{' '}
        <span className="font-mono text-primary">
          {start || '(없음)'} ~ {end || '(없음)'}
        </span>
      </p>
    </section>
  )
}

// ──────────────────────────────────────────
// 실습 4: "yyyyMMdd" 문자열 반환
// ──────────────────────────────────────────
function DateRangeYmdStringExample() {
  const [start, setStart] = useState('')
  const [end, setEnd]     = useState('')

  return (
    <section className="p-6 border rounded-xl bg-white shadow-sm space-y-3">
      <h2 className="font-semibold text-base">4. 문자열 모드 — yyyyMMdd 반환 (DB Ymd용)</h2>
      <p className="text-sm text-muted-foreground">
        <code>returnFormat=&quot;yyyyMMdd&quot;</code>. DB의 8자리 Ymd 컬럼에 적합.
      </p>
      <DateRangePicker
        title="조회기간"
        returnFormat="yyyyMMdd"
        startDate={start}
        endDate={end}
        onChange={(s, e) => { setStart(s); setEnd(e) }}
        buttonSize="sm"
      />
      <p className="text-sm">
        선택값:{' '}
        <span className="font-mono text-primary">
          {start || '(없음)'} ~ {end || '(없음)'}
        </span>
      </p>
    </section>
  )
}

// ──────────────────────────────────────────
// 실습 5: disabled 상태
// ──────────────────────────────────────────
function DateRangeDisabledExample() {
  return (
    <section className="p-6 border rounded-xl bg-white shadow-sm space-y-3">
      <h2 className="font-semibold text-base">5. disabled 상태</h2>
      <p className="text-sm text-muted-foreground">
        <code>disabled</code> prop. 비활성화되어 조작 불가.
      </p>
      <DateRangePicker
        layout="row"
        title="조회기간"
        returnFormat="yyyy-MM-dd"
        startDate="2026-01-01"
        endDate="2026-12-31"
        onChange={() => {}}
        disabled
      />
    </section>
  )
}

// ──────────────────────────────────────────
// 페이지
// ──────────────────────────────────────────
export default function ComponentTest1() {
  return (
    <>
      <Toolbar />
      <main className="container mx-auto px-4 py-6 space-y-6">
        <DateRangeDateModeExample />
        <DateRangeRowExample />
        <DateRangeDashStringExample />
        <DateRangeYmdStringExample />
        <DateRangeDisabledExample />
      </main>
    </>
  )
}
