const solc = require('solc');
const solConfig = require('./sol.config.js');

let compiled = solc.compile(JSON.stringify(solConfig));
let  factory = JSON.parse(compiled,1).contracts.Factory.AuctionFactory;

module.exports = {
    abi: factory.abi,
    bytecode: factory.evm.bytecode
}
