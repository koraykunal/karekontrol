type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

interface Logger {
    log: (...args: unknown[]) => void;
    info: (...args: unknown[]) => void;
    warn: (...args: unknown[]) => void;
    error: (...args: unknown[]) => void;
    debug: (...args: unknown[]) => void;
}

const noop = () => {};

const createLogger = (): Logger => {
    const logWithLevel = (level: LogLevel) =>
        __DEV__ ? (...args: unknown[]) => console[level](...args) : noop;

    return {
        log: logWithLevel('log'),
        info: logWithLevel('info'),
        warn: logWithLevel('warn'),
        debug: logWithLevel('debug'),
        error: __DEV__
            ? (...args: unknown[]) => console.error(...args)
            : noop,
    };
};

export const logger = createLogger();

export const createTaggedLogger = (tag: string): Logger => {
    const taggedLog = (level: LogLevel) =>
        __DEV__ ? (...args: unknown[]) => console[level](`[${tag}]`, ...args) : noop;

    return {
        log: taggedLog('log'),
        info: taggedLog('info'),
        warn: taggedLog('warn'),
        debug: taggedLog('debug'),
        error: taggedLog('error'),
    };
};
