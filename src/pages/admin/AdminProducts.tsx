import {useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {Pencil, Plus, Search, X} from 'lucide-react';
import {Badge} from '@/components/ui';
import {api} from '@/lib/api';
import {formatMoney} from '@/lib/money';
import type {Category, Product, ProductListResponse} from '@/types';

interface ProductForm {
  id?: number;
  sku: string;
  slug: string;
  name_ar: string;
  name_en: string;
  description_ar: string;
  description_en: string;
  price: string;
  compare_at_price: string;
  stock: string;
  category_id: string;
  brand: string;
  images: string;
  is_active: boolean;
  is_featured: boolean;
}

const EMPTY: ProductForm = {
  sku: '', slug: '', name_ar: '', name_en: '', description_ar: '', description_en: '',
  price: '', compare_at_price: '', stock: '10', category_id: '', brand: '', images: '',
  is_active: true, is_featured: false,
};

export default function AdminProducts() {
  const {t, i18n} = useTranslation();
  const [data, setData] = useState<ProductListResponse | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ProductForm>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    const usp = new URLSearchParams({page: String(page)});
    if (query.trim()) usp.set('q', query.trim());
    api<ProductListResponse>(`/admin/products?${usp}`).then(setData);
  };

  useEffect(load, [page, query]);

  useEffect(() => {
    api<{categories: Category[]}>('/admin/categories').then(r => setCategories(r.categories));
  }, []);

  const openCreate = () => {
    setForm(EMPTY);
    setError(null);
    setShowForm(true);
  };

  const openEdit = (p: Product) => {
    setForm({
      id: p.id,
      sku: p.sku,
      slug: p.slug,
      name_ar: p.name_ar,
      name_en: p.name_en,
      description_ar: p.description_ar,
      description_en: p.description_en,
      price: String(p.price),
      compare_at_price: p.compare_at_price ? String(p.compare_at_price) : '',
      stock: String(p.stock),
      category_id: String(p.category.id),
      brand: p.brand ?? '',
      images: p.images.join('\n'),
      is_active: true,
      is_featured: p.is_featured,
    });
    setError(null);
    setShowForm(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const body = {
      sku: form.sku.trim(),
      slug: form.slug.trim(),
      name_ar: form.name_ar.trim(),
      name_en: form.name_en.trim(),
      description_ar: form.description_ar,
      description_en: form.description_en,
      price: Number(form.price),
      compare_at_price: form.compare_at_price ? Number(form.compare_at_price) : null,
      stock: Number(form.stock),
      category_id: Number(form.category_id),
      brand: form.brand.trim() || null,
      images: form.images.split('\n').map(s => s.trim()).filter(Boolean),
      specs: {},
      is_active: form.is_active,
      is_featured: form.is_featured,
    };
    try {
      if (form.id) await api(`/admin/products/${form.id}`, {method: 'PATCH', body});
      else await api('/admin/products', {method: 'POST', body});
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setBusy(false);
    }
  };

  const deactivate = async (p: Product) => {
    if (!confirm(t('admin.confirm_delete'))) return;
    await api(`/admin/products/${p.id}`, {method: 'DELETE'});
    load();
  };

  const field = 'w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 transition';

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h2 className="font-bold text-slate-800">{t('admin.products')}</h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={15} className="absolute top-1/2 -translate-y-1/2 text-slate-400" style={{insetInlineStart: 12}} />
            <input
              value={query}
              onChange={e => { setPage(1); setQuery(e.target.value); }}
              placeholder={t('admin.search_products')}
              className="h-10 w-52 ps-9 pe-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
          </div>
          <button onClick={openCreate} className="h-10 px-4 rounded-xl bg-brand-600 text-white text-sm font-bold flex items-center gap-1.5 hover:bg-brand-700 transition">
            <Plus size={16} /> {t('admin.add_product')}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-slate-400 uppercase tracking-wide">
              <th className="text-start font-semibold pb-3">{t('cart.product')}</th>
              <th className="text-start font-semibold pb-3">{t('admin.field_sku')}</th>
              <th className="text-start font-semibold pb-3">{t('admin.field_price')}</th>
              <th className="text-start font-semibold pb-3">{t('admin.field_stock')}</th>
              <th className="text-start font-semibold pb-3">{t('order.status')}</th>
              <th className="text-end font-semibold pb-3">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data?.items.map(p => (
              <tr key={p.id}>
                <td className="py-3">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-lg overflow-hidden bg-slate-50 shrink-0">
                      {p.images[0] && <img src={p.images[0]} alt="" className="w-full h-full object-cover" />}
                    </span>
                    <span className="font-semibold text-slate-700 line-clamp-1 max-w-52">
                      {i18n.language === 'ar' ? p.name_ar : p.name_en}
                    </span>
                  </div>
                </td>
                <td className="py-3 text-slate-500" dir="ltr">{p.sku}</td>
                <td className="py-3 font-semibold text-slate-700" dir="ltr">{formatMoney(p.price, i18n.language)}</td>
                <td className="py-3">
                  <span className={p.stock <= 5 ? 'text-red-500 font-bold' : 'text-slate-600'}>{p.stock}</span>
                </td>
                <td className="py-3">
                  {p.is_featured ? <Badge tone="blue">{t('admin.field_featured')}</Badge> : <Badge tone="green">{t('product.in_stock')}</Badge>}
                </td>
                <td className="py-3 text-end">
                  <div className="flex justify-end gap-1.5">
                    <button onClick={() => openEdit(p)} className="p-2 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => deactivate(p)} className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition">
                      <X size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && data.pages > 1 && (
        <div className="flex justify-center gap-2 mt-5">
          {Array.from({length: data.pages}, (_, i) => i + 1).map(n => (
            <button
              key={n}
              onClick={() => setPage(n)}
              className={`w-8 h-8 rounded-lg text-sm font-semibold ${n === data.page ? 'bg-brand-600 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              {n}
            </button>
          ))}
        </div>
      )}

      {/* Create / edit modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <form
            onSubmit={submit}
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-auto p-7 fade-up"
          >
            <h3 className="text-lg font-extrabold text-slate-900 mb-6">
              {form.id ? t('admin.edit_product') : t('admin.new_product')}
            </h3>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">{t('admin.field_name_ar')}</label>
                <input required value={form.name_ar} onChange={e => setForm(f => ({...f, name_ar: e.target.value}))} className={field} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">{t('admin.field_name_en')}</label>
                <input required value={form.name_en} onChange={e => setForm(f => ({...f, name_en: e.target.value}))} className={field} dir="ltr" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">{t('admin.field_sku')}</label>
                <input required value={form.sku} onChange={e => setForm(f => ({...f, sku: e.target.value}))} className={field} dir="ltr" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">{t('admin.field_slug')}</label>
                <input required value={form.slug} onChange={e => setForm(f => ({...f, slug: e.target.value}))} className={field} dir="ltr" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">{t('admin.field_price')}</label>
                <input required type="number" min={0} value={form.price} onChange={e => setForm(f => ({...f, price: e.target.value}))} className={field} dir="ltr" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">{t('admin.field_compare')}</label>
                <input type="number" min={0} value={form.compare_at_price} onChange={e => setForm(f => ({...f, compare_at_price: e.target.value}))} className={field} dir="ltr" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">{t('admin.field_stock')}</label>
                <input required type="number" min={0} value={form.stock} onChange={e => setForm(f => ({...f, stock: e.target.value}))} className={field} dir="ltr" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">{t('admin.field_category')}</label>
                <select required value={form.category_id} onChange={e => setForm(f => ({...f, category_id: e.target.value}))} className={field}>
                  <option value="">—</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{i18n.language === 'ar' ? c.name_ar : c.name_en}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">{t('admin.field_brand')}</label>
                <input value={form.brand} onChange={e => setForm(f => ({...f, brand: e.target.value}))} className={field} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-500 mb-1.5">{t('admin.field_desc_ar')}</label>
                <textarea rows={2} value={form.description_ar} onChange={e => setForm(f => ({...f, description_ar: e.target.value}))} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-500 mb-1.5">{t('admin.field_desc_en')}</label>
                <textarea rows={2} value={form.description_en} onChange={e => setForm(f => ({...f, description_en: e.target.value}))} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200" dir="ltr" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-500 mb-1.5">{t('admin.field_images')}</label>
                <textarea rows={3} value={form.images} onChange={e => setForm(f => ({...f, images: e.target.value}))} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200" dir="ltr" />
              </div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
                <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({...f, is_active: e.target.checked}))} className="w-4 h-4 accent-brand-600" />
                {t('admin.field_active')}
              </label>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
                <input type="checkbox" checked={form.is_featured} onChange={e => setForm(f => ({...f, is_featured: e.target.checked}))} className="w-4 h-4 accent-brand-600" />
                {t('admin.field_featured')}
              </label>
            </div>

            {error && <p className="mt-4 text-sm font-semibold text-red-500 bg-red-50 rounded-xl px-4 py-2.5">{error}</p>}

            <div className="flex gap-3 mt-7">
              <button disabled={busy} className="h-11 px-6 rounded-xl bg-brand-600 text-white text-sm font-bold hover:bg-brand-700 disabled:opacity-60 transition">
                {form.id ? t('admin.update') : t('admin.create')}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="h-11 px-6 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition">
                {t('common.cancel')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
