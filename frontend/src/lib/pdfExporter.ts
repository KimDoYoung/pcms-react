/**
 * 목적: 게시글/문서를 A4 규격 및 Pretendard 폰트가 적용된 독립 HTML로 구성하고,
 *       백엔드 Gotenberg 변환 엔드포인트(/files/pdf-convert)를 통해 PDF로 변환/다운로드하는 공용 유틸리티.
 *
 * 사용법:
 *   import { exportPostToPdf } from '@/lib/pdfExporter'
 *   await exportPostToPdf(post, board?.name, board?.contentType)
 */
import { format } from 'date-fns'
import { apiClient } from '@/lib/apiClient'
import { renderMarkdown } from '@/lib/markdownRenderer'
import { formatDate, formatFileSize } from '@/lib/utils'
import markdownCss from '@/styles/markdown.css?raw'
import type { PostDto } from '@/domain/board/types/board'

export interface BuildPostPdfHtmlParams {
  post: PostDto
  boardName?: string
  contentType?: string
}

/**
 * 게시글 데이터를 기반으로 PDF 변환에 최적화된 독립 HTML5 문서를 생성합니다.
 */
export function buildPostPdfHtml({ post, boardName, contentType = 'html' }: BuildPostPdfHtmlParams): string {
  const content = post.content ?? ''

  let bodyContentHtml = ''
  if (contentType === 'markdown') {
    bodyContentHtml = `<div class="markdown-body">${renderMarkdown(content)}</div>`
  } else if (contentType === 'html') {
    bodyContentHtml = `<div class="markdown-body">${content}</div>`
  } else {
    bodyContentHtml = `<pre class="pdf-plain-text">${escapeHtml(content)}</pre>`
  }

  const attachmentsHtml = (post.attachments && post.attachments.length > 0)
    ? `
      <div class="pdf-attachments">
        <div class="pdf-attachments-title">📎 첨부파일 (${post.attachments.length}개)</div>
        <ul class="pdf-attachments-list">
          ${post.attachments.map((att) => `
            <li>
              <span class="pdf-attachment-name">${escapeHtml(att.orgFileName)}</span>
              <span class="pdf-attachment-size">(${formatFileSize(att.fileSize)})</span>
            </li>
          `).join('')}
        </ul>
      </div>
    `
    : ''

  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(post.title || '게시글')}</title>
<style>
@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');

@page {
  size: A4;
  margin: 15mm 15mm 15mm 15mm;
}

* {
  box-sizing: border-box;
}

body {
  font-family: Pretendard, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif;
  color: #1f2937;
  line-height: 1.6;
  background: #ffffff;
  margin: 0;
  padding: 0;
  font-size: 14px;
}

.pdf-container {
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
}

/* 헤더 영역 */
.pdf-header {
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 14px;
  margin-bottom: 20px;
}

.pdf-board-badge {
  display: inline-block;
  font-size: 12px;
  font-weight: 600;
  color: #4f46e5;
  background-color: #eef2ff;
  padding: 3px 8px;
  border-radius: 4px;
  margin-bottom: 8px;
}

.pdf-title {
  font-size: 22px;
  font-weight: 800;
  color: #111827;
  margin: 0 0 12px 0;
  line-height: 1.35;
  word-break: break-all;
}

.pdf-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
  font-size: 12px;
  color: #6b7280;
}

.pdf-meta-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.pdf-meta-label {
  font-weight: 600;
  color: #4b5563;
}

/* 본문 래퍼 */
.pdf-body {
  margin-bottom: 24px;
  min-height: 150px;
}

.pdf-plain-text {
  white-space: pre-wrap;
  word-break: break-all;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 13px;
  line-height: 1.6;
  color: #374151;
  background: #f9fafb;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

/* 첨부파일 영역 */
.pdf-attachments {
  margin-top: 24px;
  padding: 14px 16px;
  border-radius: 8px;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  page-break-inside: avoid;
}

.pdf-attachments-title {
  font-size: 13px;
  font-weight: 700;
  color: #334155;
  margin-bottom: 8px;
}

.pdf-attachments-list {
  margin: 0;
  padding-left: 18px;
  font-size: 12px;
  color: #475569;
}

.pdf-attachments-list li {
  margin-bottom: 4px;
}

.pdf-attachment-name {
  font-weight: 500;
  color: #1e293b;
}

.pdf-attachment-size {
  color: #94a3b8;
  margin-left: 6px;
}

/* markdown.css 주입 */
${markdownCss}

/* PDF 인쇄 시 불필요한 UI 숨김 및 페이지 분할 최적화 */
.code-copy-btn, .media-toggle-btn {
  display: none !important;
}

h1, h2, h3, h4, h5, h6 {
  page-break-after: avoid;
}

table, pre, blockquote, img, .media-card, .pdf-attachments {
  page-break-inside: avoid;
}

img {
  max-width: 100%;
  height: auto;
}
</style>
</head>
<body>
<div class="pdf-container">
  <div class="pdf-header">
    ${boardName ? `<div class="pdf-board-badge">${escapeHtml(boardName)}</div>` : ''}
    <h1 class="pdf-title">${escapeHtml(post.title || '제목 없음')}</h1>
    <div class="pdf-meta">
      <span class="pdf-meta-item">
        <span class="pdf-meta-label">작성자:</span>
        <span>${escapeHtml(post.author || '관리자')}</span>
      </span>
      <span class="pdf-meta-item">
        <span class="pdf-meta-label">등록일:</span>
        <span>${formatDate(post.baseYmd, false)}</span>
      </span>
      <span class="pdf-meta-item">
        <span class="pdf-meta-label">조회수:</span>
        <span>${post.viewCount ?? 0}</span>
      </span>
    </div>
  </div>

  <div class="pdf-body">
    ${bodyContentHtml}
  </div>

  ${attachmentsHtml}
</div>
</body>
</html>
`
}

/**
 * 게시글을 PDF로 변환하고 브라우저 다운로드를 실행합니다.
 * 파일명 형식: post_{id}_yyyymmdd_hhmmss.pdf
 */
export async function exportPostToPdf(
  post: PostDto,
  boardName?: string,
  contentType?: string,
): Promise<void> {
  const html = buildPostPdfHtml({ post, boardName, contentType })
  const timeStamp = format(new Date(), 'yyyyMMdd_HHmmss')
  const filename = `post_${post.id}_${timeStamp}.pdf`

  const res = await apiClient.post(
    '/files/pdf-convert',
    { html, filename },
    { responseType: 'blob' },
  )

  const blob = res as unknown as Blob
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
