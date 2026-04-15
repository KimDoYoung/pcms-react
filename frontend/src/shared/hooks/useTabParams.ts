import { useContext } from 'react'
import { useParams } from 'react-router-dom'
import { TabRouteParamsContext } from '@/shared/context/TabContext'

/**
 * useTabParams
 *
 * 목적: 탭 시스템 안에서 동적 경로 파라미터를 읽는 훅.
 *       TabRouteParamsContext(탭에서 전달한 params)를 우선 사용하고,
 *       없으면 React Router의 useParams()로 폴백한다.
 *
 * 사용법:
 *   const { id } = useTabParams<{ id: string }>()
 */
export function useTabParams<T extends Record<string, string | undefined> = Record<string, string | undefined>>(): T {
  const tabParams = useContext(TabRouteParamsContext)
  const routerParams = useParams()

  if (Object.keys(tabParams).length > 0) return tabParams as T
  return routerParams as T
}
