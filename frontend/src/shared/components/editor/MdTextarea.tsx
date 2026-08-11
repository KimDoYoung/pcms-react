/**
 * 목적: 마크다운 본문을 편집하는 textarea. 서식 삽입/변환, 우클릭 컨텍스트 메뉴, 단축키,
 *       이미지 붙여넣기 업로드, 글머리기호/번호목록/인용구 Enter 자동 이어쓰기를 지원한다.
 *       상위 컴포넌트(MdSplitEditor)의 툴바가 ref를 통해 텍스트 삽입/서식 액션을 호출할 수 있다.
 *
 * 사용법:
 *   const editorRef = useRef<MdTextareaHandle>(null)
 *   <MdTextarea ref={editorRef} value={content} onChange={setContent} onSave={handleSave}
 *     onOpenMedia={() => setMediaOpen(true)}
 *     onOpenAssetPicker={(atype, pos) => setAssetPopup({atype, position: pos})} />
 *   editorRef.current?.applyAction('bold')
 *   editorRef.current?.insertText('![제목](url)')
 *
 * props:
 *   - value: string - 현재 마크다운 내용
 *   - onChange: (value: string) => void - 내용 변경 콜백
 *   - onSave?: () => void - Ctrl+S 저장 콜백
 *   - onOpenMedia?: () => void - Ctrl+Shift+V 비디오/오디오/유튜브 모달 열기
 *   - onOpenAssetPicker?: (atype, position) => void - Ctrl+1~4 에셋 팝업 열기
 *   - textareaRef?: 외부에서 textarea DOM 접근용 ref (스크롤 동기화 등)
 *
 * 단축키: Ctrl+B/I/Shift+S(취소선) / Ctrl+L(링크) / Ctrl+0/9/8(목록/인용) / Ctrl+,(표 삽입/표↔CSV 전환)
 *         Ctrl+.(글자색) / Ctrl+/(배경색) / Ctrl+S(저장) / Ctrl+Space(&nbsp;)
 *         Ctrl+Enter(<br/>) / Ctrl+Shift+V(미디어모달) / Ctrl+Shift+K(kbd태그)
 *         Ctrl+1~4(에셋팝업) / Alt+Z(현재줄 중앙스크롤)
 *         Tab(들여쓰기+2칸) / Shift+Tab(내어쓰기) / Enter/Shift+Enter(목록 자동이어쓰기)
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
    onOpenMedia?: () => void;
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
    { value, onChange, onSave, onOpenMedia, onOpenAssetPicker, textareaRef: externalRef },
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
        const scrollTop = textarea.scrollTop;

        // execCommand로 삽입해야 브라우저 네이티브 undo(Ctrl+Z) 스택이 유지된다.
        // (React state로 textarea.value를 직접 덮어쓰면 undo 히스토리가 끊긴다.)
        textarea.focus();
        textarea.setSelectionRange(start, end);

        let successful = false;
        try {
            successful = document.execCommand('insertText', false, newText);
        } catch {
            successful = false;
        }

        if (!successful) {
            const updated = form.content.substring(0, start) + newText + form.content.substring(end);
            setForm({ content: updated });
            onChange(updated);
        }

        // 포커스 유지 및 커서 위치 조정 (약간의 지연 필요)
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + cursorOffsetStart, start + newText.length - cursorOffsetEnd);
            textarea.scrollTop = scrollTop;
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
                if (!selectedText || !selectedText.trim()) {
                    // 선택 영역이 없으면 기본 템플릿 삽입
                    const table = `\n| Column 1 | Column 2 | Column 3 |\n|----------|----------|----------|\n| Row 1    | Row 2    | Row 3    |\n`;
                    updateContent(textarea, start, end, table, table.length, 0);
                    break;
                }

                // 선택 영역이 있으면 마크다운 표 <-> CSV/TSV 양방향 전환
                const lines = selectedText.split('\n').map((l) => l.trim()).filter(Boolean);
                if (lines.length === 0) {
                    alert('선택된 영역에 텍스트가 없습니다.');
                    break;
                }

                const isSeparatorRow = (line: string): boolean => /^[|:\s-]+$/.test(line) && line.includes('-');
                let hasSeparator = false;
                let pipeLineCount = 0;
                for (const line of lines) {
                    if (isSeparatorRow(line)) hasSeparator = true;
                    if (line.includes('|')) pipeLineCount++;
                }
                const isMarkdownTable = hasSeparator && pipeLineCount >= 2;

                if (isMarkdownTable) {
                    // 마크다운 표 -> CSV 변환
                    const escapeCSVField = (val: string): string => {
                        const cleaned = val.trim();
                        return cleaned.includes(',') || cleaned.includes('"') || cleaned.includes('\n')
                            ? `"${cleaned.replace(/"/g, '""')}"`
                            : cleaned;
                    };
                    const csvLines: string[] = [];
                    for (const line of lines) {
                        if (isSeparatorRow(line) || !line.includes('|')) continue;
                        let content = line;
                        if (content.startsWith('|')) content = content.substring(1);
                        if (content.endsWith('|')) content = content.substring(0, content.length - 1);
                        const cells = content.split('|').map((c) => c.trim());
                        csvLines.push(cells.map(escapeCSVField).join(','));
                    }
                    const csvResult = csvLines.join('\n');
                    updateContent(textarea, start, end, csvResult, csvResult.length, 0);
                } else {
                    // CSV/TSV -> 마크다운 표 변환
                    const firstLine = lines[0];
                    const commaCount = (firstLine.match(/,/g) || []).length;
                    const tabCount = (firstLine.match(/\t/g) || []).length;
                    if (commaCount === 0 && tabCount === 0) {
                        alert('선택한 텍스트가 마크다운 표 또는 CSV 형식이 아닙니다.\n(쉼표나 탭으로 구분된 최소 2열 이상의 데이터여야 표 변환이 가능합니다.)');
                        break;
                    }
                    const delimiter = tabCount > commaCount ? '\t' : ',';

                    const rows: string[][] = [];
                    for (const line of lines) {
                        const row: string[] = [];
                        let current = '';
                        let inQuotes = false;
                        for (let i = 0; i < line.length; i++) {
                            const char = line[i];
                            if (char === '"') {
                                inQuotes = !inQuotes;
                            } else if (char === delimiter && !inQuotes) {
                                row.push(current.trim());
                                current = '';
                            } else {
                                current += char;
                            }
                        }
                        row.push(current.trim());
                        rows.push(row);
                    }

                    const colCounts = rows.map((r) => r.length);
                    const minCols = Math.min(...colCounts);
                    if (minCols <= 1) {
                        alert('선택한 텍스트가 마크다운 표 또는 CSV 형식이 아닙니다.\n(최소 2열 이상의 데이터여야 표 변환이 가능합니다.)');
                        break;
                    }
                    const maxCols = Math.max(...colCounts);

                    const headerRow = rows[0];
                    while (headerRow.length < maxCols) headerRow.push('');
                    const headerLine = `| ${headerRow.map((cell) => cell || ' ').join(' | ')} |`;
                    const separatorLine = `| ${Array(maxCols).fill('---').join(' | ')} |`;
                    const dataLines = rows.slice(1).map((row) => {
                        while (row.length < maxCols) row.push('');
                        return `| ${row.map((cell) => cell || ' ').join(' | ')} |`;
                    });

                    const tableMarkdown = `\n${headerLine}\n${separatorLine}\n${dataLines.join('\n')}\n`;
                    updateContent(textarea, start, end, tableMarkdown, tableMarkdown.length, 0);
                }
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
        const text = form.content;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;

        // Tab / Shift+Tab: 들여쓰기 (aman 동일)
        if (e.key === 'Tab') {
            e.preventDefault();
            if (start === end) {
                const updated = text.substring(0, start) + '  ' + text.substring(start);
                setForm({ content: updated });
                onChange(updated);
                setTimeout(() => { textarea.focus(); textarea.setSelectionRange(start + 2, start + 2); }, 0);
            } else {
                const lastNl = text.substring(0, start).lastIndexOf('\n');
                const lineStart = lastNl === -1 ? 0 : lastNl + 1;
                const textToIndent = text.substring(lineStart, end);
                const lines = textToIndent.split('\n');
                let newSelStart = start;
                let newSelEnd = end;
                let indented: string;
                if (e.shiftKey) {
                    let totalRemoved = 0;
                    const updated2 = lines.map((line, idx) => {
                        let removed = 0;
                        let nl = line;
                        if (line.startsWith('\t')) { nl = line.substring(1); removed = 1; }
                        else if (line.startsWith('    ')) { nl = line.substring(4); removed = 4; }
                        else if (line.startsWith('  ')) { nl = line.substring(2); removed = 2; }
                        if (idx === 0) {
                            const off = start - lineStart;
                            if (off > 0) newSelStart = Math.max(lineStart, start - Math.min(removed, off));
                        }
                        totalRemoved += removed;
                        return nl;
                    });
                    indented = updated2.join('\n');
                    newSelEnd = end - totalRemoved;
                } else {
                    indented = lines.map((l) => '  ' + l).join('\n');
                    newSelStart = start + 2;
                    newSelEnd = end + lines.length * 2;
                }
                const updated2 = text.substring(0, lineStart) + indented + text.substring(end);
                setForm({ content: updated2 });
                onChange(updated2);
                setTimeout(() => { textarea.focus(); textarea.setSelectionRange(newSelStart, newSelEnd); }, 0);
            }
            return;
        }

        // Alt+Z: 현재 커서 줄을 화면 중앙으로 스크롤
        if (e.altKey && !e.ctrlKey && e.code === 'KeyZ') {
            e.preventDefault();
            const [topPx] = measureLineTops(textarea, [start]);
            const lineHeight = parseFloat(window.getComputedStyle(textarea).lineHeight) || 20;
            const targetScrollTop = topPx - textarea.clientHeight / 2 + lineHeight / 2;
            textarea.scrollTop = Math.max(0, Math.min(targetScrollTop, textarea.scrollHeight - textarea.clientHeight));
            return;
        }

        // Enter: Ctrl+Enter → <br/>, Shift+Enter → 줄 끝에 리스트 이어쓰기, 일반 Enter → 리스트 자동 이어쓰기
        if (e.key === 'Enter') {
            if (e.ctrlKey) {
                e.preventDefault();
                updateContent(textarea, start, end, '<br/>', 5, 0);
                return;
            }

            if (e.shiftKey) {
                e.preventDefault();
                const nextNl = text.indexOf('\n', start);
                const lineEnd = nextNl === -1 ? text.length : nextNl;
                const lastNl = text.substring(0, start).lastIndexOf('\n');
                const lineStart2 = lastNl === -1 ? 0 : lastNl + 1;
                const currentLine = text.substring(lineStart2, lineEnd);
                let insertText = '\n';
                const bm = currentLine.match(/^(\s*)-\s+(.+)$/);
                const nm = currentLine.match(/^(\s*)(\d+)\.\s+(.+)$/);
                const qm = currentLine.match(/^(\s*)>\s+(.+)$/);
                if (bm) insertText = `\n${bm[1]}- `;
                else if (nm) insertText = `\n${nm[1]}${parseInt(nm[2], 10) + 1}. `;
                else if (qm) insertText = `\n${qm[1]}> `;
                const updated = text.substring(0, lineEnd) + insertText + text.substring(lineEnd);
                setForm({ content: updated });
                onChange(updated);
                const newPos = lineEnd + insertText.length;
                setTimeout(() => { textarea.focus(); textarea.setSelectionRange(newPos, newPos); }, 0);
                return;
            }

            // 일반 Enter: 리스트 빈 줄 종료 + 자동 이어쓰기
            if (start === end) {
                const lastNl = text.substring(0, start).lastIndexOf('\n');
                const lineStart2 = lastNl === -1 ? 0 : lastNl + 1;
                const currentLine = text.substring(lineStart2, start);
                const emptyMatch =
                    currentLine.match(/^(\s*)-\s*$/) ||
                    currentLine.match(/^(\s*)\d+\.\s*$/) ||
                    currentLine.match(/^(\s*)>\s*$/);
                if (emptyMatch) {
                    e.preventDefault();
                    const indent = emptyMatch[1];
                    const updated = text.substring(0, lineStart2) + indent + text.substring(start);
                    setForm({ content: updated });
                    onChange(updated);
                    setTimeout(() => { textarea.focus(); textarea.setSelectionRange(lineStart2 + indent.length, lineStart2 + indent.length); }, 0);
                    return;
                }
                const bm = currentLine.match(/^(\s*)-\s+(.+)$/);
                const nm = currentLine.match(/^(\s*)(\d+)\.\s+(.+)$/);
                const qm = currentLine.match(/^(\s*)>\s+(.+)$/);
                let insertion: string | null = null;
                if (bm) insertion = `\n${bm[1]}- `;
                else if (nm) insertion = `\n${nm[1]}${parseInt(nm[2], 10) + 1}. `;
                else if (qm) insertion = `\n${qm[1]}> `;
                if (insertion) {
                    e.preventDefault();
                    const updated = text.substring(0, start) + insertion + text.substring(start);
                    setForm({ content: updated });
                    onChange(updated);
                    const newPos = start + insertion.length;
                    setTimeout(() => { textarea.focus(); textarea.setSelectionRange(newPos, newPos); }, 0);
                    return;
                }
            }
            return;
        }

        if (e.ctrlKey) {
            const key = e.key.toLowerCase();

            // Ctrl+Space: &nbsp;
            if (e.key === ' ' || e.code === 'Space') {
                e.preventDefault();
                updateContent(textarea, start, end, '&nbsp;', 6, 0);
                return;
            }
            // Ctrl+Shift+V: 미디어 모달
            if (e.shiftKey && key === 'v') {
                e.preventDefault();
                onOpenMedia?.();
                return;
            }
            // Ctrl+Shift+K: kbd 태그 (선택 텍스트를 + 기준 분리해 각각 감싸기)
            if (e.shiftKey && key === 'k') {
                e.preventDefault();
                if (start !== end) {
                    const selected = text.substring(start, end);
                    const keys = selected.split('+').map((k) => k.trim()).filter((k) => k.length > 0);
                    if (keys.length > 0) {
                        const newText = keys.map((k) => `<kbd>${k}</kbd>`).join(' + ');
                        updateContent(textarea, start, end, newText, 0, 0);
                    }
                }
                return;
            }
            // Ctrl+Shift+S: 취소선
            if (e.shiftKey && key === 's') {
                e.preventDefault();
                handleAction('strike');
                return;
            }
            if (key === '.') { e.preventDefault(); handleAction('color-text'); return; }
            if (key === '/') { e.preventDefault(); handleAction('color-bg'); return; }
            if (key === 's') { e.preventDefault(); onSave?.(); return; }
            if (['b', 'i', 'l', '0', '9', '8', ','].includes(key)) {
                e.preventDefault();
                const actionMap: Record<string, string> = {
                    b: 'bold', i: 'italic', l: 'link', '0': 'bullet', '9': 'number', '8': 'quote', ',': 'table',
                };
                handleAction(actionMap[key]);
                return;
            }
            // Ctrl+1~4: 에셋 팝업 (커서 위치 기반)
            const assetMap: Record<string, AssetType> = { '1': 'EMOJI', '2': 'SYMBOL', '3': 'PHRASE', '4': 'TEMPLATE' };
            if (!e.shiftKey && !e.altKey && assetMap[e.key]) {
                e.preventDefault();
                const [topInTextarea] = measureLineTops(textarea, [start]);
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
                className="flex-1 w-full border border-gray-200 rounded-lg px-4 pt-3 pb-[50vh] text-sm resize-none focus:outline-none focus:border-blue-500 font-mono custom-scroll"
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
