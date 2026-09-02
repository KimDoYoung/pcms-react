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
