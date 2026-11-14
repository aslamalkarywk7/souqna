import {NavLink, Outlet} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import {Heart, Package, User} from 'lucide-react';
import {useAuth} from '@/context/AuthContext';

export default function AccountLayout() {
  const {t} = useTranslation();
  const {user} = useAuth();

  const item = ({isActive}: {isActive: boolean}) =>
    `flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium transition ${
      isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50'
    }`;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 fade-up">
      <div className="flex items-center gap-4 mb-8">
        <span className="w-14 h-14 rounded-2xl bg-brand-600 text-white text-xl font-extrabold flex items-center justify-center">
          {user?.name.charAt(0).toUpperCase()}
        </span>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">{t('account.my_account')}</h1>
          <p className="text-sm text-slate-400">{user?.email}</p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        <nav className="flex lg:flex-col gap-2 overflow-x-auto">
          <NavLink to="/account" end className={item}>
            <User size={17} /> {t('account.profile')}
          </NavLink>
          <NavLink to="/account/orders" className={item}>
            <Package size={17} /> {t('account.orders')}
          </NavLink>
          <NavLink to="/account/wishlist" className={item}>
            <Heart size={17} /> {t('account.wishlist')}
          </NavLink>
        </nav>
        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
