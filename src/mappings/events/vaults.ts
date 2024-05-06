import { VaultsMetricsDaily, VaultManagerMetrics, VaultManagerMetricsDaily, VaultManagerGovernance, Wallet, Vault } from "../../types";
import { VAULT_STATES } from "../constants";
import { dateToDayKey, extractBrand } from "../utils";

export const vaultsEventKit = (block: any, data: any, module: string, path: string) => {
  async function saveVaultManagerGovernance(payload: any): Promise<Promise<any>[]> {
    const vaultManagerGovernance = new VaultManagerGovernance(
      path,
      BigInt(data.blockHeight),
      block.block.header.time as any,
      BigInt(payload.current.DebtLimit.value.__value),
      BigInt(payload.current.InterestRate.value?.denominator.__value ?? 0),
      BigInt(payload.current.InterestRate.value?.numerator.__value ?? 0),
      BigInt(payload.current.LiquidationMargin.value?.denominator.__value ?? 0),
      BigInt(payload.current.LiquidationMargin.value?.numerator.__value ?? 0),
      BigInt(payload.current.LiquidationPadding.value?.denominator.__value ?? 0),
      BigInt(payload.current.LiquidationPadding.value?.numerator.__value ?? 0),
      BigInt(payload.current.LiquidationPenalty.value?.denominator.__value ?? 0),
      BigInt(payload.current.LiquidationPenalty.value?.numerator.__value ?? 0),
      BigInt(payload.current.MintFee.value?.denominator.__value ?? 0),
      BigInt(payload.current.MintFee.value?.numerator.__value ?? 0)
    ).save();

    return [vaultManagerGovernance];
  }

  async function saveWallets(payload: any): Promise<Promise<any>[]> {
    const promises: Promise<void>[] = [];
    const address = path.split(".")[2];
    const wallet = new Wallet(path, BigInt(data.blockHeight), block.block.header.time as any, address);

    if (payload.offerToPublicSubscriberPaths) {
      for (let i = 0; i < payload.offerToPublicSubscriberPaths.length; i++) {
        const [_, { vault: vaultId }] = payload.offerToPublicSubscriberPaths[i] as [string, { vault: string }];

        let vault = await Vault.get(vaultId);
        if (!vault) {
          vault = new Vault(vaultId, BigInt(data.blockHeight), block.block.header.time as any, wallet.id);
        }
        vault.walletId = wallet.id;
        promises.push(vault.save());
      }
    }
    promises.push(wallet.save());
    return promises;
  }

  async function saveVaults(payload: any): Promise<Promise<any>[]> {
    let vault = await Vault.get(path);
    let active = 0;
    let closed = 0;
    let liquidating = 0;
    let liquidated = 0;


    if (!vault) {
      vault = new Vault(path, BigInt(data.blockHeight), block.block.header.time as any, "");
    }

    vault.coin = payload?.locked?.__brand;
    vault.denom = payload?.locked?.__brand;
    vault.debt = payload?.debtSnapshot?.debt?.__value;
    vault.balance = payload?.locked?.__value;
    vault.lockedValue = payload?.locked?.__value;
    vault.state = payload?.vaultState;

    if (vault.state === VAULT_STATES.LIQUIDATING && !vault.liquidatingAt) {
      vault.liquidatingAt = block.block.header.time;
      vault.liquidating = true;
      liquidating = 1;
    }

    if (vault.state === VAULT_STATES.LIQUIDATED && !vault.liquidatedAt) {
      vault.liquidatedAt = block.block.header.time;
      vault.liquidated = true;
      liquidated = 1;
    }

    if (vault.state === VAULT_STATES.ACTIVE && !vault.active) {
      vault.active = true;
      active = 1;
    }

    if (vault.state === VAULT_STATES.CLOSED && !vault.closed) {
      vault.closed = true;
      closed = 1;
    }

    const metrics = saveVaultsMetricsDaily(active, closed, liquidated, liquidating);

    return [metrics, vault.save()];
  }

  async function saveVaultsMetricsDaily(active: number, closed: number, liquidated: number, liquidating: number): Promise<any> {
    const dateKey = dateToDayKey(block.block.header.time);
    const metrics = await getVaultsMetricsDaily(dateKey);
    metrics.numActiveVaultsLast = BigInt(active) + BigInt(metrics.numActiveVaultsLast ?? 0);
    metrics.numClosedVaultsLast = BigInt(closed) + BigInt(metrics.numClosedVaultsLast ?? 0);
    metrics.numLiquidatedVaultsLast = BigInt(liquidated) + BigInt(metrics.numLiquidatedVaultsLast ?? 0);
    metrics.numLiquidatingVaultsLast = BigInt(liquidating) + BigInt(metrics.numLiquidatingVaultsLast ?? 0);
    return metrics.save();
  }

  async function getVaultsMetricsDaily(dateKey: number): Promise<VaultsMetricsDaily> {
    const id = `vaults:${dateKey}`;
    let state = await VaultsMetricsDaily.get(id);
    if (!state) {
      state = new VaultsMetricsDaily(id, dateKey);
      return state;
    }
    return state;
  }

  async function saveVaultManagerMetrics(payload: any): Promise<Promise<any>[]> {
    saveVaultManagerMetricsDaily(payload);

    const vaultManagerMetric = new VaultManagerMetrics(
      path,
      BigInt(data.blockHeight),
      block.block.header.time as any,
      extractBrand(payload.liquidatingCollateral.__brand),
      BigInt(payload.liquidatingCollateral.__value),
      extractBrand(payload.liquidatingDebt.__brand),
      BigInt(payload.liquidatingDebt.__value),
      BigInt(payload.lockedQuote?.denominator.__value ?? 0),
      BigInt(payload.lockedQuote?.numerator.__value ?? 0),
      BigInt(payload.numActiveVaults),
      BigInt(payload.numLiquidatingVaults),
      BigInt(payload.numLiquidationsAborted),
      BigInt(payload.numLiquidationsCompleted),
      BigInt(payload.retainedCollateral.__value),
      BigInt(payload.totalCollateral.__value),
      BigInt(payload.totalCollateralSold.__value),
      BigInt(payload.totalDebt.__value),
      BigInt(payload.totalOverageReceived.__value),
      BigInt(payload.totalProceedsReceived.__value),
      BigInt(payload.totalShortfallReceived.__value)
    );
    return [vaultManagerMetric.save()];
  }

  async function saveVaultManagerMetricsDaily(payload: any): Promise<Promise<any>[]> {
    const dateKey = dateToDayKey(block.block.header.time);

    const state = await getVaultManagerMetricsDaily(path, dateKey);

    state.liquidatingCollateralBrand = extractBrand(payload.liquidatingCollateral.__brand);
    state.liquidatingDebtBrand = extractBrand(payload.liquidatingDebt.__brand);

    state.liquidatingCollateralValueLast = BigInt(payload.liquidatingCollateral.__value);
    state.liquidatingDebtValueLast = BigInt(payload.liquidatingDebt.__value);
    state.lockedQuoteDenominatorLast = BigInt(payload.lockedQuote?.denominator.__value ?? 0);
    state.lockedQuoteNumeratorLast = BigInt(payload.lockedQuote?.numerator.__value ?? 0);
    state.numActiveVaultsLast = BigInt(payload.numActiveVaults);
    state.numLiquidatingVaultsLast = BigInt(payload.numLiquidatingVaults);
    state.numLiquidationsAbortedLast = BigInt(payload.numLiquidationsAborted);
    state.numLiquidationsCompletedLast = BigInt(payload.numLiquidationsCompleted);
    state.retainedCollateralLast = BigInt(payload.retainedCollateral.__value);
    state.totalCollateralLast = BigInt(payload.totalCollateral.__value);
    state.totalCollateralSoldLast = BigInt(payload.totalCollateralSold.__value);
    state.totalDebtLast = BigInt(payload.totalDebt.__value);
    state.totalOverageReceivedLast = BigInt(payload.totalOverageReceived.__value);
    state.totalProceedsReceivedLast = BigInt(payload.totalProceedsReceived.__value);
    state.totalShortfallReceivedLast = BigInt(payload.totalShortfallReceived.__value);

    state.metricsCount = (state.metricsCount ?? BigInt(0)) + BigInt(1);
    return [state.save()];
  }

  async function getVaultManagerMetricsDaily(path: string, dateKey: number): Promise<VaultManagerMetricsDaily> {
    const id = `${path}:${dateKey}`;
    let state = await VaultManagerMetricsDaily.get(id);
    if (!state) {
      state = new VaultManagerMetricsDaily(id, path, dateKey, BigInt(data.blockHeight), block.block.header.time as any);
      return state;
    }
    return state;
  }

  return {
    saveVaultManagerGovernance,
    saveWallets,
    saveVaults,
    saveVaultManagerMetrics,
  };
};
