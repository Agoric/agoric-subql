// @ts-check
import fetch from 'node-fetch';
import assert from 'assert';
const delay = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const states = {
  liquidated: 'liquidated',
  liquidating: 'liquidating',
};

const expectedLiquidating = {
  ids: [
    'published.vaultFactory.managers.manager0.vaults.vault10-liquidating',
    'published.vaultFactory.managers.manager0.vaults.vault11-liquidating',
    'published.vaultFactory.managers.manager0.vaults.vault12-liquidating',
  ],
  debts: ['100500000', '103515000', '105525000'],
  balance: ['15000000', '15000000', '15000000'],
  denom: 'ATOM',
};

const expectedLiquidated = {
  ids: [
    'published.vaultFactory.managers.manager0.vaults.vault10-liquidated',
    'published.vaultFactory.managers.manager0.vaults.vault11-liquidated',
    'published.vaultFactory.managers.manager0.vaults.vault12-liquidated',
  ],
  debts: ['0', '0', '0'],
  balance: ['3425146', '3077900', '2846403'],
  denom: 'ATOM',
};

const validate = async ({
  apiUrl,
  maxRetries,
  retryDuration,
  expectedIds,
  expectedDebts,
  expectedBalance,
  expectedDenom,
  filterState,
}) => {
  console.log(`Checking ${filterState} vaults...`);
  let retries = 0;

  while (retries < maxRetries) {
    try {
      const graphqlQuery = {
        query: `query {
            vaultLiquidations (filter: {state: {equalTo: "${filterState}"}}) {
                nodes {
                    id
                    denom
                    debt
                    state
                    balance
                }
            }
        }`,
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(graphqlQuery),
      });

      const jsonResponse = await response.json();
      console.log('Response:', JSON.stringify(jsonResponse));

      const nodes = jsonResponse?.data?.vaultLiquidations?.nodes || [];
      if (nodes.length !== 3) {
        console.error(`Attempt ${retries + 1}: No data available`);
        retries++;
        await delay(retryDuration);
        continue;
      }

      nodes.sort((a, b) => a.id.localeCompare(b.id));
      console.log('Sorted Nodes:', JSON.stringify(nodes));

      // Validate Ids
      assert.strictEqual(nodes[0].id, expectedIds[0]);
      assert.strictEqual(nodes[1].id, expectedIds[1]);
      assert.strictEqual(nodes[2].id, expectedIds[2]);

      // Validate Debts
      assert.strictEqual(nodes[0].debt, expectedDebts[0]);
      assert.strictEqual(nodes[1].debt, expectedDebts[1]);
      assert.strictEqual(nodes[2].debt, expectedDebts[2]);

      // Validate Denom
      assert.strictEqual(nodes[0].denom, expectedDenom);
      assert.strictEqual(nodes[1].denom, expectedDenom);
      assert.strictEqual(nodes[2].denom, expectedDenom);

      // Validate Balance
      assert.strictEqual(nodes[0].balance, expectedBalance[0]);
      assert.strictEqual(nodes[1].balance, expectedBalance[1]);
      assert.strictEqual(nodes[2].balance, expectedBalance[2]);

      console.log('All validations passed successfully.');
      return;
    } catch (error) {
      console.error(`Error on attempt ${retries + 1} fetching active vaults:`, error);
      retries++;
      await delay(retryDuration);
    }
  }

  console.error('Maximum retry attempts reached. Exiting...');
  process.exit(1);
};

const main = async () => {
  console.log('Starting main process...');

  const apiUrl = process.env.API_URL || 'http://localhost:3000/';
  console.log(`API URL set to: ${apiUrl}`);

  try {
    console.log('Validating liquidating vaults...');
    await validate({
      apiUrl,
      expectedIds: expectedLiquidating.ids,
      expectedBalance: expectedLiquidating.balance,
      expectedDenom: expectedLiquidating.denom,
      expectedDebts: expectedLiquidating.debts,
      maxRetries: 6,
      retryDuration: 3 * 60 * 1000,
      filterState: states.liquidating,
    });
    console.log('Validation successful for liquidating vaults.');

    console.log('Validating liquidated vaults...');
    await validate({
      apiUrl,
      expectedIds: expectedLiquidated.ids,
      expectedBalance: expectedLiquidated.balance,
      expectedDenom: expectedLiquidated.denom,
      expectedDebts: expectedLiquidated.debts,
      maxRetries: 3,
      retryDuration: 2 * 60 * 1000,
      filterState: states.liquidated,
    });
    console.log('Validation successful for liquidated vaults.');
  } catch (error) {
    console.error('Validation failed:', error);
  }
};

main();
