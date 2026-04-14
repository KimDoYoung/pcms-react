export interface MovieDto {
  id?: number;
  mid?: string;
  gubun: string;
  title1: string;
  title2?: string;
  title3?: string;
  category?: string;
  gamdok?: string;
  makeYear?: string;
  nara?: string;
  dvdId?: string;
  title1num?: string;
  title1title2?: string;
}

export interface MovieSearchDto {
  page?: number;
  size?: number;
  keyword?: string;
  category?: string;
  gamdok?: string;
  makeYear?: string;
  gubun?: string;
  nara?: string;
}

export interface MovieReviewDto {
  id?: number;
  title: string;
  nara?: string;
  year?: string;
  lvl?: number;
  ymd?: string;
  content?: string;
  lastmodifyDt?: string;
}

export interface MovieReviewSearchDto {
  page?: number;
  size?: number;
  keyword?: string;
  startYmd?: string;
  endYmd?: string;
  minLvl?: number;
}

export interface HddDto {
  id?: number;
  volumnName?: string;
  gubun: string;
  path?: string;
  fileName?: string;
  name: string;
  pdir?: string;
  extension?: string;
  size?: number;
  sha1Cd?: string;
  srchKey?: string;
  lastModifiedYmd?: string;
  pid?: number;
  rightPid?: number;
}

export interface HddSearchDto {
  page?: number;
  size?: number;
  keyword?: string;
  volumnName?: string;
  extension?: string;
  gubun?: string;
}
