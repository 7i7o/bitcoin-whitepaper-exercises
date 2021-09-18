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

// var difficulty = 10;
var difficulty = 14;

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

let totalTime = 0;

for (let line of poem) {
	let startTime = Date.now();
	let bl = createBlock(line);
	Blockchain.blocks.push(bl);
	let time = Date.now() - startTime;
	console.log(`Hash (Difficulty: ${difficulty}): ${bl.hash} - ${humanReadableMilliseconds(time)}`);
	totalTime += time;
	difficulty++;

}
console.log(humanReadableMilliseconds(totalTime));	


// **********************************

function humanReadableMilliseconds(time) {
	let h,m,s,ms;
	h = Math.floor(time/3600000);
	m = Math.floor(time/60000 - h * 60);
	s = Math.floor(time/1000 - h * 3600 - m * 60);
	ms = time - h * 3600000 - m * 60000 - s * 1000;
	ms = `${ms < 100 ? ( ms < 10 ? '00' : '0' ) : ''}${ms}` 
	s = `${s < 10 ? '0': ''}${s}` 
	m = `${m < 10 ? '0': ''}${m}` 
	h = `${h < 10 ? '0': ''}${h}` 
	return `${h}:${m}:${s}.${ms}`
}

function createBlock(data) {
	var bl = {
		index: Blockchain.blocks.length,
		prevHash: Blockchain.blocks[Blockchain.blocks.length-1].hash,
		data,
		timestamp: Date.now(),
	};
	do {
		bl.nonce = randomNonce();
		bl.hash = blockHash(bl);
	} while (!hashIsLowEnough(bl.hash))

	return bl;
}

// TODO: randomNonce()
function randomNonce() {
	return crypto.randomBytes(16).toString('base64');
}

function blockHash(bl) {
	// TODO
	return crypto.createHash("sha256").update(
		`${bl.index};${bl.prevHash};${bl.data};${bl.timestamp};${bl.nonce};`
	).digest("hex");
}

function hashIsLowEnough(hash) {
	// TODO
	// let div = parseInt(Number(difficulty/4))
	// let mod = difficulty % 4;
	// let leadingHashNum = parseInt(Number('0x'+hash.slice(0, div+1)));
	// switch (mod * 4) {
	// 	case 0: // No zeroes left to compare in last hex
	// 		return leadingHashNum < 16;
	// 	case 4:  // One zero left to compare in last hex
	// 		return leadingHashNum < 8;
	// 	case 8:  // Two zeroes left to compare in last hex
	// 		return leadingHashNum < 4;
	// 	case 12: // Three zeroes left to compare in last hex
	// 		return leadingHashNum < 2;
	// }
	// return true;
	var neededChars = Math.ceil(difficulty / 4);
	var threshold = Number(`0b${"".padStart(neededChars * 4,"1111".padStart(4 + difficulty,"0"))}`);
	var prefix = Number(`0x${hash.substr(0,neededChars)}`);
	return prefix <= threshold;
}

function verifyBlock(bl) {
	if (bl.data == null) return false;
	if (bl.index === 0) {
		if (bl.hash !== "000000") return false;
	}
	else {
		if (!bl.prevHash) return false;
		if (!(
			typeof bl.index === "number" &&
			Number.isInteger(bl.index) &&
			bl.index > 0
		)) {
			return false;
		}
		if (bl.hash !== blockHash(bl)) return false;
	}

	return true;
}

function verifyChain(chain) {
	var prevHash;
	for (let bl of chain.blocks) {
		if (prevHash && bl.prevHash !== prevHash) return false;
		if (!verifyBlock(bl)) return false;
		prevHash = bl.hash;
	}

	return true;
}
