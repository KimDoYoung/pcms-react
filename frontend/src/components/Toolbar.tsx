import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { apiClient } from '@/lib/apiClient'
import wizardImg from '@/assets/wizard.png'

interface MenuItem {
  label: string
  to: string
}

interface MenuGroup {
  key: string
  label: string
  items: MenuItem[]
}

const menuGroups: MenuGroup[] = [
  {
    key: 'diary',
    label: '📖 일지',
    items: [
      { label: '✏️ 일지기록', to: '/diary/register' },
      { label: '🔍 일지찾기', to: '/diary' },
      { label: '📅 달력', to: '/calendar' },
    ],
  },
  {
    key: 'board',
    label: '📝 게시판',
    items: [
      { label: '✍️ 게시판관리', to: '/boards' },
    ],
  },
  {
    key: 'tech',
    label: '🔧 Tech',
    items: [
      { label: '🖥️ 장비', to: '/jangbi' },
      { label: '📂 파일관리', to: '/apnode' },
    ],
  },
]

function DropdownMenu({ group, isOpen, onToggle }: {
  group: MenuGroup
  isOpen: boolean
  onToggle: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        if (isOpen) onToggle()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onToggle])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={onToggle}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 ${isOpen ? 'bg-blue-50 text-blue-600' : ''}`}
      >
        <span>{group.label}</span>
        <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : 'opacity-50'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-20">
          <div className="py-1.5">
            {group.items.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={onToggle}
                className="block px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-blue-600 font-medium transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function Toolbar() {
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const navigate = useNavigate()
  const { accessToken, userNm, clearAuth } = useAuthStore()

  const { data: health } = useQuery<{ version: string }>({
    queryKey: ['health'],
    queryFn: () => apiClient.get('/health'),
    staleTime: Infinity,
  })
  const isLoggedIn = !!accessToken

  function toggleMenu(key: string) {
    setActiveMenu((prev) => (prev === key ? null : key))
  }

  async function handleLogout() {
    try {
      await apiClient.post('/auth/logout')
    } catch {
      // 실패해도 클라이언트 상태는 초기화
    }
    clearAuth()
    navigate('/')
  }

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <nav className="container mx-auto px-6 h-16 flex items-center justify-between">

        {/* 왼쪽: 로고 + 메뉴 */}
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2.5 group">
            <img src={wizardImg} alt="logo" className="w-9 h-9 rounded-full object-cover shadow-md" />
            <span className="text-xl font-bold text-gray-800 tracking-tight group-hover:text-blue-600 transition-colors">
              PCMS{health?.version && <span className="text-xs font-normal text-gray-400 ml-1">(ver:{health.version})</span>}
            </span>
          </Link>

          {/* 로그인 시에만 메뉴 표시 */}
          {isLoggedIn && (
            <div className="flex items-center gap-1">
              {menuGroups.map((group) => (
                <DropdownMenu
                  key={group.key}
                  group={group}
                  isOpen={activeMenu === group.key}
                  onToggle={() => toggleMenu(group.key)}
                />
              ))}
            </div>
          )}
        </div>

        {/* 오른쪽: 사용자 정보 or 로그인 */}
        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <div className="flex items-center gap-3 pl-6 border-l border-gray-100">
              <span className="text-sm font-medium text-gray-600">{userNm}</span>
              <button
                onClick={handleLogout}
                className="text-xs px-3 py-1.5 rounded-full border border-gray-300 hover:bg-gray-50 hover:text-red-600 hover:border-red-200 transition-colors"
              >
                로그아웃
              </button>
            </div>
          ) : (
            <Link to="/login" className="text-sm font-medium text-blue-600 hover:text-blue-700">
              로그인
            </Link>
          )}
        </div>
      </nav>
    </header>
  )
}

export default Toolbar
