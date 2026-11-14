import i18n from '@/i18n';

/**
 * All monetary values are integer minor units (halalas). Formatting is
 * locale-aware: "149.00 ر.س." in Arabic, "SAR 149.00" in English.
 */
export function formatMoney(minor: number, lang: string = i18n.language): string {
  const locale = lang === 'ar' ? 'ar-SA' : 'en-US';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(minor / 100);
}

export const FREE_SHIPPING_THRESHOLD = 50000; // 500 SAR
export const SHIPPING_FEE = 2500; // 25 SAR
