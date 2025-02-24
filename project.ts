import { CosmosDatasourceKind, CosmosHandlerKind, CosmosProject } from '@subql/types-cosmos';

const chainTypesU18 = new Map([
  [
    'cosmos.slashing.v1beta1',
    {
      file: './proto/cosmos/slashing/v1beta1/tx.proto',
      messages: ['MsgUnjail'],
    },
  ],
  [
    'cosmos.gov.v1beta1',
    {
      file: './proto/cosmos/gov/v1beta1/tx.proto',
      messages: ['MsgVoteWeighted'],
    },
  ],
  [
    'cosmos.gov.v1beta1.gov',
    {
      file: './proto/cosmos/gov/v1beta1/gov.proto',
      messages: ['WeightedVoteOption'],
    },
  ],
  [
    '/agoric.swingset.MsgInstallBundle',
    {
      file: './proto/agoric/swingset/msgs.proto',
      messages: ['MsgInstallBundle'],
    },
  ],
]);

const networkConfig = {
  local: {
    chainId: 'agoriclocal',
    endpoint: ['http://localhost:26657'],
    chaintypes: chainTypesU18,
    startBlock: 1,
  },
  docker: {
    chainId: 'agoriclocal',
    endpoint: ['http://host.docker.internal:26657'],
    chaintypes: chainTypesU18,
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
    chaintypes: chainTypesU18,
    startBlock: 1,
  },
  main: {
    chainId: 'agoric-3',
    endpoint: ['https://main-a.rpc.agoric.net:443'],
    chaintypes: chainTypesU18,
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
      // TODO document these
      // startBlock: 2115669,
      // startBlock: 14347000,
      // startBlock: 12306806,
      // startBlock: 13017175,
      // startBlock: 2115669,
      startBlock: startBlock[startBlockKey],

      mapping: {
        file: './dist/index.js',
        handlers: [
          // {
          //     Using block handlers slows your project down as they can be executed with each and every block.
          //     Only use if you need to
          //     handler: 'handleEvent',
          //     kind: CosmosHandlerKind.Block,
          // },
          // {
          //   handler: "handleEvent",
          //   kind: CosmosHandlerKind.Event,
          //   filter: {
          //     type: "transfer",
          //     messageFilter: {
          //       type: "/cosmos.bank.v1beta1.MsgSend",
          //     },
          //   },
          // },
          // {
          //   handler: "handleIbcSendPacketEvent",
          //   kind: CosmosHandlerKind.Event,
          //   filter: {
          //     type: "send_packet",
          //     messageFilter: {
          //       type: "/ibc.applications.transfer.v1.MsgTransfer",
          //     },
          //   },
          // },
          // {
          //   handler: "handleIbcReceivePacketEvent",
          //   kind: CosmosHandlerKind.Event,
          //   filter: {
          //     type: "recv_packet",
          //     messageFilter: {
          //       type: "/ibc.core.channel.v1.MsgRecvPacket",
          //     },
          //   },
          // },
          {
            handler: 'handleStateChangeEvent',
            kind: CosmosHandlerKind.Event,
            filter: {
              type: 'state_change',
            },
          },
          {
            handler: 'handleBundleInstallMessage',
            kind: CosmosHandlerKind.Message,
            filter: {
              type: '/agoric.swingset.MsgInstallBundle',
            },
          },
        ],
      },
    },
  ],
};

// Must set default to the project instance
export default project;
