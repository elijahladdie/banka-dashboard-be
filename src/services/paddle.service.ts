import { Paddle, ApiError, CustomerCreatedEvent, Customer } from '@paddle/paddle-node-sdk';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { AuthRepository } from '../repositories/implementations/auth.repository';
import { SubscriptionsRepository } from '../repositories/implementations/subscriptions.repository';
import { ForbiddenError, ServerError, UnauthorizedError } from '../helpers';
import { PADDLE_API_KEY, PADDLE_API_ENV, PADDLE_CREATION_WEBHOOK_SECRET, PADDLE_SUBSCRIPTION_WEBHOOK_SECRET, PLAN_NAME_MAP, BCRYPT_SALT_ROUNDS, JWT_ACCESS_SECRET, SUBSCRIPTION_RANK } from '../utils/constants';
import { PaddleProductQuery, WebhookResult, PaddleSignUpInput } from '../types';
import { generateTokens, normalizePaddleSubscription, mapProductToClientResponse } from '../utils/helper';
import { sendRegistrationEmail, sendSubsPlanChangeEmail } from './email.service';
import logger from '../utils/logger';

export class PaddleService {
  private readonly paddle: Paddle;
  private readonly authRepository: AuthRepository;
  private readonly subscriptionsRepository: SubscriptionsRepository;

  constructor() {
    this.paddle = new Paddle(PADDLE_API_KEY, {
      environment: PADDLE_API_ENV,
    });
    this.authRepository = new AuthRepository();
    this.subscriptionsRepository = new SubscriptionsRepository();
  }

  // ──────────────────────────────────────────────
  // User / Subscription Business Logic
  // ──────────────────────────────────────────────

  async syncSubscriptionFromPaddle({ customerId, subscriptionId, event }: any) {
    const sub = await this.subscriptionsRepository.findOne({ customerId });
    if (!sub) return null;

    const normalized = normalizePaddleSubscription(event);

    await this.subscriptionsRepository.update(sub.id, {
      subscriptionId,
      plan: normalized.product,
      status: normalized.status,
      startsAt: normalized.startsAt,
      endsAt: normalized.endsAt,
      billingInterval: normalized.billingCycle?.interval || 'month',
    });

    return true;
  }

  async updateSubscriptionFromPaddle({ customerId, subscriptionId, event }: any) {
    const subscription = await this.subscriptionsRepository.findOne({ customerId });
    if (!subscription) return null;

    const normalized = normalizePaddleSubscription(event);
    console.log("Normalized subscription data from Paddle webhook:", normalized);
    console.log("Existing subscription data from database:", {
      metadata: {
        currency: normalized.currency,
        amount: normalized.amount,
        billingCycle: normalized.billingCycle,
        event: event.eventType,
      },
    });
    const previousPlan = subscription.plan;
    const previousInterval = subscription.billingInterval || 'month';
    const newPlan = normalized.product;
    const newInterval = normalized.billingCycle?.interval || 'month';

    await this.subscriptionsRepository.update(subscription.id, {
      subscriptionId,
      plan: newPlan,
      status: normalized.status,
      startsAt: normalized.startsAt,
      endsAt: normalized.endsAt,
      canceledAt: normalized.canceledAt,
      billingInterval: newInterval,
      metadata: {
        currency: normalized.currency,
        amount: normalized.amount,
        billingCycle: normalized.billingCycle,
        event: event.eventType,
      },
    });

    const user = await this.authRepository.findById(subscription.userId);
    if (!user) return null;

    const previousRank = SUBSCRIPTION_RANK[`${previousPlan}:${previousInterval}` as keyof typeof SUBSCRIPTION_RANK];
    const newRank = SUBSCRIPTION_RANK[`${newPlan}:${newInterval}` as keyof typeof SUBSCRIPTION_RANK];
    const isUpgrade = newRank > previousRank;
    const changed = previousPlan !== newPlan || previousInterval !== newInterval;

    if (changed) {
      await sendSubsPlanChangeEmail({
        email: user.email,
        firstName: user.firstName,
        previousPlan: PLAN_NAME_MAP[previousPlan] || previousPlan,
        newPlan: PLAN_NAME_MAP[newPlan] || newPlan,
        previousInterval,
        newInterval,
        isUpgrade,
      });
    }

    return user;
  }

  async cancelSubscriptionFromPaddle({ customerId, subscriptionId }: any) {
    const subscription = await this.subscriptionsRepository.findOne({ customerId });
    if (!subscription) return null;

    await this.subscriptionsRepository.update(subscription.id, {
      status: 'CANCELED',
      subscriptionId,
    });

    return true;
  }

  async listProducts(query: PaddleProductQuery = {}) {
    try {
      const params: Record<string, any> = {};
      if (query.id?.length) params.id = query.id;
      if (query.after) params.after = query.after;
      if (query.per_page) params.perPage = query.per_page;
      if (query.include?.length) params.include = query.include;
      if (query.order_by) params.orderBy = query.order_by;
      if (query.status?.length) params.status = query.status;
      if (query.tax_category?.length) params.taxCategory = query.tax_category;
      if (query.type) params.type = query.type;
      if (query.interval) params.interval = query.interval;

      const products = this.paddle.products.list(params);
      const page = await products.next();
      return page;
    } catch (error: any) {
      throw this.handlePaddleError(error, 'Failed to fetch products from Paddle');
    }
  }


  async findCustomer(customerId: string): Promise<Customer | null> {
    try {
      const customer = await this.paddle.customers.get(customerId);
      return customer;
    } catch (error: any) {
      if (error instanceof ApiError && error.code === 'not_found') {
        return null;
      }
      throw this.handlePaddleError(error, `Failed to fetch Paddle customer ${customerId}`);
    }
  }

  async listProductsWithPrices(query: PaddleProductQuery = {}) {
    const interval =
      String(query.interval || 'year')
        .toLowerCase() === 'month'
        ? 'month'
        : 'year';

    const products = await this.listProducts({ ...query, include: ['prices'] });

    return (products || [])
      .map((product: any) => mapProductToClientResponse(product, interval))
      .filter(Boolean);
  }

  async updateSubscription(subscriptionId: string, priceId: string) {
    try {
      const result = await this.paddle.subscriptions.update(subscriptionId, {
        items: [{ priceId, quantity: 1 }],
        prorationBillingMode: 'prorated_immediately',
      });
      return result;
    } catch (error: any) {
      throw this.handlePaddleError(error, 'Failed to update subscription');
    }
  }

  async verifyCreationWebhook(rawBody: string, signature: string): Promise<CustomerCreatedEvent> {
    return await this.paddle.webhooks.unmarshal(rawBody, PADDLE_CREATION_WEBHOOK_SECRET, signature) as CustomerCreatedEvent;
  }

  async verifySubscriptionWebhook(rawBody: string, signature: string) {
    return this.paddle.webhooks.unmarshal(rawBody, PADDLE_SUBSCRIPTION_WEBHOOK_SECRET, signature);
  }

  async listTransactions(query: { after?: string; per_page?: number; status?: string } = {}) {
    try {
      const params: Record<string, any> = {};
      if (query.after) params.after = query.after;
      if (query.per_page) params.perPage = query.per_page;
      if (query.status) params.status = query.status;

      const transactions = this.paddle.transactions.list(params);
      const page = await transactions.next();
      return page;
    } catch (error: any) {
      throw this.handlePaddleError(error, 'Failed to fetch transactions from Paddle');
    }
  }

  // ──────────────────────────────────────────────
  // Controller-facing Webhook Delegates
  // ──────────────────────────────────────────────

  async processCreationWebhook(rawBody: string, signature: string): Promise<void> {
    if (!rawBody || !signature) {
      logger.warn('[paddle-webhook] Missing raw body or signature');
      return;
    }

    try {

      const event = await this.verifyCreationWebhook(rawBody, signature);
      const eventType = event.eventType;
      const data = event.data || {};
      const email = data.email;

      if (eventType !== 'customer.created') {
        logger.warn(`[paddle-webhook] Ignoring non-customer.created event: ${eventType}`);
        return;
      }

      if (!email) {
        logger.warn('[paddle-webhook] Missing email in customer.created event');
      }
      await this.signUp({
        email,
        fullName: data.name || email.split('@')[0],
        customerId: data.id || '',
        subscriptionId: '',
        source: 'paddle',
      });


    } catch (err) {
      logger.error('[paddle-webhook] Creation webhook processing error:', err);
    }

  }

  async processSubscriptionWebhook(rawBody: string, signature: string): Promise<WebhookResult | void> {
    if (!rawBody || !signature) {
      logger.warn('[paddle-webhook] Missing raw body or signature');
      return;
    }

    try {
      const event = await this.verifySubscriptionWebhook(rawBody, signature) as any;
      const eventType = event.eventType;
      const data = event.data || {};
      const customerId = data.customerId;

      if (!customerId) {
        logger.warn(`[paddle-webhook] Missing customerId in subscription event: ${eventType}`);
        return;
      }

      const subscriptionId = data.id || '';

      if (eventType === 'subscription.created' || eventType === 'subscription.activated') {
        try {
          await this.syncSubscriptionFromPaddle({ customerId, subscriptionId, event });
          logger.info(`[paddle-webhook] Subscription event processed: ${eventType} for customerId: ${customerId}`);
          return;
        } catch (err: any) {
          logger.error(`[paddle-webhook] Error processing subscription event: ${eventType} for customerId: ${customerId}`, err);
        }
      }

      if (eventType === 'subscription.updated') {
        try {
          const user = await this.updateSubscriptionFromPaddle({ customerId, subscriptionId, event });

          if (!user) {
            const customer = await this.findCustomer(customerId);
            if (!customer?.email) {
              logger.warn(`[paddle-webhook] Customer not resolvable for subscription.updated event: ${eventType} for customerId: ${customerId}`);
              return;
            }

            await this.signUp({
              email: customer?.email,
              fullName: customer?.name || customer?.email?.split('@')[0],
              customerId,
              subscriptionId,
              source: 'paddle',
            });

            await this.updateSubscriptionFromPaddle({ customerId, subscriptionId, event });
          }

          return { handled: true };
        } catch (err: any) {
          return { handled: false, reason: err.message };
        }
      }

      if (eventType === 'subscription.canceled') {
        try {
          await this.cancelSubscriptionFromPaddle({ customerId, subscriptionId });
          return { handled: true };
        } catch (err: any) {
          return { handled: false, reason: err.message };
        }
      }

      return { handled: true, reason: `Subscription event acknowledged: ${eventType}` };


    } catch (err) {
      logger.error('[paddle-webhook] Subscription webhook processing error:', err);
    }
  }

  async listTransactionsFromQuery(query: Record<string, any>) {
    const after = query.after as string | undefined;
    const perPage = query.per_page ? parseInt(query.per_page as string, 10) : undefined;
    const status = query.status as string | undefined;
    return this.listTransactions({ after, per_page: perPage, status });
  }
  private async signUp(input: PaddleSignUpInput): Promise<{ user: any }> {
    const existingUser = await this.authRepository.findByEmail(input.email);

    if (existingUser) {
      const existingSub = await this.subscriptionsRepository.findOne({ userId: existingUser.id });
      if (existingSub) {
        await this.subscriptionsRepository.update(existingSub.id, {
          customerId: input.customerId || existingSub.customerId,
          subscriptionId: input.subscriptionId || existingSub.subscriptionId,
        });
      } else {
        await this.subscriptionsRepository.create({
          userId: existingUser.id,
          customerId: input.customerId || '',
          subscriptionId: input.subscriptionId || '',
        });
      }
      const { password: _, ...userWithoutPassword } = existingUser;
      return { user: userWithoutPassword };
    }

    const placeholderHash = await bcrypt.hash(uuidv4(), 1);

    const user = await this.authRepository.createUserWithRole({
      email: input.email,
      passwordHash: placeholderHash,
      firstName: input.fullName,
      lastName: '',
      isRegComplete: false,
      source: 'paddle',
      roleSlug: 'client',
    });

    await this.subscriptionsRepository.create({
      userId: user.id,
      customerId: input.customerId || '',
      subscriptionId: input.subscriptionId || '',
    });

    const roles = user.userRoles?.map((ur: any) => ur.role.slug) ?? [];
    const token = generateTokens({ userId: user.id, email: user.email, roles });
    await sendRegistrationEmail({ token, fullName: user.firstName, email: user.email });
    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword };
  }

  private handlePaddleError(error: any, fallbackMessage: string): never {
    if (error instanceof ApiError) {
      const code = error.code;

      if (code === 'invalid_token' || code === 'authentication_malformed' || code === 'authentication_missing') {
        throw new UnauthorizedError('Paddle API authentication failed. Check your API key.');
      }
      if (code === 'forbidden') {
        throw new ForbiddenError('Paddle API permission denied. Check your API key permissions.');
      }
      if (code === 'too_many_requests') {
        throw new ServerError('Paddle API rate limit exceeded. Please try again later.');
      }

      throw new ServerError(`Paddle API error: ${error.detail || error.message || fallbackMessage}`);
    }

    throw new ServerError(fallbackMessage);
  }
}
