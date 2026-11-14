/**
 * Payment gateway abstraction. The mock gateway simulates a card charge so the
 * full order flow works end-to-end; swap in a real implementation
 * (Stripe, Paymob, Moyasar…) behind the same interface later.
 */

export interface ChargeResult {
  ok: boolean;
  provider: string;
  txn_id: string | null;
  reason?: string;
}

export interface PaymentGateway {
  readonly name: string;
  charge(amountMinor: number, orderRef: string): Promise<ChargeResult>;
}

export const mockGateway: PaymentGateway = {
  name: 'mock',
  async charge(amountMinor: number, orderRef: string): Promise<ChargeResult> {
    if (amountMinor <= 0) {
      return {ok: false, provider: 'mock', txn_id: null, reason: 'INVALID_AMOUNT'};
    }
    return {ok: true, provider: 'mock', txn_id: `TXN-MOCK-${orderRef}`};
  },
};
