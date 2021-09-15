"use strict";

var crypto = require("crypto");

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

// TODO: insert each line into blockchain
for (let line of poem) {
	createBlock(line);
}



console.log(`Blockchain is valid: ${verifyChain(Blockchain)}`);


// **********************************

function createBlock(data) {
	const blockQty = Blockchain.blocks.length;
	const block = {
		index: blockQty,
		prevHash: Blockchain.blocks[blockQty-1].hash,
		data: data,
		timestamp: Date.now(),
	};
	block.hash = blockHash(block);
	Blockchain.blocks.push(block);
	console.log(block);
	return block;
}

function blockHash(bl) {
	return crypto.createHash("sha256").update(
		// TODO: use block data to calculate hash
		`${bl.index};${bl.prevHash};${bl.data};${bl.timestamp};`
	).digest("hex");
}

function verifyChain(bc) {
	let prevHash = '';
	for (let block of bc.blocks) {
		if (!verifyBlock(block)) return false; // hash del bloque valido
		if (block.index > 0 && prevHash != block.prevHash) return false; // prevHash coincide
		prevHash = block.hash;
	}
	return true;
}

function verifyBlock (bl) {
	console.log('Checking validity of Block '+bl.index);
	if (bl.data == null) return false; // data not empty
	if (bl.index < 0 || bl.index % 1 != 0) return false; // Negative or not Integer
	if (bl.index === 0) return (bl.hash === "000000"); // Genesis block
	if (bl.data.length === 0) return false; // data not empty
	if (bl.prevHash.length === 0) return false; // prevHash not empty
	if (bl.hash != blockHash(bl)) return false; // hash doesn't match computing blockHash on the block

	return true;
}
// console.log(JSON.stringify(Blockchain.blocks));