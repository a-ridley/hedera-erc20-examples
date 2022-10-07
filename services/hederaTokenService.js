const { TokenCreateTransaction, Hbar, TokenType, TransferTransaction, TransactionId, TokenAssociateTransaction } = require('@hashgraph/sdk');

const createFungibleToken = async (
  client,
  treasureyAccId,
  supplyKey,
  treasuryAccPvKey,
  initialSupply,
  tokenName,
  tokenSymbol,
) => {
  /* 
    * Create a transaction with token type fungible
    * Returns Fungible Token Id and Token Id in solidity format
  */
  const createTokenTxn = await new TokenCreateTransaction()
    .setTokenName(tokenName)
    .setTokenSymbol(tokenSymbol)
    .setTokenType(TokenType.FungibleCommon)
    .setInitialSupply(initialSupply)
    .setTreasuryAccountId(treasureyAccId)
    .setSupplyKey(supplyKey)
    .setMaxTransactionFee(new Hbar(30))
    .freezeWith(client); //freeze tx from from any further mods.

  const createTokenTxnSigned = await createTokenTxn.sign(treasuryAccPvKey);
  // submit txn to heder network
  const txnResponse = await createTokenTxnSigned.execute(client);
  // request receipt of txn
  const txnRx = await txnResponse.getReceipt(client);
  const txnStatus = txnRx.status.toString();
  const tokenId = txnRx.tokenId;
  const tokenIdInSolidityFormat = tokenId.toSolidityAddress();

  console.log(
    `Token Type Creation was a ${txnStatus} and was created with token id: ${tokenId}`
  );
  console.log(`Token Id in Solidity format: ${tokenIdInSolidityFormat}`);

  return [tokenId, tokenIdInSolidityFormat];
};

const associateToken = async (client, tokenId, accountId, accountPrivateKey) => {
  const tokenAssociateTx = new TokenAssociateTransaction()
  .setTokenIds([tokenId])
  .setAccountId(accountId)
  .freezeWith(client);
const tokenAssociateSign = await tokenAssociateTx.sign(accountPrivateKey);
const tokenAssociateSubmit = await tokenAssociateSign.execute(client);
const tokenAssociateRx = await tokenAssociateSubmit.getReceipt(client);
console.log(`- Associated with token: ${tokenAssociateRx.status}`);
} 

const sendToken = async (client, tokenId, owner, reciever, sendBalance, spender, spenderPvKey) => {
  let hbarSendRx = [];
  try {
    if (client.operatorAccountId != null) {
      let tokenSendTx = new TransferTransaction()
        .addTokenTransfer(tokenId, owner, -sendBalance)
        .addTokenTransfer(tokenId, reciever, sendBalance)
        .freezeWith(client);
      const tokenSendTxSign = await tokenSendTx.sign(spenderPvKey);
      let tokenSendSubmit = await tokenSendTxSign.execute(client);
      hbarSendRx[0] = await tokenSendSubmit.getReceipt(client);
      console.log(`- Sent token to account ${reciever}: ${hbarSendRx[0].status}`);
    }
    else {
      console.log('hedera client operator not set');
    }
  } catch (err) {
    console.log(`- ERROR: Couldn't send token to ${reciever}`);
    console.error(err);
  }
  return hbarSendRx;
}

  //Note: The spender must either be set as the client or must set the TransactionId and sign it 
const sendApprovedToken = async (client, tokenId, owner, reciever, sendBalance, spenderId, spenderKey) => {
  let hbarSendRx = null;
  try {
    if (client.operatorAccountId != null) {
      let tokenSendTx = new TransferTransaction()
        .addApprovedTokenTransfer(tokenId, owner, -sendBalance)
        .setTransactionId(TransactionId.generate(spenderId))
        .addTokenTransfer(tokenId, reciever, sendBalance)
        .freezeWith(client);
      const tokenSendTxSigned = await tokenSendTx.sign(spenderKey);
      let tokenSendSubmit = await tokenSendTxSigned.execute(client);
      hbarSendRx = await tokenSendSubmit.getReceipt(client);
      console.log(`- Sent token to account ${reciever}: ${hbarSendRx.status}`);
    }
    else {
      console.log('hedera client operator not set');
    }
  } catch (err) {
    console.log(`- ERROR: Couldn't send token to ${reciever}`);
    console.error(err);
  }

  return hbarSendRx;
}

module.exports = { createFungibleToken, sendToken, sendApprovedToken, associateToken };
