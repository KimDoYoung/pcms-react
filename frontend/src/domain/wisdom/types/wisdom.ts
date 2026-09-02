/**
 * 목적: 격언(Wisdom) 도메인 관련 타입 정의
 * 
 * 용도:
 *   - Wisdom 데이터 구조
 *   - Wisdom 검색/페이징 쿼리 파라미터 및 응답 인터페이스
 *   - 폼 입력 및 도메인/카테고리 기본 상수
 */

export interface Wisdom {
  id: string
  domain: string
  document: string
  category: string
  authorSource?: string | null
  keywords?: string[] | null
  contextTrigger?: string | null
  lastModifiedAt?: string | null
}

export interface WisdomSearchQuery {
  domain?: string
  category?: string
  keyword?: string
  authorSource?: string
  contextTrigger?: string
  page?: number
  size?: number
}

export interface WisdomPageResponse {
  page: number
  size: number
  total: number
  dtoList: Wisdom[]
}

export interface WisdomFormData {
  id: string
  domain: string
  document: string
  category: string
  authorSource: string
  keywords: string[]
  contextTrigger: string
}

export const DEFAULT_DOMAINS = [
  { value: 'LIFE', label: '인생/인문 (LIFE)' },
  { value: 'STOCK', label: '주식/투자 (STOCK)' },
] as const

export const DEFAULT_CATEGORIES: Record<string, { value: string; label: string }[]> = {
  LIFE: [
    { value: 'COMMUNICATION', label: '소통/대화 (COMMUNICATION)' },
    { value: 'HAPPINESS', label: '행복/삶의태도 (HAPPINESS)' },
    { value: 'MOTIVATION', label: '동기부여/성취 (MOTIVATION)' },
    { value: 'RELATIONSHIP', label: '인간관계 (RELATIONSHIP)' },
    { value: 'HABIT', label: '습관/실천 (HABIT)' },
  ],
  STOCK: [
    { value: 'MINDSET', label: '투자심리/멘탈 (MINDSET)' },
    { value: 'RISK', label: '리스크관리 (RISK)' },
    { value: 'TIMING', label: '매매타이밍 (TIMING)' },
    { value: 'PORTFOLIO', label: '포트폴리오 (PORTFOLIO)' },
    { value: 'VOLUME', label: '거래량/수급 (VOLUME)' },
  ],
}

export const CONTEXT_TRIGGER_PRESETS = [
  // LIFE (인생/인문)
  { value: 'burnout', label: '번아웃', group: 'LIFE' },
  { value: 'lethargy', label: '무기력', group: 'LIFE' },
  { value: 'procrastination', label: '미루기/나태', group: 'LIFE' },
  { value: 'anger', label: '분노/화', group: 'LIFE' },
  { value: 'conflict', label: '갈등/대립', group: 'LIFE' },
  { value: 'gossip', label: '말실수/소문', group: 'LIFE' },
  { value: 'loneliness', label: '외로움/고독', group: 'LIFE' },
  { value: 'relationship', label: '인간관계 고민', group: 'LIFE' },
  { value: 'gratitude', label: '감사/겸손', group: 'LIFE' },
  // STOCK (주식/투자)
  { value: 'overtrading', label: '잦은매매/뇌동매매', group: 'STOCK' },
  { value: 'bear_market', label: '약세장/하락장', group: 'STOCK' },
  { value: 'loss_streak', label: '연속 손실', group: 'STOCK' },
  { value: 'credit_ratio_high', label: '신용과열/레버리지', group: 'STOCK' },
  { value: 'overheated_market', label: '시장 과열', group: 'STOCK' },
  { value: 'profit_target_reached', label: '목표수익 도달', group: 'STOCK' },
  { value: 'greed_control', label: '탐욕 제어/익절', group: 'STOCK' },
] as const
