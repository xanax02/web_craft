export interface PolarWebhookEvent<TData = unknown> {
  id: string | number;
  type: string;
  data: TData;
}

export type ReceivedEvent = PolarWebhookEvent<unknown>;

export const isPolarWebhookEvent = (
  x: unknown,
): x is PolarWebhookEvent<unknown> => {
  return (
    !!x &&
    typeof x === "object" &&
    "type" in (x as Record<string, unknown>) &&
    "data" in (x as Record<string, unknown>)
  );
};

export interface PolarCustomer {
  id: string;
  email: string | null;
}

export interface PolarPrice {
  id?: string | null;
  recurring_interval?: string | null;
}

export interface PolarProduct {
  id?: string | null;
  name?: string | null;
}

export interface PolarSubsription {
  id: string;
  status: string;
  current_period_end?: string | null;
  trail_ends_at?: string | null;
  cancel_at?: string | null;
  canceled_at?: string | null;
  customer?: PolarCustomer | null;
  product_id?: string | null;
  product?: PolarProduct | null;
  prices?: PolarPrice[] | null;
  seats?: number | null;
  plan_code?: string | null;
  metadata?: Record<string, unknown> | null;
}
