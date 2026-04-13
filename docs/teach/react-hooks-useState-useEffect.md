# React Hooks — useState · useEffect 실습

> 실습 페이지: `http://localhost:5173/practice/hooks`  
> 실습 파일: `frontend/src/practice/Practice02Hooks.tsx`

---

## 1. Hook이란?

React 16.8부터 도입된 **함수형 컴포넌트에서 상태와 생명주기를 다루는 함수**입니다.  
클래스 컴포넌트의 `this.state`, `componentDidMount` 등을 대체합니다.

```
컴포넌트가 렌더링될 때마다 Hook이 순서대로 실행됩니다.
Hook은 반드시 컴포넌트 최상위에서만 호출해야 합니다 (조건문/반복문 안 X).
```

---

## 2. useState — 컴포넌트 내부 상태 관리

### 기본 문법

```tsx
const [state, setState] = useState(초기값)
```

- `state` : 현재 값
- `setState` : 값을 바꾸는 함수 → 호출하면 **리렌더링** 발생
- `초기값` : 첫 렌더링 때만 사용됨

### 프로젝트 실제 사용 예 — `Toolbar.tsx`

```tsx
// Toolbar.tsx:105
const [activeMenu, setActiveMenu] = useState<string | null>(null)

function toggleMenu(key: string) {
  setActiveMenu((prev) => (prev === key ? null : key))
}
```

드롭다운 메뉴가 열려 있는 key를 상태로 관리합니다.  
`prev =>` 형태는 **이전 값을 기반으로 새 값을 계산**할 때 사용합니다.

### 프로젝트 실제 사용 예 — `TodoAddModal.tsx`

```tsx
// TodoAddModal.tsx:17
const [inputs, setInputs] = useState(['', '', '', '', ''])

function handleChange(index: number, value: string) {
  setInputs((prev) => prev.map((v, i) => (i === index ? value : v)))
}
```

배열을 상태로 관리할 때 **불변성**을 지켜야 합니다.  
`map`으로 새 배열을 만들어 setState에 넘깁니다.

### 자주 하는 실수

```tsx
// ❌ 직접 변경 — 리렌더링 안 됨
state.push('새 항목')
setState(state)

// ✅ 새 배열/객체 생성
setState([...state, '새 항목'])
```

---

## 3. useEffect — 렌더링 이후 부수 효과 처리

### 기본 문법

```tsx
useEffect(() => {
  // 실행할 코드

  return () => {
    // cleanup (선택) — 컴포넌트 언마운트 또는 deps 변경 직전에 실행
  }
}, [deps])  // deps 배열
```

| deps 배열 | 실행 시점 |
|-----------|----------|
| 생략 | 매 렌더링마다 |
| `[]` | 마운트 시 1회만 |
| `[a, b]` | 마운트 + a 또는 b가 바뀔 때마다 |

### 프로젝트 실제 사용 예 — `Toolbar.tsx`

```tsx
// Toolbar.tsx:62 — 드롭다운 외부 클릭 시 닫기
useEffect(() => {
  function handleClickOutside(e: MouseEvent) {
    if (ref.current && !ref.current.contains(e.target as Node)) {
      if (isOpen) onToggle()
    }
  }
  document.addEventListener('mousedown', handleClickOutside)

  return () => document.removeEventListener('mousedown', handleClickOutside)  // cleanup
}, [isOpen, onToggle])
```

`cleanup`이 없으면 이벤트 리스너가 계속 쌓입니다. `return () => ...`로 반드시 제거하세요.

### 프로젝트 실제 사용 예 — `PostEditPage.tsx`

```tsx
// PostEditPage.tsx:45 — API 데이터 로드 후 폼 초기화
useEffect(() => {
  if (!post) return
  setForm({
    title: post.title,
    author: post.author ?? '',
    baseYmd: post.baseYmd,
    content: post.content ?? '',
  })
  setFormReady(true)
}, [post])  // post가 바뀔 때(로드 완료)만 실행
```

---

## 4. useRef — 렌더링과 무관한 값 보관

```tsx
const ref = useRef<HTMLDivElement>(null)

// DOM 접근
<div ref={ref}>...</div>
ref.current?.focus()

// 값 보관 (변경해도 리렌더링 X)
const timerRef = useRef<number | null>(null)
```

useState와 차이점: **ref 변경은 리렌더링을 유발하지 않습니다.**

### 프로젝트 실제 사용 예 — `Toolbar.tsx`

```tsx
// Toolbar.tsx:60 — 드롭다운 DOM 참조
const ref = useRef<HTMLDivElement>(null)

// Toolbar.tsx:63 — contains()로 내부 클릭 여부 판단
if (ref.current && !ref.current.contains(e.target as Node)) { ... }
```

---

## 5. 실습 — `Practice02Hooks.tsx` 를 직접 완성하세요

파일 위치: `frontend/src/practice/Practice02Hooks.tsx`

파일을 열면 아래와 같은 **skeleton 코드**가 있습니다.  
주석을 읽고 빈 곳을 직접 채워 넣으세요.

### 실습 1: useState — 카운터

```
목표: + / - 버튼으로 숫자를 올리고 내리기
      숫자가 0 미만이 되면 빨간색으로 표시하기
```

### 실습 2: useState — 입력 폼

```
목표: 이름/이메일 입력 → '제출' 클릭 시 아래에 목록으로 표시
      목록 항목 클릭 시 삭제
```

### 실습 3: useEffect — 타이머

```
목표: 페이지 진입 시 1초마다 경과 시간(초) 표시
      페이지를 떠날 때(cleanup) 타이머를 정리하기
```

### 실습 4: useEffect + useState — 외부 클릭 감지

```
목표: '메뉴 열기' 버튼 클릭 시 드롭다운 표시
      드롭다운 외부 클릭 시 닫기 (Toolbar.tsx 참고)
```

---

## 6. 체크리스트

- [ ] `useState`의 setter에 함수형 업데이트 `prev => ...` 를 써봤다
- [ ] 배열 상태를 `map` / `filter`로 불변하게 업데이트했다
- [ ] `useEffect`의 deps 배열을 빈 배열 `[]` 과 값 포함 `[x]` 둘 다 써봤다
- [ ] `useEffect`에서 cleanup 함수를 반환했다
- [ ] `useRef`로 DOM 요소에 직접 접근했다

---

## 다음 단계

Hook의 기본을 익혔다면 아래 주제를 공부하세요.

- **React Router** (`useNavigate`, `useParams`, `useSearchParams`) — 페이지 이동과 URL 파라미터 처리
- **커스텀 Hook** — 반복되는 로직을 `useSomething` 함수로 추출하기
- **TanStack Query** (`useQuery`, `useMutation`) — 서버 데이터 페칭을 Hook으로 처리하기
