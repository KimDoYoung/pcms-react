/**
 * 목적: cms.assets (이모지/특수문자/상용구/템플릿) 테이블을 관리하는 CRUD 패널.
 *       에디터 툴바의 이모지/기호/상용구/템플릿 팝업이 참조하는 데이터를 여기서 등록/수정/삭제한다.
 *
 * 사용법:
 *   <AssetManagePanel />
 *   routeConfig에 '/assets' 경로로 등록되어 독립 페이지로 사용한다.
 *
 * props: 없음
 */
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { apiClient } from '@/lib/apiClient'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useMessage } from '@/shared/hooks/useMessage'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { AssetDto, AssetType } from '@/domain/asset/types/asset'

const ALL_TYPES: AssetType[] = ['EMOJI', 'SYMBOL', 'PHRASE', 'TEMPLATE']

const TYPE_LABELS: Record<AssetType, string> = {
  EMOJI: '이모지',
  SYMBOL: '특수문자',
  PHRASE: '상용구',
  TEMPLATE: '템플릿',
}

const TYPE_BADGE_STYLE: Record<AssetType, string> = {
  EMOJI: 'bg-emerald-50 text-emerald-600',
  SYMBOL: 'bg-blue-50 text-blue-600',
  PHRASE: 'bg-purple-50 text-purple-600',
  TEMPLATE: 'bg-indigo-50 text-indigo-600',
}

const EMPTY_FORM = { id: 0, atype: 'EMOJI' as AssetType, name: '', value: '' }

export default function AssetManagePanel() {
  const queryClient = useQueryClient()
  const { showMessage } = useMessage()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const isEdit = form.id > 0

  const isTextType = form.atype === 'PHRASE' || form.atype === 'TEMPLATE'

  const { data: assets = [], isLoading } = useQuery<AssetDto[]>({
    queryKey: ['assets'],
    queryFn: () => apiClient.get<AssetDto[]>('/assets'),
  })

  function openCreate() {
    setForm(EMPTY_FORM)
    setDialogOpen(true)
  }

  function openEdit(asset: AssetDto) {
    setForm({ id: asset.id, atype: asset.atype, name: asset.name, value: asset.value })
    setDialogOpen(true)
  }

  async function handleSubmit() {
    if (!form.name.trim() || !form.value.trim()) {
      showMessage('이름과 값을 입력해 주세요.', 'error')
      return
    }
    try {
      if (isEdit) {
        await apiClient.put(`/assets/${form.id}`, { atype: form.atype, name: form.name, value: form.value })
      } else {
        await apiClient.post('/assets', { atype: form.atype, name: form.name, value: form.value })
      }
      queryClient.invalidateQueries({ queryKey: ['assets'] })
      setDialogOpen(false)
      showMessage(isEdit ? '수정되었습니다.' : '등록되었습니다.', 'success')
    } catch {
      showMessage('저장 중 오류가 발생했습니다.', 'error')
    }
  }

  async function handleDelete(asset: AssetDto) {
    if (!confirm(`"${asset.name}"을(를) 삭제하시겠습니까?`)) return
    try {
      await apiClient.delete(`/assets/${asset.id}`)
      queryClient.invalidateQueries({ queryKey: ['assets'] })
      showMessage('삭제되었습니다.', 'success')
    } catch {
      showMessage('삭제 중 오류가 발생했습니다.', 'error')
    }
  }

  return (
    <div className="p-6 bg-white rounded-xl border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">자산 관리</h3>
          <p className="text-sm text-gray-500">에디터에서 삽입할 이모지·특수문자·상용구·템플릿 목록을 관리합니다.</p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="w-4 h-4 mr-1" /> 등록
        </Button>
      </div>

      {isLoading ? (
        <p className="text-center py-10 text-gray-400 text-sm">불러오는 중...</p>
      ) : (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500">
                <th className="px-4 py-2 text-center font-medium w-24">타입</th>
                <th className="px-4 py-2 text-left font-medium">이름</th>
                <th className="px-4 py-2 text-left font-medium">값</th>
                <th className="px-4 py-2 text-center font-medium w-20"></th>
              </tr>
            </thead>
            <tbody>
              {assets.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-10 text-gray-400">등록된 자산이 없습니다.</td>
                </tr>
              )}
              {assets.map((asset) => (
                <tr key={asset.id} className="border-b border-gray-100 hover:bg-gray-50/60">
                  <td className="px-4 py-2 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${TYPE_BADGE_STYLE[asset.atype] ?? 'bg-gray-50 text-gray-600'}`}>
                      {TYPE_LABELS[asset.atype] ?? asset.atype}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-gray-700">{asset.name}</td>
                  <td className="px-4 py-2 text-gray-500 truncate max-w-xs">{asset.value}</td>
                  <td className="px-4 py-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(asset)}
                        className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"
                        title="수정"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(asset)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                        title="삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>{isEdit ? '자산 수정' : '자산 등록'}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">타입</label>
              <div className="flex gap-2 flex-wrap">
                {ALL_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, atype: t }))}
                    className={`px-3 py-1.5 text-sm rounded border transition-colors ${
                      form.atype === t
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {TYPE_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">이름</label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="예: 인사말"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">
                {isTextType
                  ? '값 (마크다운 지원 — 삽입될 전체 내용)'
                  : '값 (콤마로 여러 개 등록 가능)'}
              </label>
              {isTextType ? (
                <Textarea
                  value={form.value}
                  onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                  placeholder={form.atype === 'PHRASE' ? '예: 안녕하세요. 감사합니다.' : '예: # 제목\n\n내용을 입력하세요.'}
                  rows={6}
                  className="font-mono text-sm"
                />
              ) : (
                <Input
                  value={form.value}
                  onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                  placeholder="예: 😀,😁,😂"
                />
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>취소</Button>
            <Button onClick={handleSubmit}>{isEdit ? '수정' : '등록'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
