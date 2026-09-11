/**
 * 목적: HTML(TipTap)/Markdown 에디터가 공통으로 참조하는 글자 크기 상수.
 * 사용법:
 *   import { FONT_SIZE_DEFAULT, FONT_SIZE_STEP, EMOJI_FONT_SIZE } from '@/shared/components/editor/editorFontSize'
 * props: 없음 (상수 모듈)
 */
export const FONT_SIZE_MIN = 10
export const FONT_SIZE_MAX = 40
export const FONT_SIZE_DEFAULT = 16
export const FONT_SIZE_STEP = 2

// Ctrl+'+' 를 5회 누른 크기와 동일하게 이모지를 삽입하기 위한 값
export const EMOJI_FONT_SIZE = FONT_SIZE_DEFAULT + FONT_SIZE_STEP * 5
