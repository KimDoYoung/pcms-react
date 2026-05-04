import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import type { ApNode } from '../types/apnode'

export function useApNodeData(currentFolderId: string | null) {
  const rootsQuery = useQuery<ApNode[]>({
    queryKey: ['apnode-roots'],
    queryFn: () => apiClient.get<ApNode[]>('/apnode'),
  })

  const childrenQuery = useQuery<ApNode[]>({
    queryKey: ['apnode-children', currentFolderId],
    queryFn: () =>
      currentFolderId
        ? apiClient.get<ApNode[]>(`/apnode/${currentFolderId}/children`)
        : Promise.resolve([]),
    enabled: currentFolderId != null,
  })

  const pathQuery = useQuery<ApNode[]>({
    queryKey: ['apnode-path', currentFolderId],
    queryFn: () =>
      currentFolderId
        ? apiClient.get<ApNode[]>(`/apnode/${currentFolderId}/path`)
        : Promise.resolve([]),
    enabled: currentFolderId != null,
  })

  const currentItems: ApNode[] =
    currentFolderId == null ? (rootsQuery.data ?? []) : (childrenQuery.data ?? [])
  const breadcrumb: ApNode[] = pathQuery.data ?? []
  const ancestorIds = breadcrumb.map((n) => n.id)
  const isLoading = currentFolderId == null ? rootsQuery.isLoading : childrenQuery.isLoading
  const rootDirs = (rootsQuery.data ?? []).filter((n) => n.nodeType === 'D')

  return { currentItems, breadcrumb, ancestorIds, isLoading, rootDirs }
}
