import path from 'path';
import fs from 'fs-extra';
import { E2CConfig, LanguagePack, StageResult, ExitCode } from '../types';
import { createLogger, Logger } from '../utils/logger';
import { readConfig, ensureDirectory } from '../utils/file-utils';
import { loadPlugins } from './plugin/loader';
import { copyFiles } from './stages/file-copy';
import { transformCode } from './stages/code-transform';
import { adaptConfig } from './stages/config-adapter';

export interface ConvertOptions {
  config?: string;
  force?: boolean;
  verbose?: boolean;
  lang: LanguagePack;
}

export async function convertProject(options: ConvertOptions): Promise<boolean> {
  const logger = createLogger({ verbose: options.verbose || false });
  const t = options.lang;

  const configPath = options.config || path.join(process.cwd(), 'e2c.config.json');
  const config = await readConfig<E2CConfig>(configPath);

  if (!config) {
    logger.error(t.errors.configNotFound);
    process.exit(ExitCode.configError);
  }

  const projectPath = path.resolve(config.electronProjectPath);
  const outputPath = path.resolve(config.outputPath);

  if (!await fs.pathExists(projectPath)) {
    logger.error(t.errors.projectNotFound);
    process.exit(ExitCode.configError);
  }

  if (await fs.pathExists(outputPath)) {
    if (!options.force) {
      logger.error(`Output directory exists. Use -f to force overwrite.`);
      process.exit(ExitCode.error);
    }
    await fs.remove(outputPath);
  }

  await ensureDirectory(outputPath);

  logger.info(t.convert.title);
  logger.info(t.convert.converting);

  const plugins = await loadPlugins(config);
  const results: StageResult[] = [];

  const stage1Start = Date.now();
  try {
    await copyFiles(projectPath, outputPath, plugins, logger);
    results.push({ name: 'File Copy', status: 'success', duration: Date.now() - stage1Start });
    logger.stage('File Copy', 'success');
  } catch (err: any) {
    results.push({ name: 'File Copy', status: 'error', duration: Date.now() - stage1Start, error: err.message });
    logger.stage('File Copy', 'error');
    logger.error(err.message);
    process.exit(ExitCode.error);
  }

  const stage2Start = Date.now();
  try {
    await transformCode(outputPath, plugins, logger);
    results.push({ name: 'Code Transform', status: 'success', duration: Date.now() - stage2Start });
    logger.stage('Code Transform', 'success');
  } catch (err: any) {
    results.push({ name: 'Code Transform', status: 'error', duration: Date.now() - stage2Start, error: err.message });
    logger.stage('Code Transform', 'error');
    logger.error(err.message);
    process.exit(ExitCode.error);
  }

  const stage3Start = Date.now();
  try {
    await adaptConfig(outputPath, config, plugins, logger);
    results.push({ name: 'Config Adapter', status: 'success', duration: Date.now() - stage3Start });
    logger.stage('Config Adapter', 'success');
  } catch (err: any) {
    results.push({ name: 'Config Adapter', status: 'error', duration: Date.now() - stage3Start, error: err.message });
    logger.stage('Config Adapter', 'error');
    logger.error(err.message);
    process.exit(ExitCode.error);
  }

  logger.success(t.convert.complete);
  logger.info(`${t.convert.outputDir}: ${outputPath}`);

  return true;
}
