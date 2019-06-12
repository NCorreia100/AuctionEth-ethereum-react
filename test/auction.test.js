const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');


const provider = ganache.provider();
const web3 = new Web3(provider);
const { abi, bytecode } = require('../ethereum/build/compile');

let accounts;
let factory;
let auctionAddress;
let auction;

before(async()=>{
    accounts = web3.eth.getAccounts();
    factory = await new web3.eth.Contract(abi)
    .deploy({data:bytecode})
    .send({from:accounts[0],gas:'100000'});
})

beforeEach(async()=>{
    await factory.methods.createAuction('a product','a description',1,100,web3.utils.toWei('0.1','ether'))
    .send({from:accounts[0],gas:'1000000'})
    
    let [...auctionAddress] = await factory.methods.getDeployedAuctions().call();
    campain 
})