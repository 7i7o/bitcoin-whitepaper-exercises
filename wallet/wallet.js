"use strict";

var path = require("path");
var fs = require("fs");
const { format } = require("path");

var Blockchain = require(path.join(__dirname,"blockchain.js"));

const KEYS_DIR = path.join(__dirname,"keys");
const PRIV_KEY_TEXT_1 = fs.readFileSync(path.join(KEYS_DIR,"1.priv.pgp.key"),"utf8");
const PUB_KEY_TEXT_1 = fs.readFileSync(path.join(KEYS_DIR,"1.pub.pgp.key"),"utf8");
const PRIV_KEY_TEXT_2 = fs.readFileSync(path.join(KEYS_DIR,"2.priv.pgp.key"),"utf8");
const PUB_KEY_TEXT_2 = fs.readFileSync(path.join(KEYS_DIR,"2.pub.pgp.key"),"utf8");

var wallet = {
	accounts: {},
};

addAccount(PRIV_KEY_TEXT_1,PUB_KEY_TEXT_1);
addAccount(PRIV_KEY_TEXT_2,PUB_KEY_TEXT_2);

// fake an initial balance in account #1
wallet.accounts[PUB_KEY_TEXT_1].outputs.push({
		account: PUB_KEY_TEXT_1,
		amount: 42,
	}
);

main().catch(console.log);


// **********************************

async function main() {

	// logResults(wallet.accounts[PUB_KEY_TEXT_1], wallet.accounts[PUB_KEY_TEXT_2], 0);

	await spend(
		wallet.accounts[PUB_KEY_TEXT_1], // from
		wallet.accounts[PUB_KEY_TEXT_2], // to
		13                               // amount
	);

	await spend(
		wallet.accounts[PUB_KEY_TEXT_2], // from
		wallet.accounts[PUB_KEY_TEXT_1], // to
		5                                // amount
	);

	await spend(
		wallet.accounts[PUB_KEY_TEXT_1], // from
		wallet.accounts[PUB_KEY_TEXT_2], // to
		31                               // amount
	);

	try {
		await spend(
			wallet.accounts[PUB_KEY_TEXT_2], // from
			wallet.accounts[PUB_KEY_TEXT_1], // to
			40                               // amount
		);
		}
	catch (err) {
		console.log(err);
	}

	// console.log(accountBalance(PUB_KEY_TEXT_1));
	// console.log(accountBalance(PUB_KEY_TEXT_2));
	console.log(await Blockchain.verifyChain(Blockchain.chain));
}

function addAccount(privKey,pubKey) {
	wallet.accounts[pubKey] = {
		privKey,
		pubKey,
		outputs: []
	};
}

async function spend(fromAccount,toAccount,amountToSpend) {
	// TODO
	var trData = {
	inputs: [],
	outputs: [],
};
	
	// pick inputs to use from fromAccount's outputs (i.e. previous txns, see line 22), sorted descending
	if (!fromAccount.outputs) {
		throw `Don't have enough to spend ${amountToSpend}! ( 'From' Balance: ${accountBalance(fromAccount.pubKey)} . 'To' Balance: ${accountBalance(toAccount.pubKey)} )`;
	} else {
		var sortedInputs = [...fromAccount.outputs].sort((a, b) => b - a );
		// console.log('Sorted Inputs: '+JSON.stringify(sortedInputs));
		
		let inputAmounts = 0;
		let inputsToUse = [];
		for (let input of sortedInputs) {
			// remove input from output-list
			fromAccount.outputs.splice(fromAccount.outputs.indexOf(input), 1);

			inputAmounts += input.amount;
			inputsToUse.push(input);

			// do we have enough inputs to cover the spent amount?
			if (inputAmounts >= amountToSpend) break;
		}

		// were there enough inputs?
		let change = inputAmounts - amountToSpend;
		if (change < 0) {
			fromAccount.outputs.push(...inputsToUse);
			throw `Don't have enough to spend ${amountToSpend}! ( 'From' Balance: ${accountBalance(fromAccount.pubKey)} . 'To' Balance: ${accountBalance(toAccount.pubKey)} )`;
		}

		// sign and record inputs
		for (let input of inputsToUse) {
			trData.inputs.push(
				await Blockchain.authorizeInput({
					account: input.account,
					amount: input.amount
				}, fromAccount.privKey)
			);
		}
		
		// record output
		trData.outputs.push({
			account: toAccount.pubKey,
			amount: amountToSpend
		});

		// is "change" output needed?
		if (change) {
			trData.outputs.push({
				account: fromAccount.pubKey,
				amount: change
			});
		}
		
		// create (1!) transaction and add it (as a list!) to blockchain
		var tx = Blockchain.createTransaction(trData);
		// console.log(JSON.stringify([tx, ]));
		Blockchain.insertBlock(Blockchain.createBlock([tx, ]));	
		
		// record outputs in our wallet (if needed)	
		wallet.accounts[toAccount.pubKey].outputs.push({
			account: toAccount.pubKey,
			amount: amountToSpend
		});
		if (change) {
			wallet.accounts[fromAccount.pubKey].outputs.push({
				account: fromAccount.pubKey,
				amount: change
			});
		}

		// logResults(fromAccount, toAccount, amountToSpend);
	}
}

function logResults(fromAccount, toAccount, amountSpent) {
	let fromOutputs = wallet.accounts[fromAccount.pubKey].outputs.map(output => output.amount);
	let toOutputs = wallet.accounts[toAccount.pubKey].outputs.map(output => output.amount);
	// console.log(` Results after transferring amount ${amountSpent}: < From [${fromOutputs}] . To [${toOutputs}] >`);
	console.log(` Transferred ${amountSpent}! ( 'From' Balance: ${accountBalance(fromAccount.pubKey)} . 'To' Balance: ${accountBalance(toAccount.pubKey)} )`);
}

function accountBalance(accountPubKey) {
	var balance = 0;
	if (accountPubKey in wallet.accounts) {
		for (let output of wallet.accounts[accountPubKey].outputs) {
			balance += output.amount
		}
	}	
	return balance;
	
}
