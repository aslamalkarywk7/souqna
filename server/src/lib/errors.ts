/** Typed API error with a stable machine code the client can map to i18n keys. */
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message?: string,
  ) {
    super(message ?? code);
  }
}

type AsyncHandler = (req: any, res: any, next: any) => any;

/** Wrap an async route handler so rejections reach the error middleware. */
export const wrap =
  (fn: AsyncHandler): AsyncHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
