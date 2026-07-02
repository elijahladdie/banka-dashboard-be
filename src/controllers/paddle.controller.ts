import { Request, Response } from 'express';
import { PaddleService } from '../services/paddle.service';
import { ResponseHandler } from '../utils/response-handler';

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
      'Paddle products retrieved successfully.'
    );
  }

  async subscriptionCreation(req: Request, res: Response) {

    ResponseHandler.success(res, { received: true }, 'Webhook received successfully.');

    await this.paddleService.subscriptionCreation(req.body);
  }

  async subscriptionActivation(req: Request, res: Response) {

    ResponseHandler.success(res, { received: true }, 'Webhook received successfully.');
    await this.paddleService.subscriptionActivation(req.body);
  }

  async getTransactions(req: Request, res: Response) {
    const result = await this.paddleService.getTransactions(req.query);
    ResponseHandler.success(res, result, 'Transactions retrieved successfully.');
  }
}
