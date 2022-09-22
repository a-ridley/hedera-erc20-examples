const { TransactionRecordQuery, TokenInfoQuery, AccountBalanceQuery } = require("@hashgraph/sdk");

const transactionRecordQuery = async (txId, client) => {
	const transactionRecordQuery = await new TransactionRecordQuery()
		.setTransactionId(txId)
		.setIncludeChildren(true)
		.execute(client);
	return transactionRecordQuery;
}

const tokenInfoQuery = async (tkId, client) => {
	const info = await new TokenInfoQuery().setTokenId(tkId).execute(client);
	return info;
}

const checkBalance = async (accountId, tokenId, client) => {
	let balanceCheckTx = [];
	try {
		balanceCheckTx.push(await new AccountBalanceQuery().setAccountId(accountId).execute(client));
		console.log(
			`- Balance of account ${accountId}: ${balanceCheckTx.hbars.toString()} + ${balanceCheckTx.tokens._map.get(
				tokenId.toString()
			)} unit(s) of token ${tokenId}`
		);
	} catch {
		balanceCheckTx.push(await new AccountBalanceQuery().setContractId(accountId).execute(client));
		console.log(
			`- Balance of contract ${accountId}: ${balanceCheckTx.hbars.toString()} + ${balanceCheckTx.tokens._map.get(
				tokenId.toString()
			)} unit(s) of token ${tokenId}`
		);
	}
}

module.exports = { transactionRecordQuery, tokenInfoQuery, checkBalance };
