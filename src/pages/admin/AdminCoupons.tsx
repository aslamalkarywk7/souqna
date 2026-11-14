import {useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {Plus, Trash2} from 'lucide-react';
import {Badge} from '@/components/ui';
import {api, ApiClientError} from '@/lib/api';
import {formatMoney} from '@/lib/money';
import type {Coupon} from '@/types';

export default function AdminCoupons() {
  const {t, i18n} = useTranslation();
  const [coupons, setCoupons] = useState<Coupon[] | null>(null);
  const [form, setForm] = useState({code: '', type: 'percent', value: '', min_subtotal: '0', max_uses: '', expires_at: ''});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () => api<{coupons: Coupon[]}>('/admin/coupons').then(r => setCoupons(r.coupons));
  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api('/admin/coupons', {
        method: 'POST',
        body: {
          code: form.code.trim().toUpperCase(),
          type: form.type,
          value: Number(form.value),
          min_subtotal: Number(form.min_subtotal || 0),
          max_uses: form.max_uses ? Number(form.max_uses) : null,
          expires_at: form.expires_at || null,
        },
      });
      setForm({code: '', type: 'percent', value: '', min_subtotal: '0', max_uses: '', expires_at: ''});
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Error');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (code: string) => {
    if (!confirm(t('admin.confirm_delete'))) return;
    await api(`/admin/coupons/${code}`, {method: 'DELETE'});
    await load();
  };

  const field = 'w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 transition';

  return (
    <div className="space-y-6">
      {/* Create */}
      <form onSubmit={submit} className="bg-white rounded-2xl border border-slate-100 p-6">
        <h2 className="font-bold text-slate-800 mb-5 flex items-center gap-2">
          <Plus size={17} className="text-brand-600" /> {t('admin.add_coupon')}
        </h2>
        <div className="grid sm:grid-cols-3 lg:grid-cols-6 gap-3 items-end">
          <div className="lg:col-span-2">
            <label className="block text-xs font-bold text-slate-500 mb-1.5">{t('admin.field_code')}</label>
            <input required value={form.code} onChange={e => setForm(f => ({...f, code: e.target.value.toUpperCase()}))} className={field} dir="ltr" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">{t('admin.field_type')}</label>
            <select value={form.type} onChange={e => setForm(f => ({...f, type: e.target.value}))} className={field}>
              <option value="percent">{t('admin.type_percent')}</option>
              <option value="fixed">{t('admin.type_fixed')}</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">{t('admin.field_value')}</label>
            <input required type="number" min={1} value={form.value} onChange={e => setForm(f => ({...f, value: e.target.value}))} className={field} dir="ltr" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">{t('admin.field_min_subtotal')}</label>
            <input type="number" min={0} value={form.min_subtotal} onChange={e => setForm(f => ({...f, min_subtotal: e.target.value}))} className={field} dir="ltr" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">{t('admin.field_expires')}</label>
            <input type="date" value={form.expires_at} onChange={e => setForm(f => ({...f, expires_at: e.target.value}))} className={field} dir="ltr" />
          </div>
        </div>
        {error && <p className="mt-4 text-sm font-semibold text-red-500 bg-red-50 rounded-xl px-4 py-2.5">{error}</p>}
        <button disabled={busy} className="mt-5 h-11 px-6 rounded-xl bg-brand-600 text-white text-sm font-bold hover:bg-brand-700 disabled:opacity-60 transition">
          {t('admin.create')}
        </button>
      </form>

      {/* List */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h2 className="font-bold text-slate-800 mb-5">{t('admin.coupons')}</h2>
        {coupons && coupons.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-400 uppercase tracking-wide">
                  <th className="text-start font-semibold pb-3">{t('admin.field_code')}</th>
                  <th className="text-start font-semibold pb-3">{t('admin.field_type')}</th>
                  <th className="text-start font-semibold pb-3">{t('admin.field_value')}</th>
                  <th className="text-start font-semibold pb-3">{t('admin.field_min_subtotal')}</th>
                  <th className="text-start font-semibold pb-3">{t('admin.usage')}</th>
                  <th className="text-end font-semibold pb-3">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {coupons.map(c => (
                  <tr key={c.code}>
                    <td className="py-3 font-extrabold text-brand-700" dir="ltr">{c.code}</td>
                    <td className="py-3">
                      <Badge tone={c.type === 'percent' ? 'blue' : 'gray'}>
                        {c.type === 'percent' ? `${c.value}%` : formatMoney(c.value, i18n.language)}
                      </Badge>
                    </td>
                    <td className="py-3 text-slate-500" dir="ltr">{c.type === 'percent' ? `−${c.value}%` : `−${formatMoney(c.value, i18n.language)}`}</td>
                    <td className="py-3 text-slate-500" dir="ltr">{formatMoney(c.min_subtotal, i18n.language)}</td>
                    <td className="py-3 text-slate-500">{c.used_count}{c.max_uses ? ` / ${c.max_uses}` : ''}</td>
                    <td className="py-3 text-end">
                      <button onClick={() => remove(c.code)} className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition">
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-sm text-slate-400 py-8">{t('admin.no_coupons')}</p>
        )}
      </div>
    </div>
  );
}
