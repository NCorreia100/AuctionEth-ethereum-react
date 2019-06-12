const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');


const provider = ganache.provider();
const web3 = new Web3(provider);
const { factoryABI, auctionABI,factoryBytecode, auctionBytecode } = require('../ethereum/build/compile');

let accounts;
let factory;
let auction;

before(async()=>{   
    accounts = await web3.eth.getAccounts();      
    factory = await new web3.eth.Contract(factoryABI)
    .deploy({data:factoryBytecode})
    .send({from:accounts[0],gas:'5000000'});
});

beforeEach(async()=>{
    await factory.methods.createAuction('a product','a description',1,100,web3.utils.toWei('0.1','ether'))
    .send({from:accounts[0],gas:'1000000'})
    
    let auctionAddress = await factory.methods.getDeployedAuctions().call();   
    auction = await new web3.eth.Contract(auctionABI,auctionAddress.pop()); 
});

describe('Lottery Contract', () => {
    it('deploys a factory and an auction', () => {
      assert.ok(factory.options.address);
      assert.ok(auction.options.address);
    })
});

