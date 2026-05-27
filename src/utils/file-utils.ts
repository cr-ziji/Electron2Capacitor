import fs from 'fs-extra';
import path from 'path';
import os from 'os';

export async function readJSON<T = any>(filePath: string): Promise<T> {
  const content = await fs.readFile.__promisify__(filePath, 'utf-8');
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

export async function writeProjectConfig(filePath: string, data: any): Promise<void> {
  await fs.ensureDir(path.dirname(filePath));
  const config = JSON.stringify(data, null, 2);
  await fs.writeFile(filePath, `const { defineConfig } = require('@e2c/e2c-cli')\n\nmodule.exports = defineConfig(${config})`, 'utf-8');
}

export function getGlobalConfigPath(): string {
  const homeDir = os.homedir();
  const e2cDir = path.join(homeDir, '.e2c');
  return path.join(e2cDir, 'config.json');
}

export function resolvePath(inputPath: string): string {
  if (path.isAbsolute(inputPath)) {
    return inputPath;
  }
  return path.join(process.cwd(), inputPath);
}
