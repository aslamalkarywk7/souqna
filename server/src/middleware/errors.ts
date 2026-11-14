import type {NextFunction, Request, Response} from 'express';
import {ApiError} from '../lib/errors';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ApiError) {
    res.status(err.status).json({error: {code: err.code, message: err.message}});
    return;
  }
  console.error(err);
  res.status(500).json({error: {code: 'INTERNAL', message: 'Unexpected server error'}});
}

/** Validate a request body against a zod schema; throws a coded ApiError on failure. */
export function parseBody<T>(schema: {safeParse: (v: unknown) => {success: true; data: T} | {success: false; error: {issues: {message: string}[]}}}, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) {
    const first = result.error.issues[0];
    throw new ApiError(400, 'VALIDATION', first?.message ?? 'Invalid request body');
  }
  return result.data;
}
