import path from 'path';
import { E2CConfig } from '../types';
import { input, select } from '@inquirer/prompts';
import { ensureDirectory, writeConfig } from '../utils/file-utils';
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

  const projectPath = options.in || await input({
    message: t.init.prompts.projectPath,
    default: './electron-app',
  });

  const outputPath = options.out || await input({
    message: t.init.prompts.outputPath,
    default: './capacitor-app',
  });

  const projectName = options.name || await input({
    message: t.init.prompts.projectName,
    default: 'my-mobile-app',
  });

  const appId = options.appid || await input({
    message: t.init.prompts.appId,
    default: 'com.example.myapp',
  });

  const engine = options.type || await select({
    message: t.init.prompts.engine,
    choices: [
      { name: '@jadejr/capacitor-nodejs', value: 'capacitor-nodejs' },
      { name: 'nodejs-mobile-capacitor', value: 'nodejs-mobile' },
    ],
    default: 'capacitor-nodejs',
  });

  const config: E2CConfig = {
    electronProjectPath: projectPath,
    outputPath,
    projectName,
    appId,
    settings: {
      verbose: options.verbose || false,
    },
  };

  const configPath = path.join(process.cwd(), 'e2c.config.json');
  await ensureDirectory(path.dirname(configPath));
  await writeConfig(configPath, config);

  logger.success(t.init.success);
  logger.info(`${t.init.configCreated}: ${configPath}`);

  return true;
}
