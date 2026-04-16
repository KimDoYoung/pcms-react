import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Globe } from 'lucide-react'

import { useTabParams } from '@/shared/layout/useTabParams'
import { useMessage } from '@/shared/hooks/useMessage'
import { apiClient } from '@/lib/apiClient'
import { formatYmd } from '@/lib/utils'

import Toolbar from '@/shared/layout/Toolbar'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import ContentEditor from '@/shared/components/editor/ContentEditor'
import StarRatingInput from '@/shared/components/StarRatingInput'
import { CountrySelectPanel } from '@/shared/components/CountrySelectPanel'
import type { MovieReviewDto } from '@/domain/movie/types/movie'

// Zod 스키마 정의 (유효성 검사)
const formSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요.'),
  nara: z.string().optional(),
  year: z.string().regex(/^\d{0,4}$/, '4자리 숫자만 입력 가능합니다.').optional(),
  lvl: z.number().min(1, '평점은 1점 이상이어야 합니다.').max(5, '평점은 5점 이하이어야 합니다.'),
  ymd: z.string().min(8, '본 일자를 선택해주세요.').max(8),
  content: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

export default function MovieReviewFormPage() {
  const navigate = useNavigate()
  const { id } = useTabParams<{ id: string }>()
  const { showMessage } = useMessage()
  const [loading, setLoading] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [showCountryPanel, setShowCountryPanel] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      nara: '',
      year: '',
      lvl: 5,
      ymd: formatYmd(new Date().toISOString().slice(0, 10)),
      content: '',
    },
  })

  const currentYmd = watch('ymd')
  const displayDate = currentYmd ? `${currentYmd.slice(0, 4)}-${currentYmd.slice(4, 6)}-${currentYmd.slice(6, 8)}` : ''

  useEffect(() => {
    if (id) {
      setIsReady(false)
      async function fetchReview() {
        try {
          const res = await apiClient.get<MovieReviewDto>(`/movie/review/${id}`)
          reset({
            title: res.title,
            nara: res.nara || '',
            year: res.year || '',
            lvl: res.lvl || 5,
            ymd: res.ymd || '',
            content: res.content || '',
          })
          setIsReady(true)
        } catch (e) {
          console.error('Failed to fetch review', e)
          showMessage('감상평을 불러오는데 실패했습니다.', 'error')
          setIsReady(true)
        }
      }
      fetchReview()
    } else {
      setIsReady(true)
    }
  }, [id, reset, showMessage])

  async function onSubmit(data: FormValues) {
    setLoading(true)
    try {
      if (id) {
        await apiClient.put(`/movie/review/${id}`, data)
        showMessage('수정되었습니다.', 'success')
      } else {
        await apiClient.post('/movie/review', data)
        showMessage('등록되었습니다.', 'success')
      }
      navigate('/movie/review')
    } catch (e) {
      console.error('Save error', e)
      showMessage('저장 중 오류가 발생했습니다.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Toolbar />
      <main className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            🎬 {id ? '영화 감상평 수정' : '영화 감상평 등록'}
          </h1>
          <div className="flex gap-2">
            <Button variant="cancel" size="pill" onClick={() => navigate('/movie/review')}>취소</Button>
            <Button variant="action" size="pill" onClick={handleSubmit(onSubmit)} disabled={loading || !isDirty}>
              {loading ? '저장 중...' : '저장'}
            </Button>
            <Button variant="init" size="pill" onClick={() => navigate('/movie/review')}>목록</Button>
          </div>
        </div>

        <form className="space-y-6">
          {/* 기본 정보 섹션 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-gray-700 font-semibold">영화 제목 <span className="text-red-500">*</span></Label>
              <Input
                id="title"
                {...register('title')}
                placeholder="관람한 영화의 제목을 입력하세요"
                className={errors.title ? 'border-red-500 focus-visible:ring-red-500' : ''}
              />
              {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* 평점 */}
              <div className="space-y-2">
                <Label className="text-gray-700 font-semibold">평점 (1-5)</Label>
                <Controller
                  name="lvl"
                  control={control}
                  render={({ field }) => (
                    <div className="flex items-center gap-2 pt-1">
                      <StarRatingInput 
                        value={field.value ?? 0} 
                        onChange={(val) => field.onChange(val)} 
                        max={5}
                      />
                      <span className="text-sm font-bold text-amber-500 w-8 text-center">{field.value}</span>
                    </div>
                  )}
                />
              </div>

              {/* 관람 일자 */}
              <div className="space-y-2">
                <Label className="text-gray-700 font-semibold">관람 일자 <span className="text-red-500">*</span></Label>
                <Input
                  type="date"
                  value={displayDate}
                  onChange={(e) => setValue('ymd', formatYmd(e.target.value), { shouldDirty: true })}
                  className={errors.ymd ? 'border-red-500' : ''}
                />
                {errors.ymd && <p className="text-xs text-red-500 mt-1">{errors.ymd.message}</p>}
              </div>

              {/* 국가 */}
              <div className="space-y-2">
                <Label className="text-gray-700 font-semibold">제작 국가</Label>
                <div className="relative flex gap-2">
                  <Input
                    {...register('nara')}
                    placeholder="예: 한국, 미국"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setShowCountryPanel(!showCountryPanel)}
                    title="국가 선택"
                  >
                    <Globe className="w-4 h-4" />
                  </Button>
                  {showCountryPanel && (
                    <div className="absolute right-0 top-11 z-50">
                      <CountrySelectPanel
                        onSelect={(names) => {
                          setValue('nara', names.join(', '), { shouldDirty: true })
                          setShowCountryPanel(false)
                        }}
                        onClose={() => setShowCountryPanel(false)}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* 제작년도 */}
              <div className="space-y-2">
                <Label className="text-gray-700 font-semibold">제작 년도</Label>
                <Input
                  {...register('year')}
                  placeholder="YYYY (예: 2024)"
                  maxLength={4}
                />
                {errors.year && <p className="text-xs text-red-500 mt-1">{errors.year.message}</p>}
              </div>
            </div>
          </div>

          {/* 감상평 에디터 섹션 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-2">
            <Label className="text-gray-700 font-semibold">상세 감상평</Label>
            {isReady && (
              <Controller
                name="content"
                control={control}
                render={({ field }) => (
                  <ContentEditor
                    key={id || 'new'}
                    value={field.value || ''}
                    onChange={(html) => field.onChange(html)}
                    minHeight="500px"
                    placeholder="영화에 대한 감상을 자유롭게 작성하세요..."
                  />
                )}
              />
            )}
          </div>
        </form>
      </main>
    </div>
  )
}
