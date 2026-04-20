import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useTabStore } from '@/shared/layout/tabStore'
import { findRoute } from '@/shared/layout/routeConfig'

export function useTabSync() {
  const location = useLocation()
  const { openTab, activateTab, updateTab } = useTabStore()
  const lastProcessedUrl = useRef('')

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
    // 단, 명시적으로 선언된 정적 라우트(isDynamic === false)인 경우 독립적인 탭으로 오픈
    const isInTabNavigation =
      currentActiveTabId !== '/' &&
      pathname !== currentActiveTabId &&
      pathname.startsWith(currentActiveTabId + '/') &&
      found.isDynamic !== false

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
}
