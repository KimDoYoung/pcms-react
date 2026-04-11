import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Paperclip, X } from 'lucide-react'
import { apiClient } from '@/lib/apiClient'
import Toolbar from '@/shared/components/Toolbar'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import SpecEditor from '@/shared/components/editor/SpecEditor'

export default function JangbiNewPage() {
  const navigate = useNavigate()
  const today = new Date().toISOString().slice(0, 10)

  const [form, setForm] = useState({
    ymd: today,
    item: '',
    location: '',
    cost: '',
    lvl: '2',
    spec: '',
  })
  const [newFiles, setNewFiles] = useState<File[]>([])
  const [saving, setSaving] = useState(false)

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit() {
    if (!form.ymd) { alert('구입일을 입력하세요.'); return }
    if (!form.item.trim()) { alert('품목을 입력하세요.'); return }

    setSaving(true)
    try {
      const payload = {
        ymd: form.ymd.replace(/-/g, ''),
        item: form.item,
        location: form.location || null,
        cost: form.cost ? Number(form.cost) : null,
        spec: form.spec || null,
        lvl: form.lvl,
      }
      const formData = new FormData()
      formData.append('jangbi', new Blob([JSON.stringify(payload)], { type: 'application/json' }))
      newFiles.forEach((f) => formData.append('files', f))

      const res = await apiClient.post<{ id: number }>('/jangbi', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      navigate(`/jangbi/${res.id}`)
    } catch {
      alert('저장 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toolbar />
      <main className="container mx-auto px-6 py-6">
        <h1 className="text-xl font-bold text-gray-800 mb-6">➕ 새 장비 등록</h1>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100">

          {/* 기본 정보 */}
          <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-6 gap-5">

            {/* 구입일 */}
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-sm font-medium text-gray-700">
                구입일 <span className="text-red-500">*</span>
              </label>
              <Input
                type="date"
                value={form.ymd}
                onChange={(e) => set('ymd', e.target.value)}
              />
            </div>

            {/* 만족감 */}
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-sm font-medium text-gray-700">
                만족도 <span className="text-red-500">*</span>
              </label>
              <select
                value={form.lvl}
                onChange={(e) => set('lvl', e.target.value)}
                className="h-9 border border-gray-200 rounded-md px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="3">만족</option>
                <option value="2">보통</option>
                <option value="1">실망</option>
              </select>
            </div>

            {/* 가격 */}
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-sm font-medium text-gray-700">가격 (원)</label>
              <Input
                type="number"
                placeholder="숫자만 입력"
                min={0}
                value={form.cost}
                onChange={(e) => set('cost', e.target.value)}
              />
            </div>

            {/* 품목 */}
            <div className="flex flex-col gap-1.5 sm:col-span-3">
              <label className="text-sm font-medium text-gray-700">
                품목 <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="장비명이나 품목명"
                maxLength={100}
                value={form.item}
                onChange={(e) => set('item', e.target.value)}
              />
            </div>

            {/* 위치 */}
            <div className="flex flex-col gap-1.5 sm:col-span-3">
              <label className="text-sm font-medium text-gray-700">위치</label>
              <Input
                placeholder="예: 거실, 2층 창고"
                maxLength={200}
                value={form.location}
                onChange={(e) => set('location', e.target.value)}
              />
            </div>
          </div>

          {/* 스펙/특징 */}
          <div className="px-6 py-5 flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">스펙 / 특징</label>
            <SpecEditor
              value={form.spec}
              onChange={(html) => set('spec', html)}
              placeholder="장비 스펙이나 특징을 입력하세요..."
            />
          </div>

          {/* 첨부파일 */}
          <div className="px-6 py-5 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <Paperclip className="w-4 h-4" /> 첨부파일
              </h3>
              <button
                onClick={() => document.getElementById('jangbi-new-file')?.click()}
                className="px-3 py-1 text-xs font-medium bg-white border border-gray-300 rounded-md hover:bg-gray-100 text-gray-600 transition-colors shadow-sm"
              >
                + 파일 추가
              </button>
              <input
                id="jangbi-new-file"
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    const filesArray = Array.from(e.target.files)
                    setNewFiles((prev) => [...prev, ...filesArray])
                  }
                  e.target.value = ''
                }}
              />
            </div>

            <div className="flex flex-wrap gap-2 min-h-[40px]">
              {newFiles.length === 0 && (
                <span className="text-xs text-gray-300 italic py-2">첨부된 파일이 없습니다.</span>
              )}
              {newFiles.map((file, idx) => (
                <div key={`${file.name}-${idx}`} className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 px-2.5 py-1.5 border border-blue-200 rounded-md">
                  <Paperclip className="w-3 h-3 text-blue-400" />
                  <span className="truncate max-w-[160px]" title={file.name}>{file.name}</span>
                  <button
                    type="button"
                    onClick={() => setNewFiles((prev) => prev.filter((_, i) => i !== idx))}
                    className="text-blue-400 hover:text-red-500 p-0.5 rounded transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* 버튼 */}
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => navigate('/jangbi')}>취소</Button>
          <Button onClick={handleSubmit} disabled={saving || !form.item.trim()}>
            {saving ? '저장 중...' : '저장'}
          </Button>
        </div>
      </main>
    </div>
  )
}
