import {
  PrivateKey,
  AccountCreateTransaction,
  Hbar,
  Client,
  AccountId,
} from '@hashgraph/sdk';

// create an account with an initial balance
export const createAccount = async (client: Client, initialBalance: number): Promise<[AccountId, PrivateKey]> => {
  const accountPrivateKey = PrivateKey.generateED25519();

  const response = await new AccountCreateTransaction()
    .setInitialBalance(new Hbar(initialBalance))
    .setKey(accountPrivateKey)
    .execute(client);

  const receipt = await response.getReceipt(client);

  if (receipt.accountId === null) {
    throw new Error("Somehow accountId is null.");
  }

  return [receipt.accountId, accountPrivateKey];
};

