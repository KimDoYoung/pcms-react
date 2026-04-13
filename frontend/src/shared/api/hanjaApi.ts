import { apiClient } from '@/lib/apiClient'

export interface HanjaResult {
  korean: string
  hanja: string
  meaning: string
}

export async function searchHanja(word: string): Promise<HanjaResult[]> {
  return apiClient.get<HanjaResult[]>('/utility/hanja/search', { params: { word } })
}

export async function addHanja(korean: string, hanja: string): Promise<void> {
  await apiClient.post('/utility/hanja', { korean, hanja, meaning: '' })
}
