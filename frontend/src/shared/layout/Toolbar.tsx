import { useState, useRef, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Settings, Menu, X, ChevronRight, LogOut, User, LayoutGrid } from 'lucide-react'
import { useAuthStore } from '@/shared/store/authStore'
import { useTabStore } from '@/shared/layout/tabStore'
import { useTabContext } from '@/shared/layout/TabContext'
import { apiClient } from '@/lib/apiClient'
import { getMenuGroups, type MenuItem, type MenuGroup } from '@/shared/layout/routeConfig'
import wizardImg from '@/assets/wizard.png'
import { Button } from '@/shared/components/ui/button'

function DropdownMenu({ group, isOpen, onToggle, onOpenTab }: {
  group: MenuGroup
  isOpen: boolean
  onToggle: () => void
  onOpenTab: (item: MenuItem) => void
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
              <button
                key={item.to}
                onClick={() => { onOpenTab(item); onToggle() }}
                className="block w-full text-left px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-blue-600 font-medium transition-colors"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function Toolbar() {
  const { isInsideTab } = useTabContext()
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [expandedMobileGroups, setExpandedMobileGroups] = useState<Set<string>>(new Set())
  const navigate = useNavigate()
  const { accessToken, userNm, clearAuth } = useAuthStore()

  // routeConfig에서 동적으로 메뉴 그룹 생성
  const menuGroups = useMemo(() => getMenuGroups(), [])

  const { data: health } = useQuery<{ version: string }>({
    queryKey: ['health'],
    queryFn: () => apiClient.get('/health'),
    staleTime: Infinity,
  })
  const isLoggedIn = !!accessToken

  // 모달 오픈 시 본문 스크롤 방지
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'auto'
    }
  }, [isMobileMenuOpen])

  if (isInsideTab) return null

  function toggleMenu(key: string) {
    setActiveMenu((prev) => (prev === key ? null : key))
  }

  function toggleMobileGroup(key: string) {
    setExpandedMobileGroups(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function handleOpenTab(item: MenuItem) {
    const existing = useTabStore.getState().tabs.find(t => t.id === item.to)
    setIsMobileMenuOpen(false)
    if (existing) {
      navigate(existing.path + (existing.search || ''))
    } else {
      navigate(item.to)
    }
  }

  async function handleLogout() {
    try {
      await apiClient.post('/auth/logout')
    } catch {
      // 실패해도 클라이언트 상태는 초기화
    }
    clearAuth()
    setIsMobileMenuOpen(false)
    navigate('/login')
  }

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <nav className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">

        {/* 왼쪽: 로고 + 메뉴(Desktop) */}
        <div className="flex items-center gap-4 md:gap-8">
          <button
            onClick={() => { navigate('/'); setIsMobileMenuOpen(false) }}
            className="flex items-center gap-2.5 group"
          >
            <img src={wizardImg} alt="logo" className="w-8 h-8 md:w-9 md:h-9 rounded-full object-cover shadow-md" />
            <span className="text-lg md:text-xl font-bold text-gray-800 tracking-tight group-hover:text-blue-600 transition-colors">
              PCMS{health?.version && <span className="hidden sm:inline text-[10px] md:text-xs font-normal text-gray-400 ml-1">(ver:{health.version})</span>}
            </span>
          </button>

          {/* 로그인 시에만 메뉴 표시 (Desktop) */}
          {isLoggedIn && (
            <div className="hidden lg:flex items-center gap-1">
              {menuGroups.map((group) => (
                <DropdownMenu
                  key={group.key}
                  group={group}
                  isOpen={activeMenu === group.key}
                  onToggle={() => toggleMenu(group.key)}
                  onOpenTab={handleOpenTab}
                />
              ))}
            </div>
          )}
        </div>

        {/* 오른쪽: 사용자 정보 or 로그인 / 햄버거 메뉴 */}
        <div className="flex items-center gap-2 md:gap-4">
          {isLoggedIn ? (
            <>
              {/* 데스크탑 사용자 메뉴 */}
              <div className="hidden md:flex items-center gap-3 pl-6 border-l border-gray-100">
                <button
                  onClick={() => navigate('/user-info')}
                  className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
                >
                  {userNm}
                </button>
                <button
                  onClick={() => navigate('/settings')}
                  className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                </button>
                <button
                  onClick={handleLogout}
                  className="text-xs px-3 py-1.5 rounded-full border border-gray-300 hover:bg-gray-50 hover:text-red-600 hover:border-red-200 transition-colors"
                >
                  로그아웃
                </button>
              </div>

              {/* 모바일 햄버거 메뉴 버튼 */}
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <Menu className="w-6 h-6" />
              </button>
            </>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              로그인
            </button>
          )}
        </div>
      </nav>

      {/* 모바일 메뉴 오버레이 (Drawer) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Sidebar Drawer */}
          <div className="absolute top-0 right-0 h-full w-[280px] bg-white shadow-2xl flex flex-col transition-transform animate-in slide-in-from-right duration-300">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LayoutGrid className="w-5 h-5 text-blue-500" />
                <span className="font-bold text-gray-800">전체 메뉴</span>
              </div>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* 사용자 간략 정보 */}
            <div className="p-5 bg-gray-50/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                  {userNm?.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800">{userNm}</p>
                  <p className="text-xs text-gray-500">환영합니다!</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs h-9 justify-start"
                  onClick={() => { navigate('/user-info'); setIsMobileMenuOpen(false) }}
                >
                  <User className="w-3.5 h-3.5 mr-2" /> 내 정보
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs h-9 justify-start"
                  onClick={() => { navigate('/settings'); setIsMobileMenuOpen(false) }}
                >
                  <Settings className="w-3.5 h-3.5 mr-2" /> 설정
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto py-4">
              {menuGroups.map((group) => {
                const isExpanded = expandedMobileGroups.has(group.key)
                return (
                  <div key={group.key} className="px-2 mb-1">
                    <button
                      onClick={() => toggleMobileGroup(group.key)}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors"
                    >
                      <span className="text-sm font-semibold">{group.label}</span>
                      <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </button>
                    {isExpanded && (
                      <div className="mt-1 ml-2 pl-2 border-l-2 border-gray-100">
                        {group.items.map((item) => (
                          <button
                            key={item.to}
                            onClick={() => handleOpenTab(item)}
                            className="w-full text-left px-4 py-2.5 text-sm text-gray-600 hover:text-blue-600 transition-colors"
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="p-4 border-t border-gray-100">
              <Button 
                variant="ghost" 
                className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-3" /> 로그아웃
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

export default Toolbar
