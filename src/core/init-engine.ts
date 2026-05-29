import path from 'path';
import fs from 'fs-extra';
import { E2CConfig } from '../types';
import { input, select } from '@inquirer/prompts';
import { writeProjectConfig, resolvePath } from '../utils/file-utils';
import { createLogger, Logger } from '../utils/logger';
import { loadLanguagePack, LanguagePack } from '../utils/lang-loader';
import { getConfigSync } from "./config-engine";

// @ts-ignore
const t: LanguagePack = loadLanguagePack(getConfigSync('lang') || 'zh');

export interface InitOptions {
  in?: string;
  out?: string;
  name?: string;
  appid?: string;
  type?: string;
  default?: boolean;
}

export async function initializeProject(options: InitOptions): Promise<boolean> {
  const logger: Logger = createLogger();

  logger.info(t.init.title);
  logger.info(t.init.description);

  const defaultProjectPath: string = options.in||'./';
  const projectPath: string = options.default ? defaultProjectPath : await input({
    message: t.init.prompts.projectPath,
    default: defaultProjectPath,
    prefill: options.in?'editable':'tab'
  });
  const projectPathResolved: string = resolvePath(projectPath);
  if (!await fs.pathExists(projectPathResolved)) {
    logger.error(t.errors.projectNotFound);
    return false;
  }
  let projectPackage = { name: undefined };
  if (await fs.pathExists(path.join(projectPathResolved, 'package.json'))){
    projectPackage = require(path.join(projectPathResolved, 'package.json'))
  }

  const defaultOutputPath: string = options.out||'./output';
  const outputPath: string = options.default ? defaultOutputPath : await input({
    message: t.init.prompts.outputPath,
    default: defaultOutputPath,
    prefill: options.out?'editable':'tab'
  });

  const defaultProjectName: string = options.name||projectPackage.name||'myapp';
  const projectName: string = options.default ? defaultProjectName : await input({
    message: t.init.prompts.projectName,
    default: defaultProjectName,
    prefill: options.name?'editable':'tab'
  });

  const defaultAppId: string = options.appid||(projectPackage.name&&`com.${projectPackage.name}.mobile`)||'com.myapp.mobile';
  const appId: string = options.default ? defaultAppId : await input({
    message: t.init.prompts.appId,
    default: defaultAppId,
    prefill: options.appid?'editable':'tab'
  });

  const defaultConfigType: string = options.type||'ts';
  const configType: string = options.default ? defaultConfigType : await select({
    message: t.init.prompts.configType,
    choices: [
      { name: 'javascript', value: 'js' },
      { name: 'typescript', value: 'ts' },
    ],
    // @ts-ignore
    default: defaultConfigType,
  });

  const config: E2CConfig = {
    electronProjectPath: projectPath,
    outputPath,
    projectName,
    appId
  };

  const configPath: string = path.join(process.cwd(), `e2c.config.${configType}`);
  await writeProjectConfig(configPath, config);

  logger.success(t.init.success);
  logger.info(`${t.init.configCreated}: ${configPath}`);

  return true;
}
