#!/usr/bin/env node

import { program } from 'commander';

const packageJson = require('../../../package.json');

import { initializeProject } from '../core/init-engine';
import { checkProject } from '../core/check-engine';
import { convertProject } from '../core/convert-engine';
import { getConfig, setConfig, listConfig, resetConfig, deleteConfig } from '../core/config-engine';
import { createLogger, Logger } from '../utils/logger';
import { loadLanguagePack, LanguagePack } from '../utils/lang-loader';

const logger: Logger = createLogger();
const lang: LanguagePack = loadLanguagePack('zh');

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
    .option('-g, --global', lang.cli.config.get.options.global)
    .option('-p, --project', lang.cli.config.get.options.project)
    .option('-j, --json', lang.cli.config.get.options.json)
    .action(async (key, options) => {
        try {
            await getConfig(key, options);
        } catch (error) {
            logger.error(`${lang.cli.config.get.error}:`, error);
            process.exit(1);
        }
    });

configCmd
    .command('set <key> <value>')
    .description(lang.cli.config.set.description)
    .option('-g, --global', lang.cli.config.set.options.global, true)
    .option('-p, --project', lang.cli.config.set.options.project)
    .option('-f, --force', lang.cli.config.set.options.force)
    .action(async (key, value, options) => {
        try {
            await setConfig(key, value, options);
        } catch (error) {
            logger.error(`${lang.cli.config.set.error}:`, error);
            process.exit(1);
        }
    });

configCmd
    .command('list')
    .description(lang.cli.config.list.description)
    .option('-g, --global', lang.cli.config.list.options.global)
    .option('-p, --project', lang.cli.config.list.options.project)
    .option('-m, --merged', lang.cli.config.list.options.merged, true)
    .option('-t, --table', lang.cli.config.list.options.table, true)
    .option('-j, --json', lang.cli.config.list.options.json)
    .action(async (options) => {
        try {
            await listConfig(options)
        } catch (error) {
            logger.error(`${lang.cli.config.list.error}:`, error);
            process.exit(1);
        }
    });

configCmd
    .command('reset [key]')
    .description(lang.cli.config.reset.description)
    .option('-g, --global', lang.cli.config.reset.options.global, true)
    .option('-p, --project', lang.cli.config.reset.options.project)
    .option('-y, --yes', lang.cli.config.reset.options.yes)
    .action(async (key, options) => {
        try {
            await resetConfig(key, options);
        } catch (error) {
            logger.error(`${lang.cli.config.reset.error}:`, error);
            process.exit(1);
        }
    });

configCmd
    .command('delete <key>')
    .description(lang.cli.config.delete.description)
    .option('-g, --global', lang.cli.config.delete.options.global, true)
    .option('-p, --project', lang.cli.config.delete.options.project)
    .action(async (key, options) => {
        try {
            await deleteConfig(key, options);
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