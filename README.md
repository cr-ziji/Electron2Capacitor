# e2c CLI 工具总体设计文档

## 1. 项目概述

e2c (Electron to Capacitor) 是一个用于快速将 Electron 项目转换为 Capacitor 移动端项目的命令行工具。

### 1.1 项目目标

- 自动化 Electron 到 Capacitor 的转换过程
- 保留原有代码的功能完整性
- 使用 Node.js Mobile 作为后端引擎
- 提供简洁易用的 CLI 接口

### 1.2 核心特性

- 文件复制与转换
- Electron 特定代码到 Capacitor 的适配
- 配置文件生成与转换
- 自定义映射规则文件支持

---

## 2. 总体架构设计

### 2.1 分层架构

```
┌─────────────────────────────────────────┐
│         CLI 命令层 (Command Layer)       │
│  - e2c init                             │
│  - e2c check                           │
│  - e2c convert                          │
│  - e2c config                           │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│       转换引擎层 (Conversion Engine)     │
│  - 阶段管理器                            │
│  - 转换规则引擎                          │
│  - 文件处理器                            │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│        核心功能层 (Core Services)        │
│  - 文件操作服务                          │
│  - 代码转换服务                          │
│  - 依赖管理服务                          │
│  - 配置生成服务                          │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│      底层工具层 (Utilities Layer)        │
│  - 文件系统工具                          │
│  - AST 解析器                            │
│  - 模板引擎                              │
│  - 日志系统                              │
└─────────────────────────────────────────┘
```

### 2.2 转换流程阶段

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   阶段1      │ →  │   阶段2       │ →  │   阶段3      │
│  复制文件     │    │  代码转换     │    │  配置适配    │
└──────────────┘    └──────────────┘    └──────────────┘
```

### 2.3 插件结构

```
┌─────────────────────────────────────────────────────────────┐
│                        插件系统                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────┐  │
│  │ Node.js引擎插件   │  │ 依赖包插件        │  │ 内容转换  │  │
│  │                  │  │                  │  │ 插件      │  │
│  │ - 提供后端运行环境 │  │ - 管理npm包映射  │  │ - AST转换  │  │
│  │ - 定义通信桥接    │  │ - 处理包依赖      │  │ - 代码替换 │  │
│  │ - 处理进程生命周期 │  │ - API兼容层      │  │ - 文件过滤 │  │
│  └──────────────────┘  └──────────────────┘  └───────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. API 设计

### 3.1 CLI 命令接口

#### 3.1.1 `e2c init`

创建配置文件

```bash
e2c init [options]
```

**选项:**

- `-i, --in <path>` - 输入目录路径
- `-o, --out <path>` - 输出目录路径
- `-n, --name <name>` - 应用名
- `-a, --appid <id>` - 应用id
- `-t, --type <type>` - 配置文件类型
- `-d, --default` - 使用默认配置

#### 3.1.2 `e2c check`

转换可行性检测

```bash
e2c check [options]
```

**选项:**

- `-c, --config <path>` - 读取配置（默认：`/e2c.config.json`或`/e2c.config.ts`）

#### 3.1.3 `e2c convert`

转换项目

```bash
e2c convert [options]
```

**选项:**

- `-c, --config <path>` - 转换配置（默认：`/e2c.config.json`或`/e2c.config.ts`）
- `-f, --force` - 覆盖输出目录
- `-v, --verbose` - 详细输出模式

#### 3.1.4 `e2c config`

配置管理

```bash
e2c config [command] [options]
```

**层级:**

```
全局配置 (~/.e2c/config.json)
↓ (继承)
项目配置 (./e2c.config.json)
↓ (覆盖)
命令行参数 (--flag)
```

**全局配置文件路径:**

| 平台 | 全局配置路径 |
| ---- | ------------ |
| Linux | ~/.e2c/config.json |
| macOS | ~/.e2c/config.json |
| Windows | %USERPROFILE%\.e2c\config.json |

**子命令:**

###### 1. `e2c config get`

获取配置值

```bash
e2c config get [key] [options]
```

参数：

- `key` - 配置键名

**选项:**

- `-g, --global` - 只读取全局配置
- `-p, --project` - 只读取项目配置
- `-j, --json` - 以 JSON 格式输出

###### 2. `e2c config set`

设置配置值

```bash
e2c config set <key> <value> [options]
```

参数：

- `key` - 配置键名（支持点号分隔）
- `value` - 配置值（字符串、数字、JSON 对象）

**选项:**

- `-g, --global` - 设置到全局配置（默认）
- `-p, --project` - 设置到项目配置
- `-f, --force` - 强制覆盖，不提示确认

###### 3. `e2c config list`

列出所有配置

```bash
e2c config list [options]
```

**选项:**

- `-g, --global` - 只显示全局配置
- `-p, --project` - 只显示项目配置
- `-m, --merged` - 显示合并后的最终配置（默认）
- `-t, --table` - 以表格形式显示（默认）
- `-j, --json` - 以 JSON 格式显示

###### 4. `e2c config reset`

重置配置为默认值

```bash
e2c config reset [key] [options]
```

参数：

- `key` - 要重置的配置键（可选，不指定则重置所有）

**选项:**

- `-g, --global` - 重置全局配置（默认）
- `-p, --project` - 重置项目配置
- `-y, --yes` - 跳过确认提示

###### 5. `e2c config delete`

删除配置项

```bash
e2c config delete <key> [options]
```

参数：

- `key` - 要删除的配置键

**选项:**

- `-g, --global` - 从全局配置删除（默认）
- `-p, --project` - 从项目配置删除

### 3.2 退出码

| 退出码 | 说明 |
|--------|------|
| 0 | 执行成功 |
| 1 | 一般错误 |
| 2 | 配置错误 |
| 3 | 可行性检查失败 |

## 4. 资源文件设计

### 4.1 项目结构

```
e2c/
├── assets/                       # 静态资源-模拟桌面环境
│   ├── index.html
│   ├── src/
│   │   ├── main.ts
│   │   └── style.css
│   └── public/
│       └── nodejs
│           ├── loader.ts
│           └── main.ts
├── src/
│   ├── bin/
│   │   └── cli.ts                # CLI 入口文件
│   ├── core/                     # 转换引擎
│   │   ├── stages/               # 转换阶段
│   │   │   ├── file-copy.ts
│   │   │   ├── code-transform.ts
│   │   │   └── config-adapter.ts
│   │   ├── transformers/         # 转换器
│   │   │   ├── main-process-transformer.ts
│   │   │   └── renderer-process-transformer.ts
│   │   ├── plugin/               # 加载插件
│   │   │   └── loader.ts
│   │   ├── init-engine.ts
│   │   ├── check-engine.ts
│   │   ├── convert-engine.ts
│   │   └── config-engine.ts
│   ├── lang/                      # 语言包
│   │   ├── en.json
│   │   └── zh.json
│   ├── utils/                     # 工具函数
│   │   ├── logger.ts
│   │   ├── ast-parser.ts
│   │   └── file-utils.ts
│   ├── index.ts
│   └── types.ts
├── plugins/                      # 默认插件
│   ├── capacitorNodejs.ts
│   ├── nodejsMobileCapacitor.ts
│   ├── electron.ts
│   └── contentAST.ts
├── scripts/                      # 脚本文件
│   └── build-assets.ts           # 构建 assets 的脚本
├── test/                         # 测试capacitor应用
├── dist/                         # ts构建目录
├── examples/                     # 示例项目
├── package.json
├── tsconfig.json
└── README.md
```

### 4.2 配置文件设计

#### 4.2.1 e2c.config.json (项目配置)

```json
{
  "electronProjectPath": "./electron-app",
  "outputPath": "./capacitor-app",
  "projectName": "my-mobile-app",
  "appId": "com.example.myapp",
  "settings": {
    "verbose": false
  }
}
```

#### 4.2.2 e2c.config.ts (项目配置)

```typescript
// vite.config.ts
import { defineConfig, defaultPlugins } from '@e2c/e2c-cli'

export default defineConfig({
    "electronProjectPath": "./electron-app",
    "outputPath": "./capacitor-app",
    "projectName": "my-mobile-app",
    "appId": "com.example.myapp",
    "settings": {
        "verbose": boolean
    },
    "nodejs": {
        "engine": defaultPlugins.capacitorNodejs({ version: "latest" }),
        "packages": {
            "electron": defaultPlugins.electron()
        }
    },
    "content": {
        "AST": [
            defaultPlugins.contentAST()
        ]
    }
})
```

## 5. 接口转换插件配置

### 5.1 基础插件接口配置

```typescript
interface E2CPlugin {
    name: string;
    type: 'engine' | 'package' | 'content';
    version: string;
    enabled?: boolean;

    // 可行性检查
    checkViable?: { 
        [viableKey: string]: boolean|{ solved: boolean, message: string };
    };
}
```

### 5.2 Node.js 引擎插件配置

```typescript
interface NodejsEnginePlugin extends E2CPlugin {
  type: 'engine';
  
  // 引擎配置
  engine: {
    name: '@jadejr/capacitor-nodejs' | string;
    version: string;
    downloadUrl?: string;  // 引擎下载地址
  };
  
  // 运行时 API
  runtime: {
    // 初始化引擎
    initialize: (config: EngineConfig) => Promise<void>;
    
    // 启动 Node.js 项目
    startProject: (projectPath: string) => Promise<ProcessHandle>;
    
    // 通信桥接
    bridge: {
      sendToNode: (message: any) => void;
      onFromNode: (callback: (message: any) => void) => void;
      sendToWeb: (message: any) => void;
      onFromWeb: (callback: (message: any) => void) => void;
    };
  };
  
  // 生成的文件模板
  templates: {
    bridgeScript?: string;     // 桥接脚本内容
    loaderScript?: string;     // 加载器脚本
    configTemplate?: string;   // 配置文件模板
  };
}
```

### 5.3 依赖包插件配置

```typescript
interface PackagePlugin extends E2CPlugin {
    type: 'package';
    packageName?: string|string[]; // 支持的包名
    provide: object;        // 提供的引入对象
    apis?: string[];        // 该对象包含的 API（仅用于文档和检查）
    dependencies?: {        // 需要添加到 package.json 的依赖
        [packageName: string]: string;
    };
}
```

### 5.4 内容转换插件配置

```typescript
interface ContentPlugin extends E2CPlugin {
  type: 'content';
  
  // 文件过滤
  include?: string[];   // 包含的文件（glob）
  exclude?: string[];   // 排除的文件（glob）
  
  // 转换规则
  rules: ContentTransformRule[];
  
  // 自定义转换器
  transformers?: {
    beforeCopy?: (file: FileInfo) => Promise<FileAction>;
    onTransform?: (content: string, file: FileInfo) => Promise<string>;
    afterCopy?: (file: FileInfo) => Promise<void>;
  };
  
  // AST 转换器（高级）
  astTransformers?: {
    [filePattern: string]: ASTTransformer;
  };
}

interface ContentTransformRule {
  name: string;
  pattern: string | RegExp;
  replacement: string | ((match: string, ...args: any[]) => string);
  files?: string[];     // 限定文件
  type: 'string' | 'regex' | 'function';
}

interface ASTTransformer {
  // 使用抽象语法树进行精确转换
  transform: (ast: any, filePath: string) => any;
  language: 'javascript' | 'typescript' | 'html' | 'css';
}
```

---

## 6. Electron → Capacitor 转换映射设计

### 6.1 API 映射表

| Electron API | Capacitor 对应 API | 备注 |
|--------------|---------------------|------|
| `electron.app` | 自定义 Node.js Mobile 服务 | 主进程逻辑迁移 |
| `electron.ipcMain` | Node.js Mobile 通信机制 | |
| `electron.ipcRenderer` | Capacitor 插件 + Node.js Mobile | |
| `electron.BrowserWindow` | Capacitor WebView | |
| `electron.dialog` | `@capacitor/dialog` | |
| `electron.storage` | `@capacitor/storage` | |
| `electron.shell` | `@capacitor/app` | |

### 6.2 进程模型转换

- **Electron 主进程** → Node.js Mobile 后台服务
- **Electron 渲染进程** → Capacitor Web 层
- **IPC 通信** → Node.js Mobile 桥接层通信

---
