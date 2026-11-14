import {useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {Link, useSearchParams} from 'react-router-dom';
import {SlidersHorizontal} from 'lucide-react';
import Pagination from '@/components/Pagination';
import ProductCard from '@/components/ProductCard';
import {EmptyState, Spinner} from '@/components/ui';
import {formatMoney} from '@/lib/money';
import {api} from '@/lib/api';
import type {Category, ProductListResponse} from '@/types';

const SORTS = ['newest', 'price_asc', 'price_desc', 'rating', 'name'] as const;

export default function CatalogPage() {
  const {t, i18n} = useTranslation();
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState<ProductListResponse | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const q = params.get('q') ?? '';
  const category = params.get('category') ?? '';
  const sort = params.get('sort') ?? 'newest';
  const page = Number(params.get('page')) || 1;
  const featured = params.get('featured') === 'true';
  const priceMin = params.get('price_min') ?? '';
  const priceMax = params.get('price_max') ?? '';
  const [minInput, setMinInput] = useState(priceMin);
  const [maxInput, setMaxInput] = useState(priceMax);

  useEffect(() => {
    setMinInput(params.get('price_min') ?? '');
    setMaxInput(params.get('price_max') ?? '');
  }, [params]);

  useEffect(() => {
    api<{categories: Category[]}>('/categories').then(r => setCategories(r.categories)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const usp = new URLSearchParams();
    if (q) usp.set('q', q);
    if (category) usp.set('category', category);
    if (sort) usp.set('sort', sort);
    if (featured) usp.set('featured', 'true');
    if (priceMin) usp.set('price_min', String(Number(priceMin) * 100));
    if (priceMax) usp.set('price_max', String(Number(priceMax) * 100));
    usp.set('page', String(page));
    usp.set('per_page', '12');
    api<ProductListResponse>(`/products?${usp.toString()}`)
      .then(setData)
      .finally(() => setLoading(false));
  }, [q, category, sort, page, featured, priceMin, priceMax]);

  const patch = (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(updates)) {
      if (v === null || v === '') next.delete(k);
      else next.set(k, v);
    }
    if (!('page' in updates)) next.delete('page');
    setParams(next);
  };

  const activeCategory = categories.find(c => c.slug === category);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 fade-up">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            {featured ? t('home.featured') : activeCategory ? (i18n.language === 'ar' ? activeCategory.name_ar : activeCategory.name_en) : t('catalog.title')}
          </h1>
          {data && <p className="text-sm text-slate-400 mt-1">{t('catalog.results_count', {total: data.total})}</p>}
        </div>
        <div className="flex items-center gap-3">
          <SlidersHorizontal size={16} className="text-slate-400" />
          <select
            value={sort}
            onChange={e => patch({sort: e.target.value})}
            className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-200"
          >
            {SORTS.map(s => (
              <option key={s} value={s}>{t(`catalog.sort_${s}`)}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar filters */}
        <aside className="lg:w-64 shrink-0 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h3 className="font-bold text-sm text-slate-800 mb-3">{t('catalog.categories')}</h3>
            <ul className="space-y-1 text-sm">
              <li>
                <button
                  onClick={() => patch({category: null, featured: null})}
                  className={`w-full text-start px-3 py-2 rounded-lg transition ${
                    !category && !featured ? 'bg-brand-50 text-brand-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {t('catalog.all_categories')}
                </button>
              </li>
              {categories.map(c => (
                <li key={c.id}>
                  <button
                    onClick={() => patch({category: c.slug, featured: null})}
                    className={`w-full text-start px-3 py-2 rounded-lg transition ${
                      category === c.slug ? 'bg-brand-50 text-brand-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {i18n.language === 'ar' ? c.name_ar : c.name_en}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h3 className="font-bold text-sm text-slate-800 mb-3">{t('catalog.price_range')}</h3>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                value={minInput}
                onChange={e => setMinInput(e.target.value)}
                placeholder={t('catalog.min_price')}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
              />
              <span className="text-slate-300">—</span>
              <input
                type="number"
                min={0}
                value={maxInput}
                onChange={e => setMaxInput(e.target.value)}
                placeholder={t('catalog.max_price')}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">{formatMoney(0, i18n.language)} – {formatMoney(500000, i18n.language)}</p>
            <button
              onClick={() => patch({price_min: minInput, price_max: maxInput})}
              className="mt-3 w-full h-10 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition"
            >
              {t('catalog.apply')}
            </button>
            {(category || q || priceMin || priceMax || featured) && (
              <button
                onClick={() => {
                  setMinInput('');
                  setMaxInput('');
                  setParams(new URLSearchParams());
                }}
                className="mt-2 w-full h-10 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition"
              >
                {t('catalog.clear')}
              </button>
            )}
          </div>
        </aside>

        {/* Grid */}
        <div className="flex-1">
          {loading ? (
            <Spinner label={t('common.loading')} />
          ) : data && data.items.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                {data.items.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
              <Pagination page={data.page} pages={data.pages} onPage={p => patch({page: String(p)})} />
            </>
          ) : (
            <EmptyState
              title={t('catalog.no_results')}
              sub={t('catalog.no_results_sub')}
              action={
                <Link to="/products" className="mt-2 h-10 px-5 rounded-xl bg-brand-600 text-white text-sm font-semibold flex items-center hover:bg-brand-700">
                  {t('catalog.clear')}
                </Link>
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}
