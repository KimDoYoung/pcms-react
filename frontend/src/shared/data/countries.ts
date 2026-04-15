export interface Country {
  name: string;
  emoji: string | null;
  badge?: string;
}

export const COUNTRIES: Country[] = [
  { name: '한국', emoji: '🇰🇷' },
  { name: '태국', emoji: '🇹🇭' },
  { name: '캐나다', emoji: '🇨🇦' },
  { name: '멕시코', emoji: '🇲🇽' },
  { name: '독일', emoji: '🇩🇪' },
  { name: '대만', emoji: '🇹🇼' },
  { name: '체코', emoji: '🇨🇿' },
  { name: '헝가리', emoji: '🇭🇺' },
  { name: '이탈리아', emoji: '🇮🇹' },
  { name: '인도', emoji: '🇮🇳' },
  { name: '홍콩', emoji: '🇭🇰' },
  { name: '네덜란드', emoji: '🇳🇱' },
  { name: '그리스', emoji: '🇬🇷' },
  { name: '영국', emoji: '🇬🇧' },
  { name: '소련', emoji: null, badge: 'СССР' },
  { name: '뉴질랜드', emoji: '🇳🇿' },
  { name: '이란', emoji: '🇮🇷' },
  { name: '프랑스', emoji: '🇫🇷' },
  { name: '스웨덴', emoji: '🇸🇪' },
  { name: '중국', emoji: '🇨🇳' },
  { name: '미국', emoji: '🇺🇸' },
  { name: '일본', emoji: '🇯🇵' },
  { name: '덴마크', emoji: '🇩🇰' },
  { name: '러시아', emoji: '🇷🇺' },
  { name: '스페인', emoji: '🇪🇸' },
];

export const COUNTRY_EMOJI_MAP = new Map<string, string>(
  COUNTRIES.map((c) => [c.name, c.emoji ?? c.badge ?? c.name])
);