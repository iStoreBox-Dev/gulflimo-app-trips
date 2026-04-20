type LogEntry = {
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  time: string;
  meta?: any;
};

function pushLog(entry: LogEntry) {
  try {
    const win: any = typeof window !== 'undefined' ? window : globalThis;
    if (!win.__appLogs) win.__appLogs = [];
    win.__appLogs.push(entry);
  } catch (e) {
    // ignore
  }
}

export function log(level: LogEntry['level'], message: string, meta?: any) {
  try {
    pushLog({ level, message, time: new Date().toISOString(), meta });
  } catch (e) {}
}

export function initGlobalLogging() {
  if (typeof window === 'undefined') return;

  // preserve originals
  const origConsoleError = console.error.bind(console);
  const origConsoleWarn = console.warn.bind(console);
  const origConsoleLog = console.log.bind(console);

  console.error = (...args: any[]) => {
    try {
      pushLog({ level: 'error', message: String(args[0] ?? ''), time: new Date().toISOString(), meta: args.slice(1) });
    } catch (e) {}
    origConsoleError(...args);
  };

  console.warn = (...args: any[]) => {
    try {
      pushLog({ level: 'warn', message: String(args[0] ?? ''), time: new Date().toISOString(), meta: args.slice(1) });
    } catch (e) {}
    origConsoleWarn(...args);
  };

  console.log = (...args: any[]) => {
    try {
      pushLog({ level: 'info', message: String(args[0] ?? ''), time: new Date().toISOString(), meta: args.slice(1) });
    } catch (e) {}
    origConsoleLog(...args);
  };

  window.addEventListener('error', (ev) => {
    try {
      const { message, filename, lineno, colno, error } = ev as any;
      pushLog({ level: 'error', message: `${message} @ ${filename}:${lineno}:${colno}`, time: new Date().toISOString(), meta: { error } });
    } catch (e) {}
  });

  window.addEventListener('unhandledrejection', (ev) => {
    try {
      const reason = (ev as any).reason;
      pushLog({ level: 'error', message: `UnhandledRejection: ${String(reason)}`, time: new Date().toISOString(), meta: { reason } });
    } catch (e) {}
  });
}

export function getCollectedLogs() {
  const win: any = typeof window !== 'undefined' ? window : globalThis;
  return win.__appLogs || [];
}

export function wrapAsync<T extends (...args: any[]) => Promise<any>>(fn: T, name = 'async') {
  return async function wrapped(...args: Parameters<T>): Promise<ReturnType<T>> {
    console.log(`[DEBUG] ${name} START`, { args });
    try {
      const res = await fn(...args);
      console.log(`[DEBUG] ${name} END`, { result: res });
      return res;
    } catch (e: any) {
      console.error(`[${name}] Error:`, e?.message || e, e?.stack || 'no-stack');
      throw e;
    }
  } as T;
}

export function logStateChange<T>(name: string, prev: T, next: T) {
  console.log(`[STATE] ${name} changed`, { prev, next });
}

export function logFunctionStart(name: string, ...args: any[]) {
  console.log(`[FUNC] ${name} called`, { args });
}
