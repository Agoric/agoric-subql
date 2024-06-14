import { b64encode } from './utils';

export const EVENT_TYPES = {
  ACTIVE_PROPOSAL: 'active_proposal',
  BURN: 'burn',
  COIN_RECEIVED: 'coin_received',
  COIN_SPENT: 'coin_spent',
  COINBASE: 'coinbase',
  COMMISSION: 'commission',
  MESSAGE: 'message',
  MINT: 'mint',
  PROPOSAL_DEPOSIT: 'proposal_deposit',
  PROPOSAL_VOTE: 'proposal_vote',
  PROPOSER_REWARD: 'proposer_reward',
  REWARDS: 'rewards',
  STATE_CHANGE: 'state_change',
  STORAGE: 'storage',
  SUBMIT_PROPOSAL: 'submit_proposal',
  TRANSFER: 'transfer',
  SEND_PACKET: 'send_packet',
  RECEIVE_PACKET: 'recv_packet',
  IBC_TRANSFER: 'ibc_transfer',
  FUNGIBLE_TOKEN_PACKET: 'fungible_token_packet',
};

export const VAULT_STATES = {
  ACTIVE: 'active',
  CLOSED: 'closed',
  LIQUIDATING: 'liquidating',
  LIQUIDATED: 'liquidated',
  LIQUIDATED_CLOSED: 'liquidatedClosed',
};

export const VALUE_KEY = b64encode('value');
export const STORE_KEY = b64encode('store');
export const VSTORAGE_VALUE = b64encode('vstorage');
export const KEY_KEY = b64encode('key');
export const STORE_NAME_KEY = b64encode('store_name');
export const SUBKEY_KEY = b64encode('store_subkey');
export const UNPROVED_VALUE_KEY = b64encode('unproved_value');
export const PACKET_DATA_KEY = 'packet_data';
export const PACKET_SRC_CHANNEL_KEY = 'packet_src_channel';
export const PACKET_DST_CHANNEL_KEY = 'packet_dst_channel';
export const PACKET_SRC_PORT_KEY = 'packet_src_port';
export const PACKET_DST_PORT_KEY = 'packet_dst_port';
export const ACTION_KEY = b64encode('action');
export const IBC_MESSAGE_TRANSFER_VALUE = b64encode('/ibc.applications.transfer.v1.MsgTransfer');
export const IBC_MESSAGE_RECEIVE_PACKET_VALUE = b64encode('/ibc.core.channel.v1.MsgRecvPacket');
export const RECEPIENT_KEY = b64encode('recipient');
export const SENDER_KEY = b64encode('sender');
export const SPENDER_KEY = b64encode('spender');
export const RECEIVER_KEY = b64encode('receiver');
export const AMOUNT_KEY = b64encode('amount');
export const TRANSFER_PORT_VALUE = 'transfer';

export const BALANCE_FIELDS = {
  amount: 'amount',
  // Bank Events
  coinbase: 'minter',
  coin_received: 'receiver',
  coin_spent: 'spender',
  transfer_recipient: 'recipient',
  transfer_sender: 'sender',
  burn: 'burner',
  // Distribution Events
  rewards: 'validator',
  commission: 'validator',
  proposer_reward: 'validator',
  withdraw_rewards: 'validator',
  withdraw_commission: 'validator',
};

export const FETCH_ACCOUNTS_URL = 'https://main-a.api.agoric.net:443/cosmos/auth/v1beta1/accounts';
export const GET_FETCH_BALANCE_URL = (address: string) =>
  `https://main-a.api.agoric.net:443/cosmos/bank/v1beta1/balances/${address}`;

export const GENESIS_URL = 'https://agoric-rpc.polkachu.com/genesis';
