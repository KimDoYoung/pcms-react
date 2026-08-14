const VIDEO_EXTENSIONS = new Set(['mkv', 'avi', 'mp4', 'mov', 'wmv', 'ts', 'm2ts', 'flv', 'm4v'])

export function isVideoExtension(extension?: string): boolean {
  return !!extension && VIDEO_EXTENSIONS.has(extension.toLowerCase())
}

// "The.Bible.In.The.Beginning.1966.720p.BluRay...mp4" -> { titleEn: "The Bible In The Beginning", year: "1966" }
// 해상도(720/1080/2160 등)는 19xx/20xx 범위 밖이라 연도 정규식과 충돌하지 않음
export function guessTitleYearFromFileName(fileName: string): { titleEn: string; year?: string } {
  const base = fileName.replace(/\.[^.]+$/, '')
  const yearMatch = base.match(/(19\d{2}|20\d{2})/)
  const cut = yearMatch ? base.slice(0, yearMatch.index) : base
  const titleEn = cut.replace(/[._]+/g, ' ').trim()
  return { titleEn, year: yearMatch?.[1] }
}

// "영화2/우묵배미의 사랑" -> "우묵배미의 사랑"
export function lastPathSegment(path?: string): string {
  if (!path) return ''
  const parts = path.split('/').filter(Boolean)
  return parts[parts.length - 1] ?? ''
}
