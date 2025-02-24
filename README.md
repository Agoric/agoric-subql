# Agoric indexer

This uses [SubQuery](https://subquery.network) to index all transfer events and messages on the Agoric chain.

## Usage

Explorer URL: https://explorer.subquery.network/subquery/agoric-labs/agoric-mainnet-v2

API Endpoint: https://api.subquery.network/sq/agoric-labs/agoric-mainnet-v2

The indexer query service is used by the [inter dashboard](https://info.inter.trade/) and [its code](https://github.com/agoric-labs/agoric-inter-dashboard/blob/master/src/queries.ts) includes various examples of query usage.

## Data

The indexer uses state change events to index most of the data also available from vstorage:

- Metadata about the indexer. e.g. lastProcessedHeight
- PSM metrics (minted pool balances, governance parameters)
- Active vault data (count, total balance by collateral type)
- Daily metrics (vault metrics, collateral, debt, oracle prices)
- Reserve metrics (shortfall balances, allocation values)
- Wallets

Note: as of June 13th, 2024, this indexer does not include transactions, account balances, or raw block data.

### Performance

Sources of latency:

- Waiting for new blocks. RPC itself can be delayed.
- Processing time of blocks.
- DB delay. OnFinality has some caching which batches DB operations.

## Developing

### IDE

For your IDE to resolve all the files, run `yarn codegen && yarn build`.

### With A3P

1. Start up an A3P instance

   ```sh
   docker run -p 26657:26657 -p 1317:1317 -p 9090:9090 ghcr.io/agoric/agoric-3-proposals:latest
   ```

   Or with a proposal that you've built in a3p-integration,

   ```sh
   docker run -p 26657:26657 -p 1317:1317 -p 9090:9090 ghcr.io/agoric/agoric-3-proposals:use-fast-usdc
   ```

2. Confirm the data is visible with [vstorage viewer](https://vstorage.agoric.net/?endpoint=http%3A%2F%2Flocalhost%3A26657)

3. Start up the Indexer
   After the A3P instance is up and running, initiate the indexer with the following command:

   ```sh
   AGORIC_NET=docker yarn dev
   ```

4. Access the GraphQL playground
   Once the indexer is operational, access the GraphQL interface to query indexed data:

   - Open a web browser and navigate to http://localhost:3000.
   - Use the provided interface to write and execute your GraphQL queries.

### With multichain-testing

Make some transactions.

```sh
cd multichain-testing && yarn
make setup # if you've never ran starship
docker pull ghcr.io/agoric/agoric-sdk:dev # to make sure you have the latest IBC hooks changes
make stop
make start FILE=config.fusdc.yaml # wait ~7 mins
yarn test:fast-usdc test/fast-usdc/fast-usdc.test.ts
```

View [published.fastUsdc](https://vstorage.agoric.net/?endpoint=http%3A%2F%2Flocalhost%3A26657&path=published.fastUsdc)

Start a fresh indexer:

```sh
scripts/restart-dev.sh
```

Play at http://localhost:3000/

Cleanup…

```sh
cd multichain-testing
make stop
```

### Troubleshooting the Indexer

If you encounter issues with the indexer:

- Check the logs of indexer for any errors or warnings that might indicate what is wrong. Use the command:

  ```sh
  docker logs -f agoric-subql-subquery-node-1
  ```

- If restarting the indexer is necessary, first delete the `.data` folder in the root directory to avoid conflicts or corruption of data:

  ```sh
  rm -rf .data
  ```

## Testing

When a PR is created, tests associated with indexing are automatically triggered in the following workflows:

- `.github/workflows/pr.yaml`
- `.github/workflows/liquidation.yaml`
- `.github/workflows/vaults-and-reserve-metrics-testing.yml`

These tests are scheduled to run daily and can also be manually triggered at any time from the GitHub Actions tab on GitHub.

## Deploying

OnFinality has staging and production instances.

Once it's in Production, you can find the indexer at https://indexer.agoric.net.

For staging, they don't provide an explorer. Instead you can use a [generic GraphQL playground](https://hygraph.com/graphql-playground) and enter a custom schema URL pointing to the staging instance ("Staging query url" in Onfinality's UI).

```gql
# For example, https://api.subquery.network/sq/agoric-labs/internal__YWdvc
query {
  fastUsdcTransactions {
    totalCount
  }
}
```
