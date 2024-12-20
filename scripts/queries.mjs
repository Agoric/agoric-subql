const buildFilter = (filters) => {
  const filterStrings = Object.entries(filters).map(([key, value]) => {
    return `${key}: {equalTo: "${value}"}`;
  });
  return `(filter: {${filterStrings.join(', ')}})`;
};

export const getQuery = (entity, filters) => {
  const filterString = buildFilter(filters);

  const queries = {
    vaults: `query {
        vaults ${filterString} {
            nodes {
              balance
              lockedValue
              coin
              denom
              debt
              state
            }
        }
    }`,
    vaultStatesDailies: `query {
      vaultStatesDailies ${filterString} {
          nodes {
              active
              closed
              liquidating
              liquidated
            }
          }
      }`,
    vaultManagerGovernances: `query {
          vaultManagerGovernances ${filterString} {
              nodes {
                id
                debtLimit
                interestRateDenominator
                interestRateNumerator
                liquidationMarginDenominator
                liquidationMarginNumerator
                liquidationPaddingDenominator
                liquidationPaddingNumerator
                liquidationPenaltyDenominator
                liquidationPenaltyNumerator
                mintFeeDenominator
                mintFeeNumerator
              }
          }
      }`,
    vaultManagerMetrics: `query {
          vaultManagerMetrics ${filterString} {
              nodes {
                id
                liquidatingCollateralBrand
                liquidatingCollateralValue
                liquidatingDebtBrand
                liquidatingDebtValue
                lockedQuoteDenominator
                lockedQuoteNumerator
                numActiveVaults
                numLiquidatingVaults
                numLiquidationsAborted
                numLiquidationsCompleted
                retainedCollateral
                totalCollateral
                totalCollateralSold
                totalDebt
                totalOverageReceived
                totalProceedsReceived
                totalShortfallReceived
              }
          }
      }`,
    vaultManagerMetricsDailies: `query {
          vaultManagerMetricsDailies ${filterString} {
              nodes {
                path
                liquidatingCollateralBrand
                liquidatingDebtBrand
                liquidatingCollateralValueLast
                liquidatingDebtValueLast
                lockedQuoteDenominatorLast
                lockedQuoteNumeratorLast
                numActiveVaultsLast
                numLiquidatingVaultsLast
                numLiquidationsAbortedLast
                numLiquidationsCompletedLast
                retainedCollateralLast
                totalCollateralLast
                totalCollateralSoldLast
                totalDebtLast
                totalOverageReceivedLast
                totalProceedsReceivedLast
                totalShortfallReceivedLast
                metricsCount
              }
          }
      }`,
    reserveMetrics: `query {
          reserveMetrics ${filterString} {
              nodes {
                id
                shortfallBalance
                totalFeeBurned
                totalFeeMinted
              }
          }
      }`,
    reserveAllocationMetrics: `query {
          reserveAllocationMetrics ${filterString} {
              nodes {
                id
                denom
                key
                value
              }
          }
      }`,
    reserveAllocationMetricsDailies: `query {
          reserveAllocationMetricsDailies ${filterString} {
              nodes {
                denom
                key
                valueLast
                metricsCount
              }
          }
      }`,
  };

  return queries[entity];
};

export const expectations = {
  vaults: {
    balance: '788000000',
    lockedValue: '788000000',
    coin: 'ATOM',
    denom: 'ATOM',
    debt: '4745610000',
    state: 'active',
  },
  vaultStatesDailies: {
    active: '7',
    closed: '3',
    liquidating: '0',
    liquidated: '0',
  },
  vaultManagerGovernances: {
    id: 'published.vaultFactory.managers.manager1.governance',
    debtLimit: '1000000000',
    interestRateDenominator: '100',
    interestRateNumerator: '1',
    liquidationMarginDenominator: '100',
    liquidationMarginNumerator: '150',
    liquidationPaddingDenominator: '100',
    liquidationPaddingNumerator: '25',
    liquidationPenaltyDenominator: '100',
    liquidationPenaltyNumerator: '1',
    mintFeeDenominator: '10000',
    mintFeeNumerator: '50',
  },
  vaultManagerMetrics: {
    liquidatingCollateralBrand: 'stATOM',
    liquidatingCollateralValue: '0',
    liquidatingDebtBrand: 'IST',
    liquidatingDebtValue: '0',
    lockedQuoteDenominator: '0',
    lockedQuoteNumerator: '0',
    numActiveVaults: '0',
    numLiquidatingVaults: '0',
    numLiquidationsAborted: '0',
    numLiquidationsCompleted: '0',
    retainedCollateral: '0',
    totalCollateral: '0',
    totalCollateralSold: '0',
    totalDebt: '0',
    totalOverageReceived: '0',
    totalProceedsReceived: '0',
    totalShortfallReceived: '0',
  },
  vaultManagerMetricsDailies: {
    path: 'published.vaultFactory.managers.manager1.metrics',
    liquidatingCollateralBrand: 'stATOM',
    liquidatingDebtBrand: 'IST',
    liquidatingCollateralValueLast: '0',
    liquidatingDebtValueLast: '0',
    lockedQuoteDenominatorLast: '0',
    lockedQuoteNumeratorLast: '0',
    numActiveVaultsLast: '0',
    numLiquidatingVaultsLast: '0',
    numLiquidationsAbortedLast: '0',
    numLiquidationsCompletedLast: '0',
    retainedCollateralLast: '0',
    totalCollateralLast: '0',
    totalCollateralSoldLast: '0',
    totalDebtLast: '0',
    totalOverageReceivedLast: '0',
    totalProceedsReceivedLast: '0',
    totalShortfallReceivedLast: '0',
    metricsCount: '1',
  },
  reserveMetrics: {
    id: 'published.reserve.metrics',
    shortfallBalance: '0',
    totalFeeBurned: '0',
    totalFeeMinted: '0',
  },
  reserveAllocationMetrics: {
    id: 'IST',
    denom: 'IST',
    key: 'Fee',
    value: '187909157',
  },
  reserveAllocationMetricsDailies: {
    denom: 'IST',
    key: 'Fee',
    valueLast: '187909157',
    metricsCount: '1',
  },
};
