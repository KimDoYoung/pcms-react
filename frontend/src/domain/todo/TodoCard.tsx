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
        <div className="bg-yellow-100 rounded-lg shadow p-3 w-64 h-64 flex flex-col overflow-hidden relative">
            {/* 삭제 버튼 */}
            <button
                type="button"
                onClick={() => onDelete(todo.id)}
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 p-0.5 rounded transition-colors"
                aria-label="삭제"
            >
                <X className="w-4 h-4" />
            </button>
            {/* 내용 영역 */}
            <div className="flex-1 flex items-center justify-center px-2 pt-3">
                <p className="text-center text-xl font-semibold text-blue-700 break-words leading-snug line-clamp-4">
                {todo.content}
                </p>
            </div>

            {/* 날짜 영역 */}
            <p className="text-xs text-gray-500 mt-auto">
                {formatDate(todo.createdAt)}
            </p>            

        </div>
    );
}