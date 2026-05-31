import fs from 'fs-extra';
import { getGlobalConfigPath, readJSON, writeJSON, readJSONSync } from '../utils/file-utils';
import { isSupportLanguage } from '../utils/lang-loader';
import { loadLanguagePack, LanguagePack } from '../utils/lang-loader';
import { createLogger } from '../utils/logger';

const t: LanguagePack = loadLanguagePack(getConfigSync('lang') || 'zh');
const logger = createLogger({ verbose: false });

function fillTemplate(template: string, params: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(params[key] ?? ''));
}

function getNestedValue(obj: any, key: string): any {
  const parts = key.split('.');
  let current = obj;
  for (const part of parts) {
    if (current === undefined || current === null) {
      return undefined;
    }
    current = current[part];
  }
  return current;
}

function setNestedValue(obj: any, key: string, value: any): any {
  const parts = key.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!(parts[i] in current)) {
      current[parts[i]] = {};
    }
    current = current[parts[i]];
  }
  current[parts[parts.length - 1]] = value;
  return obj;
}

function deleteNestedValue(obj: any, key: string): boolean {
  const parts = key.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!(parts[i] in current)) {
      return false;
    }
    current = current[parts[i]];
  }
  return delete current[parts[parts.length - 1]];
}

export async function getConfig(key: string): Promise<any> {
  const globalPath = getGlobalConfigPath();
  logger.info(fillTemplate(t.config.readingPath, { path: globalPath }));

  if (await fs.pathExists(globalPath)) {
    const globalConfig = await readJSON(globalPath);
    if (key) {
      const value = getNestedValue(globalConfig, key);
      if (value !== undefined) {
        logger.success(fillTemplate(t.config.keyFound, { key, value: JSON.stringify(value) }));
        return value;
      }
      logger.warn(fillTemplate(t.config.keyNotFound, { key }));
      return null;
    }
    logger.success(t.config.returnFull);
    return globalConfig;
  }

  logger.warn(t.config.fileNotExist);
  return null;
}

export function getConfigSync(key: string): any {
  const globalPath = getGlobalConfigPath();

  if (fs.pathExistsSync(globalPath)) {
    const globalConfig = readJSONSync(globalPath);
    if (key) {
      const value = getNestedValue(globalConfig, key);
      if (value !== undefined) {
        return value;
      }
      return null;
    }
    return globalConfig;
  }

  return null;
}

export async function setConfig(key: string, value: any): Promise<boolean> {
  if (key === 'lang' && !isSupportLanguage(value)) {
    logger.error(fillTemplate(t.config.unsupportedLang, { lang: value }));
    return false;
  }

  const globalPath = getGlobalConfigPath();
  logger.info(fillTemplate(t.config.settingKey, { key }));

  let config: any = {};
  if (await fs.pathExists(globalPath)) {
    config = await readJSON(globalPath);
  }

  setNestedValue(config, key, value);
  await writeJSON(globalPath, config);
  logger.success(fillTemplate(t.config.set.success, { key }));
  return true;
}

export async function listConfig(): Promise<any> {
  const globalPath = getGlobalConfigPath();
  logger.info(t.config.listing);

  if (await fs.pathExists(globalPath)) {
    const config = await readJSON(globalPath);
    logger.success(fillTemplate(t.config.foundItems, { count: Object.keys(config).length }));
    return config;
  }

  logger.warn(t.config.list.empty);
  return {};
}

export async function resetConfig(key?: string): Promise<boolean> {
  const globalPath = getGlobalConfigPath();

  if (key) {
    logger.info(fillTemplate(t.config.resettingKey, { key }));
    let config: any = {};
    if (await fs.pathExists(globalPath)) {
      config = await readJSON(globalPath);
    }
    const deleted = deleteNestedValue(config, key);
    if (deleted) {
      await writeJSON(globalPath, config);
      logger.success(fillTemplate(t.config.keyReset, { key }));
    } else {
      logger.warn(fillTemplate(t.config.keyNotFoundReset, { key }));
    }
  } else {
    logger.info(t.config.resettingAll);
    if (await fs.pathExists(globalPath)) {
      await fs.remove(globalPath);
      logger.success(t.config.fileRemoved);
    } else {
      logger.warn(t.config.fileNotExistReset);
    }
  }

  return true;
}

export async function deleteConfig(key: string): Promise<boolean> {
  const globalPath = getGlobalConfigPath();
  logger.info(fillTemplate(t.config.deletingKey, { key }));

  if (await fs.pathExists(globalPath)) {
    const config = await readJSON(globalPath);
    const deleted = deleteNestedValue(config, key);
    if (deleted) {
      await writeJSON(globalPath, config);
      logger.success(fillTemplate(t.config.keyDeleted, { key }));
    } else {
      logger.warn(fillTemplate(t.config.keyNotFoundDelete, { key }));
    }
  } else {
    logger.warn(t.config.fileNotExistDelete);
  }

  return true;
}
