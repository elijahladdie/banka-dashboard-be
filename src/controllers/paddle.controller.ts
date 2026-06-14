import { Request, Response } from 'express';
import { PaddleService } from '../services/paddle.service';
import { ResponseHandler } from '../utils/response-handler';
import { mapPaddleProductsResponse } from '../utils/paddle-mapper';
import { verifyPaddleSignature, processPaddleWebhook } from '../utils/paddle-webhook';
import { PADDLE_WEBHOOK_SECRET } from '../utils/constants';

export class PaddleController {
  private readonly paddleService: PaddleService;
  constructor() {
    this.paddleService = new PaddleService();
  }

  async getProducts(req: Request, res: Response) {
    const interval = req.query.interval as string | undefined;

    const result = await this.paddleService.listProductsWithPrices();
    const mapped = mapPaddleProductsResponse(result);

    if (!interval || !mapped?.data) {
      ResponseHandler.success(res, mapped, 'Paddle products retrieved successfully.');
      return;
    }

    // Filter each product's prices array by the requested billing interval
    const filtered = {
      ...mapped,
      data: mapped.data
        .map((product: any) => ({
          ...product,
          prices: (product.prices || []).filter(
            (price: any) => price.billingCycle?.interval === interval
          ),
        }))
        .filter((product: any) => product.prices.length > 0),
    };

    ResponseHandler.success(res, filtered, 'Paddle products retrieved successfully.');
  }

  /**
   * Handle incoming Paddle webhooks.
   *
   * Per Paddle best practices:
   * 1. Respond with HTTP 200 IMMEDIATELY — before any processing.
   * 2. Verify the signature using the raw body (captured via express.json verify callback).
   * 3. Process the event asynchronously after responding.
   *
   * @see https://developer.paddle.com/webhooks/about/respond-to-webhooks
   * @see https://developer.paddle.com/webhooks/about/signature-verification
   */
  async handleWebhook(req: Request, res: Response) {
    // Acknowledge receipt immediately — Paddle requires 200 within 5 seconds
    res.status(200).json({ received: true });

    const rawBody: string = (req as any).rawBody || '';
    const paddleSignature = req.headers['paddle-signature'] as string || '';
    const secret = PADDLE_WEBHOOK_SECRET;

    if (!secret) {
      console.error('[paddle-webhook] PADDLE_WEBHOOK_SECRET not configured');
      return;
    }

    if (!verifyPaddleSignature(rawBody, paddleSignature, secret)) {
      console.warn('[paddle-webhook] Invalid signature');
      return;
    }

    // Process the event asynchronously
    const event = JSON.parse(rawBody);
    processPaddleWebhook(event).then((result) => {
      if (!result.handled) {
        console.log(`[paddle-webhook] Not handled: ${result.reason}`);
      }
    }).catch((err) => {
      console.error('[paddle-webhook] Processing error:', err);
    });
  }
}
