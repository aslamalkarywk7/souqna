import {useState} from 'react';
import {useTranslation} from 'react-i18next';
import {Link, useNavigate} from 'react-router-dom';
import {Banknote, CreditCard, Ticket} from 'lucide-react';
import {EmptyState} from '@/components/ui';
import {useAuth} from '@/context/AuthContext';
import {useCart} from '@/context/CartContext';
import {api, ApiClientError} from '@/lib/api';
import {FREE_SHIPPING_THRESHOLD, SHIPPING_FEE, formatMoney} from '@/lib/money';
import type {Order} from '@/types';

export default function CheckoutPage() {
  const {t, i18n} = useTranslation();
  const {user} = useAuth();
  const {lines, subtotal, clear} = useCart();
  const navigate = useNavigate();

  const [ship, setShip] = useState({
    name: user?.name ?? '',
    phone: user?.phone ?? '',
    line1: '',
    city: '',
    country: 'Saudi Arabia',
  });
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'card'>('cod');
  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState<{code: string; discount: number} | null>(null);
  const [couponError, setCouponError] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (lines.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 fade-up">
        <EmptyState
          title={t('cart.empty')}
          sub={t('cart.empty_sub')}
          action={
            <Link to="/products" className="mt-2 h-11 px-6 rounded-xl bg-brand-600 text-white text-sm font-bold flex items-center hover:bg-brand-700">
              {t('cart.continue_shopping')}
            </Link>
          }
        />
      </div>
    );
  }

  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const discount = coupon?.discount ?? 0;
  const total = Math.max(0, subtotal - discount) + shipping;

  const applyCoupon = async () => {
    setCouponError(false);
    if (!couponInput.trim()) return;
    try {
      const r = await api<{code: string; discount: number}>('/coupons/validate', {
        method: 'POST',
        body: {code: couponInput.trim(), subtotal},
      });
      setCoupon(r);
    } catch {
      setCoupon(null);
      setCouponError(true);
    }
  };

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setPlacing(true);
    setError(null);
    try {
      const r = await api<{order: Order}>('/orders', {
        method: 'POST',
        body: {
          ship,
          payment_method: paymentMethod,
          coupon_code: coupon?.code,
          items: lines.map(l => ({product_id: l.product.id, qty: l.qty})),
        },
      });
      await clear();
      navigate(`/account/orders/${r.order.order_number}?success=1`);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : t('auth.err_generic'));
      setPlacing(false);
    }
  };

  const field = 'w-full h-11 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 transition';

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 fade-up">
      <h1 className="text-2xl font-extrabold text-slate-900 mb-8">{t('checkout.title')}</h1>

      <form onSubmit={placeOrder} className="grid lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-6">
          {/* Shipping */}
          <section className="bg-white rounded-2xl border border-slate-100 p-6">
            <h2 className="font-bold text-slate-800 mb-5">{t('checkout.shipping_info')}</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <input required value={ship.name} onChange={e => setShip(s => ({...s, name: e.target.value}))} placeholder={t('checkout.name')} className={field} />
              <input required value={ship.phone} onChange={e => setShip(s => ({...s, phone: e.target.value}))} placeholder={t('checkout.phone')} className={field} dir="ltr" />
              <input required value={ship.line1} onChange={e => setShip(s => ({...s, line1: e.target.value}))} placeholder={t('checkout.address')} className={`${field} sm:col-span-2`} />
              <input required value={ship.city} onChange={e => setShip(s => ({...s, city: e.target.value}))} placeholder={t('checkout.city')} className={field} />
              <input required value={ship.country} onChange={e => setShip(s => ({...s, country: e.target.value}))} placeholder={t('checkout.country')} className={field} />
            </div>
          </section>

          {/* Payment */}
          <section className="bg-white rounded-2xl border border-slate-100 p-6">
            <h2 className="font-bold text-slate-800 mb-5">{t('checkout.payment_method')}</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {([
                {id: 'cod', icon: Banknote, title: t('checkout.cod'), desc: t('checkout.cod_desc')},
                {id: 'card', icon: CreditCard, title: t('checkout.card'), desc: t('checkout.card_desc')},
              ] as const).map(({id, icon: Icon, title, desc}) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setPaymentMethod(id)}
                  className={`flex items-start gap-3 p-4 rounded-xl border-2 text-start transition ${
                    paymentMethod === id ? 'border-brand-500 bg-brand-50/50' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${paymentMethod === id ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    <Icon size={19} />
                  </span>
                  <span>
                    <span className="block font-bold text-sm text-slate-800">{title}</span>
                    <span className="block text-xs text-slate-400 mt-0.5">{desc}</span>
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* Coupon */}
          <section className="bg-white rounded-2xl border border-slate-100 p-6">
            <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Ticket size={18} className="text-brand-600" /> {t('checkout.coupon')}
            </h2>
            <div className="flex gap-2">
              <input
                value={couponInput}
                onChange={e => setCouponInput(e.target.value.toUpperCase())}
                placeholder={t('checkout.coupon_placeholder')}
                className={`${field} flex-1`}
                dir="ltr"
              />
              <button type="button" onClick={applyCoupon} className="h-11 px-5 rounded-xl bg-slate-800 text-white text-sm font-bold hover:bg-slate-700 transition shrink-0">
                {t('checkout.apply_coupon')}
              </button>
            </div>
            {coupon && (
              <p className="mt-3 text-sm font-semibold text-emerald-600">
                {t('checkout.coupon_applied', {discount: formatMoney(coupon.discount, i18n.language)})}
              </p>
            )}
            {couponError && <p className="mt-3 text-sm font-semibold text-red-500">{t('checkout.coupon_failed')}</p>}
          </section>
        </div>

        {/* Summary */}
        <aside className="bg-white rounded-2xl border border-slate-100 p-6 lg:sticky lg:top-24">
          <h2 className="font-bold text-slate-800 mb-5">{t('checkout.order_summary')}</h2>
          <ul className="space-y-3 mb-5 max-h-48 overflow-auto">
            {lines.map(({product, qty}) => (
              <li key={product.id} className="flex items-center gap-3 text-sm">
                <span className="w-11 h-11 rounded-lg overflow-hidden bg-slate-50 shrink-0">
                  {product.images[0] && <img src={product.images[0]} alt="" className="w-full h-full object-cover" />}
                </span>
                <span className="flex-1 min-w-0 line-clamp-1 text-slate-600">
                  {i18n.language === 'ar' ? product.name_ar : product.name_en}
                  <span className="text-slate-400"> ×{qty}</span>
                </span>
                <span className="font-semibold shrink-0">{formatMoney(product.price * qty, i18n.language)}</span>
              </li>
            ))}
          </ul>
          <dl className="space-y-3 text-sm border-t border-slate-100 pt-4">
            <div className="flex justify-between">
              <dt className="text-slate-500">{t('cart.subtotal')}</dt>
              <dd className="font-semibold">{formatMoney(subtotal, i18n.language)}</dd>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <dt>{t('cart.discount')}</dt>
                <dd className="font-semibold">−{formatMoney(discount, i18n.language)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-slate-500">{t('cart.shipping')}</dt>
              <dd className="font-semibold">
                {shipping === 0 ? <span className="text-emerald-600 font-bold">{t('cart.free')}</span> : formatMoney(shipping, i18n.language)}
              </dd>
            </div>
            <hr className="border-slate-100" />
            <div className="flex justify-between text-base">
              <dt className="font-bold text-slate-800">{t('cart.grand_total')}</dt>
              <dd className="font-extrabold text-brand-700">{formatMoney(total, i18n.language)}</dd>
            </div>
          </dl>

          {error && <p className="mt-4 text-sm font-semibold text-red-500 bg-red-50 rounded-xl px-4 py-3">{error}</p>}

          <button
            disabled={placing}
            className="mt-5 w-full h-12 rounded-xl bg-brand-600 text-white font-bold hover:bg-brand-700 shadow-lg shadow-brand-200 disabled:opacity-60 transition"
          >
            {placing ? t('checkout.placing') : t('checkout.place_order')}
          </button>
        </aside>
      </form>
    </div>
  );
}
