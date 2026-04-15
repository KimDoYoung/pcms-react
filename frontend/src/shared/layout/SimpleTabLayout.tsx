/**
 * SimpleTabLayout
 *
 * 목적: Toolbar + SimpleTabBar + 탭 콘텐츠로 구성되는 전체 워크벤치 레이아웃.
 *       - TabContext.Provider로 콘텐츠 영역을 감싸 각 페이지의 Toolbar를 비활성화
 *       - 탭 콘텐츠는 display:none으로 숨겨 상태(검색 필터 등) 보존
 *       - location.pathname 변화 감지 → 내부 navigate() 호출 시 자동 탭 오픈
 *       - 동적 경로(/diary/:id 등)는 matchPath로 처리, params를 Context로 전달
 */
import { TabContext, TabRouteParamsContext } from '@/shared/layout/TabContext'
import { useTabStore } from '@/shared/layout/tabStore'
import { SimpleTabBar } from '@/shared/layout/SimpleTabBar'
import Toolbar from '@/shared/layout/Toolbar'
import { useTabSync } from '@/shared/layout/useTabSync'
import { findRoute } from '@/shared/layout/routeConfig'

export function SimpleTabLayout() {
  const tabs = useTabStore(state => state.tabs)
  const activeTabId = useTabStore(state => state.activeTabId)

  // URL ↔ 탭 동기화 로직 추출
  useTabSync()

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
