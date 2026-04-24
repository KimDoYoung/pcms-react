import React, { useState, useEffect, useRef } from 'react';
import { apiClient } from '@/lib/apiClient';

interface Props {
    value: string;
    onChange: (value: string) => void;
}

// 컨텍스트 메뉴 위치를 위한 타입
interface MenuPosition {
    x: number;
    y: number;
    visible: boolean;
}

const MdTextarea: React.FC<Props> = ({ value, onChange }) => {
    const [form, setForm] = useState({ content: value });
    const [menuPos, setMenuPos] = useState<MenuPosition>({ x: 0, y: 0, visible: false });
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // 메뉴 외부 클릭 시 닫기
    useEffect(() => {
        const handleClick = () => setMenuPos((prev) => ({ ...prev, visible: false }));
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    const updateContent = (textarea: HTMLTextAreaElement, start: number, end: number, newText: string) => {
        const updated = form.content.substring(0, start) + newText + form.content.substring(end);
        setForm({ content: updated });
        onChange(updated);

        // 포커스 유지 및 커서 위치 조정 (약간의 지연 필요)
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + 2, start + newText.length - 2);
        }, 0);
    };

    const handleAction = (action: string) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = form.content.substring(start, end);

        switch (action) {
            case 'bold':
                updateContent(textarea, start, end, `**${selectedText}**`);
                break;
            case 'link':
                const url = prompt('URL을 입력하세요:');
                if (url) updateContent(textarea, start, end, `[${selectedText}](${url})`);
                break;
            case 'bullet':
                updateContent(textarea, start, end, selectedText.split('\n').map((l) => `- ${l}`).join('\n'));
                break;
            case 'number':
                updateContent(textarea, start, end, selectedText.split('\n').map((l, i) => `${i + 1}. ${l}`).join('\n'));
                break;
            case 'table':
                const table = `\n| Column 1 | Column 2 | Column 3 |\n|----------|----------|----------|\n| Row 1    | Row 2    | Row 3    |\n`;
                updateContent(textarea, start, end, table);
                break;
        }
        setMenuPos((prev) => ({ ...prev, visible: false }));
    };

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        setMenuPos({ x: e.pageX, y: e.pageY, visible: true });
    };

    const handleKeydown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.ctrlKey) {
            const key = e.key.toLowerCase();
            if (['b', 'l', '0', '9', ','].includes(key) || (e.shiftKey && key === '?')) {
                const actionMap: Record<string, string> = {
                    b: 'bold', l: 'link', '0': 'bullet', '9': 'number', ',': 'table'
                };
                if (key === '?') {
                    handleAction('help'); // 도움말 로직 별도 분리 권장
                    return;
                }
                handleAction(actionMap[key]);
            }
        }
    };

    // 기존 handlePaste, handleChange 로직 유지...
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onChange(e.target.value);
        setForm({ content: e.target.value });
    };

    return (
        <div className="relative w-full">
            <textarea
                ref={textareaRef}
                rows={20}
                placeholder="마크다운으로 내용을 입력하세요..."
                value={form.content}
                onChange={handleChange}
                onKeyDown={handleKeydown}
                onContextMenu={handleContextMenu}
                className="border border-gray-200 rounded-lg px-4 py-3 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono w-full"
            />

            {/* 커스텀 컨텍스트 메뉴 */}
            {menuPos.visible && (
                <ul
                    className="fixed z-50 bg-white border border-gray-200 shadow-xl rounded-md py-1 text-sm w-48"
                    style={{ top: menuPos.y, left: menuPos.x }}
                >
                    <ContextMenuItem label="Bold" shortcut="Ctrl+B" onClick={() => handleAction('bold')} />
                    <ContextMenuItem label="Link" shortcut="Ctrl+L" onClick={() => handleAction('link')} />
                    <hr className="my-1 border-gray-100" />
                    <ContextMenuItem label="Bullet List" shortcut="Ctrl+0" onClick={() => handleAction('bullet')} />
                    <ContextMenuItem label="Number List" shortcut="Ctrl+9" onClick={() => handleAction('number')} />
                    <ContextMenuItem label="Table" shortcut="Ctrl+," onClick={() => handleAction('table')} />
                </ul>
            )}
        </div>
    );
};

// 내부 컴포넌트: 메뉴 아이템 스타일
const ContextMenuItem = ({ label, shortcut, onClick }: { label: string; shortcut: string; onClick: () => void }) => (
    <li
        className="px-4 py-2 hover:bg-blue-50 cursor-pointer flex justify-between items-center text-gray-700"
        onClick={(e) => { e.stopPropagation(); onClick(); }}
    >
        <span>{label}</span>
        <span className="text-xs text-gray-400 font-mono">{shortcut}</span>
    </li>
);

export default MdTextarea;