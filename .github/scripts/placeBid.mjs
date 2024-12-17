import { execa } from 'execa';
import assert from 'assert';

const agops = '/usr/src/agoric-sdk/packages/agoric-cli/bin/agops';

const placeBid = async ({ fromAddress, giveAmount, priceOrDiscount, commandType, agoricNet, containerName }) => {
  console.log('Starting the bidding process...');

  try {
    const env = {
      AGORIC_NET: agoricNet,
    };

    let commandTypeOption;
    if (commandType === 'by-price') {
      commandTypeOption = 'by-price --price';
    } else if (commandType === 'by-discount') {
      commandTypeOption = 'by-discount --discount';
    }

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
};

const bidInfo = {
  fromAddress: process.env.fromAddress,
  giveAmount: process.env.giveAmount,
  priceOrDiscount: process.env.priceOrDiscount,
  commandType: process.env.commandType,
  agoricNet: process.env.agoricNet,
  commandTimeout: process.env.commandTimeout,
  containerName: process.env.containerName,
};

placeBid(bidInfo);
