import { type ComponentType } from 'react'
import { matchPath } from 'react-router-dom'

import HomePage from '@/home/HomePage'
import DiaryPage from '@/domain/diary/DiaryPage'
import DiaryRegisterPage from '@/domain/diary/DiaryRegisterPage'
import DiaryViewPage from '@/domain/diary/DiaryViewPage'
import JangbiPage from '@/domain/jangbi/JangbiPage'
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
import MovieReviewFormPage from '@/domain/movie/MovieReviewFormPage'
import MovieReviewViewPage from '@/domain/movie/MovieReviewViewPage'
import HddPage from '@/domain/movie/HddPage'
import UserInfoPage from '@/user/UserInfoPage'
import SettingsPage from '@/user/SettingsPage'
import Practice01Flex from '@/practice/Practice01Flex'
import Practice02Hooks from '@/practice/Practice02Hooks'
import Practice03Hanja from '@/practice/Practice03Hanja'
import ComponentTest1 from '@/practice/PracticeComponentTest1'

export interface AppRoute {
  path: string
  label: string
  Component: ComponentType
  menuGroup?: string
  isDynamic?: boolean
}

export const APP_ROUTES: AppRoute[] = [
  // 홈
  { path: '/', label: '🏠 홈', Component: HomePage },

  // 일지
  { path: '/diary/register', label: '✏️ 일지기록', Component: DiaryRegisterPage, menuGroup: '📖 일지' },
  { path: '/diary', label: '🔍 일지찾기', Component: DiaryPage, menuGroup: '📖 일지' },
  { path: '/calendar', label: '📅 달력', Component: Calendar1Page, menuGroup: '📖 일지' },
  { path: '/calendar/anniversary', label: '🎂 기념일', Component: AnniversaryPage, menuGroup: '📖 일지' },
  
  // 게시판
  { path: '/boards', label: '✍️ 게시판관리', Component: BoardsPage, menuGroup: '📝 게시판' },
  { path: '/posts', label: '📋 게시글', Component: PostsPage },
  { path: '/posts/new', label: '📝 새게시글', Component: PostNewPage },

  // 취미
  { path: '/jangbi', label: '🖥️ 장비', Component: JangbiPage, menuGroup: '🔧 취미' },
  { path: '/apnode', label: '📂 파일관리', Component: ApNodePage, menuGroup: '🔧 취미' },

  // 영화
  { path: '/movie/collection', label: '📀 수집(DVD)', Component: MoviePage, menuGroup: '📽️ 영화' },
  { path: '/movie/review', label: '🎬 영화감상평', Component: MovieReviewPage, menuGroup: '📽️ 영화' },
  { path: '/movie/review/register', label: '🎬 영화감상평 등록', Component: MovieReviewFormPage },
  { path: '/movie/hdd', label: '🎞️ 하드디스크', Component: HddPage, menuGroup: '📽️ 영화' },

  // 실습
  { path: '/practice/tailwindcss', label: '✏️ Tailwind CSS 연습', Component: Practice01Flex, menuGroup: '📝 실습' },
  { path: '/practice/hooks', label: '🪝 React Hooks 연습', Component: Practice02Hooks, menuGroup: '📝 실습' },
  { path: '/practice/hanja', label: '漢 한자 변환 연습', Component: Practice03Hanja, menuGroup: '📝 실습' },
  { path: '/practice/component-test1', label: '🧪 DatePicker 연습', Component: ComponentTest1, menuGroup: '📝 실습' },

  // 사용자
  { path: '/user-info', label: '👤 사용자정보', Component: UserInfoPage },
  { path: '/settings', label: '⚙️ 설정', Component: SettingsPage },

  // 동적 경로 (isDynamic: true)
  { path: '/diary/:id', label: '📖 일지보기', Component: DiaryViewPage, isDynamic: true },
  { path: '/jangbi/:id/edit', label: '🖥️ 장비수정', Component: JangbiEditPage, isDynamic: true },
  { path: '/jangbi/:id', label: '🖥️ 장비상세', Component: JangbiViewPage, isDynamic: true },
  { path: '/posts/:id/edit', label: '📝 게시글수정', Component: PostEditPage, isDynamic: true },
  { path: '/posts/:id', label: '📝 게시글', Component: PostViewPage, isDynamic: true },
  { path: '/movie/review/:id/edit', label: '🎬 영화감상평 수정', Component: MovieReviewFormPage, isDynamic: true },
  { path: '/movie/review/:id/view', label: '🎬 영화감상평 보기', Component: MovieReviewViewPage, isDynamic: true },
]

export interface FoundRoute {
  Component: ComponentType
  params: Record<string, string>
  label: string
}

export function findRoute(pathname: string): FoundRoute | null {
  // 1. 정적 경로 우선 매칭
  const staticRoute = APP_ROUTES.find(r => !r.isDynamic && r.path === pathname)
  if (staticRoute) {
    return { Component: staticRoute.Component, params: {}, label: staticRoute.label }
  }

  // 2. 동적 경로 매칭
  for (const route of APP_ROUTES.filter(r => r.isDynamic)) {
    const match = matchPath(route.path, pathname)
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

export interface MenuItem {
  label: string
  to: string
}

export interface MenuGroup {
  key: string
  label: string
  items: MenuItem[]
}

export function getMenuGroups(): MenuGroup[] {
  const groups: Record<string, MenuGroup> = {}

  APP_ROUTES.forEach(route => {
    if (route.menuGroup) {
      if (!groups[route.menuGroup]) {
        groups[route.menuGroup] = {
          key: route.menuGroup,
          label: route.menuGroup,
          items: []
        }
      }
      groups[route.menuGroup].items.push({
        label: route.label,
        to: route.path
      })
    }
  })

  return Object.values(groups)
}
