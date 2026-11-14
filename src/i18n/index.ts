import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';
import ar from './ar.json';
import en from './en.json';

export type AppLang = 'ar' | 'en';

const STORAGE_KEY = 'souqna_lang';
const saved = localStorage.getItem(STORAGE_KEY) as AppLang | null;
const initial: AppLang = saved === 'en' || saved === 'ar' ? saved : 'ar';

i18n.use(initReactI18next).init({
  resources: {
    ar: {translation: ar},
    en: {translation: en},
  },
  lng: initial,
  fallbackLng: 'ar',
  interpolation: {escapeValue: false},
});

function applyDirection(lang: string): void {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.title = lang === 'ar' ? 'سوقنا | Souqna' : 'Souqna | سوقنا';
}

applyDirection(i18n.language);

i18n.on('languageChanged', (lng) => {
  applyDirection(lng);
  localStorage.setItem(STORAGE_KEY, lng);
});

export default i18n;
