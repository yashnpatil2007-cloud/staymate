class AppError extends Error {
  constructor(message, statusCode = 500, details) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

function notFound(req, res, next) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Something went wrong';
  let details = err.details;

  if (err.name === 'ValidationError') {
    statusCode = 400;
    details = Object.values(err.errors).map((e) => ({ path: e.path, message: e.message }));
    message = 'Please check the submitted information.';
  }

  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid identifier provided.';
  }

  if (err.code === 11000) {
    statusCode = 409;
    message = 'That record already exists.';
  }

  if (err.name === 'MulterError') {
    statusCode = 400;
    message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'Image is too large. Maximum size is 5MB.'
        : `Upload error: ${err.message}`;
  }

  if (statusCode >= 500) {
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message: statusCode >= 500 && !env_isDev() ? 'Something went wrong. Please try again.' : message,
    details
  });
}

function env_isDev() {
  return process.env.NODE_ENV !== 'production';
}

module.exports = { AppError, notFound, errorHandler };
