import { AppError } from "./errors.js";

// Maps any thrown error to a safe HTTP response.
export const sendError = (res, err) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ success: false, message: err.message });
  }
  if (err?.name === "ValidationError") {
    const message =
      Object.values(err.errors || {}).map((e) => e.message).join(" ") || "Validation failed.";
    return res.status(400).json({ success: false, message });
  }
  if (err?.name === "CastError") {
    return res.status(400).json({ success: false, message: "Invalid identifier supplied." });
  }
  if (err?.code === 11000) {
    return res.status(409).json({ success: false, message: "A record with these details already exists." });
  }
  console.error(err);
  return res.status(500).json({ success: false, message: "Server error." });
};

// Wraps an async controller: thrown errors are converted to a safe response
// instead of needing a try/catch block in every single controller function.
export const asyncRoute = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (err) {
    sendError(res, err);
  }
};
