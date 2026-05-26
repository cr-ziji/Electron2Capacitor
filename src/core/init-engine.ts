import path from 'path';
import fs from 'fs-extra';
import { E2CConfig } from '../types';
import { input, select } from '@inquirer/prompts';
import { writeProjectConfig, resolvePath } from '../utils/file-utils';
import { createLogger, Logger } from '../utils/logger';
import { loadLanguagePack, LanguagePack } from '../utils/lang-loader';

const t: LanguagePack = loadLanguagePack('zh');

export interface InitOptions {
  in?: string;
  out?: string;
  name?: string;
  appid?: string;
  type?: string;
  verbose?: boolean;
}

export async function initializeProject(options: InitOptions): Promise<boolean> {
  const logger: Logger = createLogger({ verbose: options.verbose || false });

  logger.info(t.init.title);
  logger.info(t.init.description);

  const projectPath = await input({
    message: t.init.prompts.projectPath,
    default: options.in||'./',
    prefill: options.in?'editable':'tab'
  });
  const projectPathResolved = resolvePath(projectPath);
  if (!await fs.pathExists(projectPathResolved)) {
    logger.error(t.errors.projectNotFound);
    return false;
  }
  const projectPackage = require(path.join(projectPathResolved, 'package.json'));

  const outputPath = await input({
    message: t.init.prompts.outputPath,
    default: options.out||'./output',
    prefill: options.out?'editable':'tab'
  });

  const projectName = await input({
    message: t.init.prompts.projectName,
    default: options.name||projectPackage.name||'my-mobile-app',
    prefill: options.name?'editable':'tab'
  });

  const appId = await input({
    message: t.init.prompts.appId,
    default: options.appid||`com.${projectPackage.name}.mobile`||'com.example.myapp',
    prefill: options.appid?'editable':'tab'
  });

  const configType = await select({
    message: t.init.prompts.configType,
    choices: [
      { name: 'json', value: 'json' },
      { name: 'typescript', value: 'ts' },
    ],
    // @ts-ignore
    default: options.type||'json',
  });

  const config: E2CConfig = {
    electronProjectPath: projectPath,
    outputPath,
    projectName,
    appId
  };

  const configPath = path.join(process.cwd(), `e2c.config.${configType}`);
  await writeProjectConfig(configType, configPath, config);

  logger.success(t.init.success);
  logger.info(`${t.init.configCreated}: ${configPath}`);

  return true;
}
