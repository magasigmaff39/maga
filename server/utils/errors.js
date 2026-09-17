// Typed HTTP errors + Express error middleware. Services throw HttpError; routes never format errors themselves.

export class HttpError extends Error {
  /**
   * @param {number} status
   * @param {string} message  human-readable (Russian by default — the UI shows it as is)
   * @param {string} [code]   machine-readable code for the frontend (e.g. 'EMAIL_TAKEN')
   * @param {unknown} [details]
   */
  constructor(status, message, code = 'ERROR', details = undefined) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const badRequest = (message, code = 'BAD_REQUEST', details) => new HttpError(400, message, code, details);
export const unauthorized = (message = 'Требуется авторизация', code = 'UNAUTHORIZED') => new HttpError(401, message, code);
export const forbidden = (message = 'Доступ запрещён', code = 'FORBIDDEN') => new HttpError(403, message, code);
export const notFound = (message = 'Не найдено', code = 'NOT_FOUND') => new HttpError(404, message, code);
export const conflict = (message, code = 'CONFLICT') => new HttpError(409, message, code);
export const tooMany = (message = 'Слишком много запросов, попробуйте позже', code = 'RATE_LIMITED') => new HttpError(429, message, code);
export const upstream = (message = 'Внешний сервис недоступен', code = 'UPSTREAM_ERROR') => new HttpError(502, message, code);

/** Wrap async route handlers so rejected promises reach the error middleware. */
export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// eslint-disable-next-line no-unused-vars
export function errorMiddleware(err, req, res, _next) {
  // multer size/type errors
  if (err?.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'Файл слишком большой', code: 'FILE_TOO_LARGE' });
  }
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, code: err.code, details: err.details });
  }
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Тело запроса слишком большое', code: 'PAYLOAD_TOO_LARGE' });
  }
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Некорректный JSON в теле запроса', code: 'BAD_JSON' });
  }
  console.error(`[${new Date().toISOString()}] Unhandled error on ${req.method} ${req.originalUrl}:`, err);
  return res.status(500).json({ error: 'Внутренняя ошибка сервера', code: 'INTERNAL' });
}

export function notFoundMiddleware(req, res) {
  res.status(404).json({ error: `Маршрут ${req.method} ${req.originalUrl} не найден`, code: 'ROUTE_NOT_FOUND' });
}
