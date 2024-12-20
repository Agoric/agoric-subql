#! /usr/bin/env node
/* eslint-env node */

const delay = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
const getActiveVaults = async (apiUrl, expectedVaults) => {
  console.log('Fetching the number of active vaults...');
  const maxRetries = 5;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      const graphqlQuery = {
        query: `query { vaults(filter: {state: {equalTo: "active"}}) { totalCount } }`,
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
      const activeVaults = jsonResponse.data.vaults.totalCount;

      console.log(`Attempt ${retries + 1}: Active vaults: ${activeVaults}`);

      if (activeVaults === expectedVaults) {
        console.log(`Assertion passed: ${activeVaults} active vaults match the expected count.`);
        return;
      }

      console.log(
        `Assertion failed on attempt ${retries + 1}: Expected ${expectedVaults} active vaults, but found ${activeVaults}. Retrying...`,
      );
      retries++;
      await delay(5000);
    } catch (error) {
      console.error(`Error on attempt ${retries + 1} fetching active vaults:`, error);
      retries++;
      await delay(5000);
    }
  }

  console.error('Maximum retry attempts reached. Exiting...');
  process.exit(1);
};

const apiUrl = process.env.apiUrl;
const expectedVaults = parseInt(process.env.expectedVaults, 10);

getActiveVaults(apiUrl, expectedVaults);
