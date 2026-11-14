import {useTranslation} from 'react-i18next';
import {Link, useNavigate} from 'react-router-dom';
import {Minus, Plus, ShoppingBag, Trash2} from 'lucide-react';
import {EmptyState} from '@/components/ui';
import {useCart} from '@/context/CartContext';
import {FREE_SHIPPING_THRESHOLD, SHIPPING_FEE, formatMoney} from '@/lib/money';

export default function CartPage() {
  const {t, i18n} = useTranslation();
  const {lines, subtotal, setQty, removeItem} = useCart();
  const navigate = useNavigate();

  if (lines.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 fade-up">
        <EmptyState
          title={t('cart.empty')}
          sub={t('cart.empty_sub')}
          action={
            <Link to="/products" className="mt-2 h-11 px-6 rounded-xl bg-brand-600 text-white text-sm font-bold flex items-center hover:bg-brand-700 transition">
              {t('cart.continue_shopping')}
            </Link>
          }
        />
      </div>
    );
  }

  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const nameOf = (p: (typeof lines)[0]['product']) => (i18n.language === 'ar' ? p.name_ar : p.name_en);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 fade-up">
      <h1 className="text-2xl font-extrabold text-slate-900 mb-8 flex items-center gap-3">
        <ShoppingBag className="text-brand-600" size={26} /> {t('cart.title')}
      </h1>

      <div className="grid lg:grid-cols-3 gap-8 items-start">
        {/* Lines */}
        <div className="lg:col-span-2 space-y-4">
          {lines.map(({product, qty}) => (
            <div key={product.id} className="bg-white rounded-2xl border border-slate-100 p-4 flex gap-4 items-center">
              <Link to={`/products/${product.slug}`} className="w-24 h-24 rounded-xl overflow-hidden bg-slate-50 shrink-0">
                {product.images[0] && <img src={product.images[0]} alt="" className="w-full h-full object-cover" />}
              </Link>
              <div className="flex-1 min-w-0">
                <Link to={`/products/${product.slug}`} className="font-semibold text-sm text-slate-800 line-clamp-1 hover:text-brand-600 transition">
                  {nameOf(product)}
                </Link>
                <p className="text-xs text-slate-400 mt-1">{formatMoney(product.price, i18n.language)}</p>
                <div className="mt-2.5 flex items-center gap-3">
                  <div className="flex items-center border border-slate-200 rounded-lg h-8">
                    <button onClick={() => setQty(product.id, qty - 1)} className="w-8 h-full flex items-center justify-center text-slate-500 hover:text-brand-600">
                      <Minus size={13} />
                    </button>
                    <span className="w-8 text-center text-sm font-bold">{qty}</span>
                    <button onClick={() => setQty(product.id, Math.min(product.stock, qty + 1))} disabled={qty >= product.stock} className="w-8 h-full flex items-center justify-center text-slate-500 hover:text-brand-600 disabled:opacity-30">
                      <Plus size={13} />
                    </button>
                  </div>
                  <button onClick={() => removeItem(product.id)} className="p-2 text-slate-400 hover:text-red-500 transition" aria-label={t('cart.remove')}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="text-end shrink-0">
                <p className="font-extrabold text-slate-900">{formatMoney(product.price * qty, i18n.language)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <aside className="bg-white rounded-2xl border border-slate-100 p-6 lg:sticky lg:top-24">
          <h2 className="font-bold text-slate-800 mb-5">{t('cart.order_summary')}</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">{t('cart.subtotal')}</dt>
              <dd className="font-semibold">{formatMoney(subtotal, i18n.language)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">{t('cart.shipping')}</dt>
              <dd className="font-semibold">
                {shipping === 0 ? <span className="text-emerald-600 font-bold">{t('cart.free')}</span> : formatMoney(shipping, i18n.language)}
              </dd>
            </div>
            <hr className="border-slate-100" />
            <div className="flex justify-between text-base">
              <dt className="font-bold text-slate-800">{t('cart.grand_total')}</dt>
              <dd className="font-extrabold text-brand-700">{formatMoney(subtotal + shipping, i18n.language)}</dd>
            </div>
          </dl>
          <button
            onClick={() => navigate('/checkout')}
            className="mt-6 w-full h-12 rounded-xl bg-brand-600 text-white font-bold hover:bg-brand-700 shadow-lg shadow-brand-200 transition"
          >
            {t('cart.checkout')}
          </button>
          <Link to="/products" className="block text-center mt-3 text-sm text-slate-500 hover:text-brand-600 transition">
            {t('cart.continue_shopping')}
          </Link>
        </aside>
      </div>
    </div>
  );
}
