import { en, TranslationDictionary } from './en';
import { fil } from './fil';

export type KioskLanguage = 'en' | 'fil';

export const dictionaries: Record<KioskLanguage, TranslationDictionary> = {
  en,
  fil
};