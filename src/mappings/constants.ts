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

export const VALUE_KEY = 'value';
export const STORE_KEY = 'store';
export const VSTORAGE_VALUE = 'vstorage';
export const KEY_KEY = 'key';
export const STORE_NAME_KEY = 'store_name';
export const SUBKEY_KEY = 'store_subkey';
export const UNPROVED_VALUE_KEY = 'unproved_value';
export const PACKET_DATA_KEY = 'packet_data';
export const PACKET_SRC_CHANNEL_KEY = 'packet_src_channel';
export const PACKET_DST_CHANNEL_KEY = 'packet_dst_channel';
export const PACKET_SRC_PORT_KEY = 'packet_src_port';
export const PACKET_DST_PORT_KEY = 'packet_dst_port';
export const ACTION_KEY = 'action';
export const IBC_MESSAGE_TRANSFER_VALUE = '/ibc.applications.transfer.v1.MsgTransfer';
export const IBC_MESSAGE_RECEIVE_PACKET_VALUE = '/ibc.core.channel.v1.MsgRecvPacket';
export const RECEPIENT_KEY = 'recipient';
export const SENDER_KEY = 'sender';
export const RECEIVER_KEY = 'receiver';
export const AMOUNT_KEY = 'amount';
export const TRANSFER_PORT_VALUE = 'transfer';
