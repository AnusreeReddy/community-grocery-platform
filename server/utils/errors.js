const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const badRequest = (message) => createError(message, 400);

const unauthorized = (message = "Unauthorized") =>
  createError(message, 401);

const forbidden = (message = "Forbidden") =>
  createError(message, 403);

const notFound = (message = "Resource not found") =>
  createError(message, 404);

export {
  createError,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
};