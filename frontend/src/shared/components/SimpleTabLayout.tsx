/**
 * SimpleTabLayout
 *
 * 목적: Toolbar + SimpleTabBar + 탭 콘텐츠로 구성되는 전체 워크벤치 레이아웃.
 *       - TabContext.Provider로 콘텐츠 영역을 감싸 각 페이지의 Toolbar를 비활성화
 *       - 탭 콘텐츠는 display:none으로 숨겨 상태(검색 필터 등) 보존
 *       - location.pathname 변화 감지 → 내부 navigate() 호출 시 자동 탭 오픈
 *       - 동적 경로(/diary/:id 등)는 matchPath로 처리, params를 Context로 전달
 */
import { useEffect, useRef, type ComponentType } from 'react'
import { useLocation, matchPath } from 'react-router-dom'
import { TabContext, TabRouteParamsContext } from '@/shared/context/TabContext'
import { useTabStore } from '@/shared/store/tabStore'
import { SimpleTabBar } from '@/shared/components/SimpleTabBar'
import Toolbar from '@/shared/components/Toolbar'

import HomePage from '@/home/HomePage'
import DiaryPage from '@/domain/diary/DiaryPage'
import DiaryRegisterPage from '@/domain/diary/DiaryRegisterPage'
import DiaryViewPage from '@/domain/diary/DiaryViewPage'
import JangbiPage from '@/domain/jangbi/JangbiPage'
import JangbiNewPage from '@/domain/jangbi/JangbiNewPage'
import JangbiViewPage from '@/domain/jangbi/JangbiViewPage'
import JangbiEditPage from '@/domain/jangbi/JangbiEditPage'
import BoardsPage from '@/domain/board/BoardsPage'
import PostsPage from '@/domain/board/PostsPage'
import PostNewPage from '@/domain/board/PostNewPage'
import PostViewPage from '@/domain/board/PostViewPage'
import PostEditPage from '@/domain/board/PostEditPage'
import ApNodePage from '@/domain/apnode/ApNodePage'
import Calendar1Page from '@/domain/calendar/Calendar1Page'
import AnniversaryPage from '@/domain/calendar/AnniversaryPage'
import MoviePage from '@/domain/movie/MoviePage'
import MovieReviewPage from '@/domain/movie/MovieReviewPage'
import HddPage from '@/domain/movie/HddPage'
import UserInfoPage from '@/user/UserInfoPage'
import SettingsPage from '@/user/SettingsPage'
import Practice01Flex from '@/practice/Practice01Flex'
import Practice02Hooks from '@/practice/Practice02Hooks'
import Practice03Hanja from '@/practice/Practice03Hanja'

// 경로 → 탭 라벨
const ROUTE_LABELS: Record<string, string> = {
  '/': '🏠 홈',
  '/diary': '🔍 일지찾기',
  '/diary/register': '✏️ 일지기록',
  '/calendar': '📅 달력',
  '/calendar/anniversary': '🎂 기념일',
  '/jangbi': '🖥️ 장비',
  '/jangbi/new': '🖥️ 장비등록',
  '/apnode': '📂 파일관리',
  '/boards': '✍️ 게시판관리',
  '/posts': '📋 게시글',
  '/posts/new': '📝 새게시글',
  '/movie/collection': '📀 수집(DVD)',
  '/movie/review': '🎬 감상',
  '/movie/hdd': '🎞️ 하드디스크',
  '/user-info': '👤 사용자정보',
  '/settings': '⚙️ 설정',
  '/practice/tailwindcss': '✏️ Tailwind CSS',
  '/practice/hooks': '🪝 React Hooks',
  '/practice/hanja': '漢 한자변환',
}

// 정적 경로 → 컴포넌트
const STATIC_TAB_MAP: Record<string, ComponentType> = {
  '/': HomePage,
  '/diary': DiaryPage,
  '/diary/register': DiaryRegisterPage,
  '/calendar': Calendar1Page,
  '/calendar/anniversary': AnniversaryPage,
  '/jangbi': JangbiPage,
  '/jangbi/new': JangbiNewPage,
  '/apnode': ApNodePage,
  '/boards': BoardsPage,
  '/posts': PostsPage,
  '/posts/new': PostNewPage,
  '/movie/collection': MoviePage,
  '/movie/review': MovieReviewPage,
  '/movie/hdd': HddPage,
  '/user-info': UserInfoPage,
  '/settings': SettingsPage,
  '/practice/tailwindcss': Practice01Flex,
  '/practice/hooks': Practice02Hooks,
  '/practice/hanja': Practice03Hanja,
}

// 동적 경로 패턴 → 컴포넌트 + 라벨
const DYNAMIC_ROUTES: Array<{
  pattern: string
  Component: ComponentType
  label: string
}> = [
  { pattern: '/diary/:id',       Component: DiaryViewPage,   label: '📖 일지보기' },
  { pattern: '/jangbi/:id/edit', Component: JangbiEditPage,  label: '🖥️ 장비수정' },
  { pattern: '/jangbi/:id',      Component: JangbiViewPage,  label: '🖥️ 장비상세' },
  { pattern: '/posts/:id/edit',  Component: PostEditPage,    label: '📝 게시글수정' },
  { pattern: '/posts/:id',       Component: PostViewPage,    label: '📝 게시글' },
]

interface FoundRoute {
  Component: ComponentType
  params: Record<string, string>
  label: string
}

function findRoute(pathname: string): FoundRoute | null {
  if (STATIC_TAB_MAP[pathname]) {
    return { Component: STATIC_TAB_MAP[pathname], params: {}, label: ROUTE_LABELS[pathname] ?? pathname }
  }
  for (const route of DYNAMIC_ROUTES) {
    const match = matchPath(route.pattern, pathname)
    if (match) {
      return {
        Component: route.Component,
        params: (match.params as Record<string, string>) ?? {},
        label: route.label,
      }
    }
  }
  return null
}

export function SimpleTabLayout() {
  const tabs = useTabStore(state => state.tabs)
  const activeTabId = useTabStore(state => state.activeTabId)
  const openTab = useTabStore(state => state.openTab)
  const activateTab = useTabStore(state => state.activateTab)
  const updateTab = useTabStore(state => state.updateTab)

  const location = useLocation()
  const lastProcessedUrl = useRef('')

  // 내부 navigate() 호출 감지 → 탭 자동 오픈 or 인-탭 이동
  useEffect(() => {
    // 경로 정규화 (끝 슬래시 제거 등)
    const pathname = location.pathname.replace(/\/$/, '') || '/'
    const search = location.search
    const currentUrl = pathname + search

    if (pathname === '/login') return
    // 이미 처리한 URL이면 중복 실행 방지
    if (lastProcessedUrl.current === currentUrl) return
    lastProcessedUrl.current = currentUrl

    const found = findRoute(pathname)
    if (!found) return

    // 렌더링 시점의 최신 상태를 getState()로 직접 참조
    const state = useTabStore.getState()
    const currentTabs = state.tabs
    const currentActiveTabId = state.activeTabId

    // active 탭의 하위 경로면 새 탭 대신 현재 탭 내부에서 이동
    const isInTabNavigation =
      currentActiveTabId !== '/' &&
      pathname !== currentActiveTabId &&
      pathname.startsWith(currentActiveTabId + '/')

    if (isInTabNavigation) {
      const activeTab = currentTabs.find(t => t.id === currentActiveTabId)
      if (activeTab) {
        updateTab(currentActiveTabId, { 
          path: pathname, 
          params: found.params,
          label: found.label
        })
      }
      return
    }

    const existing = currentTabs.find((t) => t.id === pathname)
    if (existing) {
      // 1. 활성 탭이 다르면 해당 탭으로 전환
      if (currentActiveTabId !== existing.id) {
        activateTab(existing.id)
      } 
      
      // 2. 경로 정보나 검색어, 라벨이 바뀌었으면 업데이트
      // search는 베이스 경로일 때만 업데이트 (상세페이지에서는 목록 검색어 보존)
      const isBaseTabPath = pathname === existing.id
      updateTab(existing.id, { 
        path: pathname, 
        params: found.params,
        label: found.label,
        ...(isBaseTabPath ? { search } : {})
      })
    } else if (currentActiveTabId !== pathname) {
      openTab({
        id: pathname,
        label: found.label,
        path: pathname,
        params: found.params,
        search: search
      })
    }
  }, [location.pathname, location.search, activateTab, openTab, updateTab])

  return (
    <div className="flex flex-col h-screen">
      <Toolbar />
      <SimpleTabBar />
      <div className="flex-1 overflow-auto bg-gray-50">
        <TabContext.Provider value={{ isInsideTab: true }}>
          {tabs.map((tab) => {
            const found = findRoute(tab.path)
            if (!found) return null
            const { Component } = found
            return (
              <TabRouteParamsContext.Provider key={tab.id} value={found.params}>
                <div style={{ display: activeTabId === tab.id ? 'block' : 'none' }}>
                  <Component />
                </div>
              </TabRouteParamsContext.Provider>
            )
          })}
        </TabContext.Provider>
      </div>
    </div>
  )
}
