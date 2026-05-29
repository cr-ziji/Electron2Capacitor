import fs from 'fs-extra';
import { getGlobalConfigPath, readJSON, writeJSON, readJSONSync } from '../utils/file-utils';
import { isSupportLanguage } from '../utils/lang-loader';

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
  if (await fs.pathExists(globalPath)) {
    const globalConfig = await readJSON(globalPath);
    if (key) {
      const value = getNestedValue(globalConfig, key);
      return value !== undefined ? value : null;
    }
    return globalConfig;
  }
  return null;
}

export function getConfigSync(key: string): any {
  const globalPath = getGlobalConfigPath();
  if (fs.pathExistsSync(globalPath)) {
    const globalConfig = readJSONSync(globalPath);
    if (key) {
      const value = getNestedValue(globalConfig, key);
      return value !== undefined ? value : null;
    }
    return globalConfig;
  }
  return null;
}

export async function setConfig(key: string, value: any): Promise<boolean> {
  if (key === 'lang' && !isSupportLanguage(value)) {
    return false;
  }
  const globalPath = getGlobalConfigPath();
  let config: any = {};
  if (await fs.pathExists(globalPath)) {
    config = await readJSON(globalPath);
  }
  setNestedValue(config, key, value);
  await writeJSON(globalPath, config);
  return true;
}

export async function listConfig(): Promise<any> {
  const globalPath = getGlobalConfigPath();
  if (await fs.pathExists(globalPath)) {
    return await readJSON(globalPath);
  }
  return {};
}

export async function resetConfig(key?: string): Promise<boolean> {
  const globalPath = getGlobalConfigPath();
  if (key) {
    let config: any = {};
    if (await fs.pathExists(globalPath)) {
      config = await readJSON(globalPath);
    }
    deleteNestedValue(config, key);
    await writeJSON(globalPath, config);
  } else {
    if (await fs.pathExists(globalPath)) {
      await fs.remove(globalPath);
    }
  }
  return true;
}

export async function deleteConfig(key: string): Promise<boolean> {
  const globalPath = getGlobalConfigPath();
  if (await fs.pathExists(globalPath)) {
    let config = await readJSON(globalPath);
    deleteNestedValue(config, key);
    await writeJSON(globalPath, config);
  }
  return true;
}
