import type { tendermint37 } from '@cosmjs/tendermint-rpc';
import { CosmosEvent, CosmosMessage } from '@subql/types-cosmos';
import { BundleInstall, IBCChannel, IBCTransfer, StateChangeEvent, TransferType } from '../types';
import {
  b64decode,
  extractStoragePath,
  getAddressFromUint8Array,
  getEscrowAddress,
  getStateChangeModule,
  resolveBrandNamesAndValues,
} from './utils';

import type { StreamCell } from '@agoric/internal/src/lib-chainStorage';
import type { CapData } from '@endo/marshal';
import {
  EVENT_TYPES,
  KEY_KEY,
  PACKET_DATA_KEY,
  PACKET_DST_CHANNEL_KEY,
  PACKET_DST_PORT_KEY,
  PACKET_SRC_CHANNEL_KEY,
  PACKET_SRC_PORT_KEY,
  STORE_KEY,
  STORE_NAME_KEY,
  SUBKEY_KEY,
  TRANSFER_PORT_VALUE,
  UNPROVED_VALUE_KEY,
  VALUE_KEY,
  VSTORAGE_VALUE,
} from './constants';
import { boardAuxEventKit } from './events/boardAux';
import { priceFeedEventKit } from './events/priceFeed';
import { psmEventKit } from './events/psm';
import { reservesEventKit } from './events/reserves';
import { vaultsEventKit } from './events/vaults';

// @ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString();
};

async function saveIbcChannel(channelName: string) {
  const generatedEscrowAddress = getEscrowAddress(TRANSFER_PORT_VALUE, channelName);

  const channelRecord = new IBCChannel(channelName, channelName, generatedEscrowAddress);
  return channelRecord.save();
}

export async function handleIbcSendPacketEvent(cosmosEvent: CosmosEvent): Promise<void> {
  const { event, block, tx } = cosmosEvent as CosmosEvent & { event: tendermint37.Event };
  if (event.type != EVENT_TYPES.SEND_PACKET) {
    logger.warn('Not valid send_packet event.');
    return;
  }

  const packetSrcPortAttr = event.attributes.find((a) => a.key === PACKET_SRC_PORT_KEY);
  if (!packetSrcPortAttr || packetSrcPortAttr.value !== TRANSFER_PORT_VALUE) {
    logger.warn('packet_src_port is not transfer');
    return;
  }
  const packetDataAttr = event.attributes.find((a) => a.key === PACKET_DATA_KEY);
  if (!packetDataAttr) {
    logger.warn('No packet data attribute found');
    return;
  }

  const packetSrcChannelAttr = event.attributes.find((a) => a.key === PACKET_SRC_CHANNEL_KEY);
  if (!packetSrcChannelAttr) {
    logger.warn('No packet source channel found');
    return;
  }
  const { amount, denom, receiver, sender } = JSON.parse(packetDataAttr.value);
  const sourceChannel = packetSrcChannelAttr.value;

  const ibcChannel = saveIbcChannel(sourceChannel);

  const transferRecord = new IBCTransfer(
    tx.hash,
    block.header.time as Date,
    BigInt(block.header.height),
    packetSrcChannelAttr.value,
    sender,
    receiver,
    denom,
    amount,
    TransferType.SEND,
  );
  await Promise.allSettled([transferRecord.save(), ibcChannel]);
}

export async function handleIbcReceivePacketEvent(cosmosEvent: CosmosEvent): Promise<void> {
  const { event, block, tx } = cosmosEvent as CosmosEvent & { event: tendermint37.Event };
  if (event.type != EVENT_TYPES.RECEIVE_PACKET) {
    logger.warn('Not valid recv_packet event.');
    return;
  }

  const packetDataAttr = event.attributes.find((a) => a.key === PACKET_DATA_KEY);
  if (!packetDataAttr) {
    logger.warn('No packet data attribute found');
    return;
  }

  const packetDestPortAttr = event.attributes.find((a) => a.key === PACKET_DST_PORT_KEY);
  if (!packetDestPortAttr || packetDestPortAttr.value !== TRANSFER_PORT_VALUE) {
    logger.warn('packet_dest_port is not transfer');
    return;
  }

  const packetDstChannelAttr = event.attributes.find((a) => a.key === PACKET_DST_CHANNEL_KEY);
  if (!packetDstChannelAttr) {
    logger.warn('No packet destination channel found');
    return;
  }
  const { amount, denom, receiver, sender } = JSON.parse(packetDataAttr.value);
  const destinationChannel = packetDstChannelAttr.value;

  const ibcChannel = saveIbcChannel(destinationChannel);

  const transferRecord = new IBCTransfer(
    tx.hash,
    block.header.time as Date,
    BigInt(block.header.height),
    destinationChannel,
    sender,
    receiver,
    denom,
    amount,
    TransferType.RECEIVE,
  );

  await Promise.allSettled([transferRecord.save(), ibcChannel]);
}

export async function handleBundleInstallMessage(message: CosmosMessage): Promise<void> {
  const { msg, block, tx } = message;

  if (msg.typeUrl !== '/agoric.swingset.MsgInstallBundle') {
    logger.warn('message type is not /agoric.swingset.MsgInstallBundle');
    return;
  }

  // JSON.stringify converts the object from Uint8Array to readable string
  const { uncompressedSize, compressedBundle, bundle } = JSON.parse(JSON.stringify(msg.decodedMsg));
  const bundleRecord = new BundleInstall(
    tx.hash,
    BigInt(block.header.height),
    block.header.time as Date,
    BigInt(uncompressedSize),
    bundle || '',
    compressedBundle || '',
    getAddressFromUint8Array(msg.decodedMsg.submitter),
  );

  await bundleRecord.save();
}

export async function handleStateChangeEvent(cosmosEvent: CosmosEvent & { event: tendermint37.Event }): Promise<void> {
  const { event, block } = cosmosEvent;

  if (event.type != EVENT_TYPES.STATE_CHANGE) {
    logger.warn('Not valid state_change event.');
    return;
  }

  const storeAttr = event.attributes.find((a) => a.key === STORE_KEY || a.key === STORE_NAME_KEY);
  if (!storeAttr || storeAttr.value != VSTORAGE_VALUE) {
    return;
  }

  const valueAttr = event.attributes.find((a) => a.key === VALUE_KEY || a.key === UNPROVED_VALUE_KEY);
  if (!valueAttr || !valueAttr.value) {
    logger.warn('Value attribute is missing or empty.');
    return;
  }

  const keyAttr = event.attributes.find((a) => a.key === KEY_KEY || a.key === SUBKEY_KEY);
  if (!keyAttr) {
    logger.warn('Key attribute is missing or empty.');
    return;
  }

  let data: StreamCell<string>;
  try {
    const decodedValue = valueAttr.key === UNPROVED_VALUE_KEY ? b64decode(valueAttr.value) : valueAttr.value;
    data = JSON.parse(decodedValue);
  } catch (e) {
    return;
  }

  if (!data.values) {
    // XXX second arg ignored
    logger.warn('Data has not values.');
    logger.info(valueAttr);

    // XXX none of these output
    logger.debug(valueAttr.value);
    logger.debug('logger.debug');
    console.debug('console.debug', valueAttr.value);
    console.log('console.log', valueAttr.value);
    return;
  }

  const decodedKey = keyAttr.key === SUBKEY_KEY ? b64decode(keyAttr.value).replaceAll('\u0000', '\x00') : keyAttr.value;
  const path = extractStoragePath(decodedKey);
  const module = getStateChangeModule(path);

  const recordSaves: (Promise<void> | undefined)[] = [];

  async function saveStateEvent(idx: number, value: CapData<unknown>, payload: unknown) {
    const record = new StateChangeEvent(
      `${data.blockHeight}:${cosmosEvent.idx}:${idx}`,
      BigInt(data.blockHeight),
      block.block.header.time as Date,
      module,
      path,
      idx,
      JSON.stringify(value.slots),
      JSON.stringify(payload),
    );

    recordSaves.push(record.save());
  }

  // XXX constructs a new one of each of these when none might match the path
  const psmKit = psmEventKit(block, data, module, path);
  const boardKit = boardAuxEventKit(block, data, module, path);
  const priceKit = priceFeedEventKit(block, data, module, path);
  const vaultKit = vaultsEventKit(block, data, module, path);
  const reserveKit = reservesEventKit(block, data, module, path);

  const regexFunctionMap = [
    { regex: /^published\.priceFeed\..+price_feed$/, function: priceKit.savePriceFeed },
    { regex: /^published\.psm\..+\.metrics$/, function: psmKit.savePsmMetrics },
    { regex: /^published\.psm\..+\.governance$/, function: psmKit.savePsmGovernance },
    {
      regex: /^published\.vaultFactory\.managers\.manager[0-9]+\.metrics$/,
      function: vaultKit.saveVaultManagerMetrics,
    },
    {
      regex: /^published\.vaultFactory\.managers\.manager[0-9]+\.governance$/,
      function: vaultKit.saveVaultManagerGovernance,
    },
    { regex: /^published\.reserve\.metrics$/, function: reserveKit.saveReserveMetrics },
    { regex: /^published\.wallet\..+\.current$/, function: vaultKit.saveWallets },
    { regex: /^published\.vaultFactory\.managers\.manager[0-9]+\.vaults\.vault[0-9]+$/, function: vaultKit.saveVaults },
    { regex: /^published\.boardAux\.board[0-9]+$/, function: boardKit.saveBoardAux },
  ];

  for (let idx = 0; idx < data.values.length; idx++) {
    const rawValue: string = data.values[idx];
    if (!rawValue) {
      continue;
    }

    const value = JSON.parse(rawValue) as CapData<unknown>;
    if (!('body' in value)) {
      logger.warn(`skipping value that is not CapData: ${JSON.stringify(value)}`);
      return;
    }

    const payload = JSON.parse(value.body.replace(/^#/, ''));

    resolveBrandNamesAndValues(payload);
    try {
      for (const { regex, function: action } of regexFunctionMap) {
        if (path.match(regex)) {
          // XXX await in loop, TODO simplify by using Promise.allSettled in handlers
          // recordSaves.push(action(payload));
          recordSaves.push(...(await action(payload)));
          break;
        }
      }
      saveStateEvent(idx, value, payload);
    } catch (e) {
      logger.error(`Error for path: ${path}`);
      logger.error(e);
      throw e;
    }
  }

  await Promise.allSettled(recordSaves);
}
