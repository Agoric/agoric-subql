/** @file test against agoric-3-proposals:latest */
import { subqlTest } from '@subql/testing';
import { StateChangeEvent, Wallet } from '../types';

// FIXME observed in A3P:latest but not passing tests
subqlTest(
  'Wallet and StateChangeEvent in state_change at block 627',
  627, // block height to process
  [], // dependent entities
  [
    new Wallet(
      'published.wallet.agoric1ee9hr0jyrxhy999y755mp862ljgycmwyp4pl7q',
      BigInt(627),
      new Date('"2024-12-09T23:09:55.9Z"'),
      'agoric1ee9hr0jyrxhy999y755mp862ljgycmwyp4pl7q',
    ),
    new StateChangeEvent(
      '627:37:1',
      BigInt(627),
      new Date('2024-12-09T23:09:55.9Z'),
      'published.wallet',
      'published.wallet.agoric1ee9hr0jyrxhy999y755mp862ljgycmwyp4pl7q',
      0,
      '["board0257"]',
      '{"status":{"id":"closeVault-1733785795438","invitationSpec":{"invitationMakerName":"CloseVault","previousOffer":"openVault-1733785785382","source":"continuing"},"numWantsSatisfied":1,"proposal":{"give":{"Minted":{"brand":"$0.Alleged: IST brand","value":"+5750000","__brand":"IST","__value":"5750000"}},"want":{}},"result":"your vault is closed, thank you for your business"},"updated":"offerStatus"}',
    ),
  ],
  'handleStateChangeEvent',
);
