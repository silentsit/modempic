export type ComboSlideDto = {
  count: number;
  hours: number;
  windowLabel: string;
  productHint?: string;
  productSlug?: string;
  productImageUrl?: string;
};

export type StreamAggregateDto = {
  count: number;
  productHint: string;
  productSlug?: string;
  productImageUrl?: string;
  windowLabel: string;
  windowHours: number;
};

/**
 * Combo and stream-aggregate widgets previously hashed fake purchase counts.
 * They stay empty so the storefront only shows real orders or approved reviews.
 */
export async function generateStreamAggregates(_options?: {
  products?: unknown;
  streamNotificationId?: string;
}): Promise<StreamAggregateDto[]> {
  void _options;
  return [];
}

export async function generateComboSlides(_options: {
  comboNotificationId: string;
  aggregateHours?: number;
  products?: unknown;
}): Promise<ComboSlideDto[]> {
  void _options;
  return [];
}
