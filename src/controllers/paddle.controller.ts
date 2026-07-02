import { Request, Response } from 'express';
import { PaddleService } from '../services/paddle.service';
import { ResponseHandler } from '../utils/response-handler';

export class PaddleController {
  private readonly paddleService: PaddleService;

  constructor() {
    this.paddleService = new PaddleService();
  }

  async getProducts(req: Request, res: Response) {
    const products = await this.paddleService.listProductsWithPrices(req.query as any);
    return ResponseHandler.success(
      res,
      products,
      'Paddle products retrieved successfully.'
    );
  }

  async handleCreationWebhook(req: Request, res: Response) {
    // Acknowledge receipt immediately — Paddle requires 200 within 5 seconds
    res.status(200).json({ received: true });

    const rawBody: string = (req as any).rawBody || '';
    const signature = req.headers['paddle-signature'] as string || '';

    await this.paddleService.processCreationWebhook(rawBody, signature);
  }

  async handleSubscriptionWebhook(req: Request, res: Response) {
  
    ResponseHandler.success(res, { received: true }, 'Webhook received successfully.');

    const rawBody: string = (req as any).rawBody || '';
    const signature = req.headers['paddle-signature'] as string || '';

    await this.paddleService.processSubscriptionWebhook(rawBody, signature);
  }

  async getTransactions(req: Request, res: Response) {
    const result = await this.paddleService.listTransactionsFromQuery(req.query);
    ResponseHandler.success(res, result, 'Transactions retrieved successfully.');
  }
}
