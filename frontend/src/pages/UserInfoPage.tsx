import Toolbar from '@/components/Toolbar'
import { useAuthStore } from '@/store/authStore'

function UserInfoPage() {
  const { userNm } = useAuthStore()

  return (
    <div className="min-h-screen bg-gray-50">
      <Toolbar />
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">사용자 정보 수정</h1>
          <p className="text-gray-600 mb-8">사용자 정보를 수정하는 페이지입니다. (준비 중)</p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">사용자명</label>
              <input 
                type="text" 
                className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 cursor-not-allowed" 
                disabled 
                value={userNm || ''}
              />
            </div>
            {/* 추가 필드들... */}
          </div>
        </div>
      </main>
    </div>
  )
}

export default UserInfoPage
