import {Star} from 'lucide-react';

interface Props {
  rating: number;
  size?: number;
  showValue?: boolean;
  count?: number;
}

const STAR_GAP = 2; // px between stars

/**
 * Five-star rating with a partial-fill overlay.
 * The amber row sits inside a clipped container whose width tracks the rating;
 * its inner width is pinned in px so the clip doesn't compress the stars.
 */
export default function RatingStars({rating, size = 15, showValue = false, count}: Props) {
  const pct = Math.max(0, Math.min(100, (rating / 5) * 100));
  const rowWidthPx = size * 5 + STAR_GAP * 4;

  const stars = (className: string) => (
    <span className={`flex gap-0.5 ${className}`} style={{width: rowWidthPx}}>
      {Array.from({length: 5}).map((_, i) => (
        <Star key={i} size={size} fill="currentColor" strokeWidth={0} className="shrink-0" />
      ))}
    </span>
  );

  return (
    <span className="inline-flex items-center gap-1.5" aria-label={`${rating} / 5`}>
      <span className="relative inline-block" style={{width: rowWidthPx}}>
        {stars('text-slate-300')}
        <span className="absolute inset-y-0 start-0 overflow-hidden" style={{width: `${pct}%`}}>
          {stars('text-amber-400')}
        </span>
      </span>
      {showValue && (
        <span className="text-xs text-slate-500 font-medium">
          {rating.toFixed(1)}
          {typeof count === 'number' && count > 0 ? ` (${count})` : ''}
        </span>
      )}
    </span>
  );
}
