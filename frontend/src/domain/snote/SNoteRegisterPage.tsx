/**
 * S-Note 등록 페이지
 * - 제목, 내용, 힌트, 비밀번호를 입력받아 클라이언트에서 암호화 후 저장
 * - 힌트/비밀번호를 비워두면 서버의 passhint.txt에서 랜덤값을 사용
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '@/lib/apiClient'
import Toolbar from '@/shared/layout/Toolbar'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { encryptNote } from '@/domain/snote/snote_crypto'
import type { RandomHintResponse } from '@/domain/snote/types/snote'

export default function SNoteRegisterPage() {
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [hint, setHint] = useState('')
  const [password, setPassword] = useState('')
  const [defaultHint, setDefaultHint] = useState('')
  const [defaultPassword, setDefaultPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Ctrl+S 저장 단축키
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault()
        handleSubmit()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  // 마운트 시 서버에서 기본 hint/password 로드
  useEffect(() => {
    apiClient.get<RandomHintResponse>('/snote/random-hint').then((res) => {
      setDefaultHint(res.hint)
      setDefaultPassword(res.password)
    }).catch(() => {
      // 서버 오류 시 무시 — 제출 시 재시도
    })
  }, [])

  async function handleSubmit() {
    if (!content.trim()) {
      setError('내용을 입력해주세요.')
      return
    }

    const useHint = hint.trim() || defaultHint
    const usePassword = password.trim() || defaultPassword

    if (!usePassword) {
      setError('비밀번호를 입력하거나 서버 기본값을 기다려주세요.')
      return
    }

    const useTitle = title.trim() || `제목없음 ${Date.now()}`

    setSaving(true)
    setError('')
    try {
      const encryptedNote = await encryptNote(content, usePassword, useHint)
      await apiClient.post('/snote', { title: useTitle, note: encryptedNote })
      navigate('/snote')
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toolbar />
      <main className="container mx-auto px-4 py-6">
        <div className="mx-auto">

          <h1 className="text-xl font-bold text-gray-800 mb-6">🔐 S-Note 등록</h1>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">

            {/* 제목 */}
            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-sm text-gray-600">
                제목 <span className="text-gray-400 text-xs">(선택 — 비워두면 자동 생성)</span>
              </Label>
              <Input
                id="title"
                placeholder="제목없음으로 저장됩니다"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* 내용 */}
            <div className="space-y-1.5">
              <Label htmlFor="content" className="text-sm text-gray-600">
                내용 <span className="text-red-500">*</span>
              </Label>
              <textarea
                id="content"
                rows={24}
                placeholder="암호화하여 저장될 내용을 입력하세요."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y font-mono"
              />
            </div>

            {/* 힌트 / 비밀번호 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="hint" className="text-sm text-gray-600">
                  힌트 <span className="text-gray-400 text-xs">(선택)</span>
                </Label>
                <Input
                  id="hint"
                  placeholder={defaultHint || '비밀번호 힌트'}
                  value={hint}
                  onChange={(e) => setHint(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm text-gray-600">
                  비밀번호 <span className="text-gray-400 text-xs">(선택)</span>
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={defaultPassword ? '비워두면 자동생성' : '로딩 중...'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {defaultHint && !hint && !password && (
              <p className="text-xs text-gray-400">
                💡 비워두면 서버 기본값 사용 — 힌트: <strong>{defaultHint}</strong>
              </p>
            )}

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}

            {/* 버튼 */}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="cancel" onClick={() => navigate('/snote')} disabled={saving}>
                취소
              </Button>
              <Button onClick={handleSubmit} disabled={saving}>
                {saving ? '저장 중...' : '저장'}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
