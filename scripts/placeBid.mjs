#! /usr/bin/env node
import './lockdown.mjs';
import { execa } from 'execa';
import assert from 'node:assert/strict';
import { assertAllDefined } from '@agoric/internal';

const agops = '/usr/src/agoric-sdk/packages/agoric-cli/bin/agops';

const { AGORIC_NET, fromAddress, giveAmount, priceOrDiscount, commandType, containerName } = process.env;
assertAllDefined({ AGORIC_NET, fromAddress, giveAmount, priceOrDiscount, commandType, containerName });

try {
  const env = {
    AGORIC_NET,
  };

  let commandTypeOption;
  if (commandType === 'by-price') {
    commandTypeOption = 'by-price --price';
  } else if (commandType === 'by-discount') {
    commandTypeOption = 'by-discount --discount';
  }

  console.log('Starting the bidding process...');
  const command = `${agops} inter bid ${commandTypeOption} ${priceOrDiscount} --from ${fromAddress} --give ${giveAmount} --keyring-backend=test`;

  console.log('Executing command in the container...');
  const { stdout } = await execa('docker', ['exec', containerName, `bash -c "${command}"`], {
    env,
    shell: true,
  });

  assert.ok(stdout.includes('Your bid has been accepted'));
  console.log('Standard output:', stdout);
} catch (error) {
  console.error('Error during bid placement:', error);
  process.exit(1);
}
