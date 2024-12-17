import { execa } from 'execa';
import assert from 'assert';

const agops = '/usr/src/agoric-sdk/packages/agoric-cli/bin/agops';

const createVault = async (containerName, agoricNet, userKey, wantMinted, giveCollateral) => {
  console.log('Starting the vault creation process...');

  try {
    const env = {
      AGORIC_NET: agoricNet,
    };

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
};

const containerName = process.env.containerName;
const agoricNet = process.env.agoricNet;
const userKey = process.env.userKey;
const wantMinted = process.env.wantMinted;
const giveCollateral = process.env.giveCollateral;

createVault(containerName, agoricNet, userKey, wantMinted, giveCollateral);
