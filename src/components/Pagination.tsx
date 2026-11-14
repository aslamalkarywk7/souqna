import {useTranslation} from 'react-i18next';
import {ChevronLeft, ChevronRight} from 'lucide-react';

interface Props {
  page: number;
  pages: number;
  onPage: (page: number) => void;
}

export default function Pagination({page, pages, onPage}: Props) {
  const {i18n} = useTranslation();
  if (pages <= 1) return null;
  const isRtl = i18n.language === 'ar';
  const Prev = isRtl ? ChevronRight : ChevronLeft;
  const Next = isRtl ? ChevronLeft : ChevronRight;

  const nums = Array.from({length: pages}, (_, i) => i + 1).filter(
    n => n === 1 || n === pages || Math.abs(n - page) <= 1,
  );

  return (
    <nav className="flex items-center justify-center gap-1.5 py-10" aria-label="pagination">
      <button
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
        className="w-9 h-9 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:border-brand-300 hover:text-brand-600 disabled:opacity-40 disabled:pointer-events-none transition"
      >
        <Prev size={16} />
      </button>
      {nums.map((n, idx) => (
        <span key={n} className="flex items-center gap-1.5">
          {idx > 0 && n - nums[idx - 1] > 1 && <span className="text-slate-400 px-1">…</span>}
          <button
            onClick={() => onPage(n)}
            className={`w-9 h-9 rounded-lg text-sm font-semibold transition ${
              n === page
                ? 'bg-brand-600 text-white shadow-sm shadow-brand-200'
                : 'border border-slate-200 bg-white text-slate-600 hover:border-brand-300 hover:text-brand-600'
            }`}
          >
            {n}
          </button>
        </span>
      ))}
      <button
        disabled={page >= pages}
        onClick={() => onPage(page + 1)}
        className="w-9 h-9 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:border-brand-300 hover:text-brand-600 disabled:opacity-40 disabled:pointer-events-none transition"
      >
        <Next size={16} />
      </button>
    </nav>
  );
}
