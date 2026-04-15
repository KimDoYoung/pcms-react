import { createContext, useContext } from 'react'

interface TabContextValue {
  isInsideTab: boolean
}

export const TabContext = createContext<TabContextValue>({ isInsideTab: false })

export function useTabContext() {
  return useContext(TabContext)
}

// 동적 경로 파라미터를 탭에서 전달하기 위한 Context
// useParams() 대신 useTabParams() 훅을 통해 사용
export const TabRouteParamsContext = createContext<Record<string, string | undefined>>({})

