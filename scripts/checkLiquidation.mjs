#! /usr/bin/env node
/* eslint-env node */
import { equal } from 'node:assert/strict';
const delay = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const states = {
  liquidated: 'liquidated',
  liquidating: 'liquidating',
};

const expectedLiquidating = {
  id: [
    'published.vaultFactory.managers.manager0.vaults.vault10-liquidating',
    'published.vaultFactory.managers.manager0.vaults.vault11-liquidating',
    'published.vaultFactory.managers.manager0.vaults.vault12-liquidating',
  ],
  debt: ['100500000', '103515000', '105525000'],
  balance: ['15000000', '15000000', '15000000'],
  denom: ['ATOM', 'ATOM', 'ATOM'],
};

const expectedLiquidated = {
  id: [
    'published.vaultFactory.managers.manager0.vaults.vault10-liquidated',
    'published.vaultFactory.managers.manager0.vaults.vault11-liquidated',
    'published.vaultFactory.managers.manager0.vaults.vault12-liquidated',
  ],
  debt: ['0', '0', '0'],
  balance: ['3425146', '3077900', '2846403'],
  denom: ['ATOM', 'ATOM', 'ATOM'],
};

const validate = async ({ apiUrl, maxRetries, retryDuration, expectations, filterState }) => {
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

      for (const key of Object.keys(expectations)) {
        for (let i = 0; i < nodes.length; i++) {
          equal(nodes[i][key], expectations[key][i]);
        }
      }

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

const apiUrl = process.env.API_URL || 'http://localhost:3000/';
console.log(`API URL set to: ${apiUrl}`);

try {
  console.log('Validating liquidating vaults...');
  await validate({
    apiUrl,
    expectations: expectedLiquidating,
    maxRetries: 6,
    retryDuration: 3 * 60 * 1000,
    filterState: states.liquidating,
  });
  console.log('Validation successful for liquidating vaults.');

  console.log('Validating liquidated vaults...');
  await validate({
    apiUrl,
    expectations: expectedLiquidated,
    maxRetries: 3,
    retryDuration: 2 * 60 * 1000,
    filterState: states.liquidated,
  });
  console.log('Validation successful for liquidated vaults.');
} catch (error) {
  console.error('Validation failed:', error);
}
