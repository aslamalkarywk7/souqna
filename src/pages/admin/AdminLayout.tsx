import {NavLink, Outlet, Link} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import {LayoutDashboard, Package, Store, Ticket, ShoppingCart} from 'lucide-react';

export default function AdminLayout() {
  const {t} = useTranslation();

  const item = ({isActive}: {isActive: boolean}) =>
    `flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium transition ${
      isActive ? 'bg-brand-600 text-white shadow-sm shadow-brand-200' : 'text-slate-600 hover:bg-slate-100'
    }`;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 fade-up">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900">{t('admin.title')}</h1>
        <Link to="/" className="h-10 px-4 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold flex items-center gap-2 hover:bg-slate-50 transition">
          <Store size={15} /> {t('common.back_to_store')}
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <nav className="flex lg:flex-col gap-2 overflow-x-auto pb-1">
          <NavLink to="/admin" end className={item}>
            <LayoutDashboard size={17} /> {t('admin.dashboard')}
          </NavLink>
          <NavLink to="/admin/products" className={item}>
            <Package size={17} /> {t('admin.products')}
          </NavLink>
          <NavLink to="/admin/orders" className={item}>
            <ShoppingCart size={17} /> {t('admin.orders')}
          </NavLink>
          <NavLink to="/admin/coupons" className={item}>
            <Ticket size={17} /> {t('admin.coupons')}
          </NavLink>
        </nav>
        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
