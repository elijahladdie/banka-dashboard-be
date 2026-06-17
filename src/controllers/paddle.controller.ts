import { Request, Response } from 'express';
import { PaddleService } from '../services/paddle.service';
import { ResponseHandler } from '../utils/response-handler';


export class PaddleController {
  private readonly paddleService: PaddleService;
  constructor() {
    this.paddleService = new PaddleService();
  }

  async getProducts(req: Request, res: Response) {
    const interval =
      String(req.query.interval || 'year')
        .toLowerCase() === 'month'
        ? 'month'
        : 'year';

    const products = await this.paddleService.listProductsWithPrices({ interval });
    return ResponseHandler.success(
      res,
      products,
      'Paddle products retrieved successfully.'
    );
  }

  async handleWebhook(req: Request, res: Response) {
    // Acknowledge receipt immediately — Paddle requires 200 within 5 seconds
    res.status(200).json({ received: true });
    await this.paddleService.handleWebhook(req);
  }

  /**
   * List completed transactions directly from Paddle.
   * GET /paddle/transactions
   */
  async getTransactions(req: Request, res: Response) {
    const { after, per_page, status } = req.query;
    const result = await this.paddleService.listTransactions({
      after: after as string | undefined,
      per_page: per_page ? parseInt(per_page as string, 10) : undefined,
      status: status as string | undefined,
    });
    ResponseHandler.success(res, result, 'Transactions retrieved successfully.');
  }
}
