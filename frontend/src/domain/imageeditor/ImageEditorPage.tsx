import Toolbar from '@/shared/layout/Toolbar'
import ActionImageEditor from '@/domain/imageeditor/components/ActionImageEditor'

export default function ImageEditorPage() {
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Toolbar />
      <main className="flex-1 flex overflow-hidden">
        <ActionImageEditor />
      </main>
    </div>
  )
}
