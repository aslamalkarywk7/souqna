import {useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {api} from '@/lib/api';
import {formatMoney} from '@/lib/money';
import type {Order, OrderStatus} from '@/types';

const STATUSES: OrderStatus[] = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];

export default function AdminOrders() {
  const {t, i18n} = useTranslation();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [status, setStatus] = useState('');

  const load = () => {
    const usp = new URLSearchParams();
    if (status) usp.set('status', status);
    api<{items: Order[]}>(`/admin/orders?${usp}`).then(r => setOrders(r.items));
  };

  useEffect(load, [status]);

  const changeStatus = async (id: number, next: OrderStatus) => {
    await api(`/admin/orders/${id}`, {method: 'PATCH', body: {status: next}});
    setOrders(list => (list ? list.map(o => (o.id === id ? {...o, status: next} : o)) : list));
  };

  if (!orders) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h2 className="font-bold text-slate-800">{t('admin.orders')}</h2>
        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
          className="h-10 px-3 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-200"
        >
          <option value="">{t('admin.all_statuses')}</option>
          {STATUSES.map(s => (
            <option key={s} value={s}>{t(`order.status_${s}`)}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-slate-400 uppercase tracking-wide">
              <th className="text-start font-semibold pb-3">#</th>
              <th className="text-start font-semibold pb-3">{t('common.date')}</th>
              <th className="text-start font-semibold pb-3">{t('checkout.payment_method')}</th>
              <th className="text-start font-semibold pb-3">{t('cart.total')}</th>
              <th className="text-end font-semibold pb-3">{t('order.status')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.map(o => (
              <tr key={o.id}>
                <td className="py-3 font-bold text-slate-700" dir="ltr">{o.order_number}</td>
                <td className="py-3 text-slate-500">{new Date(o.placed_at).toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-US')}</td>
                <td className="py-3 text-slate-500">{t(o.payment_method === 'cod' ? 'order.pay_cod' : 'order.pay_card')}</td>
                <td className="py-3 font-bold text-slate-800" dir="ltr">{formatMoney(o.total, i18n.language)}</td>
                <td className="py-3 text-end">
                  <select
                    value={o.status}
                    onChange={e => changeStatus(o.id, e.target.value as OrderStatus)}
                    className="h-9 px-2.5 rounded-lg border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-200"
                  >
                    {STATUSES.map(s => (
                      <option key={s} value={s}>{t(`order.status_${s}`)}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && <p className="text-center text-sm text-slate-400 py-10">—</p>}
      </div>
    </div>
  );
}
