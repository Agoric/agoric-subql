#! /usr/bin/env node
/* eslint-env node */
import './lockdown.mjs';
import { equal } from 'node:assert/strict';
import { getQuery, expectations } from './queries.mjs';
import { assertAllDefined } from '@agoric/internal';

const apiUrl = 'http://localhost:3000/';
console.log(`API URL set to: ${apiUrl}`);

const { entity, blockHeight } = process.env;
console.log(`Entity: ${entity}, Block Height: ${blockHeight}`);

assertAllDefined({ entity, blockHeight });

const dailyEntities = ['vaultManagerMetricsDailies', 'reserveAllocationMetricsDailies', 'vaultStatesDailies'];
const filter = dailyEntities.includes(entity) ? { blockHeightLast: blockHeight } : { blockHeight };

try {
  const graphqlQuery = { query: getQuery(entity, filter) };

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
  const nodes = jsonResponse?.data[entity]?.nodes;
  console.log('Node:', nodes);

  for (const key of Object.keys(expectations[entity])) {
    equal(nodes[0]?.[key], expectations[entity][key]);
  }
} catch (error) {
  console.error('Error:', error);
  process.exit(1);
}
