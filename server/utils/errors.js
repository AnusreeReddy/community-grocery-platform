// Typed error so route handlers can signal the HTTP status they want,
// instead of every controller guessing a status code from a message string.
export class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
  }
}

export const badRequest = (message) => new AppError(message, 400);
export const unauthorized = (message = "Unauthorized.") => new AppError(message, 401);
export const forbidden = (message = "Forbidden.") => new AppError(message, 403);
export const notFound = (message = "Not found.") => new AppError(message, 404);
export const conflict = (message) => new AppError(message, 409);
