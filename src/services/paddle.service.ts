import { Request } from 'express';
import axios, { AxiosInstance } from 'axios';
import { ForbiddenError, ServerError, UnauthorizedError, verifyPaddleSignature } from '../helpers';
import { PADDLE_API_KEY, PADDLE_WEBHOOK_SECRET, PLAN_NAME_MAP, PLAN_FEATURES, PADDLE_URL } from '../utils/constants';
import { mapPaddleProductsResponse } from '../utils/paddle-mapper';
import { processPaddleWebhook, } from '../utils/paddle-webhook';
import logger from '../utils/logger';
import { PaddleProductQuery } from '../types';


export class PaddleService {
  private readonly api: AxiosInstance;

  constructor() {
    const baseURL = PADDLE_URL
    this.api = axios.create({
      baseURL,
      headers: {
        'Authorization': `Bearer ${PADDLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    });
  }

  async listProducts(query: PaddleProductQuery = {}) {
    try {
      const params: Record<string, any> = {};

      if (query.id?.length) params.id = query.id.join(',');
      if (query.after) params.after = query.after;
      if (query.per_page) params.per_page = query.per_page;
      if (query.include?.length) params.include = query.include.join(',');
      if (query.order_by) params.order_by = query.order_by;
      if (query.status?.length) params.status = query.status.join(',');
      if (query.tax_category?.length) params.tax_category = query.tax_category.join(',');
      if (query.type) params.type = query.type;

      const { data } = await this.api.get('/products', { params });
      return data;
    } catch (error: any) {
      throw this.handlePaddleError(error, 'Failed to fetch products from Paddle');
    }
  }

  async findCustomer(customerId: string) {
    try {
      const { data } = await this.api.get(
        `/customers/${customerId}`
      );

      return data?.data ?? null;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }

      throw this.handlePaddleError(
        error,
        `Failed to fetch Paddle customer ${customerId}`
      );
    }
  }



  async listProductsWithPrices(query: PaddleProductQuery = {}) {
    const { interval = 'year' } = query;

    const result = await this.listProducts({
      ...query,
      include: ['prices'],
    });

    const mapped = mapPaddleProductsResponse(result);

    const starterPlan = PLAN_FEATURES.find(
      plan => plan.name.toLowerCase() === 'starter'
    );

    const proPlan = PLAN_FEATURES.find(
      plan => plan.name.toLowerCase() === 'pro'
    );

    const advancedPlan = PLAN_FEATURES.find(
      plan => plan.name.toLowerCase() === 'advanced'
    );

    const getPlanFeatures = (planKey?: string) => {
      switch (planKey?.toUpperCase()) {
        case 'STARTER':
          return starterPlan?.features ?? [];


        case 'PRO':
          return [
            ...(proPlan?.subtitle ? [proPlan?.subtitle] : []),
            ...(proPlan?.features ?? []),
          ];

        case 'ADVANCED':
          return [
            ...(advancedPlan?.subtitle ? [advancedPlan?.subtitle] : []),
            ...(advancedPlan?.features ?? []),
          ];

        default:
          return [];
      }


    };

    return (mapped?.data || [])
      .map((product: any) => {
        const planKey =
          PLAN_NAME_MAP[product.customData?.plan?.toLowerCase()] ||
          PLAN_NAME_MAP[product.name?.toLowerCase()];


        const selectedPrice = (product.prices || []).find(
          (price: any) =>
            price.billingCycle?.interval === interval
        );

        if (!selectedPrice) {
          return null;
        }

        return {
          id: product.id,
          name: product.name,
          type: product.type,
          description: product.description,
          taxCategory: product.taxCategory,
          imageUrl: product.imageUrl,
          customData: product.customData,
          status: product.status,

          billingInterval: interval,
          prices: [selectedPrice],

          features: getPlanFeatures(planKey),

          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
        };
      })
      .filter(Boolean);
  }


  async handleWebhook(req: Request) {

    const rawBody: string = (req as any).rawBody || '';
    const paddleSignature = req.headers['paddle-signature'] as string || '';
    const secret = PADDLE_WEBHOOK_SECRET;

    if (!secret) {
      logger.error('[paddle-webhook] PADDLE_WEBHOOK_SECRET not configured');
      return;
    }

    if (!verifyPaddleSignature(rawBody, paddleSignature, secret)) {
      logger.warn('[paddle-webhook] Invalid signature');
      return;
    }

    // Process the event asynchronously
    const event = JSON.parse(rawBody);
    processPaddleWebhook(event).then((result) => {
      if (!result.handled) {
        logger.info(`[paddle-webhook] Not handled: ${result.reason}`);
      }
    }).catch((err) => {
      logger.error('[paddle-webhook] Processing error:', err);
    });
  }

  async listTransactions(query: { after?: string; per_page?: number; status?: string } = {}) {
    try {
      const params: Record<string, any> = {};
      if (query.after) params.after = query.after;
      if (query.per_page) params.per_page = query.per_page;
      if (query.status) params.status = query.status;

      const { data } = await this.api.get('/transactions', { params });
      return data.data;
    } catch (error: any) {
      throw this.handlePaddleError(error, 'Failed to fetch transactions from Paddle');
    }
  }



  private handlePaddleError(error: any, fallbackMessage: string): never {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const paddleError = error.response?.data;

      if (status === 401) {
        throw new UnauthorizedError('Paddle API authentication failed. Check your API key.');
      }
      if (status === 403) {
        throw new ForbiddenError('Paddle API permission denied. Check your API key permissions.');
      }
      if (status === 429) {
        throw new ServerError('Paddle API rate limit exceeded. Please try again later.');
      }

      const message =
        paddleError?.error?.detail ||
        paddleError?.error?.message ||
        paddleError?.message ||
        fallbackMessage;

      throw new ServerError(`Paddle API error: ${message}`);
    }

    throw new ServerError(fallbackMessage);
  }
}
