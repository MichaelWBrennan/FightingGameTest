export type LocaleDict = Record<string, string>;

export class I18nService {
  private dict: LocaleDict = {};
  private locale = 'en';
  private rtlLocales = new Set(['ar', 'he', 'fa', 'ur']);

  async load(locale: string): Promise<void> {
    this.locale = locale;
    try {
      const r = await fetch(`/assets/i18n/${locale}.json`);
      if (!r.ok) return;
      this.dict = await r.json();
      // Apply direction and lang attributes
      try {
        const el = document.documentElement;
        if (el) { el.setAttribute('lang', locale); el.setAttribute('dir', this.rtlLocales.has(locale) ? 'rtl' : 'ltr'); }
      } catch {}
      // Notify listeners
      try { window.dispatchEvent(new CustomEvent('i18n:changed', { detail: { locale } })); } catch {}
    } catch {}
  }

  t(key: string, fallback?: string): string {
    return this.dict[key] ?? fallback ?? key;
  }
}

