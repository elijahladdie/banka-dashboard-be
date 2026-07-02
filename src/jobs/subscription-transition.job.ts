import { SubscriptionsService } from '../services/subscriptions.service';
import logger from '../utils/logger';

async function run() {
  logger.info('[subscription-transition-job] Starting pending transition processing');

  const subscriptionsService = new SubscriptionsService();

  try {
    const activated = await subscriptionsService.processPendingTransitions();
    logger.info(`[subscription-transition-job] Completed. Activated ${activated} pending transitions.`);
  } catch (err: any) {
    logger.error('[subscription-transition-job] Failed to process transitions:', err);
    process.exit(1);
  }

  process.exit(0);
}

run();
