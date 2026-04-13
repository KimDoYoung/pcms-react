import React from 'react';
import { subWeeks,subMonths, startOfToday} from 'date-fns';

interface RangePickerProps {
    onRangeChange: (startDate: Date, endDate: Date) => void;
    onClose: () => void;
}
export const RangePicker: React.FC<RangePickerProps> = ({ onRangeChange, onClose }) => {
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
    ];
    return (
        <div className="absolute top-full mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
            {options.map((option) => (
                <button
                    key={option.label}
                    onClick={() => handleSelect(option.from, option.to)}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                    {option.label}
                </button>
            ))}
        </div>
    );
}
