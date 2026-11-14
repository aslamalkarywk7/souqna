import {useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {Link} from 'react-router-dom';
import {ArrowLeft, ArrowRight, Headset, RotateCcw, ShieldCheck, Truck} from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import {Spinner} from '@/components/ui';
import {api} from '@/lib/api';
import type {Category, Product, ProductListResponse} from '@/types';

const PERKS = [
  {icon: Truck, key: 'shipping'},
  {icon: Headset, key: 'support'},
  {icon: RotateCcw, key: 'returns'},
  {icon: ShieldCheck, key: 'secure'},
] as const;

export default function HomePage() {
  const {t, i18n} = useTranslation();
  const [featured, setFeatured] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const Arrow = i18n.language === 'ar' ? ArrowLeft : ArrowRight;

  useEffect(() => {
    Promise.all([
      api<ProductListResponse>('/products?featured=true&per_page=8'),
      api<ProductListResponse>('/products?sort=newest&per_page=8'),
      api<{categories: Category[]}>('/categories'),
    ])
      .then(([f, n, c]) => {
        setFeatured(f.items);
        setNewArrivals(n.items);
        setCategories(c.categories);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner label={t('common.loading')} />;

  return (
    <div className="fade-up">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50/80 via-white to-white">
        <div className="absolute -top-24 -end-24 w-96 h-96 bg-brand-100/60 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 py-20 md:py-28 text-center relative">
          <span className="inline-block px-4 py-1.5 rounded-full bg-brand-100 text-brand-700 text-xs font-bold mb-5">
            {t('home.hero_badge')}
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15] max-w-3xl mx-auto">
            {t('home.hero_title')}
          </h1>
          <p className="mt-5 text-slate-500 text-lg max-w-2xl mx-auto leading-relaxed">{t('home.hero_sub')}</p>
          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/products"
              className="h-12 px-8 rounded-xl bg-brand-600 text-white font-bold flex items-center gap-2 hover:bg-brand-700 shadow-lg shadow-brand-200 transition"
            >
              {t('home.hero_cta')} <Arrow size={18} />
            </Link>
            <Link
              to="/products"
              className="h-12 px-8 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold flex items-center hover:border-brand-300 hover:text-brand-700 transition"
            >
              {t('home.hero_cta2')}
            </Link>
          </div>
        </div>
      </section>

      {/* Perks */}
      <section className="max-w-7xl mx-auto px-4 -mt-2">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {PERKS.map(({icon: Icon, key}) => (
            <div key={key} className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-4">
              <span className="w-11 h-11 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                <Icon size={21} />
              </span>
              <div className="min-w-0">
                <h3 className="font-bold text-sm text-slate-800">{t(`home.perk_${key}_title`)}</h3>
                <p className="text-xs text-slate-400 mt-0.5 truncate">{t(`home.perk_${key}_sub`)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 pt-16">
        <h2 className="text-2xl font-extrabold text-slate-900 mb-6">{t('home.categories_title')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map(c => (
            <Link
              key={c.id}
              to={`/products?category=${c.slug}`}
              className="group relative aspect-[4/5] rounded-2xl overflow-hidden bg-slate-100"
            >
              {c.image_url && (
                <img src={c.image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
              <span className="absolute bottom-4 inset-x-0 text-center text-white font-bold text-sm drop-shadow">
                {i18n.language === 'ar' ? c.name_ar : c.name_en}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="max-w-7xl mx-auto px-4 pt-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-extrabold text-slate-900">{t('home.featured')}</h2>
          <Link to="/products?featured=true" className="text-sm font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1">
            {t('home.view_all')} <Arrow size={15} />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {featured.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      {/* New arrivals */}
      <section className="max-w-7xl mx-auto px-4 pt-16">
        <h2 className="text-2xl font-extrabold text-slate-900 mb-6">{t('home.new_arrivals')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {newArrivals.slice(0, 4).map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>
    </div>
  );
}
