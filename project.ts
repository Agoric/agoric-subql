import { CosmosDatasourceKind, CosmosHandlerKind, CosmosProject } from '@subql/types-cosmos';

const networkConfig = {
  local: {
    chainId: 'agoriclocal',
    endpoint: ['http://localhost:26657'],
    startBlock: 1,
  },
  docker: {
    chainId: 'agoriclocal',
    endpoint: ['http://host.docker.internal:26657'],
    startBlock: 1,
  },
  /*
  This configuration is specifically for the "ci" profile for the agd container.
  The reason for using the "ci" profile is because the URL http://host.docker.internal:26657
  is not accessible in CI environments. Therefore, we added the a3p service to the Docker
  Compose file and assigned it a "ci" profile to ensure it only runs in CI. In the CI environment,
  we then use the address http://agd:26657
*/
  ci: {
    chainId: 'agoriclocal',
    endpoint: ['http://a3p:26657'],
    startBlock: 1,
  },
  main: {
    chainId: 'agoric-3',
    endpoint: ['https://main-a.rpc.agoric.net:443'],
    /** First Fast USDC transaction on main */
    startBlock: 18454947,
  },
};

const networkKey = process.env.AGORIC_NET || 'main';

const startBlock = {
  local: 1,
  docker: 1,
  /** Eval of FUSD-Start */
  startFusdc: 18396254,
  /** First Fast USDC transaction on main */
  main: 18454947,
  /** Launch of Inter Protocol */
  upgrade8: 7179262,
};
const startBlockKey = process.env.SUBQL_START_BLOCK || networkKey;

// Can expand the Datasource processor types via the genreic param
const project: CosmosProject = {
  specVersion: '1.0.0',
  version: '0.0.1',
  name: 'agoric-internal',
  description: "OpCo's indexer and query service for internal use",
  runner: {
    node: {
      name: '@subql/node-cosmos',
      version: '>=3.0.0',
    },
    query: {
      name: '@subql/query',
      version: '*',
    },
  },
  schema: {
    file: './schema.graphql',
  },
  network: networkConfig[networkKey],
  dataSources: [
    {
      kind: CosmosDatasourceKind.Runtime,
      startBlock: startBlock[startBlockKey],

      mapping: {
        file: './dist/index.js',
        handlers: [
          {
            handler: 'handleStateChangeEvent',
            kind: CosmosHandlerKind.Event,
            filter: {
              type: 'state_change',
            },
          },
        ],
      },
    },
  ],
};

// Must set default to the project instance
export default project;
