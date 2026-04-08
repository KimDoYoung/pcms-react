# 프론트엔드 기술 스택 상세

> 최종 업데이트: 2026-04-08

---

## 빌드 / 개발 도구

| 항목 | 버전 | 비고 |
|------|------|------|
| **Vite** | 7.3.1 | 개발 서버 (포트 5173) |
| **TypeScript** | 5.9.3 | strict 모드 |
| **@vitejs/plugin-react-swc** | 4.2.2 | SWC 기반 빠른 컴파일 |
| **ESLint** | 9.39.1 | eslint-plugin-react-hooks, react-refresh |

### 경로 별칭
```ts
// vite.config.ts
"@/" → "src/"
```

### shadcn 별칭
```
@/components     → src/components
@/components/ui  → src/components/ui
@/lib            → src/lib
@/hooks          → src/hooks
```

---

## UI 프레임워크

| 항목 | 버전 | 비고 |
|------|------|------|
| **React** | 19.2.0 | StrictMode 사용 |
| **Tailwind CSS** | 4.2.1 | Vite 플러그인 방식 (`@tailwindcss/vite`) |
| **shadcn/ui** | 3.8.5 | style: `new-york`, baseColor: `slate`, CSS Variables 사용 |
| **radix-ui** | 1.4.3 | shadcn/ui 기반 Primitives |
| **lucide-react** | 0.576.0 | 아이콘 라이브러리 |
| **tailwind-merge** | 3.5.0 | 클래스 충돌 방지 |
| **class-variance-authority** | 0.7.1 | 컴포넌트 변형(variants) 관리 |
| **tailwindcss-animate** | 1.0.7 | 애니메이션 유틸리티 |

---

## 라우팅

| 항목 | 버전 | 비고 |
|------|------|------|
| **React Router DOM** | 7.13.1 | SPA 방식 |

---

## 상태 관리

| 항목 | 버전 | 용도 |
|------|------|------|
| **Zustand** | 5.0.11 | 전역 클라이언트 상태 |
| **TanStack Query** | 5.90.21 | 서버 상태 / API 캐싱 |

### authStore 구조 (`src/store/authStore.ts`)
```ts
interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  setTokens: (access: string, refresh: string) => void
  clearAuth: () => void
}
```
- 토큰은 `localStorage`에 영속화
- `clearAuth()` 호출 시 localStorage 및 store 동시 초기화

---

## 폼 / 유효성 검사

| 항목 | 버전 | 비고 |
|------|------|------|
| **React Hook Form** | 7.71.2 | 폼 상태 관리 |
| **Zod** | 4.3.6 | 스키마 기반 유효성 검사 |
| **@hookform/resolvers** | 5.2.2 | RHF ↔ Zod 연결 |

---

## HTTP 클라이언트

| 항목 | 버전 | 비고 |
|------|------|------|
| **Axios** | 1.13.6 | JWT 인터셉터 적용 |

### apiClient 구조 (`src/lib/apiClient.ts`)
- `baseURL`: `http://localhost:8585/pcms`
- **Request 인터셉터**: Zustand store에서 `accessToken` 읽어 `Authorization: Bearer` 헤더 자동 주입
- **Response 인터셉터**:
  - 정상 응답: `response.data`를 직접 반환 (래핑 제거)
  - 401 응답: `clearAuth()` 호출 후 `/login`으로 리다이렉트

```ts
// 사용 예
const data = await apiClient.get<MyType>('/api/endpoint')
```

---

## 그리드

| 항목 | 버전 | 비고 |
|------|------|------|
| **AG Grid Community** | 35.1.0 | 무료 버전 |
| **ag-grid-react** | 35.1.0 | React 바인딩 |

---

## 주요 타입 정의

### ApNode (`src/types/apnode.ts`)
Unix 파일 트리 구조를 표현하는 타입.

```ts
type NodeType = 'F' | 'D' | 'L'  // File / Directory / Link

interface ApNode {
  id: string
  nodeType: NodeType
  parentId: string | null
  name: string
  depth: number
  createDt: string
  modifyDt: string
  childCount: number   // D 전용
  totalSize: number    // D 전용
  linkTargetId?: string  // L 전용
  brokenLink?: boolean   // L 전용
  fileUrl?: string       // F / L(resolved) 공통
  originalName?: string
  fileSize?: number
  contentType?: string
  width?: number
  height?: number
}
```

---

## 현재 구현 상태

- 패키지 설치 및 기본 설정 완료
- `App.tsx` / `main.tsx`는 Vite 기본 스캐폴드 상태 (실제 구현 미시작)
- 구현 완료된 기반 코드:
  - `src/lib/apiClient.ts` — Axios 인스턴스 + 인터셉터
  - `src/store/authStore.ts` — JWT 토큰 상태 관리
  - `src/types/apnode.ts` — 파일 트리 타입 정의
