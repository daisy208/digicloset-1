import { logger } from '../utils/winston-logger-enterprise.js';
export const requestLogger = (req, res, next) => {
  logger.info({ method: req.method, url: req.url });
  next();
};