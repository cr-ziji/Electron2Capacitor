import fs from 'fs-extra';
import path from 'path';
import os from 'os';

export async function readJSON<T = any>(filePath: string): Promise<T> {
  const content = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(content);
}

export async function writeJSON(filePath: string, data: any): Promise<void> {
  await fs.ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export async function copyDirectory(src: string, dest: string): Promise<void> {
  await fs.copy(src, dest, { overwrite: true });
}

export async function ensureDirectory(dirPath: string): Promise<void> {
  await fs.ensureDir(dirPath);
}

export async function readConfig<T = any>(filePath: string): Promise<T | null> {
  if (!await fs.pathExists(filePath)) {
    return null;
  }
  return readJSON<T>(filePath);
}

export async function writeConfig(filePath: string, data: any): Promise<void> {
  await writeJSON(filePath, data);
}

export function getGlobalConfigPath(): string {
  const homeDir = os.homedir();
  const e2cDir = path.join(homeDir, '.e2c');
  return path.join(e2cDir, 'config.json');
}
