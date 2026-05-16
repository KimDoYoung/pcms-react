/**
 * 목적: 상세 뷰 페이지 공통 액션 버튼 (수정 / 삭제 / 목록으로)
 *
 * 사용법:
 *   <ButtonsOfView
 *     onEdit={() => navigate(`/posts/${id}/edit`)}
 *     onDelete={handleDelete}
 *     onList={() => navigate(`/posts?boardId=${boardId}`)}
 *   />
 *
 * props:
 *   - onEdit?    : 수정 버튼 클릭 핸들러. 미전달 시 버튼 숨김.
 *   - onDelete?  : 삭제 버튼 클릭 핸들러. 미전달 시 버튼 숨김.
 *   - onList?    : 목록으로 버튼 클릭 핸들러. 미전달 시 버튼 숨김.
 *   - className? : 루트 div에 추가할 클래스 (예: shrink-0).
 */
import { Pencil, Trash2, ArrowLeft } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'

interface Props {
  onEdit?: () => void
  onDelete?: () => void
  onList?: () => void
  className?: string
}

export default function ButtonsOfView({ onEdit, onDelete, onList, className }: Props) {
  return (
    <div className={`flex items-center gap-2${className ? ` ${className}` : ''}`}>
      {onEdit && (
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Pencil className="w-3.5 h-3.5 mr-1" /> 수정
        </Button>
      )}
      {onDelete && (
        <Button variant="outline" size="sm" onClick={onDelete}
          className="text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200">
          <Trash2 className="w-3.5 h-3.5 mr-1" /> 삭제
        </Button>
      )}
      {onList && (
        <Button variant="outline" size="sm" onClick={onList}>
          <ArrowLeft className="w-3.5 h-3.5 mr-1" /> 목록으로
        </Button>
      )}
    </div>
  )
}
