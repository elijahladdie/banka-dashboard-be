import { Request, Response } from 'express';
import { PaddleService } from '../services/paddle.service';
import { ResponseHandler } from '../utils/response-handler';
import { MESSAGES } from '../constants';

export class PaddleController {
  private readonly paddleService: PaddleService;

  constructor() {
    this.paddleService = new PaddleService();
  }

  async getProducts(req: Request, res: Response) {
    const products = await this.paddleService.listProducts(req.query as any);
    return ResponseHandler.success(
      res,
      products,
      MESSAGES.PADDLE.PRODUCTS_RETRIEVED
    );
  }

  async subscriptionCreation(req: Request, res: Response) {

    ResponseHandler.success(res, { received: true }, MESSAGES.PADDLE.WEBHOOK_RECEIVED);

    await this.paddleService.subscriptionCreation(req.body);
  }

  async subscriptionActivation(req: Request, res: Response) {
    ResponseHandler.success(res, { received: true }, MESSAGES.PADDLE.WEBHOOK_RECEIVED);
    await this.paddleService.subscriptionActivation(req.body);
  }

  async getTransactions(req: Request, res: Response) {
    const result = await this.paddleService.getTransactions(req.query);
    ResponseHandler.success(res, result, MESSAGES.PADDLE.TRANSACTIONS_RETRIEVED);
  }
}
