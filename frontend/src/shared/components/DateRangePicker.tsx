import React from 'react';
import { subWeeks, subMonths, startOfToday, startOfMonth, endOfMonth } from 'date-fns';
import { X } from 'lucide-react';

/**
 * RangePicker Props 인터페이스
 * @prop onRangeChange - 날짜 범위가 선택되었을 때 부모에게 [시작일, 종료일]을 전달하는 콜백 함수
 * @prop onClose - 선택 완료 후 또는 닫기 버튼 클릭 시 패널을 닫기 위한 함수
 */
interface DateRangePickerProps {
    onRangeChange: (startDate: Date, endDate: Date) => void;
    onClose: () => void;
}
export const DateRangePicker: React.FC<DateRangePickerProps> = ({ onRangeChange, onClose }) => {
    const today = startOfToday();
    const handleSelect = (fromDate: Date, toDate: Date) => {
        onRangeChange(fromDate, toDate);
        onClose();
    };
    const options = [
        { label: '1주일 전', from: subWeeks(today, 1), to: today },
        { label: '2주일 전', from: subWeeks(today, 2), to: today },
        { label: '1개월 전', from: subMonths(today, 1), to: today },
        { label: '2개월 전', from: subMonths(today, 2), to: today },
        { label: '금월', from: startOfMonth(today), to: today },
        { label: '전월', from: startOfMonth(subMonths(today, 1)), to: endOfMonth(subMonths(today, 1)) },
    ];
    return (
        <div className="absolute top-full mt-2 w-72 bg-white border border-gray-200 rounded-md shadow-lg z-10 p-3">
            <div className="flex items-start justify-between gap-2 mb-3">
                <p className="text-xs font-medium text-gray-500">빠른 날짜 선택</p>
                <button
                    type="button"
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 p-0.5 rounded transition-colors"
                    aria-label="닫기"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            <div className="flex flex-wrap gap-2">
                {options.map((option) => (
                    <button
                        key={option.label}
                        type="button"
                        onClick={() => handleSelect(option.from, option.to)}
                        className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 border border-gray-200 rounded-full hover:bg-gray-200 transition-colors"
                    >
                        {option.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
