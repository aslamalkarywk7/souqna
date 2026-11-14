import {useState} from 'react';
import {useTranslation} from 'react-i18next';
import {Link, useNavigate} from 'react-router-dom';
import {Store, UserPlus} from 'lucide-react';
import {toast} from '@/components/Toast';
import {useAuth} from '@/context/AuthContext';
import {ApiClientError} from '@/lib/api';

export default function RegisterPage() {
  const {t} = useTranslation();
  const {register} = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({name: '', email: '', password: '', phone: ''});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await register(form.name.trim(), form.email.trim(), form.password, form.phone.trim() || undefined);
      toast(t('toast.register_success'));
      navigate('/', {replace: true});
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(
          err.code === 'EMAIL_TAKEN' ? t('auth.err_email_taken')
          : err.code === 'VALIDATION' ? `${t('auth.err_validation')}: ${err.message}`
          : t('auth.err_generic'),
        );
      } else {
        setError(t('auth.err_generic'));
      }
      setBusy(false);
    }
  };

  const field = 'w-full h-11 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 transition';
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({...f, [k]: e.target.value}));

  return (
    <div className="max-w-md mx-auto px-4 py-16 fade-up">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
        <div className="text-center mb-7">
          <span className="inline-flex w-12 h-12 rounded-2xl bg-brand-600 text-white items-center justify-center mb-4">
            <Store size={22} />
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900">{t('auth.register_title')}</h1>
          <p className="text-sm text-slate-400 mt-1.5">{t('auth.register_sub')}</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <input required minLength={2} value={form.name} onChange={set('name')} placeholder={t('auth.name')} className={field} />
          <input required type="email" value={form.email} onChange={set('email')} placeholder={t('auth.email')} className={field} dir="ltr" />
          <input required type="password" minLength={8} value={form.password} onChange={set('password')} placeholder={t('auth.password')} className={field} dir="ltr" />
          <input type="tel" value={form.phone} onChange={set('phone')} placeholder={t('auth.phone')} className={field} dir="ltr" />
          {error && <p className="text-sm font-semibold text-red-500 bg-red-50 rounded-xl px-4 py-2.5">{error}</p>}
          <button disabled={busy} className="w-full h-12 rounded-xl bg-brand-600 text-white font-bold flex items-center justify-center gap-2 hover:bg-brand-700 shadow-lg shadow-brand-200 disabled:opacity-60 transition">
            <UserPlus size={17} /> {t('auth.register_title')}
          </button>
        </form>

        <p className="text-center text-sm text-slate-400 mt-5">
          {t('auth.have_account')}{' '}
          <Link to="/login" className="font-bold text-brand-600 hover:text-brand-700">{t('auth.login_here')}</Link>
        </p>
      </div>
    </div>
  );
}
