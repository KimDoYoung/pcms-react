import Toolbar from '@/shared/layout/Toolbar'
import { Button } from '@/shared/components/ui/button'
import { apiClient } from '@/lib/apiClient'
import { useState } from 'react'
import { useMessage } from '@/shared/hooks/useMessage'
import { useQuery } from '@tanstack/react-query'
import { History as HistoryIcon, BadgeInfo, CalendarDays, ChevronDown, ChevronUp } from 'lucide-react'

interface HistoryEntry {
  version: string
  date: string
  revisions: string[]
}

function SettingsPage() {
  const [loading, setLoading] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const { showMessage } = useMessage()

  const { data: history, isLoading: historyLoading } = useQuery<HistoryEntry[]>({
    queryKey: ['system-history'],
    queryFn: () => apiClient.get<HistoryEntry[]>('/history'),
    enabled: showHistory, // 섹션을 열었을 때만 데이터를 가져옴
  })

  async function handleFetchHolidays() {
    if (!confirm('공휴일 정보를 가져오시겠습니까?')) return
    
    setLoading(true)
    const currentYear = new Date().getFullYear()
    try {
      await apiClient.post(`/calendar/fetch-public-holiday/${currentYear}`)
      showMessage('공휴일 정보를 성공적으로 가져왔습니다.', 'success')
    } catch (error) {
      console.error('Failed to fetch holidays:', error)
      showMessage('공휴일 정보를 가져오는 데 실패했습니다.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toolbar />
      <main className="container mx-auto px-4 md:px-6 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-8">시스템 설정</h1>
          
          <div className="flex flex-col gap-8">
            {/* 공휴일 관리 섹션 */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-blue-50/50 rounded-xl border border-blue-100 flex flex-col items-start gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-blue-900 mb-1 flex items-center gap-2">
                    <CalendarDays className="w-5 h-5" /> 공휴일 관리
                  </h3>
                  <p className="text-sm text-blue-700/80">공공 데이터 API를 통해 올해의 공휴일 정보를 동기화합니다.</p>
                </div>
                <Button 
                  onClick={handleFetchHolidays}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
                >
                  {loading ? '가져오는 중...' : '공휴일 정보 가져오기'}
                </Button>
              </div>
            </section>

            {/* 히스토리 섹션 */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-gray-50/50 rounded-xl border border-gray-200 flex flex-col items-start gap-4 h-fit">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-1 flex items-center gap-2">
                    <HistoryIcon className="w-5 h-5 text-gray-400" /> 업데이트 내역 (History)
                  </h3>
                  <p className="text-sm text-gray-600">시스템의 버전별 주요 변경 사항 및 업데이트 내역을 확인합니다.</p>
                </div>
                <Button 
                  variant="outline"
                  onClick={() => setShowHistory(!showHistory)}
                  className="w-full sm:w-auto gap-2"
                >
                  {showHistory ? (
                    <>접기 <ChevronUp className="w-4 h-4" /></>
                  ) : (
                    <>업데이트 내역 보기 <ChevronDown className="w-4 h-4" /></>
                  )}
                </Button>

                {showHistory && (
                  <div className="w-full mt-4 border-t border-gray-100 pt-6 animate-in fade-in slide-in-from-top-2 duration-300">
                    {historyLoading ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {history?.map((entry, idx) => (
                          <div key={idx} className="relative pl-6 before:absolute before:left-0 before:top-2 before:bottom-0 before:w-0.5 before:bg-gray-100 last:before:hidden">
                            <div className="absolute left-[-3.5px] top-1.5 w-2 h-2 rounded-full bg-blue-500 border-2 border-white" />
                            
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1.5">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">v{entry.version}</span>
                                <span className="text-[10px] text-gray-400 font-medium">{entry.date}</span>
                              </div>
                            </div>

                            <ul className="space-y-1.5">
                              {entry.revisions.map((rev, revIdx) => (
                                <li key={revIdx} className="flex items-start gap-2 text-xs text-gray-600">
                                  <BadgeInfo className="w-3.5 h-3.5 text-gray-300 shrink-0 mt-0.5" />
                                  <span>{rev}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                        {(!history || history.length === 0) && (
                          <p className="text-center py-4 text-xs text-gray-400 italic">내역이 없습니다.</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}

export default SettingsPage
