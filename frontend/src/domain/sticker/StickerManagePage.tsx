/**
 * 목적: 스티커 및 작은 이미지(PNG, SVG, 주식 짤 등) 관리 페이지.
 *
 * 사용법:
 *   <StickerManagePage />
 *   /stickers 라우트에서 렌더링된다.
 *
 * props: 없음
 */
import Toolbar from '@/shared/layout/Toolbar'
import StickerManagePanel from '@/domain/sticker/StickerManagePanel'

export default function StickerManagePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Toolbar />
      <main className="container mx-auto px-4 py-6">
        <StickerManagePanel />
      </main>
    </div>
  )
}
