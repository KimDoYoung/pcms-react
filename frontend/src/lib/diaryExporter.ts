/**
 * 목적: 일지 검색 결과를 오프라인에서도 읽을 수 있는 standalone HTML 또는 PDF로 내보내는 유틸리티.
 *
 * 사용법:
 *   import { exportDiaryToHtml, exportDiaryToPdf } from '@/lib/diaryExporter'
 *   await exportDiaryToHtml(items, meta)
 *   await exportDiaryToPdf(items, meta)
 */
import { format } from 'date-fns'
import { apiClient } from '@/lib/apiClient'
import { formatDate } from '@/lib/utils'
import markdownCss from '@/styles/markdown.css?raw'
import type { DiaryListDto } from '@/domain/diary/types/diary'

export interface DiaryExportMeta {
  startYmd: string
  endYmd: string
  keyword: string
  total: number
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function buildDiaryExportHtml(items: DiaryListDto[], meta: DiaryExportMeta): string {
  const timestamp = format(new Date(), 'yyyy-MM-dd HH:mm:ss')

  const startDisplay = meta.startYmd ? formatDate(meta.startYmd) : '전체'
  const endDisplay   = meta.endYmd   ? formatDate(meta.endYmd)   : '전체'
  const keywordNote  = meta.keyword  ? ` | 검색어: "${escapeHtml(meta.keyword)}"` : ''

  const tocHtml = `
    <div class="toc">
      <h2>📋 목차</h2>
      <ol>
        ${items.map((item, idx) => {
          const ymd = item.ymd
          const displayDate = `${ymd.slice(0,4)}-${ymd.slice(4,6)}-${ymd.slice(6,8)}`
          const dateLabel = escapeHtml(formatDate(displayDate))
          const summary   = item.summary ? escapeHtml(item.summary) : '제목 없음'
          return `<li><a href="#entry-${idx}"><span class="toc-date">${dateLabel}</span><span class="toc-summary">${summary}</span></a></li>`
        }).join('\n        ')}
      </ol>
    </div>`

  const entriesHtml = items.map((item, idx) => {
    const ymd = item.ymd
    const displayDate = `${ymd.slice(0,4)}-${ymd.slice(4,6)}-${ymd.slice(6,8)}`
    const dateLabel = escapeHtml(formatDate(displayDate))
    const summary   = item.summary ? escapeHtml(item.summary) : '<em style="color:#aaa">제목 없음</em>'
    const content   = item.content ?? ''
    const attach    = item.attachmentCount > 0
      ? `<span class="attach-badge">📎 ${item.attachmentCount}</span>`
      : ''

    return `
    <div class="entry" id="entry-${idx}">
      <button class="entry-header" onclick="toggleEntry(${idx})" aria-expanded="false">
        <span class="entry-date">${dateLabel}</span>
        <span class="entry-summary">${summary}</span>
        ${attach}
        <span class="entry-chevron" id="chevron-${idx}">▼</span>
      </button>
      <div class="entry-content markdown-body" id="content-${idx}" style="display:none">
        ${content}
      </div>
    </div>`
  }).join('\n')

  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>일지 내보내기 — ${escapeHtml(startDisplay)} ~ ${escapeHtml(endDisplay)}</title>
  <style>
    /* ── Reset & Base ─────────────────────────────────────── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { font-size: 17px; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
                   "Helvetica Neue", Arial, "Noto Sans KR", sans-serif;
      background: #f5f7fa;
      color: #2d3748;
      line-height: 1.7;
      padding: 1.5rem 1rem 4rem;
    }

    /* ── Layout ───────────────────────────────────────────── */
    .container {
      max-width: 1032px;
      margin: 0 auto;
    }

    /* ── Export Header ────────────────────────────────────── */
    .export-header {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 1.4rem 1.6rem;
      margin-bottom: 1.4rem;
      box-shadow: 0 1px 4px rgba(0,0,0,.06);
    }
    .export-header h1 {
      font-size: 1.35rem;
      font-weight: 700;
      color: #1a202c;
      margin-bottom: .5rem;
    }
    .export-meta {
      font-size: .82rem;
      color: #718096;
      display: flex;
      flex-wrap: wrap;
      gap: .3rem 1.2rem;
    }
    .export-meta strong { color: #4a5568; }

    /* ── Controls ─────────────────────────────────────────── */
    .controls {
      display: flex;
      gap: .6rem;
      margin-bottom: 1rem;
      flex-wrap: wrap;
    }
    .btn {
      padding: .38rem .9rem;
      font-size: .82rem;
      border: 1px solid #cbd5e0;
      border-radius: 6px;
      background: #fff;
      color: #4a5568;
      cursor: pointer;
      transition: background .15s, border-color .15s;
    }
    .btn:hover { background: #edf2f7; border-color: #a0aec0; }
    .btn-blue { border-color: #90cdf4; color: #2b6cb0; background: #ebf8ff; }
    .btn-blue:hover { background: #bee3f8; }

    /* ── Entry Card ───────────────────────────────────────── */
    .entry {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      margin-bottom: .7rem;
      box-shadow: 0 1px 3px rgba(0,0,0,.04);
      overflow: hidden;
      transition: border-color .15s;
    }
    .entry:hover { border-color: #bee3f8; }

    .entry-header {
      width: 100%;
      display: flex;
      align-items: center;
      gap: .75rem;
      padding: .7rem 1rem;
      background: none;
      border: none;
      cursor: pointer;
      text-align: left;
      transition: background .12s;
    }
    .entry-header:hover { background: #f7fafc; }
    .entry-header[aria-expanded="true"] { background: #ebf8ff; }

    .entry-date {
      flex-shrink: 0;
      font-size: .82rem;
      font-weight: 700;
      color: #63b3ed;
      min-width: 10rem;
      font-variant-numeric: tabular-nums;
    }
    .entry-summary {
      flex: 1;
      font-size: .9rem;
      color: #2d3748;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .attach-badge {
      flex-shrink: 0;
      font-size: .75rem;
      color: #a0aec0;
    }
    .entry-chevron {
      flex-shrink: 0;
      font-size: .7rem;
      color: #a0aec0;
      transition: transform .2s;
      display: inline-block;
    }
    .entry-header[aria-expanded="true"] .entry-chevron,
    button[aria-expanded="true"] ~ * .entry-chevron { transform: rotate(180deg); }

    /* ── Entry Content ────────────────────────────────────── */
    .entry-content {
      padding: 1rem 1.2rem 1.2rem;
      border-top: 1px solid #edf2f7;
      overflow-x: auto;
    }

    /* ── TOC ──────────────────────────────────────────────── */
    .toc {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 1.2rem 1.6rem;
      margin-bottom: 1.4rem;
      box-shadow: 0 1px 4px rgba(0,0,0,.06);
    }
    .toc h2 {
      font-size: 1rem;
      font-weight: 700;
      color: #2d3748;
      margin-bottom: .8rem;
      padding-bottom: .4rem;
      border-bottom: 1px solid #e2e8f0;
    }
    .toc ol {
      padding-left: 1.4rem;
    }
    .toc li { font-size: .82rem; line-height: 1.7; }
    .toc a {
      color: #3182ce;
      text-decoration: none;
      display: inline-flex;
      gap: .6rem;
      align-items: baseline;
    }
    .toc a:hover { text-decoration: underline; }
    .toc-date { flex-shrink: 0; font-weight: 600; color: #63b3ed; }
    .toc-summary { color: #4a5568; }
    @media print { .toc { break-after: page; } }

    /* ── Markdown CSS ─────────────────────────────────────── */
    ${markdownCss}

    /* ── Print ────────────────────────────────────────────── */
    @media print {
      body { background: #fff; padding: 0; }
      .controls { display: none; }
      .entry { break-inside: avoid; box-shadow: none; border: 1px solid #ccc; margin-bottom: .5rem; }
      .entry-content { display: block !important; }
      .entry-chevron { display: none; }
    }
  </style>
</head>
<body>
  <div class="container">

    <div class="export-header">
      <h1>📖 일지 내보내기</h1>
      <div class="export-meta">
        <span><strong>기간</strong> ${escapeHtml(startDisplay)} ~ ${escapeHtml(endDisplay)}${keywordNote}</span>
        <span><strong>총</strong> ${meta.total}건</span>
        <span><strong>내보낸 시각</strong> ${timestamp}</span>
      </div>
    </div>

    ${tocHtml}

    <div class="controls">
      <button class="btn btn-blue" onclick="expandAll()">모두 펼치기</button>
      <button class="btn" onclick="collapseAll()">모두 접기</button>
    </div>

    <div id="entries">
${entriesHtml}
    </div>

  </div>

  <script>
    function toggleEntry(idx) {
      var content  = document.getElementById('content-' + idx);
      var header   = document.querySelector('#entry-' + idx + ' .entry-header');
      var chevron  = document.getElementById('chevron-' + idx);
      var isOpen   = content.style.display !== 'none';
      content.style.display  = isOpen ? 'none' : 'block';
      header.setAttribute('aria-expanded', String(!isOpen));
      chevron.style.transform = isOpen ? '' : 'rotate(180deg)';
    }

    function expandAll() {
      document.querySelectorAll('.entry-content').forEach(function(el, idx) {
        el.style.display = 'block';
        var header  = document.querySelector('#entry-' + idx + ' .entry-header');
        var chevron = document.getElementById('chevron-' + idx);
        if (header)  header.setAttribute('aria-expanded', 'true');
        if (chevron) chevron.style.transform = 'rotate(180deg)';
      });
    }

    function collapseAll() {
      document.querySelectorAll('.entry-content').forEach(function(el, idx) {
        el.style.display = 'none';
        var header  = document.querySelector('#entry-' + idx + ' .entry-header');
        var chevron = document.getElementById('chevron-' + idx);
        if (header)  header.setAttribute('aria-expanded', 'false');
        if (chevron) chevron.style.transform = '';
      });
    }
  </script>
</body>
</html>`
}

export async function exportDiaryToHtml(items: DiaryListDto[], meta: DiaryExportMeta): Promise<void> {
  const html = buildDiaryExportHtml(items, meta)
  const stamp = format(new Date(), 'yyyyMMdd_HHmmss')
  const filename = `일지_${meta.startYmd}-${meta.endYmd}_${stamp}.html`
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  triggerDownload(blob, filename)
}

export async function exportDiaryToPdf(items: DiaryListDto[], meta: DiaryExportMeta): Promise<void> {
  const html = buildDiaryExportHtml(items, meta)
  const stamp = format(new Date(), 'yyyyMMdd_HHmmss')
  const filename = `일지_${meta.startYmd}-${meta.endYmd}_${stamp}.pdf`

  const res = await apiClient.post(
    '/files/pdf-convert',
    { html, filename },
    { responseType: 'blob' },
  )

  const blob = res as unknown as Blob
  triggerDownload(blob, filename)
}
