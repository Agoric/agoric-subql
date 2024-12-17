import {
  VaultManagerMetrics,
  VaultManagerMetricsDaily,
  VaultManagerGovernance,
  Wallet,
  Vault,
  VaultLiquidation,
  VaultStatesDaily,
  OraclePrice,
} from '../../types';
import { VAULT_STATES } from '../constants';
import { dateToDayKey, extractBrand } from '../utils';

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
      BigInt(payload.current.MintFee.value?.numerator.__value ?? 0),
    ).save();

    return [vaultManagerGovernance];
  }

  async function saveWallets(payload: any): Promise<Promise<any>[]> {
    const promises: Promise<void>[] = [];
    const address = path.split('.')[2];
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

  async function updateVaultStatesDaily(
    oldState: string | undefined,
    newState: string,
    blockTime: Date,
    blockHeight: number,
  ): Promise<[VaultStatesDaily, VaultStatesDaily]> {
    let vaultState: VaultStatesDaily | undefined = await VaultStatesDaily.get('latest');

    if (!vaultState) {
      vaultState = new VaultStatesDaily(
        'latest',
        BigInt(blockHeight),
        blockTime,
        BigInt(0),
        BigInt(0),
        BigInt(0),
        BigInt(0),
        BigInt(0),
      );
    }

    const propertyMap = {
      [VAULT_STATES.ACTIVE]: 'active',
      [VAULT_STATES.LIQUIDATED]: 'liquidated',
      [VAULT_STATES.LIQUIDATING]: 'liquidating',
      [VAULT_STATES.CLOSED]: 'closed',
      [VAULT_STATES.LIQUIDATED_CLOSED]: 'liquidatedClosed',
    };

    vaultState.blockHeightLast = BigInt(blockHeight);
    vaultState.blockTimeLast = blockTime;

    if (oldState && propertyMap[oldState]) {
      const oldProperty = propertyMap[oldState];
      if ((vaultState as any)[oldProperty] === BigInt(0)) {
        throw Error(oldState + ' vaults are 0. cannot subtract more');
      }
      (vaultState as any)[oldProperty] -= BigInt(1);
    }

    // handle liquidated -> closed = liquidatedClosed
    const newStateModified =
      oldState === VAULT_STATES.LIQUIDATED && newState === VAULT_STATES.CLOSED
        ? VAULT_STATES.LIQUIDATED_CLOSED
        : newState;

    if (newStateModified && propertyMap[newStateModified]) {
      const newProperty = propertyMap[newStateModified];
      (vaultState as any)[newProperty] += BigInt(1);
    }

    const dateKey = dateToDayKey(blockTime).toString();
    const vaultStateToday = VaultStatesDaily.create(vaultState);
    vaultStateToday.id = dateKey;

    return [vaultState, vaultStateToday];
  }

  async function saveVaults(payload: any): Promise<Promise<any>[]> {
    let vault = await Vault.get(path);
    const [latestVaultState, dailyVaultState] = await updateVaultStatesDaily(
      vault?.state,
      payload?.vaultState,
      block.block.header.time,
      data.blockHeight,
    );
    if (!vault) {
      vault = new Vault(path, BigInt(data.blockHeight), block.block.header.time as any, '');
    }

    vault.coin = payload?.locked?.__brand;
    vault.denom = payload?.locked?.__brand;
    vault.debt = BigInt(payload?.debtSnapshot?.debt?.__value);
    vault.balance = BigInt(payload?.locked?.__value);
    vault.lockedValue = BigInt(payload?.locked?.__value);
    vault.state = payload?.vaultState;

    let liquidation: Promise<any> = Promise.resolve();
    if (vault.state === VAULT_STATES.LIQUIDATING || vault.state === VAULT_STATES.LIQUIDATED) {
      liquidation = await saveVaultsLiquidation(payload);
    }

    return [liquidation, vault.save(), latestVaultState.save(), dailyVaultState.save()];
  }

  async function saveVaultsLiquidation(payload: any): Promise<any> {
    const id = `${path}-${payload?.vaultState}`;
    const liquidatingId = `${path}-${VAULT_STATES.LIQUIDATING}`;

    const denom = payload?.locked?.__brand;

    let vault = await VaultLiquidation.get(id);
    if (!vault) {
      vault = new VaultLiquidation(
        id,
        BigInt(data.blockHeight),
        block.block.header.time as any,
        '',
        path,
        liquidatingId,
      );
    }

    const pathRegex = /^(published\.vaultFactory\.managers\.manager[0-9]+)\.vaults\.vault[0-9]+$/;
    const pathRegexMatch = path.match(pathRegex);
    if (!pathRegexMatch) {
      throw new Error('path format is invalid');
    }
    const vaultGovernanceId = pathRegexMatch[1] + '.governance';
    const vaultManagerGovernance = await VaultManagerGovernance.get(vaultGovernanceId);

    const oraclPriceId = `${denom}-USD`;
    const oraclePrice = await OraclePrice.get(oraclPriceId);

    if (vaultManagerGovernance && vault.vaultManagerGovernance === undefined)
      vault.vaultManagerGovernance = {
        liquidationMarginNumerator: vaultManagerGovernance.liquidationMarginNumerator,
        liquidationMarginDenominator: vaultManagerGovernance.liquidationMarginDenominator,
      };

    if (oraclePrice && vault.oraclePrice === undefined)
      vault.oraclePrice = {
        typeInAmount: oraclePrice.typeInAmount,
        typeOutAmount: oraclePrice.typeOutAmount,
      };

    vault.coin = denom;
    vault.denom = denom;
    vault.debt = payload?.debtSnapshot?.debt?.__value;
    vault.balance = payload?.locked?.__value;
    vault.lockedValue = payload?.locked?.__value;
    vault.state = payload?.vaultState;
    return vault.save();
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
      BigInt(payload.totalShortfallReceived.__value),
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
