# React 컴포넌트 만들기 — StarRating

> 목표: `<StarRating value={3} />` 처럼 사용할 수 있는 재사용 컴포넌트를 직접 만들고,
> `JangbiPage.tsx`의 만족도 표시에 적용해본다.

---

## 1. React 컴포넌트란?

React에서 컴포넌트는 **UI를 반환하는 함수**다.

```tsx
// 가장 단순한 컴포넌트
function Hello() {
  return <p>안녕하세요</p>
}

// 사용
<Hello />
```

컴포넌트가 강력한 이유는 **props**로 데이터를 받아 다르게 렌더링할 수 있기 때문이다.

```tsx
function Hello({ name }: { name: string }) {
  return <p>안녕하세요, {name}!</p>
}

// 사용
<Hello name="김도영" />   // → 안녕하세요, 김도영!
<Hello name="홍길동" />   // → 안녕하세요, 홍길동!
```

같은 컴포넌트를 **여러 곳에서 재사용**할 수 있다. 이것이 컴포넌트를 만드는 핵심 이유다.

---

## 2. 이 프로젝트의 컴포넌트 패턴

`frontend/src/components/` 폴더에 재사용 컴포넌트들이 있다.

```
components/
├── Toolbar.tsx          ← 모든 페이지에서 쓰는 네비게이션 바
├── ui/
│   ├── button.tsx       ← shadcn Button 컴포넌트
│   └── input.tsx        ← shadcn Input 컴포넌트
└── diary/
    └── DiarySummaryList.tsx
```

**실제 사용 예시** (`JangbiPage.tsx` 에서 Toolbar 컴포넌트 사용):
```tsx
import Toolbar from '@/components/Toolbar'

export default function JangbiPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Toolbar />    {/* ← 컴포넌트를 태그처럼 사용 */}
      <main>...</main>
    </div>
  )
}
```

---

## 3. StarRating 컴포넌트 설계

### 목표 동작

```tsx
<StarRating value={3} />   // ★★★
<StarRating value={2} />   // ★★☆
<StarRating value={1} />   // ★☆☆
```

### JangbiPage의 만족도 데이터

`JangbiPage.tsx`에서 만족도는 문자열 `'1'`, `'2'`, `'3'`으로 저장된다:

```tsx
// JangbiPage.tsx 현재 코드
const LVL_LABEL: Record<string, string> = { '3': '만족', '2': '보통', '1': '실망' }
const LVL_COLOR: Record<string, string> = {
  '1': 'bg-red-100 text-red-700',
  '2': 'bg-yellow-100 text-yellow-700',
  '3': 'bg-green-100 text-green-700',
}

// 테이블에서 뱃지로 표시 중
<span className={`... ${LVL_COLOR[j.lvl]}`}>
  {LVL_LABEL[j.lvl]}
</span>
```

`StarRating`은 이 `lvl` 값(`'1'`~`'3'`)을 받아서 별로 표시한다.

### Props 타입 정의

TypeScript에서 props 타입은 `interface`로 정의한다:

```tsx
interface StarRatingProps {
  value: number        // 1, 2, 3
  max?: number         // 최대 별 수 (기본값 3)
  size?: 'sm' | 'md'  // 크기 (기본값 'md')
}
```

`?`는 선택적 props (없어도 됨). 없을 때 기본값은 `=`로 지정한다:

```tsx
function StarRating({ value, max = 3, size = 'md' }: StarRatingProps) {
  ...
}
```

### 별 렌더링 로직

`Array.from({ length: max })`로 배열을 만들어 `map`으로 반복한다:

```tsx
Array.from({ length: 3 }, (_, i) => i + 1)
// → [1, 2, 3]

// i+1 <= value 이면 채워진 별(★), 아니면 빈 별(☆)
```

---

## 4. 실습

### 실습 1 — StarRating 컴포넌트 만들기

**파일 경로**: `frontend/src/components/StarRating.tsx`

**구현 목표**:
- `value` props로 1~3을 받아 해당 개수만큼 ★ 표시
- 나머지는 ☆ 표시
- `size` props로 sm(작게)/md(보통) 크기 지원

**힌트 — 전체 구조**:
```tsx
interface StarRatingProps {
  value: number
  max?: number
  size?: 'sm' | 'md'
}

export default function StarRating({ value, max = 3, size = 'md' }: StarRatingProps) {
  const sizeClass = size === 'sm' ? 'text-sm' : 'text-base'

  return (
    <span className={`inline-flex gap-0.5 ${sizeClass}`}>
      {Array.from({ length: max }, (_, i) => {
        const filled = i + 1 <= value
        return (
          <span key={i} className={filled ? 'text-yellow-400' : 'text-gray-300'}>
            {/* ★ 또는 ☆ 를 여기에 */}
          </span>
        )
      })}
    </span>
  )
}
```

**직접 채워야 할 부분**:
- `{/* ★ 또는 ☆ */}` → `filled`가 true면 `★`, false면 `☆`

---

### 실습 2 — JangbiPage.tsx에 적용

**파일 경로**: `frontend/src/pages/jangbi/JangbiPage.tsx`

**목표**: 현재 뱃지(`만족`/`보통`/`실망`) 옆에 `StarRating`을 추가한다.

**현재 코드** (`JangbiPage.tsx` 162~167번째 줄 근처):
```tsx
<td className="px-4 py-3 text-center">
  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${LVL_COLOR[j.lvl] ?? 'bg-gray-100 text-gray-500'}`}>
    {LVL_LABEL[j.lvl] ?? j.lvl}
  </span>
</td>
```

**변경 목표**:
```tsx
<td className="px-4 py-3 text-center">
  <div className="flex flex-col items-center gap-0.5">
    <StarRating value={Number(j.lvl)} size="sm" />
    <span className={`... 기존 뱃지 ...`}>
      {LVL_LABEL[j.lvl]}
    </span>
  </div>
</td>
```

**해야 할 일**:
1. `import StarRating from '@/components/StarRating'` 추가
2. 위 구조로 td 내용 수정
3. `fm.sh`로 개발서버 실행 후 장비 목록에서 별 표시 확인

---

### 실습 3 (심화) — 색상도 lvl에 따라 변경

**힌트**: `value`에 따라 별 색상을 다르게 하려면:

```tsx
// StarRating 컴포넌트 내부에서
const colorClass = value === 3 ? 'text-green-500'
                 : value === 2 ? 'text-yellow-400'
                 : 'text-red-400'
```

`filled` 별에만 `colorClass`를 적용하고, 빈 별은 `text-gray-200`으로 유지한다.

---

## 5. TypeScript 핵심 포인트

이 실습에서 사용한 TypeScript 개념:

| 개념 | 예시 | 설명 |
|------|------|------|
| interface | `interface StarRatingProps { value: number }` | props 타입 정의 |
| 선택적 props | `max?: number` | 없어도 되는 props |
| 기본값 | `max = 3` | props 기본값 |
| 유니온 타입 | `size?: 'sm' \| 'md'` | 허용되는 값 제한 |
| 타입 변환 | `Number(j.lvl)` | string → number 변환 |

---

## 다음 단계

> StarRating을 인터랙티브하게 만들고 싶다면 **React useState**를 공부하세요.
> `useState`로 클릭한 별 개수를 상태로 관리하면 클릭 가능한 평점 입력 UI가 됩니다.
>
> `/teach-pcms-react useState와 이벤트 핸들링 알려줘`
