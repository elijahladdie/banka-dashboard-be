import { createHmac, timingSafeEqual } from 'node:crypto';
import logger from '../utils/logger';

export function verifyPaddleSignature(
  rawBody: string,
  paddleSignature: string,
  secret: string,
): boolean {
  const parts = paddleSignature.split(';');
  let ts = '';
  let signature = '';

  for (const part of parts) {
    const [key, value] = part.split('=');
    if (key === 'ts') ts = value;
    if (key === 'h1') signature = value;
  }

  if (!ts || !signature) return false;


  const timestampMs = parseInt(ts, 10) * 1000;
  if (isNaN(timestampMs) || Date.now() - timestampMs > 5_000) {
    logger.warn('[paddle-webhook] Event expired or invalid timestamp (replay protection)');
    return false;
  }


  const signedPayload = `${ts}:${rawBody}`;
  const expectedSignature = createHmac('sha256', secret)
    .update(signedPayload, 'utf-8')
    .digest('hex');

  try {
    return timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex'),
    );
  } catch {
    return false;
  }
}