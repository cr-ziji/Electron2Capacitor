import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { E2CConfig } from "../types";

export async function readJSON<T = any>(filePath: string): Promise<T> {
  const content = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(content);
}

export function readJSONSync<T = any>(filePath: string): Promise<T> {
  const content = fs.readFileSync(filePath, 'utf-8');
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

export async function getProjectConfig(configPath?: string): Promise<E2CConfig> {
  if (configPath && !await fs.pathExists(configPath)) {
    throw new Error('Config file not found');
  }
  if (configPath){
    return require(configPath);
  }
  if (await fs.pathExists(path.join(process.cwd(), 'e2c.config.js'))){
    return require(path.join(process.cwd(), 'e2c.config.js'));
  }
  throw new Error('Config file not found');
}

export async function copyFolder(src: string, dest: string, filter: (src: string, dest: string) => boolean|Promise<boolean>) {
  await fs.ensureDir(dest);
  const items = await fs.readdir(src);
  for (const item of items) {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    if (!await filter(srcPath, destPath)) continue;
    const stat = await fs.stat(srcPath);
    if (stat.isDirectory()) {
      await copyFolder(srcPath, destPath, filter);
    } else {
      await fs.copy(srcPath, destPath);
    }
  }
}