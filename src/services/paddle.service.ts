import { ApiError, Customer, ListProductQueryParameters } from '@paddle/paddle-node-sdk';
import bcrypt from 'bcryptjs';
import paddle from '../helpers/paddle';
import { v4 as uuidv4 } from 'uuid';
import { AuthRepository } from '../repositories/implementations/auth.repository';
import { SubscriptionsRepository } from '../repositories/implementations/subscriptions.repository';
import { ForbiddenError, ServerError, UnauthorizedError } from '../helpers';
import { ProductQuery, WebhookResult, UpdateActivationInput, SignUpInput } from '../types';
import { generateTokens, mapProductToClientResponse, formatSubscription } from '../helpers/helper';
import { sendRegistrationEmail } from './email.service';
import { buildSubscriptionUpdateData, isSubscriptionChanged, getRankComparison, sendPlanChangeNotification, extractWebhookPayload } from '../helpers/subscriptions.helper';
import logger from '../utils/logger';

export class PaddleService {
  private readonly authRepository: AuthRepository;
  private readonly subscriptionsRepository: SubscriptionsRepository;

  constructor() {
    this.authRepository = new AuthRepository();
    this.subscriptionsRepository = new SubscriptionsRepository();
  }

  async updateActivation({ customerId, subscriptionId, event }: { customerId: string; subscriptionId: string; event: Record<string, any> }): Promise<any> {
    const subscription = await this.subscriptionsRepository.findOne({ customerId });
    if (!subscription) return null;

    const { subscription: normalized, previousPlan, previousInterval, newPlan, newInterval } = buildSubscriptionUpdateData(event, subscription);

    await this.subscriptionsRepository.update(subscription.id, {
      subscriptionId, plan: newPlan, status: normalized.status,
      startsAt: normalized.startsAt, endsAt: normalized.endsAt,
      canceledAt: normalized.canceledAt, billingInterval: newInterval,
      metadata: { currency: normalized.currency, amount: normalized.amount, billingCycle: normalized.billingCycle, event: event.eventType },
    });

    const user = await this.authRepository.findById(subscription.userId);
    if (!user) return null;

    const { isUpgrade } = getRankComparison(previousPlan, newPlan, previousInterval, newInterval);
    if (isSubscriptionChanged(previousPlan, newPlan, previousInterval, newInterval)) {
      await sendPlanChangeNotification(user, previousPlan, newPlan, previousInterval, newInterval, isUpgrade);
    }
    return user;
  }

  async cancelSubscription({ customerId, subscriptionId }: any): Promise<void> {
    const subscription = await this.subscriptionsRepository.findOne({ customerId });
    if (!subscription) return;
    await this.subscriptionsRepository.update(subscription.id, { status: 'CANCELED', subscriptionId });
  }

  async listProducts(query: ProductQuery = {}) {
    try {
      const params: ListProductQueryParameters = {};
      const interval = query.interval || 'year';
      const products = (await paddle.products.list({ ...params, include: ['prices'] }).next());
      return (products || [])
        .map((product: any) => mapProductToClientResponse(product, interval))
        .filter(Boolean);
    } catch (error: any) {
      throw this.handlePaddleError(error, 'Failed to fetch products from Paddle');
    }
  }

  async updateSubscription(subscriptionId: string, priceId: string) {
    try {
      return await paddle.subscriptions.update(subscriptionId, {
        items: [{ priceId, quantity: 1 }], prorationBillingMode: 'prorated_immediately',
      });
    } catch (error: any) {
      throw this.handlePaddleError(error, 'Failed to update subscription');
    }
  }

  async listTransactions(query: { after?: string; per_page?: number; status?: string } = {}) {
    try {
      const params: Record<string, any> = {};
      if (query.after) params.after = query.after;
      if (query.per_page) params.perPage = query.per_page;
      if (query.status) params.status = query.status;
      return await (await paddle.transactions.list(params).next());
    } catch (error) {
      throw this.handlePaddleError(error, 'Failed to fetch transactions from Paddle');
    }
  }

  async subscriptionCreation(event: Record<string, any>): Promise<void> {
    const data = event.data || {};
    const email = data.email;
    await this.signUp({ email, firstName: data.name || email.split('@')[0], customerId: data.id || '', subscriptionId: '', source: 'paddle' });
  }

  async subscriptionActivation(event: Record<string, any>): Promise<WebhookResult | void> {
    try {
      const payload = extractWebhookPayload(event);
      switch (event.eventType) {
        case 'subscription.created':
        case 'subscription.activated':
          return this.syncActivatedSubscription(payload);
        case 'subscription.updated':
          return this.updateSubscriptionActivation(payload);
        case 'subscription.canceled':
          return this.cancelSubscription(payload);
        default:
          logger.info(`[paddle-webhook] Unhandled subscription event type: ${event.eventType}`);
          return { handled: true, reason: `Subscription event acknowledged: ${event.eventType}` };
      }
    } catch (err) {
      logger.error('[paddle-webhook] Subscription webhook processing error:', err);
      return { handled: false, reason: err instanceof Error ? err.message : 'Unknown error' };
    }
  }



  async getTransactions(query: Record<string, any>) {
    const after = query.after as string | undefined;
    const perPage = query.per_page ? parseInt(query.per_page as string, 10) : undefined;
    const status = query.status as string | undefined;
    return this.listTransactions({ after, per_page: perPage, status });
  }

  private async syncActivatedSubscription({ customerId, subscriptionId, event }: { customerId: string; subscriptionId: string; event: Record<string, any> }): Promise<void> {
    try {
      const sub = await this.subscriptionsRepository.findOne({ customerId });
      if (!sub) return;
      const normalized = formatSubscription(event);
      await this.subscriptionsRepository.update(sub.id, {
        subscriptionId, plan: normalized.product, status: normalized.status,
        startsAt: normalized.startsAt, endsAt: normalized.endsAt,
        billingInterval: normalized.billingCycle?.interval || 'month',
      });
      logger.info(`[paddle-webhook] Subscription event processed: ${event.eventType} for customerId: ${customerId}`);
      return;
    } catch (err) {
      logger.error(`[paddle-webhook] Error processing subscription event: ${event.eventType} for customerId: ${customerId}`, err);
    }
  }

  private async updateSubscriptionActivation(input: UpdateActivationInput): Promise<WebhookResult> {
    const { customerId, subscriptionId, event } = input;
    try {
      const user = await this.updateActivation({ customerId, subscriptionId, event });
      if (user) return { handled: true };

      const customer = await this.findCustomer(customerId);
      if (!customer) return { handled: true };

      await this.signUp({ email: customer.email, firstName: customer.name || customer.email.split('@')[0], customerId, subscriptionId, source: 'paddle' });
      await this.updateActivation({ customerId, subscriptionId, event });
      return { handled: true };
    } catch (err: any) {
      logger.error(`[paddle-webhook] Error processing subscription update for customerId: ${customerId}`, err);
      return { handled: false, reason: err.message };
    }
  }

  private async signUp(input: SignUpInput): Promise<{ user: any }> {
    const existingUser = await this.authRepository.findByEmail(input.email);
    if (existingUser) {
      const existingSub = await this.subscriptionsRepository.findOne({ userId: existingUser.id });
      if (existingSub) {
        await this.subscriptionsRepository.update(existingSub.id, { customerId: input.customerId || existingSub.customerId, subscriptionId: input.subscriptionId || existingSub.subscriptionId });
      } else {
        await this.subscriptionsRepository.create({ userId: existingUser.id, customerId: input.customerId || '', subscriptionId: input.subscriptionId || '' });
      }
      const { password: _, ...userWithoutPassword } = existingUser;
      return { user: userWithoutPassword };
    }

    const placeholderHash = await bcrypt.hash(uuidv4(), 1);
    const user = await this.authRepository.createUserWithRole({
      email: input.email, password: placeholderHash,
      firstName: input.firstName, lastName: input.lastName || '',
      isRegComplete: false, source: 'paddle', roleSlug: 'client',
    });

    await this.subscriptionsRepository.create({ userId: user.id, customerId: input.customerId || '', subscriptionId: input.subscriptionId || '' });

    const roles = user.userRoles?.map((ur: any) => ur.role.slug) ?? [];
    const token = generateTokens({ userId: user.id, email: user.email, roles });
    await sendRegistrationEmail({ token, fullName: user.firstName, email: user.email });
    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword };
  }


  private async findCustomer(customerId: string): Promise<Customer | null> {
    try {
      const customer = await paddle.customers.get(customerId);
      if (!customer.email) {
        logger.warn(`Customer with ID ${customerId} has no email associated.`);
        return null;
      }
      return customer;
    } catch (error: any) {
      if (error instanceof ApiError && error.code === 'not_found') {
        return null;
      }
      throw this.handlePaddleError(error, `Failed to fetch Paddle customer ${customerId}`);
    }
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
