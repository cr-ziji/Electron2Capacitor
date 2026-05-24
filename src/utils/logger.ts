import chalk from 'chalk';

export interface LoggerOptions {
  verbose: boolean;
}

export interface Logger {
  info: (msg: string) => void;
  warn: (msg: string) => void;
  error: (msg: string) => void;
  success: (msg: string) => void;
  debug: (msg: string) => void;
  stage: (name: string, status: string) => void;
}

export function createLogger(options: LoggerOptions): Logger {
  return {
    info: (msg: string) => {
      console.log(chalk.blue('[INFO]'), msg);
    },
    warn: (msg: string) => {
      console.log(chalk.yellow('[WARN]'), msg);
    },
    error: (msg: string) => {
      console.error(chalk.red('[ERROR]'), msg);
    },
    success: (msg: string) => {
      console.log(chalk.green('[SUCCESS]'), msg);
    },
    debug: (msg: string) => {
      if (options.verbose) {
        console.log(chalk.gray('[DEBUG]'), msg);
      }
    },
    stage: (name: string, status: string) => {
      const statusColor = status === 'success' ? chalk.green : status === 'error' ? chalk.red : chalk.yellow;
      console.log(chalk.bold('[STAGE]'), name, statusColor(`[${status}]`));
    },
  };
}
