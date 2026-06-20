import path from "path";
import { E2CConfig, LanguagePack } from "../../types";
import { createLogger, Logger } from "../../utils/logger";
import { copyFolder, writeJSON } from "../../utils/file-utils";
import { loadLanguagePack } from "../../utils/lang-loader";
import { getConfigSync } from "../config-engine";
import { ConvertOptions } from "../convert-engine";

const t: LanguagePack = loadLanguagePack(getConfigSync('lang') || 'zh');

export async function copyFiles(options: ConvertOptions, projectPath: string, outputPath: string, config: E2CConfig){
    const logger: Logger = createLogger({ verbose: options.verbose || false });
    logger.info(t.convert.stage.copy);
    const assetsPath = path.join(__dirname, '../../../assets');
    const nodejsPath = path.join(outputPath, 'public/nodejs');

    logger.debug('copy assets...');
    await copyFolder(assetsPath, outputPath, (src) => {
        logger.debug('copy: ' + src);
        return true;
    });
    logger.debug('copy project...');
    await copyFolder(projectPath, nodejsPath, (src) => {
        if (!src.startsWith(outputPath) && !src.includes('node_modules') && !src.includes('e2c.config') && !src.includes('.git')){
            logger.debug('copy: ' + src);
            return true;
        }
        return false;
    });
    const capConfig = {
        appId: config.appId||'com.myapp.mobile',
        appName: config.projectName||'myapp',
        webDir: 'dist'
    }
    await writeJSON(path.join(outputPath, 'capacitor.config.json'), capConfig);
    const packageJSON = {
        name: config.projectName||'myapp',
        version: '0.0.1',
        scripts: {
            dev: "vite",
            build: "vite build",
            preview: "vite preview"
        },
        dependencies: {
            "@capacitor/android": "^8.3.4",
            "@capacitor/ios": "^8.3.4",
            "@capacitor/cli": "^8.3.4",
            "@capacitor/core": "^8.3.4"
        },
        devDependencies: {
            "vite": "^8.0.12"
        }
    }
    await writeJSON(path.join(outputPath, 'package.json'), packageJSON);
}