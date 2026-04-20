/**
 * S-Note 수정 페이지
 * - 잠금 상태: 힌트 표시 + 비밀번호 입력으로 복원
 * - 잠금해제 상태: 복호화된 내용 편집 후 재암호화 저장
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTabParams } from '@/shared/layout/useTabParams'
import { apiClient } from '@/lib/apiClient'
import Toolbar from '@/shared/layout/Toolbar'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Lock, Unlock } from 'lucide-react'
import { extractHint, validatePassword, decryptNote, encryptNote } from '@/domain/snote/snote_crypto'
import { formatRelativeDateTime } from '@/lib/utils'
import type { SnoteDto } from '@/domain/snote/types/snote'

export default function SNoteEditPage() {
  const { id } = useTabParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: snote, isLoading: loading } = useQuery<SnoteDto>({
    queryKey: ['snote', id],
    queryFn: () => apiClient.get<SnoteDto>(`/snote/${id}`),
    enabled: !!id,
  })

  const [passwordInput, setPasswordInput] = useState('')
  const [decrypted, setDecrypted] = useState(false)
  const [unlockPassword, setUnlockPassword] = useState('')

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    if (snote) setTitle(snote.title ?? '')
  }, [snote])

  // Ctrl+S 저장 단축키 (복호화 상태에서만 동작)
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault()
        if (decrypted) handleSave()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  async function handleRestore() {
    if (!snote || !passwordInput) return
    setMessage(null)
    try {
      const valid = await validatePassword(snote.note, passwordInput)
      if (!valid) {
        setMessage({ text: '비밀번호가 틀렸습니다.', type: 'error' })
        return
      }
      const plain = await decryptNote(snote.note, passwordInput)
      setContent(plain)
      setUnlockPassword(passwordInput)
      setDecrypted(true)
      setMessage(null)
    } catch {
      setMessage({ text: '복원 중 오류가 발생했습니다.', type: 'error' })
    }
  }

  async function handleSave() {
    if (!snote || !unlockPassword) return
    if (!content.trim()) {
      setMessage({ text: '내용을 입력해주세요.', type: 'error' })
      return
    }

    const hint = extractHint(snote.note)
    const useTitle = title.trim() || `제목없음 ${Date.now()}`

    setSaving(true)
    setMessage(null)
    try {
      const encryptedNote = await encryptNote(content, unlockPassword, hint)
      await apiClient.put(`/snote/${snote.id}`, { title: useTitle, note: encryptedNote })
      queryClient.invalidateQueries({ queryKey: ['snote-list'] })
      queryClient.invalidateQueries({ queryKey: ['snote', id] })
      setMessage({ text: '저장되었습니다.', type: 'success' })
    } catch {
      setMessage({ text: '저장 중 오류가 발생했습니다.', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Toolbar />
        <main className="container mx-auto px-4 py-6">
          <p className="text-sm text-gray-400 text-center py-20">불러오는 중...</p>
        </main>
      </div>
    )
  }

  const hint = snote ? extractHint(snote.note) : ''

  return (
    <div className="min-h-screen bg-gray-50">
      <Toolbar />
      <main className="container mx-auto px-4 py-6">
        <div className="mx-auto">

          <div className="flex items-center gap-2 mb-6">
            <h1 className="text-xl font-bold text-gray-800">🔐 S-Note 수정</h1>
            {decrypted
              ? <Unlock className="w-5 h-5 text-green-500" />
              : <Lock className="w-5 h-5 text-gray-400" />
            }
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">

            {/* 메타 정보 */}
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span>등록일: {snote?.createDt ? formatRelativeDateTime(snote.createDt) : '-'}</span>
              {hint && <span>힌트: <strong className="text-gray-600">{hint}</strong></span>}
            </div>

            {/* 제목 */}
            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-sm text-gray-600">제목</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={!decrypted}
                placeholder="제목없음"
              />
            </div>

            {/* 잠금 해제 영역 */}
            {!decrypted && (
              <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-500">내용을 보려면 비밀번호를 입력하세요.</p>
                <div className="flex gap-2">
                  <Input
                    type="password"
                    placeholder="비밀번호"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleRestore()}
                    className="flex-1"
                  />
                  <Button onClick={handleRestore} disabled={!passwordInput}>
                    복원
                  </Button>
                </div>
              </div>
            )}

            {/* 내용 (복호화 후) */}
            {decrypted && (
              <div className="space-y-1.5">
                <Label htmlFor="content" className="text-sm text-gray-600">내용</Label>
                <textarea
                  id="content"
                  rows={24}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y font-mono"
                />
              </div>
            )}

            {/* 메시지 */}
            {message && (
              <p className={`text-sm ${message.type === 'error' ? 'text-red-500' : 'text-green-600'}`}>
                {message.text}
              </p>
            )}

            {/* 버튼 */}
            <div className="flex justify-between pt-2">
              <Button variant="cancel" onClick={() => navigate('/snote')}>
                리스트로 이동
              </Button>
              {decrypted && (
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? '저장 중...' : '수정'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
