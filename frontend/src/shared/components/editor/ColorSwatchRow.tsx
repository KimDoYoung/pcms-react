/**
 * 목적: 에디터 우클릭 컨텍스트 메뉴 안에 넣는 글자색/배경색 스와치 한 줄.
 *       EditorContextMenu의 custom 항목으로 삽입해 사용한다.
 *
 * 사용법:
 *   <ColorSwatchRow
 *     label="글자 색상 (Ctrl+.)"
 *     colors={ROTATE_TEXT_COLORS}
 *     mode="text"
 *     onPick={(hex) => applyColor(hex)}
 *     onClear={() => clearColor()}
 *   />
 *
 * props:
 *   - label: string - 스와치 위에 표시할 라벨
 *   - colors: string[] - hex 색상 배열 (editorColors.ts의 ROTATE_TEXT_COLORS/ROTATE_BG_COLORS 등)
 *   - mode: 'text' | 'bg' - 'text'는 색상이 적용된 'A' 글자 미리보기, 'bg'는 색이 채워진 네모로 표시
 *   - onPick: (hex: string) => void - 스와치 클릭 콜백
 *   - onClear: () => void - 색상 해제(✕) 버튼 클릭 콜백
 */
interface Props {
    label: string
    colors: string[]
    mode: 'text' | 'bg'
    onPick: (hex: string) => void
    onClear: () => void
}

export default function ColorSwatchRow({ label, colors, mode, onPick, onClear }: Props) {
    return (
        <div className="flex flex-col gap-1 select-none">
            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">{label}</span>
            <div className="flex items-center gap-1.5 mt-0.5">
                {colors.map((hex) => (
                    <button
                        key={hex}
                        type="button"
                        title={hex}
                        onClick={() => onPick(hex)}
                        className={
                            mode === 'text'
                                ? 'w-4 h-4 rounded border border-gray-200 flex items-center justify-center cursor-pointer hover:scale-110 hover:bg-gray-50 transition-all bg-white'
                                : 'w-4 h-4 rounded border border-gray-200/60 cursor-pointer hover:scale-110 transition-all block'
                        }
                        style={mode === 'bg' ? { backgroundColor: hex } : undefined}
                    >
                        {mode === 'text' && (
                            <span className="text-[10px] font-extrabold font-serif leading-none" style={{ color: hex }}>
                                A
                            </span>
                        )}
                    </button>
                ))}
                <button
                    type="button"
                    title="색상 제거"
                    onClick={onClear}
                    className="w-4 h-4 rounded border border-gray-200 flex items-center justify-center cursor-pointer hover:scale-110 hover:bg-gray-100 transition-all bg-gray-50 text-gray-500 font-bold text-[8px]"
                >
                    ✕
                </button>
            </div>
        </div>
    )
}
