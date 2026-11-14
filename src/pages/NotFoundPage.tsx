import {useTranslation} from 'react-i18next';
import {Link} from 'react-router-dom';
import {Compass} from 'lucide-react';

export default function NotFoundPage() {
  const {t} = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center py-32 px-4 text-center fade-up">
      <span className="w-20 h-20 rounded-3xl bg-brand-50 text-brand-500 flex items-center justify-center mb-6">
        <Compass size={38} />
      </span>
      <h1 className="text-3xl font-extrabold text-slate-900">{t('notfound.title')}</h1>
      <p className="text-slate-400 mt-2 mb-7">{t('notfound.sub')}</p>
      <Link to="/" className="h-11 px-6 rounded-xl bg-brand-600 text-white text-sm font-bold flex items-center hover:bg-brand-700 transition">
        {t('notfound.go_home')}
      </Link>
    </div>
  );
}
