import { LanguagePack } from '../types';

export type SupportLanguages = 'zh'|'en'

export { LanguagePack }

export function loadLanguagePack(lang: SupportLanguages): LanguagePack {
  return require('../lang/' + lang);
}