import logger from './logger.js';

export function log(msg) {
  logger.info(msg);
}

export function error(err) {
  logger.error(err);
}
