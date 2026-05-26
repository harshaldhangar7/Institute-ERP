import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { error } from '../utils/response';

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      error(res, parsed.error.errors[0].message, 400);
      return;
    }
    req.body = parsed.data;
    next();
  };
}
