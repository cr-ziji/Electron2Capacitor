import path from 'path';
import fs from 'fs-extra';
import chalk from 'chalk';
import { E2CConfig, LanguagePack, ExitCode } from '../types';
import { createLogger, Logger } from '../utils/logger';
import { loadPlugins } from './plugin/loader';
import { readConfig } from '../utils/file-utils';

export interface CheckOptions {
  config?: string;
  verbose?: boolean;
  lang: LanguagePack;
}

export interface CheckResult {
  viable: boolean;
  score: number;
  issues: Array<{ api: string; status: 'compatible' | 'incompatible' | 'warning'; message: string }>;
}

export async function checkProject(options: CheckOptions): Promise<CheckResult> {
  const logger = createLogger({ verbose: options.verbose || false });
  const t = options.lang;

  const configPath = options.config || path.join(process.cwd(), 'e2c.config.json');
  const config = await readConfig<E2CConfig>(configPath);

  if (!config) {
    logger.error(t.errors.configNotFound);
    process.exit(ExitCode.configError);
  }

  logger.info(t.check.title);
  logger.info(t.check.checking);

  const plugins = await loadPlugins(config);
  const issues: Array<{ api: string; status: 'compatible' | 'incompatible' | 'warning'; message: string }> = [];
  let score = 100;

  for (const plugin of plugins) {
    if (plugin.checkViable) {
      for (const [key, value] of Object.entries(plugin.checkViable)) {
        if (typeof value === 'boolean') {
          if (!value) {
            score -= 20;
            issues.push({ api: plugin.name, status: 'incompatible', message: `${key} is not viable` });
          }
        } else {
          if (!value.solved) {
            score -= 10;
            issues.push({ api: plugin.name, status: 'warning', message: value.message });
          }
        }
      }
    }

    if ('packageName' in plugin) {
      const pkgPlugin = plugin as any;
      if (pkgPlugin.api) {
        const apis = pkgPlugin.apis || [];
        for (const api of apis) {
          if (plugin.checkViable && plugin.checkViable[api] === false) {
            issues.push({ api, status: 'incompatible', message: `${api} needs migration` });
            score -= 15;
          }
        }
      }
    }
  }

  score = Math.max(0, score);

  logger.info(`${t.check.score}: ${chalk.bold(score.toString())}%`);

  const compatible = issues.filter(i => i.status === 'compatible');
  const incompatible = issues.filter(i => i.status === 'incompatible');
  const warnings = issues.filter(i => i.status === 'warning');

  if (compatible.length > 0) {
    logger.info(t.check.compatible);
    compatible.forEach(i => logger.info(`  - ${i.api}: ${i.message}`));
  }

  if (incompatible.length > 0) {
    logger.warn(t.check.incompatible);
    incompatible.forEach(i => logger.warn(`  - ${i.api}: ${i.message}`));
  }

  if (warnings.length > 0) {
    logger.warn(t.check.warning);
    warnings.forEach(i => logger.warn(`  - ${i.api}: ${i.message}`));
  }

  const viable = score >= 60 && incompatible.length === 0;

  if (viable) {
    logger.success(t.check.viable);
  } else {
    logger.warn(t.check.notViable);
  }

  return { viable, score, issues };
}
