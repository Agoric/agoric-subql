export type Balance = {
  denom: string;
  amount: string;
};

type PubKey = {
  '@type': string;
  key: string;
};

export type BaseAccount = {
  '@type': string;
  address: string;
  pub_key: PubKey | null;
  account_number: string;
  sequence: string;
};

export type ModuleAccount = {
  '@type': string;
  base_account: BaseAccount;
  name: string;
  permissions: string[];
};

export type VestingAccount = {
  '@type': string;
  base_vesting_account: BaseAccount;
};

type Pagination = {
  next_key: string | null;
  total: string;
};

export type BalancesResponse = {
  balances: Balance[];
  pagination: Pagination;
};

export type AccountsResponse = {
  accounts: (BaseAccount | ModuleAccount)[];
  pagination: Pagination;
};
