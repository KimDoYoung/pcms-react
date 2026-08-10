// textarea의 실제 렌더링(자동 줄바꿈 포함)을 그대로 재현하는 숨김 mirror div를 이용해
// 여러 char offset의 실제 픽셀 y좌표를 한 번에 측정하는 유틸.
// 요청받은 모든 offset을 하나의 mirror div에서 한 번에 측정해 반복 호출 비용을 없앤다.

const MIRROR_PROPERTIES: (keyof CSSStyleDeclaration)[] = [
  'direction',
  'boxSizing',
  'width',
  'height',
  'overflowX',
  'overflowY',
  'borderTopWidth',
  'borderRightWidth',
  'borderBottomWidth',
  'borderLeftWidth',
  'borderStyle',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'fontStyle',
  'fontVariant',
  'fontWeight',
  'fontStretch',
  'fontSize',
  'lineHeight',
  'fontFamily',
  'textAlign',
  'textTransform',
  'textIndent',
  'textDecoration',
  'letterSpacing',
  'wordSpacing',
  'tabSize',
]

function camelToKebab(prop: string): string {
  return prop.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())
}

/**
 * textarea의 여러 char offset 위치에 대응하는 실제 픽셀 top(줄바꿈 반영, 스크롤과 무관한
 * 콘텐츠 기준 절대 위치)을 한 번에 측정한다. offsets와 같은 길이/순서의 배열을 반환한다.
 */
export function measureLineTops(textarea: HTMLTextAreaElement, offsets: number[]): number[] {
  if (offsets.length === 0) return []

  const computed = window.getComputedStyle(textarea)
  const div = document.createElement('div')
  const style = div.style

  style.position = 'absolute'
  style.visibility = 'hidden'
  style.whiteSpace = 'pre-wrap'
  style.wordWrap = 'break-word'
  style.overflow = 'hidden'
  style.top = '0'
  style.left = '-9999px'

  MIRROR_PROPERTIES.forEach((prop) => {
    style.setProperty(camelToKebab(String(prop)), computed.getPropertyValue(camelToKebab(String(prop))))
  })

  document.body.appendChild(div)

  const text = textarea.value
  const order = offsets.map((offset, index) => ({ offset, index }))
  order.sort((a, b) => a.offset - b.offset)

  let cursor = 0
  const markers: HTMLSpanElement[] = new Array(offsets.length)
  order.forEach(({ offset, index }) => {
    const clamped = Math.max(0, Math.min(offset, text.length))
    if (clamped > cursor) {
      div.appendChild(document.createTextNode(text.substring(cursor, clamped)))
    }
    const marker = document.createElement('span')
    marker.textContent = '​'
    div.appendChild(marker)
    markers[index] = marker
    cursor = clamped
  })
  if (cursor < text.length) {
    div.appendChild(document.createTextNode(text.substring(cursor)))
  }

  const borderTop = parseFloat(computed.borderTopWidth) || 0
  const tops = markers.map((marker) => marker.offsetTop + borderTop)

  document.body.removeChild(div)
  return tops
}
