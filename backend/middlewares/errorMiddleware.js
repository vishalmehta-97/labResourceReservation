/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.url}:`, err.message);

  // MySQL errors
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      message: 'A record with this information already exists.',
      data: null,
      error: 'DUPLICATE_ENTRY',
    });
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({
      success: false,
      message: 'Referenced record does not exist.',
      data: null,
      error: 'FOREIGN_KEY_VIOLATION',
    });
  }

  // Custom application errors
  const statusCode = err.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    message: err.message || 'An internal server error occurred.',
    data: null,
    error: err.code || 'INTERNAL_SERVER_ERROR',
  });
};

/**
 * 404 not found handler
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.url} not found.`,
    data: null,
    error: 'NOT_FOUND',
  });
};

/**
 * Utility to create a structured application error
 */
const createError = (message, statusCode = 500, code = 'ERROR') => {
  const err = new Error(message);
  err.statusCode = statusCode;
  err.code = code;
  return err;
};

module.exports = { errorHandler, notFoundHandler, createError };
