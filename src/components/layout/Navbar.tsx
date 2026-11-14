import {useNavigate} from 'react-router-dom';
import {Heart, LogOut, LayoutDashboard, Menu, Search, ShoppingBag, Store, User as UserIcon, X} from 'lucide-react';
import {useState} from 'react';
import {useTranslation} from 'react-i18next';
import {Link, NavLink} from 'react-router-dom';
import {useAuth} from '@/context/AuthContext';
import {useCart} from '@/context/CartContext';

export default function Navbar() {
  const {t, i18n} = useTranslation();
  const {user, logout} = useAuth();
  const {count} = useCart();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(query.trim() ? `/products?q=${encodeURIComponent(query.trim())}` : '/products');
    setMobileOpen(false);
  };

  const switchLang = () => {
    i18n.changeLanguage(i18n.language === 'ar' ? 'en' : 'ar');
  };

  const linkClass = ({isActive}: {isActive: boolean}) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive ? 'text-brand-600 bg-brand-50' : 'text-slate-600 hover:text-brand-600 hover:bg-slate-50'
    }`;

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <span className="w-9 h-9 bg-brand-600 text-white rounded-xl flex items-center justify-center shadow-sm shadow-brand-200">
            <Store size={20} />
          </span>
          <span className="text-xl font-bold text-ink">{t('brand')}</span>
        </Link>

        {/* Desktop links */}
        <nav className="hidden md:flex items-center gap-1">
          <NavLink to="/" end className={linkClass}>{t('nav.home')}</NavLink>
          <NavLink to="/products" end className={linkClass}>{t('nav.products')}</NavLink>
        </nav>

        {/* Search */}
        <form onSubmit={submitSearch} className="hidden md:flex flex-1 max-w-md relative">
          <Search size={17} className="absolute inset-inline-start-3 top-1/2 -translate-y-1/2 text-slate-400" style={{insetInlineStart: 12}} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t('common.search')}
            className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl ps-9 pe-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-300 transition"
          />
        </form>

        <div className="flex-1 md:hidden" />

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={switchLang}
            className="px-3 h-9 rounded-lg text-sm font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 transition"
          >
            {t('nav.language')}
          </button>

          <Link to="/cart" className="relative p-2.5 rounded-lg hover:bg-slate-100 transition" aria-label={t('nav.cart')}>
            <ShoppingBag size={20} className="text-slate-700" />
            {count > 0 && (
              <span className="absolute -top-0.5 -end-0.5 min-w-5 h-5 px-1 bg-brand-600 text-white text-[11px] font-bold rounded-full flex items-center justify-center">
                {count > 99 ? '99+' : count}
              </span>
            )}
          </Link>

          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(o => !o)}
                className="flex items-center gap-2 h-9 px-3 rounded-lg hover:bg-slate-100 transition"
              >
                <span className="w-7 h-7 bg-brand-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {user.name.charAt(0).toUpperCase()}
                </span>
                <span className="hidden lg:block text-sm font-medium max-w-28 truncate">{user.name}</span>
              </button>
              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute top-full mt-2 end-0 z-20 w-52 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 fade-up">
                    <Link to="/account" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-slate-50">
                      <UserIcon size={16} /> {t('nav.account')}
                    </Link>
                    <Link to="/account/wishlist" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-slate-50">
                      <Heart size={16} /> {t('nav.wishlist')}
                    </Link>
                    {user.role === 'admin' && (
                      <Link to="/admin" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-brand-700 font-medium hover:bg-brand-50">
                        <LayoutDashboard size={16} /> {t('nav.admin')}
                      </Link>
                    )}
                    <hr className="my-1.5 border-slate-100" />
                    <button
                      onClick={() => {
                        logout();
                        setUserMenuOpen(false);
                        navigate('/');
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut size={16} /> {t('nav.logout')}
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="h-9 px-4 rounded-lg bg-brand-600 text-white text-sm font-semibold flex items-center hover:bg-brand-700 transition"
            >
              {t('nav.login')}
            </Link>
          )}

          <button className="md:hidden p-2.5 rounded-lg hover:bg-slate-100" onClick={() => setMobileOpen(o => !o)}>
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile panel */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 py-3 space-y-2">
          <form onSubmit={submitSearch} className="relative">
            <Search size={17} className="absolute top-1/2 -translate-y-1/2 text-slate-400" style={{insetInlineStart: 12}} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={t('common.search')}
              className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl ps-9 pe-3 text-sm focus:outline-none"
            />
          </form>
          <NavLink to="/" end onClick={() => setMobileOpen(false)} className="block px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-50">
            {t('nav.home')}
          </NavLink>
          <NavLink to="/products" end onClick={() => setMobileOpen(false)} className="block px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-50">
            {t('nav.products')}
          </NavLink>
        </div>
      )}
    </header>
  );
}
