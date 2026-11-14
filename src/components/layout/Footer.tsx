import {useTranslation} from 'react-i18next';
import {Link} from 'react-router-dom';
import {Store} from 'lucide-react';
import {api} from '@/lib/api';
import type {Category} from '@/types';
import {useEffect, useState} from 'react';

export default function Footer() {
  const {t, i18n} = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    api<{categories: Category[]}>('/categories')
      .then(r => setCategories(r.categories))
      .catch(() => {});
  }, []);

  return (
    <footer className="bg-white border-t border-slate-100 mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-8 h-8 bg-brand-600 text-white rounded-lg flex items-center justify-center">
              <Store size={17} />
            </span>
            <span className="text-lg font-bold">{t('brand')}</span>
          </div>
          <p className="text-sm text-slate-500 max-w-sm leading-relaxed">{t('footer.tagline')}</p>
        </div>
        <div>
          <h4 className="text-sm font-bold mb-4 uppercase tracking-wide text-slate-800">{t('footer.quick_links')}</h4>
          <ul className="space-y-2.5 text-sm text-slate-500">
            <li><Link to="/products" className="hover:text-brand-600 transition">{t('nav.products')}</Link></li>
            <li><Link to="/cart" className="hover:text-brand-600 transition">{t('nav.cart')}</Link></li>
            <li><Link to="/account/orders" className="hover:text-brand-600 transition">{t('order.my_orders')}</Link></li>
            <li><Link to="/account/wishlist" className="hover:text-brand-600 transition">{t('nav.wishlist')}</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-bold mb-4 uppercase tracking-wide text-slate-800">{t('footer.categories')}</h4>
          <ul className="space-y-2.5 text-sm text-slate-500">
            {categories.slice(0, 5).map(c => (
              <li key={c.id}>
                <Link to={`/products?category=${c.slug}`} className="hover:text-brand-600 transition">
                  {i18n.language === 'en' ? c.name_en : c.name_ar}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-100 py-5">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-slate-400">
          <p>{t('footer.rights', {year: new Date().getFullYear()})}</p>
          <div className="flex gap-5">
            <span className="hover:text-brand-600 cursor-pointer">{t('footer.terms')}</span>
            <span className="hover:text-brand-600 cursor-pointer">{t('footer.privacy')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
