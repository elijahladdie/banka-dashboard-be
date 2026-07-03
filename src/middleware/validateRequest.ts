import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../helpers';
import { ACTIVATION_WEBHOOK_SECRET, SUB_CREATION_WEBHOOK_SECRET } from '../constants/constants';
import { CustomerCreatedEvent } from '@paddle/paddle-node-sdk';
import { PaddleActivation, PaddleCreation } from '../helpers/paddle';
import logger from '../utils/logger';

export function validateRequest(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      req.body = parsed.body;
      req.query = parsed.query;
      req.params = parsed.params;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
        throw new ValidationError(messages);
      }
      next(error);
    }
  };
}


export const verifyCreationSignature = async (req: Request, res: Response, next: NextFunction): Promise<void> => {

  const rawBody: string = (req as any).rawBody || '';
  const signature = req.headers['paddle-signature'] as string || '';
  const event = await PaddleCreation.webhooks.unmarshal(rawBody, SUB_CREATION_WEBHOOK_SECRET, signature) as CustomerCreatedEvent;
  req.body = event;
  next();
}

export const verifyActivationSignature = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const rawBody: string = (req as any).rawBody || '';
  const signature = req.headers['paddle-signature'] as string || '';
  const event = await PaddleActivation.webhooks.unmarshal(rawBody, ACTIVATION_WEBHOOK_SECRET, signature);
  req.body = event;
  next();
}