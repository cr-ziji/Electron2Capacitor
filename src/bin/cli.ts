#!/usr/bin/env node

import { program } from 'commander';

const packageJson = require('../../../package.json');

// 导入引擎模块
import { initializeProject } from '../core/init-engine';
import { checkProject } from '../core/check-engine';
import { convertProject } from '../core/convert-engine';
import { getConfig, setConfig, listConfig, resetConfig, deleteConfig } from '../core/config-engine';
import { createLogger } from '../utils/logger';

const logger = createLogger();

// ==================== init 命令 ====================
program
    .command('init')
    .description('创建配置文件')
    .option('-i, --in <path>', '输入目录路径')
    .option('-o, --out <path>', '输出目录路径')
    .option('-n, --name <name>', '应用名')
    .option('-a, --appid <id>', '应用id')
    .option('-t, --type <type>', '配置文件类型 (json|ts)', 'json')
    .action(async (options) => {
        try {
            await initializeProject(options)
        } catch (error) {
            logger.error('初始化失败:', error);
            process.exit(1);
        }
    });

// ==================== check 命令 ====================
program
    .command('check')
    .description('转换可行性检测')
    .option('-c, --config <path>', '读取配置（默认：/e2c.config.json或/e2c.config.ts）')
    .action(async (options) => {
        try {
            await checkProject(options);
        } catch (error) {
            logger.error('检测失败:', error);
            process.exit(1);
        }
    });

// ==================== convert 命令 ====================
program
    .command('convert')
    .description('转换项目')
    .option('-c, --config <path>', '转换配置（默认：/e2c.config.json或/e2c.config.ts）')
    .option('-f, --force', '覆盖输出目录')
    .option('-v, --verbose', '详细输出模式')
    .action(async (options) => {
        try {
            await convertProject(options);
        } catch (error) {
            logger.error('转换失败:', error);
            process.exit(1);
        }
    });

// ==================== config 命令组 ====================
const configCmd = program
    .command('config')
    .description('配置管理');

// config get
configCmd
    .command('get [key]')
    .description('获取配置值')
    .option('-g, --global', '只读取全局配置')
    .option('-p, --project', '只读取项目配置')
    .option('-j, --json', '以 JSON 格式输出')
    .action(async (key, options) => {
        try {
            await getConfig(key, options);
        } catch (error) {
            logger.error('获取配置失败:', error);
            process.exit(1);
        }
    });

// config set
configCmd
    .command('set <key> <value>')
    .description('设置配置值')
    .option('-g, --global', '设置到全局配置（默认）')
    .option('-p, --project', '设置到项目配置')
    .option('-f, --force', '强制覆盖，不提示确认')
    .action(async (key, value, options) => {
        try {
            await setConfig(key, value, options);
        } catch (error) {
            logger.error('设置配置失败:', error);
            process.exit(1);
        }
    });

// config list
configCmd
    .command('list')
    .description('列出所有配置')
    .option('-g, --global', '只显示全局配置')
    .option('-p, --project', '只显示项目配置')
    .option('-m, --merged', '显示合并后的最终配置（默认）')
    .option('-t, --table', '以表格形式显示（默认）')
    .option('-j, --json', '以 JSON 格式显示')
    .action(async (options) => {
        try {
            await listConfig(options)
        } catch (error) {
            logger.error('列出配置失败:', error);
            process.exit(1);
        }
    });

// config reset
configCmd
    .command('reset [key]')
    .description('重置配置为默认值')
    .option('-g, --global', '重置全局配置（默认）')
    .option('-p, --project', '重置项目配置')
    .option('-y, --yes', '跳过确认提示')
    .action(async (key, options) => {
        try {
            await resetConfig(key, options);
        } catch (error) {
            logger.error('重置配置失败:', error);
            process.exit(1);
        }
    });

// config delete
configCmd
    .command('delete <key>')
    .description('删除配置项')
    .option('-g, --global', '从全局配置删除（默认）')
    .option('-p, --project', '从项目配置删除')
    .action(async (key, options) => {
        try {
            await deleteConfig(key, options);
        } catch (error) {
            logger.error('删除配置失败:', error);
            process.exit(1);
        }
    });

// ==================== 全局选项 ====================
program.version(packageJson.version, '-v, --version', '显示版本号')

// ==================== 错误处理 ====================
program.on('command:*', () => {
    logger.error('未知命令，请使用 --help 查看可用命令');
    process.exit(1);
});

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
    logger.error('未捕获的异常:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason) => {
    logger.error('未处理的 Promise 拒绝:', reason);
    process.exit(1);
});

// ==================== 解析命令行参数 ====================
program.parse(process.argv);

// 如果没有提供任何命令，显示帮助信息
if (!process.argv.slice(2).length) {
    program.outputHelp();
}