import { useState } from 'react'
import Toolbar from '@/shared/components/Toolbar'
import { useAuthStore } from '@/shared/store/authStore'
import { apiClient } from '@/lib/apiClient'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'

function UserInfoPage() {
  const { userNm } = useAuthStore()
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (formData.newPassword !== formData.confirmPassword) {
      alert('새로운 비밀번호와 확인 비밀번호가 일치하지 않습니다.')
      return
    }

    if (!confirm('비밀번호를 변경하시겠습니까?')) return

    setLoading(true)
    try {
      const response = await apiClient.post<any>('/user/change-password', formData)
      if (response.success) {
        alert('비밀번호가 성공적으로 변경되었습니다.')
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        })
      } else {
        alert(response.message || '비밀번호 변경에 실패했습니다.')
      }
    } catch (error: any) {
      console.error('Password change error:', error)
      const msg = error.response?.data?.message || '비밀번호 변경 중 오류가 발생했습니다.'
      alert(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toolbar />
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">사용자 정보 관리</h1>
          
          <div className="space-y-6">
            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
              <label className="block text-xs font-semibold text-blue-600 mb-1 uppercase tracking-wider">로그인 사용자</label>
              <div className="text-lg font-bold text-gray-800">{userNm}</div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 pt-4 border-t border-gray-100">
              <h3 className="text-sm font-bold text-gray-700 mb-2">비밀번호 변경</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">현재 비밀번호</label>
                <Input
                  type="password"
                  placeholder="현재 비밀번호 입력"
                  value={formData.currentPassword}
                  onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">새로운 비밀번호</label>
                <Input
                  type="password"
                  placeholder="새로운 비밀번호 입력"
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">새로운 비밀번호 확인</label>
                <Input
                  type="password"
                  placeholder="새로운 비밀번호 다시 입력"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                />
              </div>

              <Button 
                type="submit" 
                disabled={loading}
                className="w-full mt-2"
              >
                {loading ? '변경 중...' : '비밀번호 변경하기'}
              </Button>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}

export default UserInfoPage
