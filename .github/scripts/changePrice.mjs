import { execa } from 'execa';
import assert from 'assert';

const agops = '/usr/src/agoric-sdk/packages/agoric-cli/bin/agops';

const amount = process.env.amount;
const containerName = process.env.containerName;
const agoricNet = process.env.agoricNet;

if (!amount || !containerName || !agoricNet) {
  console.error('Error: Missing one or more required parameters:');
  if (!amount) console.error('Missing amount');
  if (!containerName) console.error('Missing containerName');
  if (!agoricNet) console.error('Missing agoricNet');
  process.exit(1);
}

const setAtomPrice = async (amount, containerName, agoricNet) => {
  try {
    console.log(`Initiating price change to ${amount} for ATOM...`);

    const env = {
      AGORIC_NET: agoricNet,
    };

    const command = `${agops} oracle setPrice --keys gov1,gov2 --pair ATOM.USD --price ${amount} --keyring-backend=test`;
    const { stdout } = await execa('docker', ['exec', containerName, command], { env, shell: true });

    console.log('Standard output:', stdout);
  } catch (error) {
    console.error('Error:', error);
  }
};

setAtomPrice(amount, containerName, agoricNet);
