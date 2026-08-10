/**
 * 목적: 마크다운 본문을 편집하는 textarea. 서식 삽입/변환, 우클릭 컨텍스트 메뉴, 단축키,
 *       이미지 붙여넣기 업로드, 글머리기호/번호목록/인용구 Enter 자동 이어쓰기를 지원한다.
 *       상위 컴포넌트(MdSplitEditor)의 툴바가 ref를 통해 텍스트 삽입/서식 액션을 호출할 수 있다.
 *
 * 사용법:
 *   const editorRef = useRef<MdTextareaHandle>(null)
 *   <MdTextarea ref={editorRef} value={content} onChange={setContent} onSave={handleSave}
 *     onOpenAssetPicker={(atype) => setAssetPopup({atype, position: center})} />
 *   editorRef.current?.applyAction('bold')
 *   editorRef.current?.insertText('![제목](url)')
 *
 * props:
 *   - value: string - 현재 마크다운 내용
 *   - onChange: (value: string) => void - 내용 변경 콜백
 *   - onSave?: () => void - Ctrl+S 저장 콜백
 *   - onOpenAssetPicker?: (atype: AssetType) => void - Ctrl+1~4로 에셋 팝업 열기 콜백
 *   - textareaRef?: 외부에서 textarea DOM에 접근해야 할 때(스크롤 동기화 등) 전달하는 ref
 */
import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { apiClient } from '@/lib/apiClient';
import { ROTATE_TEXT_COLORS, ROTATE_BG_COLORS, getNextColor } from '@/shared/components/editor/editorColors';
import type { AssetType } from '@/domain/asset/types/asset';
import { measureLineTops } from '@/lib/textareaLinePositions';

interface Props {
    value: string;
    onChange: (value: string) => void;
    onSave?: () => void;
    onOpenAssetPicker?: (atype: AssetType, position: { x: number; y: number }) => void;
    textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
}

export interface MdTextareaHandle {
    insertText: (text: string, cursorOffsetStart?: number, cursorOffsetEnd?: number) => void;
    applyAction: (action: string) => void;
    focusEditor: () => void;
}

// 컨텍스트 메뉴 위치를 위한 타입
interface MenuPosition {
    x: number;
    y: number;
    visible: boolean;
}

const MdTextarea = forwardRef<MdTextareaHandle, Props>(function MdTextarea(
    { value, onChange, onSave, onOpenAssetPicker, textareaRef: externalRef },
    ref,
) {
    const [form, setForm] = useState({ content: value });
    const [menuPos, setMenuPos] = useState<MenuPosition>({ x: 0, y: 0, visible: false });
    const internalRef = useRef<HTMLTextAreaElement>(null);
    const textareaRef = externalRef || internalRef;

    // 메뉴 외부 클릭 시 닫기
    useEffect(() => {
        const handleClick = () => setMenuPos((prev) => ({ ...prev, visible: false }));
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    // 외부 value가 변경될 때(비동기 데이터 로드 등) 내부 state 동기화
    useEffect(() => {
        setForm({ content: value });
    }, [value]);

    const updateContent = (
        textarea: HTMLTextAreaElement,
        start: number,
        end: number,
        newText: string,
        cursorOffsetStart = 2,
        cursorOffsetEnd = 2,
    ) => {
        const updated = form.content.substring(0, start) + newText + form.content.substring(end);
        setForm({ content: updated });
        onChange(updated);

        // 포커스 유지 및 커서 위치 조정 (약간의 지연 필요)
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + cursorOffsetStart, start + newText.length - cursorOffsetEnd);
        }, 0);
    };

    // explicitColor를 넘기면 그 색으로 직접 지정(팝오버 스와치 클릭), 생략하면 팔레트에서 다음 색으로 순환(Ctrl+./Ctrl+/)
    const applyColor = (textarea: HTMLTextAreaElement, kind: 'text' | 'bg', explicitColor?: string | null) => {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        if (start === end) return;

        const selectedText = form.content.substring(start, end);
        const palette = kind === 'text' ? ROTATE_TEXT_COLORS : ROTATE_BG_COLORS;
        const regex = kind === 'text'
            ? /^<font color="([^"]+)">([\s\S]*)<\/font>$/i
            : /^<span style="background-color:\s*([^";\s]+)">([\s\S]*)<\/span>$/i;
        const match = selectedText.match(regex);
        const currentColor = match ? match[1] : null;
        const insideText = match ? match[2] : selectedText;
        const nextColor = explicitColor !== undefined ? explicitColor : getNextColor(currentColor, palette);

        const newText = nextColor
            ? kind === 'text'
                ? `<font color="${nextColor}">${insideText}</font>`
                : `<span style="background-color: ${nextColor}">${insideText}</span>`
            : insideText;

        updateContent(textarea, start, end, newText, 0, 0);
    };

    const handleAction = (action: string) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = form.content.substring(start, end);

        if (action.startsWith('color-text-set:')) {
            applyColor(textarea, 'text', action.slice('color-text-set:'.length) || null);
            setMenuPos((prev) => ({ ...prev, visible: false }));
            return;
        }
        if (action.startsWith('color-bg-set:')) {
            applyColor(textarea, 'bg', action.slice('color-bg-set:'.length) || null);
            setMenuPos((prev) => ({ ...prev, visible: false }));
            return;
        }

        switch (action) {
            case 'bold':
                updateContent(textarea, start, end, `**${selectedText}**`, 2, 2);
                break;
            case 'italic':
                updateContent(textarea, start, end, `*${selectedText}*`, 1, 1);
                break;
            case 'strike':
                updateContent(textarea, start, end, `~~${selectedText}~~`, 2, 2);
                break;
            case 'link': {
                const url = prompt('URL을 입력하세요:');
                if (url) updateContent(textarea, start, end, `[${selectedText}](${url})`, 1, 1 + url.length + 2);
                break;
            }
            case 'bullet':
                updateContent(textarea, start, end, selectedText.split('\n').map((l) => `- ${l}`).join('\n'), 2, 0);
                break;
            case 'number':
                updateContent(textarea, start, end, selectedText.split('\n').map((l, i) => `${i + 1}. ${l}`).join('\n'), 3, 0);
                break;
            case 'quote':
                updateContent(textarea, start, end, selectedText.split('\n').map((l) => `> ${l}`).join('\n'), 2, 0);
                break;
            case 'h1':
            case 'h2':
            case 'h3': {
                const level = Number(action.slice(1));
                const prefix = '#'.repeat(level) + ' ';
                updateContent(textarea, start, end, prefix + selectedText, prefix.length, 0);
                break;
            }
            case 'color-text':
                applyColor(textarea, 'text');
                break;
            case 'color-bg':
                applyColor(textarea, 'bg');
                break;
            case 'table': {
                const table = `\n| Column 1 | Column 2 | Column 3 |\n|----------|----------|----------|\n| Row 1    | Row 2    | Row 3    |\n`;
                updateContent(textarea, start, end, table, table.length, 0);
                break;
            }
        }
        setMenuPos((prev) => ({ ...prev, visible: false }));
    };

    useImperativeHandle(ref, () => ({
        insertText(text, cursorOffsetStart = text.length, cursorOffsetEnd = 0) {
            const textarea = textareaRef.current;
            if (!textarea) return;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            updateContent(textarea, start, end, text, cursorOffsetStart, cursorOffsetEnd);
        },
        applyAction(action) {
            handleAction(action);
        },
        focusEditor() {
            textareaRef.current?.focus();
        },
    }));

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        setMenuPos({ x: e.pageX, y: e.pageY, visible: true });
    };

    const handleKeydown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        const textarea = e.currentTarget;

        // 글머리기호/번호목록/인용구 라인에서 Enter 시 다음 줄에 같은 기호를 자동으로 이어 붙인다.
        if (e.key === 'Enter' && !e.ctrlKey && !e.shiftKey) {
            const value = form.content;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            if (start === end) {
                const lastNewline = value.substring(0, start).lastIndexOf('\n');
                const lineStart = lastNewline === -1 ? 0 : lastNewline + 1;
                const currentLineText = value.substring(lineStart, start);

                const emptyMatch =
                    currentLineText.match(/^(\s*)-\s*$/) ||
                    currentLineText.match(/^(\s*)\d+\.\s*$/) ||
                    currentLineText.match(/^(\s*)>\s*$/);
                if (emptyMatch) {
                    e.preventDefault();
                    const indent = emptyMatch[1];
                    const updated = value.substring(0, lineStart) + indent + value.substring(start);
                    setForm({ content: updated });
                    onChange(updated);
                    setTimeout(() => {
                        textarea.focus();
                        textarea.setSelectionRange(lineStart + indent.length, lineStart + indent.length);
                    }, 0);
                    return;
                }

                const bulletMatch = currentLineText.match(/^(\s*)-\s+(.+)$/);
                const numberMatch = currentLineText.match(/^(\s*)(\d+)\.\s+(.+)$/);
                const quoteMatch = currentLineText.match(/^(\s*)>\s+(.+)$/);
                let insertion: string | null = null;
                if (bulletMatch) insertion = `\n${bulletMatch[1]}- `;
                else if (numberMatch) insertion = `\n${numberMatch[1]}${parseInt(numberMatch[2], 10) + 1}. `;
                else if (quoteMatch) insertion = `\n${quoteMatch[1]}> `;

                if (insertion) {
                    e.preventDefault();
                    const updated = value.substring(0, start) + insertion + value.substring(start);
                    setForm({ content: updated });
                    onChange(updated);
                    const newPos = start + insertion.length;
                    setTimeout(() => {
                        textarea.focus();
                        textarea.setSelectionRange(newPos, newPos);
                    }, 0);
                    return;
                }
            }
        }

        // Alt+Z: 현재 커서 줄을 화면 중앙으로 스크롤
        if (e.altKey && e.key.toLowerCase() === 'z') {
            e.preventDefault();
            const text = form.content;
            const start = textarea.selectionStart;
            const lineCount = text.split('\n').length;
            const currentLineNumber = text.substring(0, start).split('\n').length;
            const targetScrollTop = (currentLineNumber / lineCount) * textarea.scrollHeight - textarea.clientHeight / 2;
            textarea.scrollTop = Math.max(0, Math.min(targetScrollTop, textarea.scrollHeight - textarea.clientHeight));
            return;
        }

        if (e.ctrlKey) {
            const key = e.key.toLowerCase();
            if (e.shiftKey && key === 'v') {
                e.preventDefault();
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const selected = form.content.substring(start, end);
                const kbdText = `<kbd>${selected}</kbd>`;
                updateContent(textarea, start, end, kbdText, 5, 6);
                return;
            }
            if (e.shiftKey && key === 's') {
                e.preventDefault();
                handleAction('strike');
                return;
            }
            if (key === '.') {
                e.preventDefault();
                handleAction('color-text');
                return;
            }
            if (key === '/') {
                e.preventDefault();
                handleAction('color-bg');
                return;
            }
            if (key === 's') {
                e.preventDefault();
                onSave?.();
                return;
            }
            if (['b', 'i', 'l', '0', '9', '8', ','].includes(key)) {
                e.preventDefault();
                const actionMap: Record<string, string> = {
                    b: 'bold', i: 'italic', l: 'link', '0': 'bullet', '9': 'number', '8': 'quote', ',': 'table',
                };
                handleAction(actionMap[key]);
                return;
            }
            const assetMap: Record<string, AssetType> = { '1': 'EMOJI', '2': 'SYMBOL', '3': 'PHRASE', '4': 'TEMPLATE' };
            if (!e.shiftKey && !e.altKey && assetMap[e.key]) {
                e.preventDefault();
                const [topInTextarea] = measureLineTops(textarea, [textarea.selectionStart]);
                const rect = textarea.getBoundingClientRect();
                const x = Math.max(8, Math.min(rect.left + 8, window.innerWidth - 400));
                const y = Math.max(8, Math.min(rect.top + topInTextarea - textarea.scrollTop + 20, window.innerHeight - 280));
                onOpenAssetPicker?.(assetMap[e.key], { x, y });
                return;
            }
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onChange(e.target.value);
        setForm({ content: e.target.value });
    };

    const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
        const items = e.clipboardData?.items;
        if (!items) return;
        for (const item of Array.from(items)) {
            if (item.type.startsWith('image/')) {
                e.preventDefault();
                const file = item.getAsFile();
                if (!file) continue;

                const textarea = e.currentTarget;
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;

                const placeholderId = Date.now();
                const loadingText = `![Uploading image ${placeholderId}...]()\n`;
                const newContent = form.content.substring(0, start) + loadingText + form.content.substring(end);
                setForm({ content: newContent });
                onChange(newContent);

                try {
                    const formData = new FormData();
                    formData.append('file', file);
                    const res = await apiClient.post<{ url: string } | string>('/files/editor-image', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' },
                    });
                    const actualUrl = typeof res === 'string' ? res : (res?.url ?? 'undefined_url_returned');
                    const markdownImage = `![image](${actualUrl})\n`;
                    const finalContent = newContent.replace(loadingText, markdownImage);
                    setForm({ content: finalContent });
                    onChange(finalContent);
                } catch {
                    alert('이미지 업로드 중 오류가 발생했습니다.');
                    const revertedContent = newContent.replace(loadingText, '');
                    setForm({ content: revertedContent });
                    onChange(revertedContent);
                }
                return;
            }
        }
    };

    return (
        <div className="relative w-full flex-1 flex flex-col">
            <textarea
                ref={textareaRef}
                placeholder="마크다운으로 내용을 입력하세요..."
                value={form.content}
                onChange={handleChange}
                onKeyDown={handleKeydown}
                onPaste={handlePaste}
                onContextMenu={handleContextMenu}
                className="flex-1 w-full border border-gray-200 rounded-lg px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono custom-scroll"
            />

            {/* 커스텀 컨텍스트 메뉴 */}
            {menuPos.visible && (
                <ul
                    className="fixed z-50 bg-white border border-gray-200 shadow-xl rounded-md py-1 text-sm w-48"
                    style={{ top: menuPos.y, left: menuPos.x }}
                >
                    <ContextMenuItem label="Bold" shortcut="Ctrl+B" onClick={() => handleAction('bold')} />
                    <ContextMenuItem label="Italic" shortcut="Ctrl+I" onClick={() => handleAction('italic')} />
                    <ContextMenuItem label="Strike" shortcut="Ctrl+Shift+S" onClick={() => handleAction('strike')} />
                    <ContextMenuItem label="Link" shortcut="Ctrl+L" onClick={() => handleAction('link')} />
                    <hr className="my-1 border-gray-100" />
                    <ContextMenuItem label="Bullet List" shortcut="Ctrl+0" onClick={() => handleAction('bullet')} />
                    <ContextMenuItem label="Number List" shortcut="Ctrl+9" onClick={() => handleAction('number')} />
                    <ContextMenuItem label="Quote" shortcut="Ctrl+8" onClick={() => handleAction('quote')} />
                    <ContextMenuItem label="Table" shortcut="Ctrl+," onClick={() => handleAction('table')} />
                </ul>
            )}
        </div>
    );
});

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
