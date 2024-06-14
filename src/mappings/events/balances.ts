import { Account, Balances } from '../../types';
import { BALANCE_FIELDS } from '../constants';
import { b64decode } from '../utils';
import { CosmosEvent } from '@subql/types-cosmos';
import { AMOUNT_KEY, RECEIVER_KEY, SPENDER_KEY } from '../constants';

interface Attribute {
  key: string;
  value: string;
}

export interface DecodedEvent {
  type: string;
  attributes: Attribute[];
}

export enum Operation {
  Increment = 'increment',
  Decrement = 'decrement',
}

interface TransactionData {
  isValidTransaction: boolean;
  coins: { amount: string; denom: string }[];
}

const supportedDenominations: Set<string> = new Set(['ubld', 'uist']);
export const balancesEventKit = () => {
  function getAttributeValue(data: any, key: string) {
    const attribute = data.attributes.find(
      (attr: Attribute) => attr.key === key
    );
    return attribute ? attribute.value : null;
  }

  function getData(cosmosEvent: CosmosEvent) {
    let dataAlreadyDecoded = false;
    const value = getAttributeValue(cosmosEvent.event, AMOUNT_KEY);

    if (!value) {
      dataAlreadyDecoded = true;
    }

    const data = dataAlreadyDecoded
      ? cosmosEvent.event
      : decodeEvent(cosmosEvent);

    return data;
  }

  function decodeEvent(cosmosEvent: CosmosEvent): DecodedEvent {
    const { event } = cosmosEvent;

    const decodedData: DecodedEvent = {
      type: event.type,
      attributes: [],
    };

    event.attributes.forEach((attribute) => {
      const decodedKey = b64decode(attribute.key);
      const decodedValue = b64decode(attribute.value);

      decodedData.attributes.push({
        key: decodedKey,
        value: decodedValue,
      });
    });

    return decodedData;
  }

  async function addressExists(
    address: string,
    denom: string
  ): Promise<boolean> {
    const balance = await Balances.getByFields([
      ['address', '=', address],
      ['denom', '=', denom],
    ]);

    if (!balance || balance.length === 0) {
      return false;
    }
    return true;
  }

  async function createBalancesEntry(
    address: string,
    denom: string,
    primaryKey: string
  ) {
    const newBalance = new Balances(primaryKey);
    newBalance.address = address;
    newBalance.balance = BigInt(0);
    newBalance.denom = denom;
    await newBalance.save();

    await createAccountIfNotExists(address);

    logger.info(`Created new entry for address: ${address}`);
  }

  async function createAccountIfNotExists(address: string): Promise<void> {
    const account = await Account.get(address);
    if (!account) {
      const newAccount = new Account(address);
      await newAccount.save();
    }
  }

  function validateTransaction(amount: string | null): TransactionData {
    const result: TransactionData = {
      isValidTransaction: false,
      coins: [],
    };

    if (!amount) {
      return result;
    }
    const coins = amount.split(',');

    for (let coin of coins) {
      for (let denom of supportedDenominations) {
        if (coin.endsWith(denom)) {
          result.isValidTransaction = true;
          result.coins.push({ amount: coin.slice(0, -denom.length), denom });
        }
      }
    }

    return result;
  }

  async function updateBalance(
    address: string,
    denom: string,
    amount: bigint,
    operation: Operation
  ): Promise<void> {
    const balances = await Balances.getByFields([
      ['address', '=', address],
      ['denom', '=', denom],
    ]);

    if (!balances || balances.length === 0) {
      logger.error(`Balance not found for address: ${address}`);
      return;
    }

    const balance = balances[0];
    const currentBalance = balance.balance ?? BigInt(0);
    let newBalance: bigint;

    if (operation === Operation.Increment) {
      newBalance = currentBalance + amount;
      balance.balance = newBalance;
      logger.info(
        `Incremented balance for ${address} by ${amount}. New balance: ${balance.balance}`
      );
    } else if (operation === Operation.Decrement) {
      newBalance = currentBalance - amount;
      if (newBalance < 0) {
        logger.error(
          `Attempt to decrement ${amount} would result in a negative balance. Current balance: ${currentBalance}.`
        );
        return;
      }
      balance.balance = newBalance;
      logger.info(
        `Decremented balance for ${address} by ${amount}. New balance: ${balance.balance}`
      );
    }

    await balance.save();
  }

  return {
    validateTransaction,
    getAttributeValue,
    decodeEvent,
    getData,
    addressExists,
    createBalancesEntry,
    updateBalance,
  };
};
