import Toolbar from '@/shared/layout/Toolbar'
import MediaManagePanel from '@/domain/media/MediaManagePanel'

export default function MediaManagePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Toolbar />
      <main className="container mx-auto px-4 py-6">
        <MediaManagePanel />
      </main>
    </div>
  )
}
