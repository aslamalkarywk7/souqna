import {useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {Link} from 'react-router-dom';
import {Trash2} from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import {EmptyState, Spinner} from '@/components/ui';
import {api} from '@/lib/api';
import type {Product} from '@/types';

export default function WishlistPage() {
  const {t} = useTranslation();
  const [items, setItems] = useState<Product[] | null>(null);

  useEffect(() => {
    api<{items: Product[]}>('/wishlist').then(r => setItems(r.items));
  }, []);

  if (!items) return <Spinner label={t('common.loading')} />;
  if (items.length === 0) {
    return <EmptyState title={t('account.no_wishlist')} sub={t('account.no_wishlist_sub')} />;
  }

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
        {items.map(p => (
          <div key={p.id} className="relative">
            <ProductCard product={p} />
            <button
              onClick={async () => {
                await api(`/wishlist/${p.id}`, {method: 'DELETE'});
                setItems(list => (list ? list.filter(x => x.id !== p.id) : list));
              }}
              aria-label={t('cart.remove')}
              className="absolute bottom-4 end-4 z-10 w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-red-500 flex items-center justify-center shadow-sm transition"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>
      <div className="text-center mt-8">
        <Link to="/products" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
          {t('cart.continue_shopping')}
        </Link>
      </div>
    </div>
  );
}
