import { Client, AccountId, PrivateKey, Hbar, ContractFunctionParameters } from "@hashgraph/sdk";
import dotenv from "dotenv";
import fs from "fs";
import { createFungibleToken, associateToken } from "./services/hederaTokenService";
import { createAccount } from "./services/hederaAccountService";
import { checkAccountBalance } from "./services/queries";
import { deployContract, executeContractFunction } from "./services/hederaSmartContractService";

dotenv.config();

// create your client
const accountIdString = process.env.OPERATOR_ACCOUNT_ID;
const privateKeyString = process.env.OPERATOR_PRIVATE_KEY;
if (accountIdString === undefined || privateKeyString === undefined ) { throw new Error('account id and private key in env file are empty')}

const operatorAccountId = AccountId.fromString(accountIdString);
const operatorPrivateKey = PrivateKey.fromString(privateKeyString);

const client = Client.forTestnet().setOperator(operatorAccountId, operatorPrivateKey);
client.setDefaultMaxTransactionFee(new Hbar(100));

/*
  * Creates a treasury account for a token collection. 
  * Creates an account for Alice and Bob.
  * Grants an allowance to Alice to transfer Fungible tokens to Bob using standrd ERC calls
*/
const grantAllowanceExample = async () => {
  // create treasury's, alice's, and bob's accounts
  const [treasuryAccId, treasuryAccPvKey] = await createAccount(client, 100);
  console.log(`- Treasury's account: https://hashscan.io/#/testnet/account/${treasuryAccId}`);
  console.log(`-Treasury's private key: ${treasuryAccId}\n`);
  const [aliceAccId, aliceAccPvKey] = await createAccount(client, 100);
  console.log(`- Alice's account: https://hashscan.io/#/testnet/account/${aliceAccId}`);
  const ALICE_ACCOUNT_IN_SOLIDITY_FORMAT = aliceAccId.toSolidityAddress();
  console.log(`Alice, the spender, address in solidity format: ${ALICE_ACCOUNT_IN_SOLIDITY_FORMAT}`);
  const [bobAccId, bobAccPvKey] = await createAccount(client, 100);
  console.log(`- Bob's account: https://hashscan.io/#/testnet/account/${bobAccId}\n`);
  console.log(`- Bob's private key: ${bobAccPvKey}\n`);

  const supplyKey = PrivateKey.generateED25519();

  // create token
  const { tokenId, tokenIdInSolidityFormat } = await createFungibleToken(client, treasuryAccId, supplyKey, treasuryAccPvKey, 100, 'HBAR ROCKS', 'HROCK');

  

  // Bob must associate to recieve token
  await associateToken(client, tokenId, bobAccId, bobAccPvKey)

  /*
    * Read compiled byte code
    * Note: You can compile your smart contract on Remix ide or using solc
  */
  const bytecode = fs.readFileSync("binaries/contracts_ERC20FungibleToken_sol_ERC20FungibleToken.bin");

  // Deploy contract
  const gasLimit = 1000000;
  const [contractId, contractSolidityAddress] = await deployContract(client, bytecode, gasLimit);

  // set oeprator to be treasury account (treasury account is now the caller of smart contract)
  client.setOperator(treasuryAccId, treasuryAccPvKey);

  /*
   * Setting the necessary paramters to execute the approve contract function
  */
  console.log(`------- Start approval ------\n`);
  const approveParams = new ContractFunctionParameters()
    .addAddress(tokenIdInSolidityFormat)
    .addAddress(ALICE_ACCOUNT_IN_SOLIDITY_FORMAT)
    .addUint256(50);

  await executeContractFunction(
    client,
    contractId,
    4_000_000,
    'approve',
    approveParams,
    treasuryAccPvKey);

  const allowanceParams = new ContractFunctionParameters()
    .addAddress(tokenIdInSolidityFormat)
    .addAddress(treasuryAccId.toSolidityAddress())
    .addAddress(ALICE_ACCOUNT_IN_SOLIDITY_FORMAT);
  
  // check the allowance
  const contractFunctionResult = await executeContractFunction(
    client,
    contractId,
    4_000_000,
    'checkAllowance',
    allowanceParams,
    treasuryAccPvKey);
  
  if (contractFunctionResult) {
    console.log(`Alice has an allowance of ${contractFunctionResult.getUint256(0)}`);
  }

  // set the client back to the operator account
  client.setOperator(operatorAccountId, operatorPrivateKey);
  await checkAccountBalance(treasuryAccId, tokenId, client);
  await checkAccountBalance(bobAccId, tokenId, client);

  // make alice the client to excute the contract call.
  client.setOperator(aliceAccId, aliceAccPvKey);
  console.log(`------- Start transfer ------\n`)
  const transferFromParams = new ContractFunctionParameters()
  .addAddress(tokenIdInSolidityFormat)
  .addAddress(treasuryAccId.toSolidityAddress())
  .addAddress(bobAccId.toSolidityAddress())
  .addUint256(30);

  await executeContractFunction(
    client,
    contractId,
    4_000_000,
    'transferFrom',
    transferFromParams,
    aliceAccPvKey);

  await checkAccountBalance(treasuryAccId, tokenId, client);
  await checkAccountBalance(bobAccId, tokenId, client);

  // set operator to be treasury account (treasury account is now the caller of the mart contract)
  client.setOperator(treasuryAccId, treasuryAccPvKey);
  
  // remove alice allowance
  const removeApproveParams = new ContractFunctionParameters()
  .addAddress(tokenIdInSolidityFormat)
  .addAddress(ALICE_ACCOUNT_IN_SOLIDITY_FORMAT)
  .addUint256(0);

await executeContractFunction(
  client,
  contractId,
  4_000_000,
  'approve',
  removeApproveParams,
  treasuryAccPvKey);

  // check allowance after it has been removed
  const checkallowanceParams = new ContractFunctionParameters()
  .addAddress(tokenIdInSolidityFormat)
  .addAddress(treasuryAccId.toSolidityAddress())
  .addAddress(ALICE_ACCOUNT_IN_SOLIDITY_FORMAT);

const contractFunctionRes = await executeContractFunction(
  client,
  contractId,
  4_000_000,
  'checkAllowance',
  checkallowanceParams,
  treasuryAccPvKey);
if (contractFunctionRes) {
  console.log(`Alice has an allowance of ${contractFunctionRes.getUint256(0)}`);
}

  client.close();
}
grantAllowanceExample();