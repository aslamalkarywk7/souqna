import {useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {Link} from 'react-router-dom';
import {ChevronLeft, ChevronRight} from 'lucide-react';
import {Badge, EmptyState, Spinner} from '@/components/ui';
import {api} from '@/lib/api';
import {formatMoney} from '@/lib/money';
import type {Order, OrderStatus} from '@/types';

const STATUS_TONE: Record<OrderStatus, 'green' | 'amber' | 'red' | 'blue' | 'gray'> = {
  pending: 'amber',
  paid: 'blue',
  processing: 'blue',
  shipped: 'blue',
  delivered: 'green',
  cancelled: 'red',
  refunded: 'gray',
};

export function StatusBadge({status}: {status: OrderStatus}) {
  const {t} = useTranslation();
  return <Badge tone={STATUS_TONE[status]}>{t(`order.status_${status}`)}</Badge>;
}

export default function OrdersPage() {
  const {t, i18n} = useTranslation();
  const [orders, setOrders] = useState<Order[] | null>(null);

  useEffect(() => {
    api<{orders: Order[]}>('/orders').then(r => setOrders(r.orders));
  }, []);

  if (!orders) return <Spinner label={t('common.loading')} />;
  if (orders.length === 0) {
    return <EmptyState title={t('order.no_orders')} sub={t('order.no_orders_sub')} />;
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-100">
      {orders.map(o => (
        <Link key={o.id} to={`/account/orders/${o.order_number}`} className="flex items-center gap-4 p-5 hover:bg-slate-50/70 transition">
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm text-slate-800" dir="ltr">{o.order_number}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {new Date(o.placed_at).toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-US')} · {o.items.length} {t('order.items')}
            </p>
          </div>
          <StatusBadge status={o.status} />
          <span className="font-extrabold text-slate-900 text-sm shrink-0">{formatMoney(o.total, i18n.language)}</span>
          {i18n.language === 'ar' ? <ChevronLeft size={16} className="text-slate-300" /> : <ChevronRight size={16} className="text-slate-300" />}
        </Link>
      ))}
    </div>
  );
}
