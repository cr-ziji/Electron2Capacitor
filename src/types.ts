export enum ExitCode {
  success = 0,
  error = 1,
  configError = 2,
  checkFailed = 3,
}

export interface FileInfo {
  path: string;
  relativePath: string;
  content?: string;
  encoding?: BufferEncoding;
}

export interface FileAction {
  action: 'copy' | 'skip' | 'transform' | 'delete';
  content?: string;
  reason?: string;
}

export interface E2CPlugin {
  name: string;
  type: 'engine' | 'package' | 'content';
  version: string;
  enabled?: boolean;
  checkViable?: {
    [viableKey: string]: boolean | { solved: boolean; message: string };
  };
}

export interface NodejsEnginePlugin extends E2CPlugin {
  type: 'engine';
  engine: {
    name: string;
    version: string;
    downloadUrl?: string;
  };
  runtime: {
    initialize: (config: EngineConfig) => Promise<void>;
    startProject: (projectPath: string) => Promise<ProcessHandle>;
    bridge: {
      sendToNode: (message: any) => void;
      onFromNode: (callback: (message: any) => void) => void;
      sendToWeb: (message: any) => void;
      onFromWeb: (callback: (message: any) => void) => void;
    };
  };
  templates: {
    bridgeScript?: string;
    loaderScript?: string;
    configTemplate?: string;
  };
}

export interface PackagePlugin extends E2CPlugin {
  type: 'package';
  packageName?: string | string[];
  provide: object;
  apis?: string[];
  dependencies?: { [packageName: string]: string };
}

export interface ContentPlugin extends E2CPlugin {
  type: 'content';
  include?: string[];
  exclude?: string[];
  rules: ContentTransformRule[];
  transformers?: {
    beforeCopy?: (file: FileInfo) => Promise<FileAction>;
    onTransform?: (content: string, file: FileInfo) => Promise<string>;
    afterCopy?: (file: FileInfo) => Promise<void>;
  };
  astTransformers?: {
    [filePattern: string]: ASTTransformer;
  };
}

export interface ContentTransformRule {
  name: string;
  pattern: string | RegExp;
  replacement: string | ((match: string, ...args: any[]) => string);
  files?: string[];
  type: 'string' | 'regex' | 'function';
}

export interface ASTTransformer {
  transform: (ast: any, filePath: string) => any;
  language: 'javascript' | 'typescript' | 'html' | 'css';
}

export interface EngineConfig {
  engineName: string;
  version: string;
  projectPath: string;
}

export interface ProcessHandle {
  pid: number;
  kill: () => Promise<void>;
  onExit: (callback: (code: number) => void) => void;
}

export interface E2CConfig {
  electronProjectPath: string;
  outputPath: string;
  projectName: string;
  appId: string;
  settings?: {
    verbose?: boolean;
    [key: string]: any;
  };
  nodejs?: {
    engine?: NodejsEnginePlugin;
    packages?: { [packageName: string]: PackagePlugin };
  };
  content?: {
    AST?: ContentPlugin[];
  };
  plugins?: E2CPlugin[];
}

export interface StageResult {
  name: string;
  status: 'success' | 'error' | 'skipped';
  duration: number;
  filesProcessed?: number;
  error?: string;
}

export interface PluginLoader {
  loadPlugins: (config: E2CConfig) => Promise<E2CPlugin[]>;
  mergePluginConfigs: (plugins: E2CPlugin[]) => E2CPlugin[];
}

export interface TranslationMap {
  [key: string]: string | TranslationMap;
}

export interface LanguagePack {
  cli: {
    description: string;
    version: string;
    init: {
      description: string;
      error: string;
      options: {
        projectPath: string;
        outputPath: string;
        projectName: string;
        appId: string;
        configType: string;
        default: string;
      };
    };
    check: {
      description: string;
      error: string;
      options: {
        config: string;
      };
    };
    convert: {
      description: string;
      error: string;
      options: {
        config: string;
        force: string;
        verbose: string;
      };
    };
    config: {
      description: string;
      get: {
        description: string;
        error: string;
      };
      set: {
        description: string;
        error: string;
      };
      list: {
        description: string;
        error: string;
      };
      reset: {
        description: string;
        error: string;
      };
      delete: {
        description: string;
        error: string;
      };
    };
  };
  init: {
    title: string;
    description: string;
    prompts: {
      projectPath: string;
      outputPath: string;
      projectName: string;
      appId: string;
      configType: string;
    };
    success: string;
    configCreated: string;
  };
  check: {
    title: string;
    description: string;
    checking: string;
    compatible: string;
    incompatible: string;
    warning: string;
    score: string;
    result: string;
    viable: string;
    notViable: string;
  };
  convert: {
    title: string;
    description: string;
    converting: string;
    stage: string;
    complete: string;
    outputDir: string;
    filesProcessed: string;
  };
  config: {
    title: string;
    readingPath: string;
    keyFound: string;
    keyNotFound: string;
    returnFull: string;
    fileNotExist: string;
    unsupportedLang: string;
    settingKey: string;
    listing: string;
    foundItems: string;
    resettingKey: string;
    keyReset: string;
    keyNotFoundReset: string;
    resettingAll: string;
    fileRemoved: string;
    fileNotExistReset: string;
    deletingKey: string;
    keyDeleted: string;
    keyNotFoundDelete: string;
    fileNotExistDelete: string;
    get: {
      description: string;
      notFound: string;
    };
    set: {
      description: string;
      success: string;
    };
    list: {
      description: string;
      empty: string;
      globalHeader: string;
      projectHeader: string;
      mergedHeader: string;
    };
    reset: {
      description: string;
      success: string;
      confirm: string;
    };
    delete: {
      description: string;
      success: string;
      confirm: string;
    };
  };
  errors: {
    general: string;
    configNotFound: string;
    configInvalid: string;
    projectNotFound: string;
    pathNotFound: string;
    permissionDenied: string;
    transformFailed: string;
    copyFailed: string;
    pluginLoadFailed: string;
    invalidKey: string;
    unknownCommand: string;
    invalidType: string;
  };
  common: {
    error: string;
    warn: string;
    info: string;
    success: string;
    processing: string;
    done: string;
    loading: string;
    confirming: string;
  };
}
