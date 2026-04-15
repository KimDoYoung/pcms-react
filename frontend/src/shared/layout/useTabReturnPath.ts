import { useTabStore } from '@/shared/layout/tabStore'

/**
 * useTabReturnPath
 *
 * 목적: 인-탭 네비게이션(상세보기 등) 후 목록으로 돌아갈 때,
 *       목록 페이지의 search params(검색 조건)까지 포함한 경로를 반환한다.
 *
 * 사용법:
 *   const returnPath = useTabReturnPath()
 *   <Button onClick={() => navigate(returnPath)}>← 목록</Button>
 */
export function useTabReturnPath(): string {
  const { tabs, activeTabId } = useTabStore()
  const activeTab = tabs.find((t) => t.id === activeTabId)
  return activeTabId + (activeTab?.search ?? '')
}
