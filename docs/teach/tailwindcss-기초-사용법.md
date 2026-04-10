# Tailwind CSS 기초 사용법

> 이 문서는 pcms-react 프로젝트에서 Tailwind CSS가 어떻게 사용되는지 직접 코딩하면서 익히는 것을 목표로 합니다.

---

## 1. Tailwind CSS란?

Tailwind CSS는 **유틸리티-퍼스트(Utility-First)** CSS 프레임워크입니다.

기존 방식은 클래스 이름을 직접 짓고 CSS 파일을 따로 작성합니다:

```css
/* 기존 방식 */
.header {
  display: flex;
  align-items: center;
  padding: 12px 24px;
  background-color: white;
}
```

Tailwind는 미리 만들어진 작은 클래스를 조합해서 스타일을 직접 HTML/JSX에 적습니다:

```tsx
// Tailwind 방식
<header className="flex items-center px-6 py-3 bg-white">
```

CSS 파일을 별도로 만들 필요가 없고, 클래스 이름을 고민할 필요도 없습니다.

---

## 2. 이 프로젝트에서의 설정 (Tailwind v4)

Tailwind v4부터는 설정 방식이 바뀌었습니다. `tailwind.config.js` 파일이 없습니다.

**`frontend/vite.config.ts`** — Vite 플러그인으로 등록:
```ts
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),  // 이 한 줄로 Tailwind가 활성화됩니다
  ],
})
```

**`frontend/src/index.css`** — CSS에서 import:
```css
@import "tailwindcss";  /* v4 방식. v3의 @tailwind directives 대신 */
```

---

## 3. 핵심 유틸리티 클래스

### 3-1. 레이아웃: flex

`flex`는 가장 자주 쓰는 클래스입니다. 자식 요소들을 가로로 나열합니다.

| 클래스 | 의미 |
|--------|------|
| `flex` | `display: flex` |
| `items-center` | 세로 중앙 정렬 |
| `justify-between` | 양끝 정렬 |
| `gap-4` | 자식 요소 간격 16px |

**프로젝트 실제 코드** (`Toolbar.tsx:125`):
```tsx
<nav className="container mx-auto px-6 h-16 flex items-center justify-between">
  {/* 왼쪽: 로고 + 메뉴 */}
  <div className="flex items-center gap-8">
    ...
  </div>
  {/* 오른쪽: 사용자 정보 */}
  <div className="flex items-center gap-4">
    ...
  </div>
</nav>
```

`justify-between`으로 왼쪽과 오른쪽을 양끝으로 밀어냅니다.

---

### 3-2. 간격: padding / margin

`p`, `m` 뒤에 방향과 숫자를 붙입니다. 숫자 1 = 4px.

| 클래스 | 의미 |
|--------|------|
| `px-6` | 좌우 padding 24px |
| `py-2` | 상하 padding 8px |
| `mt-2` | 위 margin 8px |
| `gap-1.5` | flex/grid 간격 6px |

**프로젝트 실제 코드** (`Toolbar.tsx:69`):
```tsx
<button className="flex items-center gap-1.5 px-3 py-2 rounded-lg ...">
```

---

### 3-3. 색상

배경색은 `bg-`, 글자색은 `text-`로 시작합니다. `hover:` 접두사로 마우스 올렸을 때 색상을 바꿀 수 있습니다.

| 클래스 | 의미 |
|--------|------|
| `bg-white` | 흰 배경 |
| `text-gray-600` | 회색 글자 |
| `hover:bg-blue-50` | 호버 시 연파랑 배경 |
| `hover:text-blue-600` | 호버 시 파랑 글자 |

**프로젝트 실제 코드** (`Toolbar.tsx:69`):
```tsx
<button className="... text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200">
```

`transition-all duration-200`을 함께 쓰면 색상 변화가 부드럽게 애니메이션됩니다.

---

### 3-4. 테두리 / 둥글기 / 그림자

| 클래스 | 의미 |
|--------|------|
| `rounded-lg` | 테두리 둥글게 |
| `border` | 1px 테두리 |
| `border-gray-200` | 테두리 색상 |
| `shadow-sm` | 작은 그림자 |
| `shadow-lg` | 큰 그림자 |

**프로젝트 실제 코드** (`Toolbar.tsx:78`):
```tsx
<div className="absolute left-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-20">
```

드롭다운 메뉴에 `rounded-xl shadow-lg border`를 조합해서 카드처럼 떠 있는 느낌을 줍니다.

**BoardsPage.tsx에서의 색상 동적 할당 패턴**:
```tsx
const CONTENT_TYPE_COLOR: Record<string, string> = {
  html: 'bg-green-100 text-green-700',
  markdown: 'bg-purple-100 text-purple-700',
  text: 'bg-gray-100 text-gray-600',
}

// 사용
<span className={`px-2 py-0.5 rounded text-xs font-medium ${CONTENT_TYPE_COLOR[contentType]}`}>
```

데이터에 따라 다른 색상을 보여줄 때 객체로 클래스를 미리 정의해두는 패턴입니다.

---

## 4. React에서 className 사용법

### 기본: 문자열 직접 작성
```tsx
<div className="flex items-center gap-4 bg-white px-6 py-3">
```

### 조건부 스타일링: 템플릿 리터럴
```tsx
// isOpen 상태에 따라 클래스를 다르게 적용
<button className={`px-3 py-2 rounded-lg ${isOpen ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`}>
```

**프로젝트 실제 코드** (`Toolbar.tsx:69`):
```tsx
className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 ${isOpen ? 'bg-blue-50 text-blue-600' : ''}`}
```

### cn() 유틸리티 (이 프로젝트의 패턴)

`frontend/src/lib/utils.ts`에 정의된 `cn()` 함수:
```ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

- `clsx`: 조건부 클래스를 깔끔하게 처리
- `twMerge`: Tailwind 클래스 충돌을 자동으로 해결 (예: `p-4`와 `px-2`가 겹치면 `px-2`가 이기도록)

사용법:
```tsx
import { cn } from '@/lib/utils'

<div className={cn(
  "flex items-center px-4 py-2",
  isActive && "bg-blue-50 text-blue-600",
  disabled && "opacity-50 cursor-not-allowed"
)}>
```

---

## 5. 실습 과제

> **직접 파일을 만들고 코딩해보세요.** 아래 경로에 파일을 생성하고 `fm.sh`로 개발서버를 실행한 뒤 브라우저에서 확인하세요.

### 실습 1 — Flex 헤더 만들기

**파일 경로**: `frontend/src/pages/practice/Practice01Flex.tsx`

**목표**: 아래 레이아웃을 Tailwind flex로 구현하세요.
```
[ LOGO ]          [ 메뉴1 ] [ 메뉴2 ]          [ 로그인 ]
```
- 배경: 흰색, 아래 border 있음, sticky (스크롤해도 상단 고정)
- 왼쪽: "LOGO" 텍스트 (굵게, 파랑)
- 가운데: "메뉴1", "메뉴2" 버튼 (호버 시 배경색 변경)
- 오른쪽: "로그인" 버튼 (border 있는 작은 버튼)

**힌트 클래스**:
```
sticky top-0 z-50 bg-white border-b border-gray-100
flex items-center justify-between
container mx-auto px-6 h-16
text-blue-600 font-bold text-xl
px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors
text-sm px-4 py-1.5 border rounded-full
```

---

### 실습 2 — 카드 컴포넌트 만들기

**파일 경로**: `frontend/src/pages/practice/Practice02Card.tsx`

**목표**: 아래 구조의 카드를 3개 나열하세요.
```
┌─────────────────────┐
│ [뱃지: HTML]        │
│ 제목                │
│ 설명 텍스트         │
│              [버튼] │
└─────────────────────┘
```
- 카드: 흰 배경, 둥근 테두리, 그림자, 호버 시 그림자 더 커짐
- 뱃지: 콘텐츠 타입별 색상 다르게 (BoardsPage의 CONTENT_TYPE_COLOR 패턴 참고)
- 버튼: 파랑 배경, 흰 글자

**힌트 클래스**:
```
grid grid-cols-3 gap-4 p-8
bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-5
flex flex-col gap-2
px-2 py-0.5 rounded text-xs font-medium (뱃지)
bg-green-100 text-green-700
text-lg font-semibold text-gray-800
text-sm text-gray-500
mt-auto self-end
bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm
```

---

## 다음 단계

Tailwind CSS 기초를 익혔으면 다음 단계로 넘어가세요.

> **다음**: **shadcn/ui** 컴포넌트를 사용해서 Tailwind를 더 효율적으로 활용하는 법을 공부하세요.
> shadcn/ui는 이 프로젝트에서 `Button`, `Input`, `Dialog` 등에 이미 사용되고 있습니다 (`frontend/src/components/ui/`).
> `/teach-pcms-react shadcn/ui 기초 사용법 알려줘` 로 다음 문서를 생성할 수 있습니다.
