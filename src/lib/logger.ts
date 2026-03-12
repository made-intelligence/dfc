const isDev = process.env.NODE_ENV === 'development';

export const logger = {
  error: (context: string, error: unknown, meta?: Record<string, unknown>) => {
    if (isDev) {
      console.error(`[${context}]`, error, meta || '');
    }
  },
  warn: (context: string, message: string) => {
    if (isDev) console.warn(`[${context}] ${message}`);
  },
  info: (context: string, message: string) => {
    if (isDev) console.log(`[${context}] ${message}`);
  },
};
