const { ContractCreateFlow, ContractCallQuery, ContractFunctionParameters, Hbar, ContractExecuteTransaction, TransactionRecordQuery } = require('@hashgraph/sdk');

/*
 * Stores the bytecode and deploys the contract to the Hedera network.
 * Return an array with the contractId and contract solidity address.
 * 
 * Note: This single call handles what FileCreateTransaction(), FileAppendTransaction() and
 * ContractCreateTransaction() classes do. 
*/
const deployContract = async (client, bytecode, gasLimit) => {
  const contractCreateFlowTxn = new ContractCreateFlow()
    .setBytecode(bytecode)
    .setGas(gasLimit);

  console.log(`- Deploying smart contract to Hedera network`)
  const txnResponse = await contractCreateFlowTxn.execute(client);

  const txnReceipt = await txnResponse.getReceipt(client);
  const contractId = txnReceipt.contractId;
  const contractSolidityAddress = contractId.toSolidityAddress();

  console.log(`- The smart contract Id is ${contractId}`);
  console.log(`- The smart contract Id in Solidity format is ${contractSolidityAddress}\n`);

  return [contractId, contractSolidityAddress];
}

const executeContractFunction = async (client, contractId, gasLimit, functionName, functionParameters, accountPvKey) => {
  const contractCallQueryTx = new ContractExecuteTransaction()
    .setContractId(contractId)
    .setGas(gasLimit)
    .setFunction(functionName, functionParameters)
    .freezeWith(client);

  const contractCallQueryTxSigned = await contractCallQueryTx.sign(accountPvKey);
  const txnResponse = await contractCallQueryTxSigned.execute(client);
  const txRecord = await txnResponse.getRecord(client);

	const recQuery = await new TransactionRecordQuery()
		.setTransactionId(txRecord.transactionId)
		.setIncludeChildren(true)
		.execute(client);

	console.log(
		`\n- Contract call for FT ${functionName} (check in Hashscan) was a: ${recQuery.receipt.status.toString()} transaction id: ${recQuery.transactionId}`
	);
    return txRecord.contractFunctionResult;
}

module.exports = { deployContract, executeContractFunction };