"use strict";

var path = require("path");
var fs = require("fs");
var crypto = require("crypto");

const KEYS_DIR = path.join(__dirname,"keys");
const PUB_KEY_TEXT = fs.readFileSync(path.join(KEYS_DIR,"pub.pgp.key"),"utf8");

// The Power of a Smile
// by Tupac Shakur
var poem = [
	"The power of a gun can kill",
	"and the power of fire can burn",
	"the power of wind can chill",
	"and the power of a mind can learn",
	"the power of anger can rage",
	"inside until it tears u apart",
	"but the power of a smile",
	"especially yours can heal a frozen heart",
];

const maxBlockSize = 4; // Higher than 1, because 'blockFee' Object counts toward maxBlockSize limit
const blockFee = 5;
var difficulty = 16;

var Blockchain = {
	blocks: [],
};

// Genesis block
Blockchain.blocks.push({
	index: 0,
	hash: "000000",
	data: "",
	timestamp: Date.now(),
});

var transactionPool = [];

addPoem();
processPool();
countMyEarnings();


// **********************************

function addPoem() {
	// TODO: add lines of poem as transactions to the transaction-pool
	let totalPoemFee = 0
	for (let line of poem) {
		let tr = createTransaction(line, Math.ceil(Math.random()*10))
		transactionPool.push(tr)
		// console.log(`  fee: ${tr.fee} - data: ${tr.data}`)
		totalPoemFee += tr.fee
	}
	console.log(`Total fee of poem lines: ${totalPoemFee}`)
	console.log(' ')
}

function processPool() {
	// TODO: process the transaction-pool in order of highest fees
	transactionPool = [...transactionPool].sort((a, b) => b.fee - a.fee );

	while (transactionPool.length > 0) {
		let blockTransactionList = [
			{
				blockFee,
				account: PUB_KEY_TEXT
			},
		]
		let trList = transactionPool.splice(0, Math.min(maxBlockSize-1, transactionPool.length))
		for (let tr of trList) {
			blockTransactionList.push(tr);
		}
		// console.log(JSON.stringify(blockTransactionList))
		Blockchain.blocks.push(createBlock(blockTransactionList));
	}
}

function countMyEarnings() {
	// TODO: count up block-fees and transaction-fees
	let totalBlockFees = 0
	let totalTransactionFess = 0
	for (let bl of Blockchain.blocks) {
		if (bl.index > 0) {
			let blockTransactionFees = 0
			for (let i = 0; i < bl.data.length; i++) {
				let tr = bl.data[i]
				if (i == 0) {
					totalBlockFees += tr.blockFee
					// console.log(`  - Block ${bl.index} Fee: ${tr.blockFee}`)
				} else {
					blockTransactionFees += tr.fee
					// console.log(`   L Transaction Fee: ${tr.fee} (data: ${tr.data})`)
				}
			}
			totalTransactionFess += blockTransactionFees
			// console.log(`  Sum of Transaction Fees in Block ${bl.index}: ${blockTransactionFees}`)
			// console.log(' ')
		}
	}
	console.log(` Sum of Block Fees: ${totalBlockFees}`)
	console.log(` Sum of Transaction Fees: ${totalTransactionFess}`)
	console.log(' ')
	console.log(`Total Earnings: ${totalBlockFees + totalTransactionFess}`)

}

function createBlock(data) {
	var bl = {
		index: Blockchain.blocks.length,
		prevHash: Blockchain.blocks[Blockchain.blocks.length-1].hash,
		data,
		timestamp: Date.now(),
	};

	bl.hash = blockHash(bl);

	return bl;
}

function blockHash(bl) {
	while (true) {
		bl.nonce = Math.trunc(Math.random() * 1E7);
		let hash = crypto.createHash("sha256").update(
			`${bl.index};${bl.prevHash};${JSON.stringify(bl.data)};${bl.timestamp};${bl.nonce}`
		).digest("hex");

		if (hashIsLowEnough(hash)) {
			return hash;
		}
	}
}

function hashIsLowEnough(hash) {
	var neededChars = Math.ceil(difficulty / 4);
	var threshold = Number(`0b${"".padStart(neededChars * 4,"1111".padStart(4 + difficulty,"0"))}`);
	var prefix = Number(`0x${hash.substr(0,neededChars)}`);
	return prefix <= threshold;
}

function createTransaction(data, fee) {
	var tr = {
		data,
		fee,
	};

	tr.hash = transactionHash(tr);

	return tr;
}

function transactionHash(tr) {
	return crypto.createHash("sha256").update(
		`${JSON.stringify(tr.data)};${JSON.stringify(tr.fee)}`
	).digest("hex");
}
