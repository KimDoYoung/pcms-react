/**
 * 목적:
 * 별(★) 개수로 점수를 시각적으로 표시하는 읽기 전용 컴포넌트입니다.
 * 평점, 만족도, 추천 점수 등을 간단히 표현할 때 사용합니다.
 *
 * 사용법:
 * - value: 현재 점수(채워질 별 개수 기준)
 * - max: 전체 별 개수 (기본값: 10)
 * - size: 별 크기 ('sm' | 'md' | 'lg', 기본값: 'md')
 * - filled: true면 value 미만 별을 강조 색상으로 표시 (기본값: true)
 *
 * 예시:
 * <StarRating value={7} />
 * <StarRating value={4} max={5} size="lg" />
 * <StarRating value={3} max={5} filled={false} />
 */

interface StarRatingProps {
    value : number
    max?: number
    size?: 'sm' | 'md' | 'lg'
    filled?: boolean
}

export default function StarRating({ value, max = 10, size = 'md', filled = true }: StarRatingProps ) {
    const sizeClass = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-2xl' : 'text-lg';
    return (
        <span className={`inline-flex shrink-0 items-center gap-0.5 leading-none ${sizeClass}`}>
            {Array.from({ length: max }, (_, i) => (
                <span key={i} className={filled && i < value ? 'text-yellow-500' : 'text-gray-300'}>★</span>
            ))}
        </span>
    );
}
