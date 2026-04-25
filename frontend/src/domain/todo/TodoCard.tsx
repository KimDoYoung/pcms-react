import React from 'react'
import { X } from 'lucide-react'
import type { Todo } from './types/todo'
import { formatDate } from '@/lib/utils';

interface TodoCardProps {
    todo: Todo;
    onDelete: (id: number) => void;
    index?: number;
};

const COLOR_VARIANTS = [
  {
    card: 'bg-gradient-to-br from-yellow-50 to-[#fff8c9] border-yellow-200/60 shadow-[0_2px_12px_-4px_rgba(234,179,8,0.15)] hover:shadow-[0_8px_24px_-4px_rgba(234,179,8,0.25)] hover:border-yellow-300/60',
    topBar: 'from-yellow-300 via-amber-300 to-yellow-400',
    badge: 'bg-yellow-100/70 text-yellow-800 border-yellow-200/50',
    deleteBtn: 'text-yellow-600/50 hover:bg-yellow-200/60',
  },
  {
    card: 'bg-gradient-to-br from-pink-50 to-[#fff0f5] border-pink-200/60 shadow-[0_2px_12px_-4px_rgba(236,72,153,0.12)] hover:shadow-[0_8px_24px_-4px_rgba(236,72,153,0.22)] hover:border-pink-300/60',
    topBar: 'from-pink-300 via-rose-300 to-pink-400',
    badge: 'bg-pink-100/70 text-pink-800 border-pink-200/50',
    deleteBtn: 'text-pink-600/50 hover:bg-pink-200/60',
  },
]

export const TodoCard: React.FC<TodoCardProps> = ({ todo, onDelete, index = 0 }) => {
    const color = COLOR_VARIANTS[index % COLOR_VARIANTS.length]
    return (
        <div className={`group relative flex flex-col w-64 h-64 rounded-2xl border transition-all duration-300 hover:-translate-y-1 overflow-hidden ${color.card}`}>
            {/* 상단 라인 포인트 (접착부 느낌) */}
            <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r opacity-60 group-hover:opacity-100 transition-opacity duration-300 ${color.topBar}`} />
            
            {/* 헤더: 날짜와 삭제버튼 */}
            <div className="flex justify-between items-start pt-4 px-4 pb-2">
                <span className={`inline-flex items-center text-[11px] font-semibold tracking-wider px-2 py-1 rounded-md border ${color.badge}`}>
                    {formatDate(todo.createdAt)}
                </span>
                
                <button
                    type="button"
                    onClick={() => onDelete(todo.id)}
                    className={`text-yellow-600/50 hover:text-red-500 p-1.5 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100 -mt-1 -mr-1 ${color.deleteBtn}`}
                    aria-label="삭제"
                >
                    <X className="w-12 h-12" />
                </button>
            </div>

            {/* 내용 영역 */}
            <div className="flex-1 p-5 pt-2 flex items-center justify-center">
                <p className="text-center text-blue-700/90 text-lg font-medium break-words leading-relaxed line-clamp-4 transition-colors group-hover:text-blue-900">
                    {todo.content}
                </p>
            </div>
        </div>
    );
}