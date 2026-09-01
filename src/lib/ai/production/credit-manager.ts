export interface CreditTransaction {
  idempotencyKey: string;
  projectId: string;
  amount: number;
  status: 'RESERVED' | 'SETTLED' | 'REFUNDED';
  createdAt: string;
  updatedAt: string;
}

export class CreditManager {
  private static transactions: Map<string, CreditTransaction> = new Map();

  /**
   * Reserves credits for a generation job using an idempotency key.
   */
  static reserveCredits(params: {
    idempotencyKey: string;
    projectId: string;
    amount: number;
  }): { success: boolean; transaction: CreditTransaction; isDuplicate: boolean } {
    const { idempotencyKey, projectId, amount } = params;

    const existing = this.transactions.get(idempotencyKey);
    if (existing) {
      return {
        success: true,
        transaction: existing,
        isDuplicate: true,
      };
    }

    const tx: CreditTransaction = {
      idempotencyKey,
      projectId,
      amount,
      status: 'RESERVED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.transactions.set(idempotencyKey, tx);
    return {
      success: true,
      transaction: tx,
      isDuplicate: false,
    };
  }

  /**
   * Settles previously reserved credits upon successful delivery.
   */
  static settleCredits(idempotencyKey: string): CreditTransaction | null {
    const tx = this.transactions.get(idempotencyKey);
    if (!tx) return null;

    tx.status = 'SETTLED';
    tx.updatedAt = new Date().toISOString();
    return tx;
  }

  /**
   * Releases or refunds reserved credits if generation failed before delivering valid asset.
   */
  static refundCredits(idempotencyKey: string, reason = 'GENERATION_FAILED'): CreditTransaction | null {
    const tx = this.transactions.get(idempotencyKey);
    if (!tx) return null;

    tx.status = 'REFUNDED';
    tx.updatedAt = new Date().toISOString();
    return tx;
  }
}
