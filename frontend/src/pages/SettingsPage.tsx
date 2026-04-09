import Toolbar from '@/components/Toolbar'
import { Button } from '@/components/ui/button'
import { apiClient } from '@/lib/apiClient'
import { useState } from 'react'

function SettingsPage() {
  const [loading, setLoading] = useState(false)

  async function handleFetchHolidays() {
    if (!confirm('공휴일 정보를 가져오시겠습니까?')) return
    
    setLoading(true)
    try {
      await apiClient.post('/system/holidays/fetch')
      alert('공휴일 정보를 성공적으로 가져왔습니다.')
    } catch (error) {
      console.error('Failed to fetch holidays:', error)
      alert('공휴일 정보를 가져오는 데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toolbar />
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-8">시스템 설정</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-blue-50/50 rounded-xl border border-blue-100 flex flex-col items-start gap-4">
              <div>
                <h3 className="text-lg font-semibold text-blue-900 mb-1">📅 공휴일 관리</h3>
                <p className="text-sm text-blue-700/80">공공 데이터 API를 통해 올해의 공휴일 정보를 동기화합니다.</p>
              </div>
              <Button 
                onClick={handleFetchHolidays}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? '가져오는 중...' : '공휴일 정보 가져오기'}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default SettingsPage
