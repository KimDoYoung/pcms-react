/**
 * 목적: 편집 페이지 공통 액션 버튼 (삭제 / 취소 / 저장)
 *
 * 사용법:
 *   <ButtonsOfEdit
 *     onDelete={handleDelete}
 *     onCancel={() => navigate(-1)}
 *     onSave={() => handleSubmit(false)}
 *     saving={saving}
 *     saveDisabled={saving || !form.title.trim()}
 *   />
 *
 * props:
 *   - onDelete?    : 삭제 버튼 클릭 핸들러. 미전달 시 버튼 숨김.
 *   - onCancel?    : 취소 버튼 클릭 핸들러. 미전달 시 버튼 숨김.
 *   - onSave?      : 저장 버튼 클릭 핸들러. 미전달 시 버튼 숨김.
 *   - saving?      : true이면 저장 버튼에 '저장 중...' 표시.
 *   - saveDisabled?: 저장 버튼 비활성화 여부.
 */
import { Button } from '@/shared/components/ui/button'

interface Props {
  onDelete?: () => void
  onCancel?: () => void
  onSave?: () => void
  saving?: boolean
  saveDisabled?: boolean
}

export default function ButtonsOfEdit({ onDelete, onCancel, onSave, saving, saveDisabled }: Props) {
  return (
    <div className="mt-4 flex items-center justify-between">
      <div>
        {onDelete && (
          <Button variant="delete" size="sm" onClick={onDelete}
            className="text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200">
            삭제
          </Button>
        )}
      </div>
      <div className="flex gap-2">
        {onCancel && (
          <Button variant="action" onClick={onCancel}>취소</Button>
        )}
        {onSave && (
          <Button onClick={onSave} disabled={saving || saveDisabled}>
            {saving ? '저장 중...' : '저장'}
          </Button>
        )}
      </div>
    </div>
  )
}
