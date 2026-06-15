import { Request, Response } from 'express';
import { PaddleService } from '../services/paddle.service';
import { ResponseHandler } from '../utils/response-handler';
import { mapPaddleProductsResponse } from '../utils/paddle-mapper';
import { verifyPaddleSignature, processPaddleWebhook } from '../utils/paddle-webhook';
import { PADDLE_WEBHOOK_SECRET } from '../utils/constants';
import prisma from '../utils/prisma';

const PLAN_NAME_MAP: Record<string, string> = {
  starter: 'STARTER',
  pro: 'PRO',
  advanced: 'ADVANCED',
};

export class PaddleController {
  private readonly paddleService: PaddleService;
  constructor() {
    this.paddleService = new PaddleService();
  }

  async getProducts(req: Request, res: Response) {
    const interval = req.query.interval as string | undefined;

    const [result, dbFeatures] = await Promise.all([
      this.paddleService.listProductsWithPrices(),
      prisma.planFeature.findMany({
        orderBy: [{ plan: 'asc' }, { billingInterval: 'asc' }, { sortOrder: 'asc' }],
      }),
    ]);

    const mapped = mapPaddleProductsResponse(result);

    // Group DB features by plan for quick lookup
    const featuresByPlan = new Map<string, { monthly: string[]; yearly: string[]; targetCustomers: string[] }>();
    for (const feat of dbFeatures) {
      const key = feat.plan; // STARTER, PRO, ADVANCED
      if (!featuresByPlan.has(key)) {
        featuresByPlan.set(key, { monthly: [], yearly: [], targetCustomers: [] });
      }
      const entry = featuresByPlan.get(key)!;
      const bucket = feat.billingInterval === 'YEARLY' ? entry.yearly : entry.monthly;
      if (feat.category === 'target_customer') {
        entry.targetCustomers.push(feat.name);
      } else {
        bucket.push(feat.name);
      }
    }

    // Attach features to each product by matching on customData.plan or name
    const enriched = {
      ...mapped,
      data: (mapped?.data || []).map((product: any) => {
        const planKey =
          PLAN_NAME_MAP[product.customData?.plan?.toLowerCase()] ||
          PLAN_NAME_MAP[product.name?.toLowerCase()];

        const planFeatures = planKey ? featuresByPlan.get(planKey) : undefined;

        return {
          ...product,
          features: planFeatures
            ? {
                monthly: planFeatures.monthly,
                yearly: planFeatures.yearly,
                targetCustomers: planFeatures.targetCustomers,
              }
            : null,
        };
      }),
    };

    if (!interval || !enriched?.data) {
      ResponseHandler.success(res, enriched, 'Paddle products retrieved successfully.');
      return;
    }

    // Filter each product's prices array by the requested billing interval
    const filtered = {
      ...enriched,
      data: enriched.data
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
