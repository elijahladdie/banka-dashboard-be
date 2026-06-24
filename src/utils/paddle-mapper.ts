function mapPaddlePrice(price: any) {
  if (!price) return null;

  return {
    id: price.id,
    productId: price.product_id,
    description: price.description,
    name: price.name ?? null,
    type: price.type,
    billingCycle: price.billing_cycle
      ? {
          interval: price.billing_cycle.interval,
          frequency: price.billing_cycle.frequency,
        }
      : null,
    trialPeriod: price.trial_period
      ? {
          interval: price.trial_period.interval,
          frequency: price.trial_period.frequency,
        }
      : null,
    taxMode: price.tax_mode,
    unitPrice: price.unit_price
      ? {
          amount: price.unit_price.amount,
          currencyCode: price.unit_price.currency_code,
        }
      : null,
    unitPriceOverrides: price.unit_price_overrides ?? [],
    quantity: price.quantity
      ? {
          minimum: price.quantity.minimum,
          maximum: price.quantity.maximum,
        }
      : null,
    status: price.status,
    createdAt: price.created_at,
    updatedAt: price.updated_at,
    customData: price.custom_data ?? null,
    importMeta: price.import_meta ?? null,
    product: price.product ?? null,
  };
}

function mapPaddleProduct(product: any) {
  if (!product) return null;

  return {
    id: product.id,
    name: product.name,
    type: product.type,
    description: product.description,
    taxCategory: product.tax_category,
    imageUrl: product.image_url ?? null,
    customData: product.custom_data ?? null,
    status: product.status,
    createdAt: product.created_at,
    updatedAt: product.updated_at,
    importMeta: product.import_meta ?? null,
    prices: (product.prices || []).map(mapPaddlePrice),
  };
}

export function mapPaddleProductsResponse(response: any) {
  if (!response) return response;

  return {
    ...response.meta,
    data: (response.data || []).map(mapPaddleProduct),
  };
}