import { Injectable, signal } from '@angular/core';
import { KioskLanguage, dictionaries } from './index';

export type { KioskLanguage };

@Injectable({ providedIn: 'root' })
export class TranslationService {
  private readonly language = signal<KioskLanguage>('en');
  readonly lang = this.language.asReadonly();

  setLanguage(lang: KioskLanguage): void {
    this.language.set(lang);
  }

  translate(key: string, params?: Record<string, string | number>): string {
    const dict = dictionaries[this.language()] ?? dictionaries.en;
    let text = dict[key];
    if (text === undefined) {
      text = dictionaries.en[key];
    }
    if (text === undefined) {
      return key;
    }
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replaceAll(`{{${k}}}`, String(v));
      }
    }
    return text;
  }
}