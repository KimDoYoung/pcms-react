import { create } from 'zustand'

export interface TabItem {
  id: string
  label: string
  path: string
  params?: Record<string, string>   // 동적 경로 파라미터 ex) { id: '123' }
  search?: string                    // 목록 페이지의 search params ex) '?keyword=foo&page=2'
  closable: boolean
}

interface TabState {
  tabs: TabItem[]
  activeTabId: string
  openTab: (item: Omit<TabItem, 'closable'> & { closable?: boolean }) => void
  closeTab: (tabId: string) => void
  activateTab: (tabId: string) => void
  closeTabsToRight: (tabId: string) => void
  closeTabsToLeft: (tabId: string) => void
  closeAllTabs: () => void
  reorderTabs: (fromId: string, toId: string) => void
  // 탭 내부 이동용: id는 유지하고 path/params만 교체
  updateTab: (tabId: string, updates: Partial<Pick<TabItem, 'path' | 'params' | 'label' | 'search'>>) => void
}

export const useTabStore = create<TabState>((set, get) => ({
  tabs: [{ id: '/', label: '🏠 홈', path: '/', closable: false }],
  activeTabId: '/',

  openTab: (item) => {
    const { tabs } = get()
    const exists = tabs.find((t) => t.id === item.id)
    if (exists) {
      set({ activeTabId: item.id })
    } else {
      set({
        tabs: [...tabs, { ...item, closable: item.closable ?? true }],
        activeTabId: item.id,
      })
    }
  },

  closeTab: (tabId) => {
    if (tabId === '/') return
    const { tabs, activeTabId } = get()
    const idx = tabs.findIndex((t) => t.id === tabId)
    const newTabs = tabs.filter((t) => t.id !== tabId)
    const newActiveId =
      activeTabId === tabId ? (newTabs[Math.max(0, idx - 1)]?.id ?? '/') : activeTabId
    set({ tabs: newTabs, activeTabId: newActiveId })
  },

  activateTab: (tabId) => set({ activeTabId: tabId }),

  closeTabsToRight: (tabId) => {
    const { tabs, activeTabId } = get()
    const idx = tabs.findIndex((t) => t.id === tabId)
    const newTabs = tabs.filter((t, i) => i <= idx || !t.closable)
    const stillOpen = newTabs.some((t) => t.id === activeTabId)
    set({ tabs: newTabs, activeTabId: stillOpen ? activeTabId : tabId })
  },

  closeTabsToLeft: (tabId) => {
    const { tabs, activeTabId } = get()
    const idx = tabs.findIndex((t) => t.id === tabId)
    const newTabs = tabs.filter((t, i) => i >= idx || !t.closable)
    const stillOpen = newTabs.some((t) => t.id === activeTabId)
    set({ tabs: newTabs, activeTabId: stillOpen ? activeTabId : tabId })
  },

  closeAllTabs: () => {
    const { tabs } = get()
    const newTabs = tabs.filter((t) => !t.closable)
    const newActiveId = newTabs[newTabs.length - 1]?.id ?? '/'
    set({ tabs: newTabs, activeTabId: newActiveId })
  },

  updateTab: (tabId, updates) => {
    const { tabs } = get()
    const target = tabs.find(t => t.id === tabId)
    if (!target) return

    const hasChange = Object.entries(updates).some(([key, value]) => {
      return target[key as keyof TabItem] !== value
    })

    if (hasChange) {
      set({
        tabs: tabs.map((t) => t.id === tabId ? { ...t, ...updates } : t)
      })
    }
  },

  reorderTabs: (fromId, toId) => {
    if (fromId === toId) return
    const { tabs } = get()
    const fromIdx = tabs.findIndex((t) => t.id === fromId)
    const toIdx = tabs.findIndex((t) => t.id === toId)
    if (fromIdx === -1 || toIdx === -1) return
    // 홈 탭(index 0) 앞으로는 이동 불가
    if (toIdx === 0) return
    const newTabs = [...tabs]
    const [moved] = newTabs.splice(fromIdx, 1)
    newTabs.splice(toIdx, 0, moved)
    set({ tabs: newTabs })
  },
}))
