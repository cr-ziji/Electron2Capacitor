import { LanguagePack } from '../types';

export type SupportLanguages = 'zh'|'en'

export function isSupportLanguage(value: string): value is SupportLanguages {
  return value === 'zh' || value === 'en'
}

export { LanguagePack }

export function loadLanguagePack(lang: SupportLanguages): LanguagePack {
  return require('../lang/' + lang);
}