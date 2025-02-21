import type { TransactionRecord } from '@agoric/fast-usdc/src/types';
import type { StreamCell } from '@agoric/internal/src/lib-chainStorage';
import type { CosmosBlock } from '@subql/types-cosmos';
import assert from 'assert';
import { FastUsdcTransaction, FastUsdcTransactionStatus } from '../../types';
// @ts-ignore not there until after codegen, but codegen won't complete if this errors
import { decodeAddressHook } from '@agoric/cosmic-proto/address-hooks.js';

export const transactionEventKit = (block: CosmosBlock, data: StreamCell, module: string, path: string) => {
  async function saveTransaction(payload: TransactionRecord): Promise<Promise<any>[]> {
    logger.info(`saveTransaction ${JSON.stringify(payload)}`);
    // extract the segment after the last period
    const id = path.split('.').pop();
    assert(id, 'saveTransaction must only be called on transaction paths');

    const t = await FastUsdcTransaction.get(id);
    if (!t) {
      assert(payload.status === FastUsdcTransactionStatus.OBSERVED, 'new status without a previous OBSERVED');
      assert(payload['evidence'], 'implied by OBSERVED');
      assert.equal(payload.evidence.txHash, id, 'txHash must match path');
      const decoded = decodeAddressHook(payload.evidence.aux.recipientAddress);
      const { EUD } = decoded.query;
      assert(typeof EUD === 'string', 'EUD must be a string');
      const newT = FastUsdcTransaction.create({
        id,
        eud: EUD,
        sourceAddress: payload.evidence.tx.sender,
        sourceBlockTimestamp: payload.evidence.blockTimestamp,
        sourceChainId: payload.evidence.chainId,
        status: payload.status,
        usdcAmount: payload.evidence.tx.amount,
        risksIdentified: payload.risksIdentified || [],
        heightObserved: block.header.height,
      });
      return [newT.save()];
    }

    // Always update the status and mark the height
    t.status = payload.status;
    t.statusHeight = block.header.height;

    switch (payload.status) {
      case FastUsdcTransactionStatus.OBSERVED:
        throw new Error('OBSERVED for extant transaction');
      case FastUsdcTransactionStatus.DISBURSED:
        t.contractFee = payload.split.ContractFee.value;
        t.poolFee = payload.split.PoolFee.value;
        t.heightDisbursed = block.header.height;
        break;
      default:
      // Nothing more to do than set the status
    }

    return [t.save()];
  }

  return { saveTransaction };
};
