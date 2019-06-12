const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');


const provider = ganache.provider();
const web3 = new Web3(provider);
const { factoryABI, auctionABI,factoryBytecode, auctionBytecode } = require('../ethereum/build/compile');

let accounts;
let factory;
let auction;

let timeinSec = Math.floor(Date.now() / 1000)
let in24h = Math.floor(Date.now() / 1000) + 24 * 60 * 60;
let wei = web3.utils.toWei('0.1', 'ether');
let mockProduct = {
    name: 'a product',
    description: 'a description',
    qtyRemaining: 1,
    dueBy: in24h,
    minimumWei: wei
}

before(async()=>{      
    accounts = await web3.eth.getAccounts();      
    factory = await new web3.eth.Contract(factoryABI)
    .deploy({data:factoryBytecode})
    .send({from:accounts[0],gas:'5000000'});
});

beforeEach(async()=>{
    await factory.methods.createAuction(...Object.values(mockProduct))
    .send({from:accounts[0],gas:'1000000'})
    
    let auctionAddress = await factory.methods.getDeployedAuctions().call();   
    auction = await new web3.eth.Contract(auctionABI,auctionAddress.pop()); 
});

describe('Auction Smart Contract', () => {
    it('deploys a factory and an auction', () => {
      assert.ok(factory.options.address);
      assert.ok(auction.options.address);
    });

    it('has the correct auction owner', async() => {        
      let auctionOwner = await auction.methods.owner().call();     
      assert.equal(accounts[0],auctionOwner);      
    });

    it('stored the product being auctioned',async()=>{
        let storedProduct = await auction.methods.product(accounts[0]).call(); 
       
        for(let key in mockProduct){
            if(typeof key==="number") assert.equal(mockProduct.key,parseInt(storedProduct.key))
            else assert.equal(mockProduct.key,storedProduct.key)
        }          
    })
});

