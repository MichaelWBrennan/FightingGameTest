export type LocaleDict = Record<string, string>;

export class I18nService {
  private dict: LocaleDict = {};
  private locale = 'en';

  async load(locale: string): Promise<void> {
    this.locale = locale;
    try {
      const r = await fetch(`/assets/i18n/${locale}.json`);
      if (!r.ok) return;
      this.dict = await r.json();
    } catch {}
  }

  t(key: string, fallback?: string): string {
    return this.dict[key] ?? fallback ?? key;
  }
}

