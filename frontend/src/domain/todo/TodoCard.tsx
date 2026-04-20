import React from 'react'
import { X } from 'lucide-react'
import type { Todo } from './types/todo'
import { formatDate } from '@/lib/utils';

interface TodoCardProps {
    todo: Todo;
    onDelete: (id: number) => void;
};

export const TodoCard: React.FC<TodoCardProps> = ({ todo, onDelete }) => {
    return (
        <div className="group relative flex flex-col w-64 h-64 bg-gradient-to-br from-yellow-50 to-[#fff8c9] rounded-2xl border border-yellow-200/60 shadow-[0_2px_12px_-4px_rgba(234,179,8,0.15)] hover:shadow-[0_8px_24px_-4px_rgba(234,179,8,0.25)] hover:border-yellow-300/60 transition-all duration-300 hover:-translate-y-1 overflow-hidden">
            {/* 상단 라인 포인트 (접착부 느낌) */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-yellow-300 via-amber-300 to-yellow-400 opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
            
            {/* 헤더: 날짜와 삭제버튼 */}
            <div className="flex justify-between items-start pt-4 px-4 pb-2">
                <span className="inline-flex items-center text-[11px] font-semibold tracking-wider px-2 py-1 bg-yellow-100/70 text-yellow-800 rounded-md border border-yellow-200/50">
                    {formatDate(todo.createdAt)}
                </span>
                
                <button
                    type="button"
                    onClick={() => onDelete(todo.id)}
                    className="text-yellow-600/50 hover:text-red-500 hover:bg-yellow-200/60 p-1.5 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100 -mt-1 -mr-1"
                    aria-label="삭제"
                >
                    <X className="w-4 h-4" />
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