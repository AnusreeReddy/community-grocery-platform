import { sendError } from "../utils/http.js";

// Fallback for errors that escape a route handler (e.g. malformed JSON bodies).
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  if (err?.type === "entity.parse.failed") {
    return res.status(400).json({ success: false, message: "Malformed JSON body." });
  }
  return sendError(res, err);
};

export default errorHandler;
