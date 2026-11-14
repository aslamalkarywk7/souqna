import {useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {Link, useNavigate, useParams} from 'react-router-dom';
import {Heart, Minus, Plus, ShoppingBag, Star} from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import RatingStars from '@/components/RatingStars';
import {toast} from '@/components/Toast';
import {EmptyState, Spinner} from '@/components/ui';
import {useAuth} from '@/context/AuthContext';
import {useCart} from '@/context/CartContext';
import {api} from '@/lib/api';
import {formatMoney} from '@/lib/money';
import type {Product, Review} from '@/types';

interface ProductResponse {
  product: Product;
  related: Product[];
}

export default function ProductPage() {
  const {slug} = useParams<{slug: string}>();
  const {t, i18n} = useTranslation();
  const {addItem} = useCart();
  const {user} = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState<ProductResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewForm, setReviewForm] = useState({rating: 5, title: '', body: ''});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLoading(true);
    setQty(1);
    setActiveImage(0);
    api<ProductResponse>(`/products/${slug}`)
      .then(setData)
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!data) return;
    api<{reviews: Review[]}>(`/products/${data.product.id}/reviews`).then(r => setReviews(r.reviews));
  }, [data]);

  if (loading) return <Spinner label={t('common.loading')} />;
  if (!data) return <EmptyState title={t('notfound.title')} />;

  const {product, related} = data;
  const name = i18n.language === 'ar' ? product.name_ar : product.name_en;
  const description = i18n.language === 'ar' ? product.description_ar : product.description_en;
  const specs = i18n.language === 'ar' ? product.specs.ar : product.specs.en;

  const add = async (buyNow = false) => {
    if (product.stock <= 0) return;
    try {
      await addItem(product, qty);
      toast(t('toast.added_to_cart', {name}));
      if (buyNow) navigate('/cart');
    } catch {
      /* handled by checkout */
    }
  };

  const toggleWishlist = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      await api('/wishlist', {method: 'POST', body: {product_id: product.id}});
      toast(t('product.added_to_wishlist'));
    } catch {
      /* duplicate is fine */
    }
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    setSubmitting(true);
    try {
      await api(`/products/${product.id}/reviews`, {method: 'POST', body: reviewForm});
      toast(t('product.review_submitted'));
      setReviewForm({rating: 5, title: '', body: ''});
      const r = await api<{reviews: Review[]}>(`/products/${product.id}/reviews`);
      setReviews(r.reviews);
      // Refresh aggregates without refetching everything
      const refreshed = await api<ProductResponse>(`/products/${slug}`);
      setData(refreshed);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 fade-up">
      <div className="grid lg:grid-cols-2 gap-10">
        {/* Gallery */}
        <div>
          <div className="aspect-square rounded-3xl overflow-hidden bg-slate-50 border border-slate-100">
            {product.images[activeImage] && (
              <img src={product.images[activeImage]} alt={name} className="w-full h-full object-cover" />
            )}
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-3 mt-4">
              {product.images.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition ${
                    i === activeImage ? 'border-brand-500' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <span className="text-xs font-bold text-brand-600 uppercase tracking-wide">
            {i18n.language === 'ar' ? product.category.name_ar : product.category.name_en}
            {product.brand ? ` · ${product.brand}` : ''}
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 mt-2 leading-snug">{name}</h1>

          <div className="mt-3 flex items-center gap-3">
            <RatingStars rating={product.rating_avg} showValue count={product.rating_count} size={17} />
            <span className="text-sm text-slate-300">|</span>
            <span className={`text-sm font-semibold ${product.stock > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {product.stock > 0
                ? product.stock <= 5
                  ? t('product.stock_left', {count: product.stock})
                  : t('product.in_stock')
                : t('product.out_of_stock')}
            </span>
          </div>

          <div className="mt-5 flex items-baseline gap-3">
            <span className="text-4xl font-extrabold text-slate-900">{formatMoney(product.price, i18n.language)}</span>
            {product.compare_at_price && (
              <span className="text-lg text-slate-400 line-through">{formatMoney(product.compare_at_price, i18n.language)}</span>
            )}
          </div>

          {/* Qty + actions */}
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <div className="flex items-center border border-slate-200 rounded-xl h-12 bg-white">
              <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-11 h-full flex items-center justify-center text-slate-500 hover:text-brand-600 disabled:opacity-30" disabled={qty <= 1}>
                <Minus size={16} />
              </button>
              <span className="w-10 text-center font-bold">{qty}</span>
              <button onClick={() => setQty(q => Math.min(product.stock || 1, q + 1))} className="w-11 h-full flex items-center justify-center text-slate-500 hover:text-brand-600 disabled:opacity-30" disabled={qty >= product.stock}>
                <Plus size={16} />
              </button>
            </div>
            <button
              onClick={() => add(false)}
              disabled={product.stock <= 0}
              className="h-12 px-6 rounded-xl bg-brand-600 text-white font-bold flex items-center gap-2 hover:bg-brand-700 shadow-lg shadow-brand-200 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none transition"
            >
              <ShoppingBag size={18} /> {t('product.add_to_cart')}
            </button>
            <button
              onClick={() => add(true)}
              disabled={product.stock <= 0}
              className="h-12 px-6 rounded-xl border-2 border-brand-600 text-brand-700 font-bold hover:bg-brand-50 disabled:opacity-40 transition"
            >
              {t('product.buy_now')}
            </button>
            <button
              onClick={toggleWishlist}
              aria-label={t('nav.wishlist')}
              className="w-12 h-12 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:text-red-500 hover:border-red-200 transition"
            >
              <Heart size={19} />
            </button>
          </div>

          {/* Meta */}
          <dl className="mt-7 grid grid-cols-2 gap-x-6 gap-y-2 text-sm max-w-md">
            <dt className="text-slate-400">{t('product.sku')}</dt>
            <dd className="font-medium text-slate-700">{product.sku}</dd>
            <dt className="text-slate-400">{t('product.brand')}</dt>
            <dd className="font-medium text-slate-700">{product.brand ?? '—'}</dd>
            <dt className="text-slate-400">{t('product.category')}</dt>
            <dd className="font-medium text-slate-700">
              <Link to={`/products?category=${product.category.slug}`} className="text-brand-600 hover:underline">
                {i18n.language === 'ar' ? product.category.name_ar : product.category.name_en}
              </Link>
            </dd>
          </dl>

          {/* Description */}
          <div className="mt-8">
            <h2 className="font-bold text-slate-800 mb-2">{t('product.description')}</h2>
            <p className="text-slate-500 leading-relaxed">{description}</p>
          </div>

          {/* Specs */}
          {Object.keys(specs).length > 0 && (
            <div className="mt-7">
              <h2 className="font-bold text-slate-800 mb-3">{t('product.specs')}</h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                {Object.entries(specs).map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3 bg-slate-50 rounded-xl px-4 py-2.5">
                    <dt className="text-slate-500">{k}</dt>
                    <dd className="font-semibold text-slate-700 text-end">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </div>

      {/* Reviews */}
      <section className="mt-16 max-w-3xl">
        <h2 className="text-xl font-extrabold text-slate-900 mb-5">{t('product.reviews', {count: reviews.length})}</h2>

        {reviews.length === 0 && <p className="text-sm text-slate-400 mb-6">{t('product.no_reviews')}</p>}

        <div className="space-y-4">
          {reviews.map(r => (
            <article key={r.id} className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 text-sm font-bold flex items-center justify-center">
                    {r.user_name.charAt(0)}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{r.user_name}</p>
                    <RatingStars rating={r.rating} size={13} />
                  </div>
                </div>
                <time className="text-xs text-slate-400">{new Date(r.created_at).toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-US')}</time>
              </div>
              {r.title && <h3 className="font-semibold text-sm text-slate-800 mb-1">{r.title}</h3>}
              {r.body && <p className="text-sm text-slate-500 leading-relaxed">{r.body}</p>}
            </article>
          ))}
        </div>

        {/* Review form */}
        <form onSubmit={submitReview} className="mt-8 bg-white rounded-2xl border border-slate-100 p-6">
          <h3 className="font-bold text-slate-800 mb-4">{t('product.write_review')}</h3>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm text-slate-500">{t('product.your_rating')}:</span>
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                type="button"
                onClick={() => setReviewForm(f => ({...f, rating: n}))}
                className={n <= reviewForm.rating ? 'text-amber-400' : 'text-slate-300 hover:text-amber-200'}
              >
                <Star size={22} fill="currentColor" strokeWidth={0} />
              </button>
            ))}
          </div>
          <input
            value={reviewForm.title}
            onChange={e => setReviewForm(f => ({...f, title: e.target.value}))}
            placeholder={t('product.review_title')}
            className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 mb-3"
          />
          <textarea
            value={reviewForm.body}
            onChange={e => setReviewForm(f => ({...f, body: e.target.value}))}
            placeholder={t('product.review_body')}
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 mb-4 resize-none"
          />
          <button
            disabled={submitting}
            className="h-11 px-6 rounded-xl bg-brand-600 text-white text-sm font-bold hover:bg-brand-700 disabled:opacity-50 transition"
          >
            {t('product.submit_review')}
          </button>
        </form>
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="text-xl font-extrabold text-slate-900 mb-6">{t('product.related')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {related.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
