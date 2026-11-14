import {useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {Link, useParams, useSearchParams} from 'react-router-dom';
import {ArrowRight, CheckCircle2, PartyPopper} from 'lucide-react';
import {toast} from '@/components/Toast';
import {Badge, Spinner} from '@/components/ui';
import {api} from '@/lib/api';
import {formatMoney} from '@/lib/money';
import type {Order} from '@/types';
import {StatusBadge} from './OrdersPage';

export default function OrderDetailsPage() {
  const {orderNumber} = useParams<{orderNumber: string}>();
  const {t, i18n} = useTranslation();
  const [params] = useSearchParams();
  const justPlaced = params.get('success') === '1';
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    api<{order: Order}>(`/orders/${orderNumber}`).then(r => setOrder(r.order));
  }, [orderNumber]);

  if (!order) return <Spinner label={t('common.loading')} />;

  const cancellable = order.status === 'pending' || order.status === 'paid';

  const cancelOrder = async () => {
    if (!confirm(t('order.confirm_cancel'))) return;
    await api<{order: Order}>(`/orders/${order.order_number}/cancel`, {method: 'POST'});
    setOrder(prev => (prev ? {...prev, status: 'cancelled'} : prev));
    toast(t('order.order_cancelled'));
  };

  const payLabel = (o: Order) => {
    const method = o.payment_method === 'cod' ? t('order.pay_cod') : t('order.pay_card');
    const status = o.payment_status === 'paid' ? t('order.pay_paid') : o.payment_status === 'refunded' ? t('order.pay_refunded') : t('order.pay_unpaid');
    return `${method} · ${status}`;
  };

  return (
    <div className="space-y-6 fade-up">
      {justPlaced && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 flex gap-4 items-start">
          <span className="w-11 h-11 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
            <PartyPopper size={20} />
          </span>
          <div>
            <h2 className="font-extrabold text-emerald-800">{t('order.thank_you')}</h2>
            <p className="text-sm text-emerald-600 mt-1">{t('order.thank_you_sub')}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">{t('order.order_number')}</p>
            <p className="text-lg font-extrabold text-slate-900" dir="ltr">{order.order_number}</p>
            <p className="text-xs text-slate-400 mt-1">
              {t('order.placed_on')}: {new Date(order.placed_at).toLocaleString(i18n.language === 'ar' ? 'ar-SA' : 'en-US')}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusBadge status={order.status} />
            <Badge tone="gray">{payLabel(order)}</Badge>
          </div>
        </div>

        {/* Items */}
        <h3 className="font-bold text-sm text-slate-800 my-4">{t('order.items')}</h3>
        <ul className="space-y-3">
          {order.items.map(it => (
            <li key={it.id} className="flex items-center gap-3">
              <span className="w-14 h-14 rounded-xl overflow-hidden bg-slate-50 shrink-0">
                {it.image && <img src={it.image} alt="" className="w-full h-full object-cover" />}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-semibold text-slate-700 line-clamp-1">
                  {i18n.language === 'ar' ? it.name_ar : it.name_en}
                </span>
                <span className="text-xs text-slate-400">
                  {formatMoney(it.unit_price, i18n.language)} × {it.qty}
                </span>
              </span>
              <span className="font-bold text-sm text-slate-800">{formatMoney(it.line_total, i18n.language)}</span>
            </li>
          ))}
        </ul>

        {/* Totals */}
        <dl className="mt-6 pt-5 border-t border-slate-100 space-y-2.5 text-sm max-w-xs ms-auto">
          <div className="flex justify-between">
            <dt className="text-slate-500">{t('cart.subtotal')}</dt>
            <dd className="font-semibold">{formatMoney(order.subtotal, i18n.language)}</dd>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-emerald-600">
              <dt>{t('cart.discount')} {order.coupon_code ? `(${order.coupon_code})` : ''}</dt>
              <dd className="font-semibold">−{formatMoney(order.discount, i18n.language)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-slate-500">{t('cart.shipping')}</dt>
            <dd className="font-semibold">{order.shipping_fee === 0 ? t('cart.free') : formatMoney(order.shipping_fee, i18n.language)}</dd>
          </div>
          <div className="flex justify-between text-base pt-2 border-t border-slate-100">
            <dt className="font-bold">{t('cart.grand_total')}</dt>
            <dd className="font-extrabold text-brand-700">{formatMoney(order.total, i18n.language)}</dd>
          </div>
        </dl>

        {/* Address */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <h3 className="font-bold text-sm text-slate-800 mb-2">{t('order.shipping_address')}</h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            {order.ship_name} · {order.ship_phone}
            <br />
            {order.ship_line1}, {order.ship_city}, {order.ship_country}
          </p>
        </div>

        {/* Actions */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-wrap gap-3">
          <Link to="/account/orders" className="h-10 px-4 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold flex items-center gap-2 hover:bg-slate-50 transition">
            <ArrowRight size={15} className="rtl:rotate-180" /> {t('order.my_orders')}
          </Link>
          {cancellable && (
            <button onClick={cancelOrder} className="h-10 px-4 rounded-xl border border-red-200 text-red-600 text-sm font-semibold flex items-center gap-2 hover:bg-red-50 transition">
              {t('order.cancel_order')}
            </button>
          )}
          {order.status === 'delivered' && (
            <span className="h-10 px-4 rounded-xl bg-emerald-50 text-emerald-600 text-sm font-semibold flex items-center gap-2">
              <CheckCircle2 size={15} /> {t('order.status_delivered')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
