#!/usr/bin/env node

import { program } from 'commander';

const packageJson = require('../../../package.json');

import { initializeProject } from '../core/init-engine';
import { checkProject } from '../core/check-engine';
import { convertProject } from '../core/convert-engine';
import { getConfig, setConfig, listConfig, resetConfig, deleteConfig, getConfigSync } from '../core/config-engine';
import { createLogger, Logger } from '../utils/logger';
import { loadLanguagePack, LanguagePack } from '../utils/lang-loader';

const logger: Logger = createLogger();
// @ts-ignore
const lang: LanguagePack = loadLanguagePack(getConfigSync('lang') || 'zh');

program
    .command('init')
    .description(lang.cli.init.description)
    .option('-i, --in <path>', lang.cli.init.options.projectPath)
    .option('-o, --out <path>', lang.cli.init.options.outputPath)
    .option('-n, --name <name>', lang.cli.init.options.projectName)
    .option('-a, --appid <id>', lang.cli.init.options.appId)
    .option('-t, --type <type>', `${lang.cli.init.options.configType}`, 'ts')
    .option('-d, --default', lang.cli.init.options.default)
    .action(async (options) => {
        try {
            if (options.type !== 'js' && options.type !== 'javascript' && options.type !== 'ts' && options.type !== 'typescript') {
                logger.error(`${lang.cli.init.error}: ${lang.errors.invalidType}`);
                process.exit(1);
            }
            if (options.type === 'typescript') options.type = 'ts';
            if (options.type === 'javascript') options.type = 'js';
            await initializeProject(options)
        } catch (error) {
            // @ts-ignore
            if (error.name === 'ExitPromptError') {
                process.exit(0);
            }
            logger.error(`${lang.cli.init.error}:`, error);
            process.exit(1);
        }
    });

program
    .command('check')
    .description(lang.cli.check.description)
    .option('-c, --config <path>', `${lang.cli.check.options.config}`)
    .action(async (options) => {
        try {
            await checkProject(options);
        } catch (error) {
            logger.error(`${lang.cli.check.error}:`, error);
            process.exit(1);
        }
    });

program
    .command('convert')
    .description(lang.cli.convert.description)
    .option('-c, --config <path>', lang.cli.convert.options.config)
    .option('-f, --force', lang.cli.convert.options.force)
    .option('-v, --verbose', lang.cli.convert.options.verbose)
    .action(async (options) => {
        try {
            await convertProject(options);
        } catch (error) {
            logger.error(`${lang.cli.convert.error}:`, error);
            process.exit(1);
        }
    });

const configCmd = program
    .command('config')
    .description(lang.cli.config.description)

configCmd
    .command('get [key]')
    .description(lang.cli.config.get.description)
    .action(async (key) => {
        try {
            logger.info(await getConfig(key));
        } catch (error) {
            logger.error(`${lang.cli.config.get.error}:`, error);
            process.exit(1);
        }
    });

configCmd
    .command('set <key> <value>')
    .description(lang.cli.config.set.description)
    .action(async (key, value) => {
        try {
            await setConfig(key, value);
        } catch (error) {
            logger.error(`${lang.cli.config.set.error}:`, error);
            process.exit(1);
        }
    });

configCmd
    .command('list')
    .description(lang.cli.config.list.description)
    .action(async () => {
        try {
            logger.info(await listConfig());
        } catch (error) {
            logger.error(`${lang.cli.config.list.error}:`, error);
            process.exit(1);
        }
    });

configCmd
    .command('reset [key]')
    .description(lang.cli.config.reset.description)
    .action(async (key) => {
        try {
            await resetConfig(key);
        } catch (error) {
            logger.error(`${lang.cli.config.reset.error}:`, error);
            process.exit(1);
        }
    });

configCmd
    .command('delete <key>')
    .description(lang.cli.config.delete.description)
    .action(async (key) => {
        try {
            await deleteConfig(key);
        } catch (error) {
            logger.error(`${lang.cli.config.delete.error}:`, error);
            process.exit(1);
        }
    });

program
    .name('e2c')
    .description(lang.cli.description)
    .version(packageJson.version, '-v, --version', lang.cli.version)

program.on('command:*', () => {
    logger.error(lang.errors.unknownCommand);
    process.exit(1);
});

program.parse(process.argv);

if (!process.argv.slice(2).length) {
    program.outputHelp();
}