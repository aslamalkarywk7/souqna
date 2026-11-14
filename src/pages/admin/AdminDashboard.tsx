import {useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {AlertTriangle, DollarSign, Package, ShoppingCart, TrendingUp, Users} from 'lucide-react';
import {Spinner} from '@/components/ui';
import {api} from '@/lib/api';
import {formatMoney} from '@/lib/money';
import type {Order, Product} from '@/types';

interface Stats {
  revenue: number;
  orders_count: number;
  products_count: number;
  customers_count: number;
  low_stock: Product[];
  top_products: {name_ar: string; name_en: string; qty_sold: number; revenue: number}[];
  recent_orders: Order[];
}

export default function AdminDashboard() {
  const {t, i18n} = useTranslation();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    api<Stats>('/admin/stats').then(setStats);
  }, []);

  if (!stats) return <Spinner label={t('common.loading')} />;

  const cards = [
    {icon: DollarSign, label: t('admin.revenue'), value: formatMoney(stats.revenue, i18n.language), tone: 'bg-emerald-50 text-emerald-600'},
    {icon: ShoppingCart, label: t('admin.orders_count'), value: String(stats.orders_count), tone: 'bg-brand-50 text-brand-600'},
    {icon: Package, label: t('admin.products_count'), value: String(stats.products_count), tone: 'bg-amber-50 text-amber-600'},
    {icon: Users, label: t('admin.customers'), value: String(stats.customers_count), tone: 'bg-sky-50 text-sky-600'},
  ];

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({icon: Icon, label, value, tone}) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-100 p-5">
            <span className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${tone}`}>
              <Icon size={19} />
            </span>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
            <p className="text-xl font-extrabold text-slate-900 mt-1" dir="ltr">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top products */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <TrendingUp size={17} className="text-emerald-500" /> {t('admin.top_products')}
          </h2>
          {stats.top_products.length === 0 ? (
            <p className="text-sm text-slate-400">—</p>
          ) : (
            <ul className="space-y-3">
              {stats.top_products.map((p, i) => (
                <li key={p.name_en} className="flex items-center gap-3 text-sm">
                  <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 text-xs font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <span className="flex-1 min-w-0 line-clamp-1 font-medium text-slate-700">
                    {i18n.language === 'ar' ? p.name_ar : p.name_en}
                  </span>
                  <span className="text-xs text-slate-400 shrink-0">{p.qty_sold}×</span>
                  <span className="font-bold text-slate-800 shrink-0" dir="ltr">{formatMoney(p.revenue, i18n.language)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Low stock */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <AlertTriangle size={17} className="text-amber-500" /> {t('admin.low_stock')}
          </h2>
          {stats.low_stock.length === 0 ? (
            <p className="text-sm text-slate-400">—</p>
          ) : (
            <ul className="space-y-3">
              {stats.low_stock.map(p => (
                <li key={p.id} className="flex items-center gap-3 text-sm">
                  <span className="w-9 h-9 rounded-lg overflow-hidden bg-slate-50 shrink-0">
                    {p.images[0] && <img src={p.images[0]} alt="" className="w-full h-full object-cover" />}
                  </span>
                  <span className="flex-1 min-w-0 line-clamp-1 font-medium text-slate-700">
                    {i18n.language === 'ar' ? p.name_ar : p.name_en}
                  </span>
                  <span className={`font-bold shrink-0 ${p.stock <= 5 ? 'text-red-500' : 'text-amber-500'}`}>
                    {p.stock} {t('admin.field_stock').toLowerCase()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Recent orders */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h2 className="font-bold text-slate-800 mb-4">{t('admin.recent_orders')}</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-start text-xs text-slate-400 uppercase tracking-wide">
                <th className="text-start font-semibold pb-3">#</th>
                <th className="text-start font-semibold pb-3">{t('common.date')}</th>
                <th className="text-start font-semibold pb-3">{t('order.status')}</th>
                <th className="text-end font-semibold pb-3">{t('cart.total')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats.recent_orders.map(o => (
                <tr key={o.id}>
                  <td className="py-3 font-bold text-slate-700" dir="ltr">{o.order_number}</td>
                  <td className="py-3 text-slate-500">{new Date(o.placed_at).toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-US')}</td>
                  <td className="py-3 text-slate-500">{t(`order.status_${o.status}`)}</td>
                  <td className="py-3 text-end font-bold text-slate-800" dir="ltr">{formatMoney(o.total, i18n.language)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
