/** @file test against agoric-3-proposals:latest */
import { subqlTest } from '@subql/testing';
import {
  BoardAux,
  OraclePrice,
  OraclePriceDaily,
  PsmGovernance,
  PsmMetrics,
  PsmMetricsDaily,
  ReserveAllocationMetrics,
  ReserveAllocationMetricsDaily,
  ReserveMetrics,
  StateChangeEvent,
  Vault,
  VaultManagerGovernance,
  VaultManagerMetrics,
  VaultManagerMetricsDaily,
  VaultStatesDaily,
  Wallet,
} from '../types';

// FIXME observed in A3P:latest but not passing tests
subqlTest(
  'StateChangeEvent in state_change at block 627',
  627,
  [],
  [
    new Wallet(
      'published.wallet.agoric1rwwley550k9mmk6uq6mm6z4udrg8kyuyvfszjk.current',
      BigInt(627),
      new Date('2024-12-09T23:07:18.273Z'),
      'agoric1rwwley550k9mmk6uq6mm6z4udrg8kyuyvfszjk',
    ),
    new StateChangeEvent(
      '627:39:3',
      BigInt(627),
      new Date('2024-12-09T23:07:18.273Z'),
      'published.wallet',
      'published.wallet.agoric1rwwley550k9mmk6uq6mm6z4udrg8kyuyvfszjk.current',
      3,
      '["board05557","board0257","board0074",null,"board05815","board00360"]',
      '{"liveOffers":[["openVault-1733785637736",{"id":"openVault-1733785637736","invitationSpec":{"callPipe":[["getCollateralManager",["$0.Alleged: ATOM brand"]],["makeVaultInvitation"]],"instancePath":["VaultFactory"],"source":"agoricContract"},"proposal":{"give":{"Collateral":{"brand":"$0","value":"+583000000","__brand":"ATOM","__value":"583000000"}},"want":{"Minted":{"brand":"$1.Alleged: IST brand","value":"+3489000000","__brand":"IST","__value":"3489000000"}}}}]],"offerToPublicSubscriberPaths":[["openVault-1733785637736",{"vault":"published.vaultFactory.managers.manager0.vaults.vault4"}]],"offerToUsedInvitation":[["openVault-1733785637736",{"brand":"$2.Alleged: Zoe Invitation brand","value":[{"description":"manager0: MakeVault","handle":"$3.Alleged: InvitationHandle","installation":"$4.Alleged: BundleIDInstallation","instance":"$5.Alleged: InstanceHandle","__handle":"InvitationHandle","__installation":"BundleIDInstallation","__instance":"InstanceHandle"}],"__brand":"Zoe Invitation"}]],"purses":[{"balance":{"brand":"$2","value":[],"__brand":"Zoe Invitation"},"brand":"$2","__brand":"Zoe Invitation"}]}',
    ),
  ],

  'handleStateChangeEvent',
);

const vault = new Vault(
  'published.vaultFactory.managers.manager0.vaults.vault6',
  BigInt(742),
  new Date('2024-12-09 23:13:19.186'),
  'published.wallet.agoric1ee9hr0jyrxhy999y755mp862ljgycmwyp4pl7q.current',
);

vault.balance = BigInt(788000000);
vault.lockedValue = BigInt(788000000);
vault.coin = 'ATOM';
vault.denom = 'ATOM';
vault.debt = BigInt(4745610000);
vault.state = 'active';

subqlTest(
  'Vault and VaultStateDailies at height 742',
  742,
  [],
  [
    vault,
    new VaultStatesDaily(
      '20241209',
      BigInt(742),
      new Date('2024-12-09 23:13:19.186'),
      BigInt(1),
      BigInt(0),
      BigInt(0),
      BigInt(0),
      BigInt(0),
    ),
  ],

  'handleStateChangeEvent',
);

const reserveAllocationMetricsDaily = new ReserveAllocationMetricsDaily(
  'IST:20241216',
  'IST',
  20241216,
  BigInt(1212),
  new Date('2024-12-16T11:42:27.000Z'),
);

reserveAllocationMetricsDaily.denom = 'IST';
reserveAllocationMetricsDaily.key = 'Fee';
reserveAllocationMetricsDaily.valueLast = BigInt(184980868);
reserveAllocationMetricsDaily.metricsCount = BigInt(1);

const vaultManagerMetricsDaily = new VaultManagerMetricsDaily(
  'published.vaultFactory.managers.manager1.metrics:20241216',
  'published.vaultFactory.managers.manager1.metrics',
  20241216,
  BigInt(1212),
  new Date('2024-12-16 11:42:27.202'),
);

vaultManagerMetricsDaily.liquidatingCollateralBrand = 'stATOM';
vaultManagerMetricsDaily.liquidatingDebtBrand = 'IST';
vaultManagerMetricsDaily.liquidatingCollateralValueLast = BigInt(0);
vaultManagerMetricsDaily.liquidatingDebtValueLast = BigInt(0);
vaultManagerMetricsDaily.lockedQuoteDenominatorLast = BigInt(0);
vaultManagerMetricsDaily.lockedQuoteNumeratorLast = BigInt(0);
vaultManagerMetricsDaily.numActiveVaultsLast = BigInt(0);
vaultManagerMetricsDaily.numLiquidatingVaultsLast = BigInt(0);
vaultManagerMetricsDaily.numLiquidationsAbortedLast = BigInt(0);
vaultManagerMetricsDaily.numLiquidationsCompletedLast = BigInt(0);
vaultManagerMetricsDaily.retainedCollateralLast = BigInt(0);
vaultManagerMetricsDaily.totalCollateralLast = BigInt(0);
vaultManagerMetricsDaily.totalCollateralSoldLast = BigInt(0);
vaultManagerMetricsDaily.totalDebtLast = BigInt(0);
vaultManagerMetricsDaily.totalOverageReceivedLast = BigInt(0);
vaultManagerMetricsDaily.totalProceedsReceivedLast = BigInt(0);
vaultManagerMetricsDaily.totalShortfallReceivedLast = BigInt(0);
vaultManagerMetricsDaily.metricsCount = BigInt(1);

subqlTest(
  'VaultManagerGovernance, VaultManagerMetrics, VaultManagerMetricsDaily, ReserveMetrics, \
  ReserveAllocationMetrics, and ReserveAllocationMetricsDaily at block height 1212',
  1212,
  [],
  [
    new VaultManagerGovernance(
      'published.vaultFactory.managers.manager1.governance',
      BigInt(1212),
      new Date('2024-12-16 11:42:27.202'),
      BigInt(1000000000),
      BigInt(100),
      BigInt(1),
      BigInt(100),
      BigInt(150),
      BigInt(100),
      BigInt(25),
      BigInt(100),
      BigInt(1),
      BigInt(10000),
      BigInt(50),
    ),
    new VaultManagerMetrics(
      'published.vaultFactory.managers.manager1.metrics',
      BigInt(1212),
      new Date('2024-12-16 11:42:27.202'),
      'stATOM',
      BigInt(0),
      'IST',
      BigInt(0),
      BigInt(0),
      BigInt(0),
      BigInt(0),
      BigInt(0),
      BigInt(0),
      BigInt(0),
      BigInt(0),
      BigInt(0),
      BigInt(0),
      BigInt(0),
      BigInt(0),
      BigInt(0),
      BigInt(0),
    ),
    vaultManagerMetricsDaily,
    new ReserveMetrics(
      'published.reserve.metrics',
      BigInt(1212),
      new Date('2024-12-16T11:42:27.202Z'),
      BigInt(0),
      BigInt(0),
      BigInt(0),
    ),
    new ReserveAllocationMetrics(
      'IST',
      BigInt(1212),
      new Date('2024-12-16T11:42:27.202Z'),
      'IST',
      'Fee',
      BigInt(184980868),
      'published.reserve.metrics',
    ),
    reserveAllocationMetricsDaily,
  ],
  'handleStateChangeEvent',
);

subqlTest(
  'BoardAux at block 643',
  643,
  [],
  [
    new BoardAux(
      'published.boardAux.board0074',
      BigInt(643),
      new Date('2024-12-09T23:07:37.423Z'),
      'Zoe Invitation',
      'set',
      0,
    ),
    new BoardAux(
      'published.boardAux.board01744',
      BigInt(643),
      new Date('2024-12-09T23:07:37.423Z'),
      'USDT_axl',
      'nat',
      6,
    ),
    new BoardAux('published.boardAux.board0257', BigInt(643), new Date('2024-12-09T23:07:37.423Z'), 'IST', 'nat', 6),
    new BoardAux(
      'published.boardAux.board03040',
      BigInt(643),
      new Date('2024-12-09T23:07:37.423Z'),
      'USDC_axl',
      'nat',
      6,
    ),
  ],

  'handleStateChangeEvent',
);

const oraclePriceDaily = new OraclePriceDaily(
  'ATOM-USD:20241209',
  20241209,
  BigInt(506),
  new Date('2024-12-09T23:03:17.000Z'),
);

oraclePriceDaily.typeInAmountLast = BigInt(1000000);
oraclePriceDaily.typeInAmountSum = BigInt(1000000);
oraclePriceDaily.typeOutAmountLast = BigInt(12010000);
oraclePriceDaily.typeOutAmountSum = BigInt(12010000);
oraclePriceDaily.typeInName = 'ATOM';
oraclePriceDaily.typeOutName = 'USD';
oraclePriceDaily.metricsCount = BigInt(1);

const oraclePrice = new OraclePrice(
  'ATOM-USD',
  BigInt(506),
  new Date('2024-12-09T23:03:17.564Z'),
  'ATOM-USD',
  BigInt(1000000),
  BigInt(12010000),
  'ATOM',
  'USD',
)

subqlTest(
  'oraclePrice at block 506',
  506,
  [],
  [oraclePriceDaily, oraclePrice],

  'handleStateChangeEvent',
);

const psmMetricsDaily = new PsmMetricsDaily(
  'published.psm.IST.USDC_axl.metrics:20241207',
  'published.psm.IST.USDC_axl.metrics',
  20241207,
  BigInt(35),
  new Date('2024-12-07T02:03:32.000Z'),
);

psmMetricsDaily.denom = 'USDC_axl';
psmMetricsDaily.anchorPoolBalanceLast = BigInt(0);
psmMetricsDaily.feePoolBalanceLast = BigInt(0);
psmMetricsDaily.mintedPoolBalanceLast = BigInt(0);
psmMetricsDaily.totalAnchorProvidedLast = BigInt(0);
psmMetricsDaily.totalMintedProvidedLast = BigInt(0);
psmMetricsDaily.metricsCount = BigInt(1);

const psmMetrics = new PsmMetrics(
  'published.psm.IST.USDC_axl.metrics',
  BigInt(35),
  new Date('2024-12-07T02:03:32.920Z'),
  'USDC_axl',
  'USDC_axl',
  BigInt(0),
  BigInt(0),
  BigInt(0),
  BigInt(0),
  BigInt(0),
);

subqlTest('psmMetrics at block 35', 35, [], [psmMetricsDaily, psmMetrics], 'handleStateChangeEvent');

const psmGovernance = new PsmGovernance(
  'published.psm.IST.USDT_axl.governance',
  BigInt(35),
  new Date('2024-12-07T02:03:32.920Z'),
  'USDT_axl',
  'USDT_axl',
  BigInt(1000000000),
  BigInt(10000),
  BigInt(0),
  BigInt(10000),
  BigInt(0),
);

subqlTest('psmGovernance at block 35', 35, [], [psmGovernance], 'handleStateChangeEvent');
