import path from 'path';
import fs from 'fs-extra';
import { confirm } from '@inquirer/prompts';
import { LanguagePack, StageResult, ExitCode, E2CConfig } from '../types';
import { createLogger, Logger } from '../utils/logger';
import { ensureDirectory, getProjectConfig } from '../utils/file-utils';
import { loadPlugins } from './plugin/loader';
import { loadLanguagePack } from "../utils/lang-loader";
import { getConfigSync } from "./config-engine";
import { copyFiles } from './stages/file-copy';
// import { transformCode } from './stages/code-transform';
// import { adaptConfig } from './stages/config-adapter';

export interface ConvertOptions {
  config?: string;
  force?: boolean;
  verbose?: boolean;
}

// @ts-ignore
const t: LanguagePack = loadLanguagePack(getConfigSync('lang') || 'zh');

export async function convertProject(options: ConvertOptions): Promise<boolean> {
  const logger: Logger = createLogger({ verbose: options.verbose || false });

  let config: E2CConfig;
  try {
    config = await getProjectConfig(options.config);
  }
  catch (err){
    logger.error(t.errors.configNotFound, err);
    process.exit(ExitCode.configError);
  }

  const projectPath = path.resolve(config.electronProjectPath);
  const outputPath = path.resolve(config.outputPath);

  if (!await fs.pathExists(projectPath)) {
    logger.error(t.errors.projectNotFound);
    process.exit(ExitCode.configError);
  }

  if (await fs.pathExists(outputPath) && (await fs.readdir(outputPath)).length > 0) {
    if (!options.force) {
      options.force = await confirm({ message: t.convert.exits });
    }
    if (options.force) {
      await fs.remove(outputPath);
    }
    else {
      return false;
    }
  }

  await ensureDirectory(outputPath);

  logger.info(t.convert.title);
  logger.info(t.convert.converting);

  const plugins = await loadPlugins(config);
  const results: StageResult[] = [];

  const stage1Start = Date.now();
  try {
    await copyFiles(options, projectPath, outputPath, config);
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
    // await transformCode(outputPath, plugins, logger);
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
    // await adaptConfig(outputPath, config, plugins, logger);
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
