export type AssetType = 'EMOJI' | 'SYMBOL'

export interface AssetDto {
  id: number
  atype: AssetType
  name: string
  value: string
}
