function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  let statusCode = Number.isInteger(err.statusCode) ? err.statusCode : Number.isInteger(err.status) ? err.status : 500;
  let message = err.message || "Internal Server Error";
  let details;

  if (err.name === "ValidationError") {
    statusCode = 400;
    message = "Validation failed";
    details = Object.values(err.errors || {}).map((item) => ({ field: item.path, message: item.message }));
  } else if (err.name === "CastError") {
    statusCode = 400;
    message = "Invalid resource identifier";
  } else if (err.code === 11000) {
    statusCode = 409;
    message = "A record with this unique value already exists";
  } else if (err.type === "entity.parse.failed") {
    statusCode = 400;
    message = "Request body contains invalid JSON";
  } else if (err.type === "entity.too.large") {
    statusCode = 413;
    message = "Request body is too large";
  }

  if (statusCode >= 500) {
    console.error("Unhandled request error:", err.stack || err);
    message = process.env.NODE_ENV === "production" ? "Internal server error" : message;
  }

  const payload = { success: false, message };
  if (details && details.length) payload.errors = details;
  return res.status(statusCode).json(payload);
}

module.exports = errorHandler;
