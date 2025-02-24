import type { tendermint37 } from '@cosmjs/tendermint-rpc';
import { CosmosEvent } from '@subql/types-cosmos';
import { b64decode, extractStoragePath, getStateChangeModule, resolveBrandNamesAndValues } from './utils';

import type { StreamCell } from '@agoric/internal/src/lib-chainStorage';
import type { CapData } from '@endo/marshal';
import assert from 'assert';
import {
  EVENT_TYPES,
  KEY_KEY,
  STORE_KEY,
  STORE_NAME_KEY,
  SUBKEY_KEY,
  UNPROVED_VALUE_KEY,
  VALUE_KEY,
  VSTORAGE_VALUE,
} from './constants';
import { transactionEventKit } from './events/fastUsdc';

// @ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString();
};

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

  // XXX constructs a new one of each of these when none might match the path
  const fastUsdcKit = transactionEventKit(block, data, module, path);

  const regexFunctionMap = [
    { regex: /^published\.fastUsdc\.txns\./, function: fastUsdcKit.saveTransaction },
    // Many others omitted that are on the main instance but not the internal one
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
          const promises = await action(payload);
          recordSaves.push(...promises);
          break;
        }
      }
    } catch (e) {
      logger.error(`Error for path: ${path}`);
      logger.error(e);
      throw e;
    }
  }

  await Promise.allSettled(recordSaves);
}
