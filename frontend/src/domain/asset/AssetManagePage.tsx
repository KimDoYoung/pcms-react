import Toolbar from '@/shared/layout/Toolbar'
import AssetManagePanel from '@/domain/asset/AssetManagePanel'

export default function AssetManagePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Toolbar />
      <main className="container mx-auto px-4 py-6">
        <AssetManagePanel />
      </main>
    </div>
  )
}
