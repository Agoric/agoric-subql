import { StateChangeEvent, IBCChannel, IBCTransfer, TransferType, Balances } from '../types';
import { CosmosBlock, CosmosEvent } from '@subql/types-cosmos';
import {
  b64decode,
  extractStoragePath,
  getStateChangeModule,
  resolveBrandNamesAndValues,
  getEscrowAddress
} from './utils';

import {
  EVENT_TYPES,
  STORE_KEY,
  VSTORAGE_VALUE,
  KEY_KEY,
  VALUE_KEY,
  STORE_NAME_KEY,
  SUBKEY_KEY,
  UNPROVED_VALUE_KEY,
  PACKET_DATA_KEY,
  PACKET_SRC_CHANNEL_KEY,
  PACKET_DST_CHANNEL_KEY,
  PACKET_DST_PORT_KEY,
  PACKET_SRC_PORT_KEY,
  TRANSFER_PORT_VALUE,
  BALANCE_FIELDS,
  FETCH_ACCOUNTS_URL,
  GENESIS_URL,
} from './constants';
import { psmEventKit } from './events/psm';
import { boardAuxEventKit } from './events/boardAux';
import { priceFeedEventKit } from './events/priceFeed';
import { vaultsEventKit } from './events/vaults';
import { reservesEventKit } from './events/reserves';
import {
  AccountsResponse,
  BaseAccount,
  ModuleAccount,
  BalancesResponse,
  Balance,
  VestingAccount,
} from './custom-types';
import { Operation, balancesEventKit } from './events/balances';
import crossFetch from 'cross-fetch';

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
  const { event, block, tx } = cosmosEvent;
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
    block.header.time as any,
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
  const { event, block, tx } = cosmosEvent;
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
    block.header.time as any,
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

export async function handleStateChangeEvent(cosmosEvent: CosmosEvent): Promise<void> {
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

  let data = Object();
  try {
    const decodedValue =
      valueAttr.key === UNPROVED_VALUE_KEY ? b64decode(b64decode(valueAttr.value)) : b64decode(valueAttr.value);
    data = JSON.parse(decodedValue);
  } catch (e) {
    return;
  }

  if (!data.values) {
    logger.warn('Data has not values.');
    return;
  }

  const decodedKey =
    keyAttr.key === SUBKEY_KEY
      ? b64decode(b64decode(keyAttr.value)).replaceAll('\u0000', '\x00')
      : b64decode(keyAttr.value);
  const path = extractStoragePath(decodedKey);
  const module = getStateChangeModule(path);

  const recordSaves: (Promise<void> | undefined)[] = [];

  async function saveStateEvent(idx: number, value: any, payload: any) {
    const record = new StateChangeEvent(
      `${data.blockHeight}:${cosmosEvent.idx}:${idx}`,
      BigInt(data.blockHeight),
      block.block.header.time as any,
      module,
      path,
      idx,
      JSON.stringify(value.slots),
      JSON.stringify(payload),
    );

    recordSaves.push(record.save());
  }

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

    const value = JSON.parse(rawValue);
    const payload = JSON.parse(value.body.replace(/^#/, ''));

    resolveBrandNamesAndValues(payload);
    try {
      for (const { regex, function: action } of regexFunctionMap) {
        if (path.match(regex)) {
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

export const handleBalanceEvent = async (cosmosEvent: CosmosEvent): Promise<void> => {
  const { event } = cosmosEvent;

  const incrementEventTypes = [EVENT_TYPES.COIN_RECEIVED];
  const decrementEventTypes = [EVENT_TYPES.COIN_SPENT];

  let operation: Operation | null = null;

  if (incrementEventTypes.includes(event.type)) {
    operation = Operation.Increment;
  } else if (decrementEventTypes.includes(event.type)) {
    operation = Operation.Decrement;
  } else {
    logger.warn(`${event.type} is not a valid balance event.`);
    return;
  }

  logger.info(`Event:${event.type}`);
  logger.info(`Event Data:${JSON.stringify(cosmosEvent.event)}`);

  const balancesKit = balancesEventKit();
  const data = balancesKit.getData(cosmosEvent);
  logger.info(`Decoded Data:${JSON.stringify(data)}`);

  const address = balancesKit.getAttributeValue(data, BALANCE_FIELDS[event.type as keyof typeof BALANCE_FIELDS]);

  const transactionAmount = balancesKit.getAttributeValue(data, BALANCE_FIELDS.amount);

  if (!address) {
    logger.error('Address is missing or invalid.');
    return;
  }

  const { isValidTransaction, coins } = balancesKit.validateTransaction(transactionAmount);

  if (!transactionAmount || !isValidTransaction) {
    logger.error(`Amount ${transactionAmount} invalid.`);
    return;
  }

  for (let { denom, amount } of coins) {
    const entryExists = await balancesKit.addressExists(address, denom);

    if (!entryExists) {
      const primaryKey = address + denom;
      await balancesKit.createBalancesEntry(address, denom, primaryKey);
    }

    const formattedAmount = BigInt(Math.round(Number(amount.slice(0, -4))));
    await balancesKit.updateBalance(address, denom, formattedAmount, operation);
  }
};

const fetchAccounts = async (
  offset: string,
  limit: string,
): Promise<[(BaseAccount | ModuleAccount | VestingAccount)[], string | null]> => {
  try {
    const url = new URL(FETCH_ACCOUNTS_URL);
    url.searchParams.append('pagination.limit', limit);
    url.searchParams.append('pagination.offset', offset);

    const response = await crossFetch(url.toString());
    const parsedResponse: AccountsResponse = await response.json();

    const accounts: (BaseAccount | ModuleAccount | VestingAccount)[] = parsedResponse.accounts;

    return [accounts, parsedResponse.pagination.next_key];
  } catch (error) {
    logger.error(`Error fetching accounts: ${error}`);
    return [[], ''];
  }
};

const findAddress = (obj: any) => {
  let stack = [obj];

  while (stack.length > 0) {
    let current = stack.pop();

    if (typeof current !== 'object' || current === null) {
      continue;
    }

    for (let key in current) {
      if (key === 'address') {
        return current[key];
      } else if (typeof current[key] === 'object') {
        stack.push(current[key]);
      }
    }
  }

  return null;
};

export const initiateBalancesTable = async (block: CosmosBlock): Promise<void> => {
  try {
    logger.info(`Initiating Balances Table`);
    const response = await crossFetch(GENESIS_URL);
    const parsedResponse = await response.json();
    const data = parsedResponse.genesis.app_state.bank;

    for (let element of data.balances) {
      let newBalance;
      for (const coin of element.coins) {
        newBalance = new Balances(`${element.address}-${coin.denom}`);
        newBalance.address = element.address;
        newBalance.balance = BigInt(coin.amount);
        newBalance.denom = coin.denom;

        await newBalance.save();
      }
    }

    logger.info(`Balances Table Initiated`);
  } catch (error) {
    logger.error(`Error initiating balances table: ${error}`);
  }
};
