import { Star } from 'lucide-react';

export default function RatingStars({ value = 0, size = 14, showValue = false }) {
  return (
    <span className="stars" aria-label={`${value} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          size={size}
          style={{ opacity: index < Math.round(value) ? 1 : 0.22 }}
          aria-hidden="true"
        />
      ))}
      {showValue && <span className="small muted" style={{ marginLeft: 4 }}>{value.toFixed(1)}</span>}
    </span>
  );
}
