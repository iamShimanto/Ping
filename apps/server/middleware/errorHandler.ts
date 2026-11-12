import { Request, Response, NextFunction } from "express";
import {ApiError} from "@repo/helpers";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let statusCode = 500;
  let message = "Internal server error";

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err.name === "CastError") {
    // Mongoose: malformed ObjectId (or other bad cast) in a route param/body
    statusCode = 400;
    message = "Invalid id format";
  } else if (err.name === "ValidationError") {
    // Mongoose schema validation (e.g. password minlength)
    statusCode = 400;
    message = err.message;
  } else if (err.name === "MulterError") {
    // Multer upload errors (e.g. LIMIT_FILE_SIZE, LIMIT_UNEXPECTED_FILE)
    statusCode = 400;
    message =
      (err as { code?: string }).code === "LIMIT_FILE_SIZE"
        ? "File too large"
        : err.message;
  }

  console.error({
    name: err.name,
    message: err.message,
    stack: err.stack,
    path: req.originalUrl,
  });

  res.status(statusCode).json({
    success: false,
    message,
  });
};
