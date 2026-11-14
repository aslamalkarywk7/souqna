import {useTranslation} from 'react-i18next';
import {Link, useNavigate} from 'react-router-dom';
import {Heart, ShoppingBag} from 'lucide-react';
import {toast} from '@/components/Toast';
import {useAuth} from '@/context/AuthContext';
import {useCart} from '@/context/CartContext';
import {api} from '@/lib/api';
import {formatMoney} from '@/lib/money';
import type {Product} from '@/types';
import RatingStars from './RatingStars';

export default function ProductCard({product}: {product: Product}) {
  const {t, i18n} = useTranslation();
  const {addItem} = useCart();
  const {user} = useAuth();
  const navigate = useNavigate();
  const name = i18n.language === 'ar' ? product.name_ar : product.name_en;
  const image = product.images[0];
  const discount = product.compare_at_price
    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
    : 0;

  const addToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.stock <= 0) return;
    try {
      await addItem(product, 1);
      toast(t('toast.added_to_cart', {name}));
    } catch {
      /* server cart errors surface at checkout */
    }
  };

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
    // Wishlist state on the card is intentionally stateless-fast: add; removal lives in the wishlist page.
    try {
      await api('/wishlist', {method: 'POST', body: {product_id: product.id}});
      toast(t('product.added_to_wishlist'));
    } catch {
      /* ignore duplicates */
    }
  };

  return (
    <Link
      to={`/products/${product.slug}`}
      className="group bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-xl hover:shadow-slate-200/60 hover:-translate-y-0.5 transition-all duration-300 flex flex-col"
    >
      <div className="relative aspect-square overflow-hidden bg-slate-50">
        {image ? (
          <img
            src={image}
            alt={name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300">
            <ShoppingBag size={40} />
          </div>
        )}
        {discount > 0 && (
          <span className="absolute top-3 start-3 px-2 py-1 bg-red-500 text-white text-[11px] font-bold rounded-lg">
            −{discount}%
          </span>
        )}
        <button
          onClick={toggleWishlist}
          aria-label={t('nav.wishlist')}
          className="absolute top-3 end-3 w-9 h-9 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-slate-500 hover:text-red-500 shadow-sm transition"
        >
          <Heart size={17} />
        </button>
        {product.stock <= 0 && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <span className="px-3 py-1.5 bg-slate-800 text-white text-xs font-semibold rounded-lg">
              {t('product.out_of_stock')}
            </span>
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <span className="text-[11px] font-semibold text-brand-600 uppercase tracking-wide">
          {i18n.language === 'ar' ? product.category.name_ar : product.category.name_en}
        </span>
        <h3 className="mt-1 font-semibold text-sm leading-snug line-clamp-2 text-slate-800 group-hover:text-brand-700 transition">
          {name}
        </h3>
        <div className="mt-1.5">
          <RatingStars rating={product.rating_avg} showValue count={product.rating_count} />
        </div>
        <div className="mt-auto pt-3 flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-1.5 min-w-0">
            <span className="font-bold text-slate-900">{formatMoney(product.price, i18n.language)}</span>
            {product.compare_at_price && (
              <span className="text-xs text-slate-400 line-through">
                {formatMoney(product.compare_at_price, i18n.language)}
              </span>
            )}
          </div>
          <button
            onClick={addToCart}
            disabled={product.stock <= 0}
            aria-label={t('product.add_to_cart')}
            className="w-9 h-9 shrink-0 rounded-xl bg-brand-600 text-white flex items-center justify-center hover:bg-brand-700 disabled:bg-slate-200 disabled:text-slate-400 transition"
          >
            <ShoppingBag size={16} />
          </button>
        </div>
      </div>
    </Link>
  );
}
