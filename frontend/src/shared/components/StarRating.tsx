
interface StarRatingProps {
    value : number
    max?: number
    size?: 'sm' | 'md' | 'lg'
    filled?: boolean
}

export default function StarRating({ value, max = 10, size = 'md', filled = true }: StarRatingProps ) {
    const sizeClass = size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5';
    return (
        <span className={`inline-flex gap-0.5 ${sizeClass}`}>
            {Array.from({ length: max }, (_, i) => (
                <span key={i} className={filled && i < value ? 'text-yellow-500' : 'text-gray-300'}>★</span>
            ))}
        </span>
    );
}
