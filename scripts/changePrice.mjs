#! /usr/bin/env node
import { execa } from 'execa';
import { assertAllDefined } from '@agoric/internal';

const agops = '/usr/src/agoric-sdk/packages/agoric-cli/bin/agops';
const { AGORIC_NET, amount, containerName } = process.env;

assertAllDefined({ AGORIC_NET, amount, containerName });

try {
  const env = {
    AGORIC_NET,
  };

  console.log(`Initiating price change to ${amount} for ATOM...`);
  const command = `${agops} oracle setPrice --keys gov1,gov2 --pair ATOM.USD --price ${amount} --keyring-backend=test`;
  const { stdout } = await execa('docker', ['exec', containerName, command], { env, shell: true });

  console.log('Standard output:', stdout);
} catch (error) {
  console.error('Error:', error);
}
