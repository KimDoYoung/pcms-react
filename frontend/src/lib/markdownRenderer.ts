/**
 * 목적: 게시글/도움말 등 markdown 컨텐츠를 HTML로 렌더링하는 공용 markdown-it 인스턴스.
 *       에디터 미리보기(MdSplitEditor)와 읽기전용 뷰어(MarkdownViewer)가 함께 사용해
 *       "에디터에서 본 대로 뷰어에서도 보인다"를 보장한다.
 *
 * 사용법:
 *   import { renderMarkdown } from '@/lib/markdownRenderer'
 *   <div className="markdown-body" dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />
 *   렌더링 결과 안의 비디오/오디오 카드를 실제로 토글/재생시키려면 shared/hooks/useMediaCardToggle를 함께 사용한다.
 *
 * 지원 확장 문법:
 *   - `![라벨](url)` 에서 url이 비디오/오디오 파일 확장자거나 유튜브 링크면 이미지 대신 토글형 미디어 카드로 렌더링.
 *   - `` `색상코드:lucide아이콘명:텍스트` `` 형태의 인라인 코드는 색상 아이콘 뱃지로 렌더링 (3파트 아니면 일반 <code>).
 *   - 각 블록(h1~h3, 문단, 인용구, 목록, 표, 코드블록)에 data-source-line 속성을 심어 에디터-미리보기 줄 단위 스크롤 동기화에 사용.
 *
 * html: true 로 설정되어 있어 <font color>, <span style="background-color:..."> 같은 원시 HTML도 통과된다.
 * (HTML 에디터도 동일하게 원시 HTML을 그대로 저장/렌더링하므로 신뢰 수준이 동일한 개인용 CMS 특성상 허용)
 */
import MarkdownIt from 'markdown-it'
import * as icons from 'lucide-react'
import { createElement, type ComponentType } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { isVideoSource, isAudioSource, isYouTubeUrl, extractYouTubeId } from '@/lib/youtube'

const md: MarkdownIt = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true,
})

type RenderRule = NonNullable<(typeof md.renderer.rules)[string]>

function withSourceLine(rule: RenderRule): RenderRule {
  return (tokens, idx, options, env, self) => {
    const token = tokens[idx]
    if (token.map) {
      token.attrSet('data-source-line', String(token.map[0] + 1))
    }
    return rule(tokens, idx, options, env, self)
  }
}

const defaultRule: RenderRule = (tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options)

const BLOCK_OPEN_RULES = [
  'heading_open',
  'paragraph_open',
  'blockquote_open',
  'bullet_list_open',
  'ordered_list_open',
  'table_open',
  'hr',
]
BLOCK_OPEN_RULES.forEach((name) => {
  const original = (md.renderer.rules[name] as RenderRule | undefined) ?? defaultRule
  md.renderer.rules[name] = withSourceLine(original)
})
const originalFence = md.renderer.rules.fence as RenderRule
md.renderer.rules.fence = withSourceLine(originalFence)

// --- 이미지 문법을 비디오/오디오/유튜브 카드로 확장 ---
const defaultImageRule = md.renderer.rules.image as RenderRule
md.renderer.rules.image = (tokens, idx, options, env, self) => {
  const token = tokens[idx]
  const src = token.attrGet('src')
  const isYt = isYouTubeUrl(src)
  const isMedia = isYt || isVideoSource(src) || isAudioSource(src)
  if (!isMedia || !src) {
    return defaultImageRule(tokens, idx, options, env, self)
  }

  const label = self.renderInlineAsText(token.children ?? [], options, env) || '미디어'
  const type = isYt ? 'youtube' : isAudioSource(src) ? 'audio' : 'video'
  const ytId = isYt ? extractYouTubeId(src) : null

  const esc = md.utils.escapeHtml
  return (
    `<div class="media-card" data-media-type="${type}" data-media-src="${esc(src)}"${ytId ? ` data-yt-id="${esc(ytId)}"` : ''}>` +
    `<div class="media-card-header">` +
    `<span class="media-card-title">${esc(label)}</span>` +
    `<button type="button" class="media-toggle-btn">${type === 'youtube' ? '유튜브 보기' : type === 'audio' ? '오디오 재생' : '동영상 보기'}</button>` +
    `</div>` +
    `<div class="media-card-body" hidden></div>` +
    `</div>`
  )
}

// --- 인라인 코드(백틱)을 `색상:아이콘명:텍스트` 3파트 문법이면 컬러 아이콘 뱃지로 확장 ---
const defaultCodeInlineRule = md.renderer.rules.code_inline as RenderRule
const BADGE_PATTERN = /^([^:]+):([^:]+):(.+)$/

function resolveLucideIcon(name: string): ComponentType<{ className?: string }> | null {
  const pascal = name
    .trim()
    .split(/[-_\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('')
  const iconMap = icons as unknown as Record<string, ComponentType<{ className?: string }>>
  return iconMap[pascal] ?? null
}

const HEX_COLOR_PATTERN = /^#?[0-9a-fA-F]{3}$|^#?[0-9a-fA-F]{6}$/

md.renderer.rules.code_inline = (tokens, idx, options, env, self) => {
  const token = tokens[idx]
  const match = token.content.match(BADGE_PATTERN)
  const rawColor = match?.[1].trim()
  if (!match || !rawColor || !HEX_COLOR_PATTERN.test(rawColor)) {
    return defaultCodeInlineRule(tokens, idx, options, env, self)
  }

  const [, , iconName, text] = match
  const color = rawColor.startsWith('#') ? rawColor : `#${rawColor}`
  const Icon = resolveLucideIcon(iconName)
  const iconSvg = Icon ? renderToStaticMarkup(createElement(Icon)) : ''
  const esc = md.utils.escapeHtml

  return (
    `<kbd class="kbd-badge" style="background-color:${esc(color)}1a;border-color:${esc(color)};color:${esc(color)}">` +
    iconSvg +
    `<span>${esc(text.trim())}</span>` +
    `</kbd>`
  )
}

export function renderMarkdown(content: string): string {
  if (!content || !content.trim()) return ''
  return md.render(content)
}

export default md
