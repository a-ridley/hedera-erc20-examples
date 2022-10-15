import { ContractCreateFlow, ContractFunctionParameters, ContractExecuteTransaction, TransactionRecordQuery, Client, ContractId, PrivateKey } from '@hashgraph/sdk';

/*
 * Stores the bytecode and deploys the contract to the Hedera network.
 * Return an array with the contractId and contract solidity address.
 * 
 * Note: This single call handles what FileCreateTransaction(), FileAppendTransaction() and
 * ContractCreateTransaction() classes do. 
*/
export const deployContract = async (client: Client, bytecode: string | Uint8Array, gasLimit: number) => {
  const contractCreateFlowTxn = new ContractCreateFlow()
    .setBytecode(bytecode)
    .setGas(gasLimit);

  console.log(`- Deploying smart contract to Hedera network`)
  const txnResponse = await contractCreateFlowTxn.execute(client);

  const txnReceipt = await txnResponse.getReceipt(client);
  const contractId = txnReceipt.contractId;
  if (contractId === null ) { throw new Error("Somehow contractId is null.");}

  const contractSolidityAddress = contractId.toSolidityAddress();

  console.log(`- The smart contract Id is ${contractId}`);
  console.log(`- The smart contract Id in Solidity format is ${contractSolidityAddress}\n`);

  return [contractId, contractSolidityAddress];
}

export const executeContractFunction = async (client: Client, contractId: string | ContractId, gasLimit: number, functionName: string, functionParameters: ContractFunctionParameters, accountPvKey: PrivateKey) => {
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
    
  return txRecord.contractFunctionResult;
}
