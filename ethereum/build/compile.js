const solc = require('solc');
const solConfig = require('./sol.config.js');

let compiled = solc.compile(JSON.stringify(solConfig));


let { AuctionFactory, Auction } = JSON.parse(compiled, 1).contracts.Factory;

module.exports = {
    factoryABI: AuctionFactory.abi,
    factoryBytecode: AuctionFactory.evm.bytecode,
    auctionABI: Auction.abi,
    auctionBytecode: Auction.evm.bytecode
};


