#! /usr/bin/env node
import { execa } from 'execa';
import assert from 'node:assert/strict';
import { assertAllDefined } from '@agoric/internal';

const agops = '/usr/src/agoric-sdk/packages/agoric-cli/bin/agops';

const { AGORIC_NET, userKey, containerName, wantMinted, giveCollateral } = process.env;
assertAllDefined({ AGORIC_NET, userKey, containerName, wantMinted, giveCollateral });

try {
  const env = {
    AGORIC_NET,
  };

  console.log('Starting the vault creation process...');
  const command = `${agops} vaults open --wantMinted ${wantMinted} --giveCollateral ${giveCollateral} > /tmp/want-ist.json`;
  await execa('docker', ['exec', containerName, `bash -c "${command}"`], { env, shell: true });

  const broadCastCommand = `${agops} perf satisfaction --executeOffer /tmp/want-ist.json --from ${userKey} --keyring-backend=test`;
  const { stdout } = await execa('docker', ['exec', containerName, broadCastCommand], {
    env,
    shell: true,
  });

  assert.ok(!stdout.includes('Error'), `Expected 'stdout' not to contain 'Error'`);
  console.log('Standard output:', stdout);
} catch (error) {
  console.error('Error during vault creation:', error);
  process.exit(1);
}
