import fs from 'fs-extra';
import { getGlobalConfigPath, readJSON, writeJSON, readConfig, writeConfig } from '../utils/file-utils';
import { E2CConfig, LanguagePack } from '../types';
import path from 'path';

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

export async function getConfig(key: string, options: { global?: boolean; project?: boolean; json?: boolean; lang: LanguagePack }): Promise<any> {
  if (options.global) {
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

  if (options.project) {
    const projectPath = path.join(process.cwd(), 'e2c.config.json');
    const projectConfig = await readConfig(projectPath);
    if (projectConfig) {
      if (key) {
        const value = getNestedValue(projectConfig, key);
        return value !== undefined ? value : null;
      }
      return projectConfig;
    }
    return null;
  }

  const globalPath = getGlobalConfigPath();
  const projectPath = path.join(process.cwd(), 'e2c.config.json');

  let globalConfig: any = {};
  let projectConfig: any = {};

  if (await fs.pathExists(globalPath)) {
    globalConfig = await readJSON(globalPath);
  }
  if (await fs.pathExists(projectPath)) {
    projectConfig = (await readConfig(projectPath)) || {};
  }

  const merged = { ...globalConfig, ...projectConfig };

  if (key) {
    const value = getNestedValue(merged, key);
    return value !== undefined ? value : null;
  }

  return merged;
}

export async function setConfig(key: string, value: any, options: { global?: boolean; project?: boolean; force?: boolean; lang: LanguagePack }): Promise<boolean> {
  const targetGlobal = options.global !== false && !options.project;
  const targetProject = options.project || !options.global;

  if (targetProject) {
    const projectPath = path.join(process.cwd(), 'e2c.config.json');
    let config: any = {};
    if (await fs.pathExists(projectPath)) {
      config = (await readConfig(projectPath)) || {};
    }
    setNestedValue(config, key, value);
    await writeConfig(projectPath, config);
    return true;
  }

  if (targetGlobal) {
    const globalPath = getGlobalConfigPath();
    let config: any = {};
    if (await fs.pathExists(globalPath)) {
      config = await readJSON(globalPath);
    }
    setNestedValue(config, key, value);
    await writeJSON(globalPath, config);
    return true;
  }

  return false;
}

export async function listConfig(options: { global?: boolean; project?: boolean; merged?: boolean; lang: LanguagePack }): Promise<any> {
  const globalPath = getGlobalConfigPath();
  const projectPath = path.join(process.cwd(), 'e2c.config.json');

  if (options.global && !options.project) {
    if (await fs.pathExists(globalPath)) {
      return await readJSON(globalPath);
    }
    return null;
  }

  if (options.project && !options.global) {
    if (await fs.pathExists(projectPath)) {
      return await readConfig(projectPath);
    }
    return null;
  }

  let globalConfig: any = {};
  let projectConfig: any = {};

  if (await fs.pathExists(globalPath)) {
    globalConfig = await readJSON(globalPath);
  }
  if (await fs.pathExists(projectPath)) {
    projectConfig = (await readConfig(projectPath)) || {};
  }

  if (options.merged !== false) {
    return { ...globalConfig, ...projectConfig };
  }

  return { global: globalConfig, project: projectConfig };
}

export async function resetConfig(key?: string, options: { global?: boolean; project?: boolean; yes?: boolean; lang: LanguagePack }): Promise<boolean> {
  const targetGlobal = options.global !== false && !options.project;
  const targetProject = options.project || !options.global;

  if (targetProject) {
    const projectPath = path.join(process.cwd(), 'e2c.config.json');
    if (key) {
      let config: any = {};
      if (await fs.pathExists(projectPath)) {
        config = (await readConfig(projectPath)) || {};
      }
      deleteNestedValue(config, key);
      await writeConfig(projectPath, config);
    } else {
      if (await fs.pathExists(projectPath)) {
        await fs.remove(projectPath);
      }
    }
    return true;
  }

  if (targetGlobal) {
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

  return false;
}

export async function deleteConfig(key: string, options: { global?: boolean; project?: boolean; lang: LanguagePack }): Promise<boolean> {
  const targetGlobal = options.global !== false && !options.project;
  const targetProject = options.project || !options.global;

  if (targetProject) {
    const projectPath = path.join(process.cwd(), 'e2c.config.json');
    if (await fs.pathExists(projectPath)) {
      let config = (await readConfig(projectPath)) || {};
      deleteNestedValue(config, key);
      await writeConfig(projectPath, config);
    }
    return true;
  }

  if (targetGlobal) {
    const globalPath = getGlobalConfigPath();
    if (await fs.pathExists(globalPath)) {
      let config = await readJSON(globalPath);
      deleteNestedValue(config, key);
      await writeJSON(globalPath, config);
    }
    return true;
  }

  return false;
}
