import {useState} from 'react';
import {useTranslation} from 'react-i18next';
import {Link, useLocation, useNavigate} from 'react-router-dom';
import {Info, LogIn, Store} from 'lucide-react';
import {toast} from '@/components/Toast';
import {useAuth} from '@/context/AuthContext';
import {ApiClientError} from '@/lib/api';

export default function LoginPage() {
  const {t} = useTranslation();
  const {login} = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const from = (location.state as {from?: string} | null)?.from ?? '/';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const user = await login(email.trim(), password);
      toast(t('toast.login_success', {name: user.name.split(' ')[0]}));
      navigate(from, {replace: true});
    } catch (err) {
      setError(err instanceof ApiClientError && err.code === 'INVALID_CREDENTIALS' ? t('auth.err_invalid') : t('auth.err_generic'));
      setBusy(false);
    }
  };

  const field = 'w-full h-11 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 transition';

  return (
    <div className="max-w-md mx-auto px-4 py-16 fade-up">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
        <div className="text-center mb-7">
          <span className="inline-flex w-12 h-12 rounded-2xl bg-brand-600 text-white items-center justify-center mb-4">
            <Store size={22} />
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900">{t('auth.login_title')}</h1>
          <p className="text-sm text-slate-400 mt-1.5">{t('auth.login_sub')}</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t('auth.email')} className={field} dir="ltr" />
          <input required type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={t('auth.password')} className={field} dir="ltr" />
          {error && <p className="text-sm font-semibold text-red-500 bg-red-50 rounded-xl px-4 py-2.5">{error}</p>}
          <button disabled={busy} className="w-full h-12 rounded-xl bg-brand-600 text-white font-bold flex items-center justify-center gap-2 hover:bg-brand-700 shadow-lg shadow-brand-200 disabled:opacity-60 transition">
            <LogIn size={17} /> {t('auth.login_title')}
          </button>
        </form>

        <p className="text-center text-sm text-slate-400 mt-5">
          {t('auth.no_account')}{' '}
          <Link to="/register" className="font-bold text-brand-600 hover:text-brand-700">{t('auth.create_one')}</Link>
        </p>

        <div className="mt-6 bg-slate-50 rounded-2xl p-4 text-xs text-slate-500 space-y-1.5">
          <p className="flex items-center gap-1.5 font-bold text-slate-600"><Info size={13} /> {t('auth.demo_title')}</p>
          <p dir="ltr" className="text-start">{t('auth.demo_admin')}</p>
          <p dir="ltr" className="text-start">{t('auth.demo_user')}</p>
        </div>
      </div>
    </div>
  );
}
