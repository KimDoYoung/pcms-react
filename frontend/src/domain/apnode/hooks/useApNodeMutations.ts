import { useCallback } from 'react'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import { useMessage } from '@/shared/hooks/useMessage'
import type { ApNode } from '../types/apnode'

interface Options {
  currentFolderId: string | null
  breadcrumb: ApNode[]
  onNavigate: (id: string | null) => void
  onFolderCreated: (node: ApNode) => void
  onRenamed: () => void
  onMoved?: () => void
  onLinkCreated?: () => void
}

export function useApNodeMutations({
  currentFolderId,
  breadcrumb,
  onNavigate,
  onFolderCreated,
  onRenamed,
  onMoved,
  onLinkCreated,
}: Options) {
  const queryClient = useQueryClient()
  const { showMessage } = useMessage()

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['apnode-children'] })
    queryClient.invalidateQueries({ queryKey: ['apnode-roots'] })
    queryClient.invalidateQueries({ queryKey: ['apnode-path'] })
  }, [queryClient])

  const createDirMutation = useMutation({
    mutationFn: (name: string) =>
      apiClient.post<ApNode>('/apnode/directories', { name, parentId: currentFolderId }),
    onSuccess: (newNode) => {
      invalidate()
      onFolderCreated(newNode)
    },
    onError: () => showMessage('폴더 생성 실패', 'error'),
  })

  const renameMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      apiClient.put<ApNode>(`/apnode/${id}/rename`, { name }),
    onSuccess: () => { invalidate(); onRenamed() },
    onError: () => showMessage('이름 변경 실패', 'error'),
  })

  const moveMutation = useMutation({
    mutationFn: ({ id, targetParentId }: { id: string; targetParentId: string | null }) =>
      apiClient.put<ApNode>(`/apnode/${id}/move`, { targetParentId }),
    onSuccess: () => { invalidate(); onMoved?.() },
    onError: () => showMessage('이동 실패', 'error'),
  })

  const createLinkMutation = useMutation({
    mutationFn: ({ name, targetId, parentId }: { name: string; targetId: string; parentId: string | null }) =>
      apiClient.post<ApNode>('/apnode/links', { name, targetId, parentId }),
    onSuccess: () => { invalidate(); onLinkCreated?.() },
    onError: () => showMessage('링크 생성 실패', 'error'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/apnode/${id}`),
    onSuccess: (_, deletedId) => {
      invalidate()
      if (deletedId === currentFolderId) {
        const parentId = breadcrumb.length > 1 ? breadcrumb[breadcrumb.length - 2].id : null
        onNavigate(parentId)
      }
    },
    onError: () => showMessage('삭제 실패', 'error'),
  })

  return { createDirMutation, renameMutation, moveMutation, createLinkMutation, deleteMutation, invalidate }
}
