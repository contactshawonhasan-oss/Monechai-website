// Future gateway contract only. COD does not implement these operations or claim
// payment has been collected. Any provider needs verified credentials and signed
// webhooks; only server code may transition payment status.
export type GatewayPaymentState = "pending" | "paid" | "failed" | "refunded";
export interface PaymentProvider {
  createPayment(orderId: string): Promise<{ redirectUrl: string }>;
  verifyPayment(providerReference: string): Promise<{ orderId: string; status: GatewayPaymentState }>;
  handleWebhook(rawBody: Uint8Array, signature: string): Promise<{ orderId: string; status: GatewayPaymentState }>;
  refundPayment(orderId: string, amountMinor: number): Promise<{ providerReference: string }>;
}
