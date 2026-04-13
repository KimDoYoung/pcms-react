/**
 * React Hooks 실습 페이지
 * 문서: docs/teach/react-hooks-useState-useEffect.md
 *
 * 아래 TODO 주석을 읽고 직접 코드를 채워 넣으세요.
 * 각 실습은 독립적으로 완성할 수 있습니다.
 */
import { useState, useEffect, useRef } from 'react'
import Toolbar from '@/shared/components/Toolbar'

// ──────────────────────────────────────────
// 실습 0: 배열 상태 및 init 를 함수로
// ──────────────────────────────────────────
const heavyWork = () => {
    // 무거운 작업 시뮬레이션 (예: 복잡한 계산, API 호출 등)
    console.log('heavyWork 실행 중...')
    return ['Alice', 'Bob', 'Charlie']
}

function ArrayState() {
    const [names, setNames] = useState(() => {
        console.log('초기값 계산 중...')
        return heavyWork();
    });
    const [input, setInput] = useState('')
    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInput(e.target.value)
    }

    return (
        <section className="p-6 border rounded-xl bg-white shadow-sm">
            <input type="text" value={input} onChange={handleInput}  />
            <button onClick={() => setNames([...names, input])}>추가</button>
            <ul>
                {names.map((name, index) => <li key={index}>{name}</li>)}
            </ul>
        </section>
    )

}

// ──────────────────────────────────────────
// 실습 1: useState — 카운터
// ──────────────────────────────────────────
function Counter() {
  // TODO 1-1: count 상태를 선언하세요. 초기값은 0
  // const [count, setCount] = useState(0)
  const [count, setCount] = useState(0)

  // TODO 1-2: increment, decrement 함수를 만드세요
  // function increment() { ... }
  // function decrement() { ... }

  return (
    <section className="p-6 border rounded-xl bg-white shadow-sm">
      <h2 className="text-lg font-bold mb-4">실습 1: 카운터</h2>
      <div className="flex items-center gap-4">
        {/* TODO 1-3: 버튼 onClick에 함수를 연결하세요 */}
        <button className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300" onClick={() => setCount(count - 1)}>-</button>

        {/* TODO 1-4: count 값을 표시하고, 0 미만이면 텍스트를 빨간색으로 바꾸세요 */}
        <span className={`text-2xl font-mono w-16 text-center ${count < 0 ? 'text-red-500' : ''}`}>{count}</span>

        <button className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300" onClick={() => setCount(count + 1)}>+</button>
      </div>
      <p className="text-xs text-gray-400 mt-3">힌트: className에 조건부로 text-red-500을 추가하세요</p>
    </section>
  )
}

// ──────────────────────────────────────────
// 실습 2: useState — 입력 폼 + 목록
// ──────────────────────────────────────────
interface Member {
  id: number
  name: string
  email: string
}

function MemberForm() {
  // TODO 2-1: name, email 상태를 선언하세요
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  // TODO 2-2: members 배열 상태를 선언하세요 (Member[])
  const [members, setMembers] = useState<Member[]>([])

  // TODO 2-3: handleSubmit 함수를 만드세요
  //   - name, email이 비어있으면 return
  //   - members 배열에 새 항목 추가 (id는 Date.now() 사용)
  //   - name, email 초기화

  // TODO 2-4: handleDelete 함수를 만드세요
  //   - id로 해당 항목을 배열에서 제거 (filter 사용)

  return (
    <section className="p-6 border rounded-xl bg-white shadow-sm">
      <h2 className="text-lg font-bold mb-4">실습 2: 입력 폼 + 목록</h2>
      <div className="flex gap-2 mb-4">
        <input
          placeholder="이름"
          className="border rounded px-3 py-2 text-sm flex-1"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          placeholder="이메일"
          className="border rounded px-3 py-2 text-sm flex-1"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {/* TODO: onClick에 handleSubmit 연결 */}
        <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
          onClick={() => {
            if (name.trim() === '' || email.trim() === '') return
            setMembers([...members, { id: Date.now(), name, email }])
            setName('')
            setEmail('')
          }}
        >
          추가
        </button>
      </div>

      {/* TODO: members 배열을 map으로 렌더링하세요 */}
      {/* 각 항목 클릭 시 handleDelete 호출 */}
      <ul className="space-y-1">
        {members.length === 0 ? (
          <li className="text-sm text-gray-400 italic">항목이 없습니다.</li>
        ) : (
          members.map((member) => (
            <li key={member.id} className="flex justify-between items-center">
              <span>{member.name} ({member.email})</span>
              <button
                className="text-red-500 text-sm"
                onClick={() => setMembers(members.filter((m) => m.id !== member.id))}
              >
                삭제
              </button>
            </li>
          ))
        )}
      </ul>
    </section>
  )
}

// ──────────────────────────────────────────
// 실습 3: useEffect — 타이머
// ──────────────────────────────────────────
function Timer() {
  // TODO 3-1: seconds 상태를 선언하세요. 초기값 0
  const [seconds, setSeconds] = useState(0)
  // TODO 3-2: running 상태를 선언하세요. 초기값 false
  const [running, setRunning] = useState(false)

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setSeconds(prev => prev + 1), 1000)
    // cleanup 함수에서 타이머를 정리하세요 (clearInterval)
    return () => clearInterval(id)
  }, [running])

  return (
    <section className="p-6 border rounded-xl bg-white shadow-sm">
      <h2 className="text-lg font-bold mb-4">실습 3: 타이머</h2>
      <div className="flex items-center gap-4">
        {/* TODO: seconds 값 표시 */}
        <span className="text-3xl font-mono">{seconds}초</span>
        {/* TODO: 시작/정지 토글 버튼 */}
        <button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600" 
                onClick={() => setRunning(!running)}
        >
          {running ? '정지' : '시작'}
        </button>
        {/* TODO: 초기화 버튼 — seconds를 0으로, running을 false로 */}
        <button className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300" 
                onClick={() => {
                  setSeconds(0)
                  setRunning(false)
                }}
        >
          초기화
        </button>
      </div>
      <p className="text-xs text-gray-400 mt-3">힌트: cleanup이 없으면 타이머가 중첩됩니다</p>
    </section>
  )
}

// ──────────────────────────────────────────
// 실습 4: useRef + useEffect — 외부 클릭 감지
// ──────────────────────────────────────────
function DropdownPractice() {
  // TODO 4-1: open 상태를 선언하세요. 초기값 false
  const [open, setOpen] = useState(false)
  // TODO 4-2: ref를 선언하세요 (useRef<HTMLDivElement>(null))
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // TODO 4-3: mousedown 이벤트 리스너를 추가하세요
    //   ref.current.contains(e.target) 로 내부 클릭인지 확인
    //   외부 클릭이면 open을 false로 설정
    //   cleanup에서 removeEventListener 호출
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
    // 힌트: Toolbar.tsx의 DropdownMenu 컴포넌트(62~70번째 줄)를 참고하세요
  }, [/* TODO: deps */])

  return (
    <section className="p-6 border rounded-xl bg-white shadow-sm">
      <h2 className="text-lg font-bold mb-4">실습 4: 외부 클릭으로 닫히는 드롭다운</h2>

      {/* TODO 4-4: ref를 이 div에 달아주세요 */}
      <div className="relative inline-block">
        <button
          className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
          onClick={() => setOpen(!open)}
        >
          메뉴 열기
        </button>

        {/* TODO 4-5: open이 true일 때만 보이도록 조건부 렌더링 */}
        {open && (
          <div className="absolute left-0 mt-2 w-40 bg-white border rounded-lg shadow-lg p-2 space-y-1" ref={ref}>
            <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded">항목 A</button>
            <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded">항목 B</button>
            <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded">항목 C</button>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 mt-3">드롭다운 바깥 영역을 클릭하면 닫혀야 합니다</p>
    </section>
  )
}

// ──────────────────────────────────────────
// 메인 페이지
// ──────────────────────────────────────────
export default function Practice02Hooks() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Toolbar />
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">React Hooks 실습</h1>
          <p className="text-sm text-gray-500 mt-1">
            각 실습의 TODO 주석을 읽고 코드를 완성하세요.
            참고 문서: <code className="bg-gray-100 px-1 rounded">docs/teach/react-hooks-useState-useEffect.md</code>
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <ArrayState />
          <Counter />
          <MemberForm />
          <Timer />
          <DropdownPractice />
        </div>
      </main>
    </div>
  )
}
