const { Client, AccountId, PrivateKey, HbarUnit, Hbar, ContractCallQuery, ContractFunctionParameters, TokenAssociateTransaction } = require("@hashgraph/sdk");
require("dotenv").config();
const fs = require("fs");
const { createFungibleToken, sendToken, sendApprovedToken } = require("./services/hederaTokenService");
const { createAccount } = require("./services/hederaAccountService");
const { tokenInfoQuery } = require("./services/queries");
const { deployContract, executeContractFunction } = require("./services/hederaSmartContractService");


// create your client
const operatorAccountId = AccountId.fromString(process.env.OPERATOR_ACCOUNT_ID);
const operatorPrivateKey = PrivateKey.fromString(
  process.env.OPERATOR_PRIVATE_KEY
);

const client = Client.forTestnet().setOperator(operatorAccountId, operatorPrivateKey);
client.setDefaultMaxTransactionFee(new Hbar(100));

/*
  * Creates a treasury account for a token collection. 
  * Creates an account for Alice and Bob.
  * Grants an allowance to Alice to transfer Fungible tokens to Bob using standrd ERC calls
*/
const grantAllowanceExample = async () => {
  // create treasury's, alice's, and bob's accounts
  const [treasureyAccId, treasuryAccPvKey] = await createAccount(client, 50);
  console.log(`- Treasury's account: https://hashscan.io/#/testnet/account/${treasureyAccId}`);
  console.log(`- Treausry Account Private Key: ${treasuryAccPvKey}\n`);
  const [aliceAccId, aliceAccPvKey] = await createAccount(client, 50);
  console.log(`- - Alice's account: https://hashscan.io/#/testnet/account/${aliceAccId}`);
  console.log(`- Alice Account Private Key: ${aliceAccPvKey}\n`);
  const [bobAccId, bobAccPvKey] = await createAccount(client, 50);
  console.log(`Bob's account: https://hashscan.io/#/testnet/account/${bobAccId}`);
  console.log(`- Bob Account Private Key: ${bobAccPvKey}`);

  const supplyKey = PrivateKey.generateED25519();

  // create token collection and print initial supply
  const [tokenId, tokenIdInSolidityFormat] = await createFungibleToken(client, treasureyAccId, supplyKey, treasuryAccPvKey, 100);
  const tokenInfo = await tokenInfoQuery(tokenId, client);
  console.log(`Initial token supply: ${tokenInfo.totalSupply.low}`);

  /*
    * Read compiled byte code
    * Note: You can compile your smart contract on Remix ide or using solc
  */
  const bytecode = fs.readFileSync("binaries/contracts_ERC20FungibleToken_sol_ERC20FungibleToken.bin");

  // Deploy contract
  const gasLimit = 1000000;
  const [contractId, contractSolidityAddress] = await deployContract(client, bytecode, gasLimit);

  const tokenAssociateTx = new TokenAssociateTransaction()
    .setTokenIds([tokenId])
    .setAccountId(aliceAccId)
    .freezeWith(client);
  const tokenAssociateSign = await tokenAssociateTx.sign(aliceAccPvKey);
  const tokenAssociateSubmit = await tokenAssociateSign.execute(client);
  const tokenAssociateRx = await tokenAssociateSubmit.getReceipt(client);
  console.log(`- Alice associated with token: ${tokenAssociateRx.status}`);

  const tokenAssociateTxBob = new TokenAssociateTransaction()
    .setTokenIds([tokenId])
    .setAccountId(bobAccId)
    .freezeWith(client);
  const tokenAssociateSignBob = await tokenAssociateTxBob.sign(bobAccPvKey);
  const tokenAssociateSubmitBob = await tokenAssociateSignBob.execute(client);
  const tokenAssociateRxBob = await tokenAssociateSubmitBob.getReceipt(client);
  console.log(`- Bob associated with token: ${tokenAssociateRxBob.status}`);

  console.log(`- Send tokens to Alice to test association`)
  await sendToken(client, tokenId, treasureyAccId, aliceAccId, 3, treasureyAccId, treasuryAccPvKey);

  
  // set oeprator to be treasury account (treasury account is now the caller of smart contract)
  client.setOperator(treasureyAccId, treasuryAccPvKey);

  // Treasury account grants an approval to alice to transfer from it's own account using IERC20(token).approve
  // Sets amount as the allowance of spender over the caller's tokens.
  const approveParams = new ContractFunctionParameters()
    .addAddress(tokenIdInSolidityFormat)
    .addAddress(aliceAccId.toSolidityAddress())
    .addUint256(5);
  const contractFunctionResult = await executeContractFunction(
    client,
    contractId,
    40_00_000,
    'approve',
    approveParams,
    treasuryAccPvKey);

  // set operator to be alice account as she is doing the transfer on the treasurys behalf (alice is caller of SC)
  client.setOperator(aliceAccId, aliceAccPvKey);

  // Alice transfers to another account (Bob in our case) 3 FT that Treasury account holds
  // const transferFromParams = new ContractFunctionParameters()
  //   .addAddress(aliceAccId.toSolidityAddress())
  //   .addAddress(bobAccId.toSolidityAddress())
  //   .addInt256(3);
  // const contractFunctionResult2 = await executeContractFunction(
  //   client,
  //   contractId,
  //   400_000,
  //   'transferFrom',
  //   transferFromParams);

  // TESTING:
  await sendApprovedToken(client, tokenId, treasureyAccId, bobAccId, 3, aliceAccId, aliceAccPvKey)

  client.close();
}
grantAllowanceExample();