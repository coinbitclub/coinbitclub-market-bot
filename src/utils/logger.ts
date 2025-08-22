// ========================================
// MARKETBOT - SIMPLE LOGGER
// Logger simples para o sistema
// ========================================

export const logger = {
  info: (...args: any[]) => console.log('ℹ️', ...args),
  error: (...args: any[]) => console.error('❌', ...args),
  warn: (...args: any[]) => console.warn('⚠️', ...args),
  debug: (...args: any[]) => console.debug('🐛', ...args),
  success: (...args: any[]) => console.log('✅', ...args)
};

export default logger;
