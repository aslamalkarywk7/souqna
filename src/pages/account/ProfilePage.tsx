import {useState} from 'react';
import {useTranslation} from 'react-i18next';
import {toast} from '@/components/Toast';
import {useAuth} from '@/context/AuthContext';

export default function ProfilePage() {
  const {t, i18n} = useTranslation();
  const {user, updateProfile} = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [busy, setBusy] = useState(false);

  if (!user) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await updateProfile({name: name.trim(), phone: phone.trim() || undefined});
      toast(t('common.saved'));
    } finally {
      setBusy(false);
    }
  };

  const field = 'w-full h-11 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 transition bg-white';

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h2 className="font-bold text-slate-800 mb-1">{t('account.profile')}</h2>
        <p className="text-sm text-slate-400 mb-6">
          {t('account.member_since')} {new Date(user.created_at).toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-US')}
        </p>
        <form onSubmit={submit} className="grid sm:grid-cols-2 gap-4 max-w-xl">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">{t('auth.name')}</label>
            <input required minLength={2} value={name} onChange={e => setName(e.target.value)} className={field} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">{t('auth.email')}</label>
            <input value={user.email} disabled className={`${field} opacity-60`} dir="ltr" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">{t('auth.phone')}</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} className={field} dir="ltr" />
          </div>
          <div className="sm:col-span-2">
            <button disabled={busy} className="h-11 px-6 rounded-xl bg-brand-600 text-white text-sm font-bold hover:bg-brand-700 disabled:opacity-60 transition">
              {t('account.update_profile')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
