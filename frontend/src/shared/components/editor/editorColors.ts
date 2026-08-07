/**
 * 에디터 단축키(Ctrl+. / Ctrl+/) 색상 rotation용 팔레트 및 유틸.
 *
 * 사용법:
 *   const next = getNextColor(currentColor, ROTATE_TEXT_COLORS)
 *   if (next) editor.chain().focus().setColor(next).run()
 *   else editor.chain().focus().unsetColor().run()
 */

export const ROTATE_TEXT_COLORS = ['#E03E3E', '#0B6E99', '#DFAB01', '#64473A', '#0F7B6C']

export const ROTATE_BG_COLORS = ['#FFE3E3', '#D3E5EF', '#FBF3DB', '#E9E5E3', '#DDEDEA']

/**
 * 현재 색상 다음 색을 반환. palette에 없으면 첫 색, 마지막 색이면 null(해제 신호).
 */
export function getNextColor(current: string | null | undefined, palette: string[]): string | null {
  if (!current) return palette[0]
  const idx = palette.findIndex((c) => c.toLowerCase() === current.toLowerCase())
  if (idx === -1) return palette[0]
  if (idx === palette.length - 1) return null
  return palette[idx + 1]
}
