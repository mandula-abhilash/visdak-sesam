import { Request, Response, NextFunction } from 'express';
import { AnyZodObject } from 'zod';
import { createErrorResponse } from '../utils/response';

export const validateRequest = (schema: AnyZodObject) => 
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error: any) {
      return res.status(400).json(
        createErrorResponse(400, error.errors[0].message)
      );
    }
  };