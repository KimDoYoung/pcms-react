export type AssetType = 'EMOJI' | 'SYMBOL' | 'PHRASE' | 'TEMPLATE'

export interface AssetDto {
  id: number
  atype: AssetType
  name: string
  value: string
}
