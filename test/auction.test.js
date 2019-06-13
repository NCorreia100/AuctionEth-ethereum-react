const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');

const ganacheOptions = { gasLimit: '1000000000000000' };

const provider = ganache.provider(ganacheOptions);
const web3 = new Web3(provider);
const { factoryABI, auctionABI, factoryBytecode, auctionBytecode } = require('../ethereum/build/compile');

let accounts;
let factory;
let auction;

let curUnixTime = Math.ceil(Date.now() / 1000);
// let curDate = new Date(curUnixTime*1000);
// console.log('cur date:',curDate.getUTCFullYear(),'/',curDate.getUTCMonth()+1,'/',curDate.getDay(),':',curDate.getUTCHours(),':',curDate.getUTCMinutes());
let monthTime = curUnixTime + 30 * 24 * 60 * 60;
let minWei = '10'

let mockProduct = {
    name: 'a product',
    description: 'a description',
    qtyRemaining: 1,
    dueBy: monthTime,
    minimumWei: minWei
}

before(async () => {
    accounts = await web3.eth.getAccounts();
    factory = await new web3.eth.Contract(factoryABI)
        .deploy({ data: factoryBytecode })
        .send({ from: accounts[0], gasLimit: '100000000' });
});

beforeEach(async () => {
    await factory.methods.createAuction(...Object.values(mockProduct))
        .send({ from: accounts[0], gas: '50000000' });

    let auctionAddress = await factory.methods.getDeployedAuctions().call();
    auction = await new web3.eth.Contract(auctionABI, auctionAddress.pop());
});

describe('Auction Smart Contract', () => {
    it('deploys a factory and an auction', () => {
        assert.ok(factory.options.address);
        assert.ok(auction.options.address);
    });

    it('has the correct auction owner', async () => {
        let auctionOwner = await auction.methods.owner().call();
        assert.equal(accounts[0], auctionOwner);
    });

    it('stored the product being auctioned', async () => {
        let storedProduct = await auction.methods.product(accounts[0]).call();

        for (let key in mockProduct) {
            if (typeof key === "number") assert.equal(mockProduct.key, parseInt(storedProduct.key))
            else assert.equal(mockProduct.key, storedProduct.key)
        }
    });

    it('allows auction owner to change the product details but no one else', async () => {
        let updatedDetails = {
            description: 'new description',
            qtyRemaining: '2',
            dueBy: monthTime + 24 * 60 * 60, //increase 24h
            minimumWei: web3.utils.toWei('0.2', 'ether')
        }
        await auction.methods.editAuction(...Object.values(updatedDetails)).send({ from: accounts[0], gas: '1000000' });
        let updatedStoredProduct = await auction.methods.product(accounts[0]).call();

        for (let key in updatedDetails) {
            if (typeof key === "number") assert.equal(updatedDetails.key, parseInt(updatedStoredProduct.key));
            else assert.equal(updatedDetails.key, updatedStoredProduct.key)
        }

        try {
            await auction.methods.editAuction(...Object.values(updatedDetails)).send({ from: accounts[1], gas: '1000000' });
            assert(false);
        } catch (err) {
            assert(true);
        }
    });

    it('allows any person to submit bid with an amount increasingly higher', async () => {

        await auction.methods.submitBid().send({ from: accounts[1], value: '11', gas: '1000000' });
        let bidsReceived = await auction.methods.bids(0).call();

        let bidders = await auction.methods.bidders(0).call();
        assert.equal('11', bidsReceived);
        assert.equal(accounts[1], bidders);

        try {
            await auction.methods.submitBid().send({ from: accounts[2], value: minWei, gas: '1000000' });
            assert(false);
        } catch (err) {
            assert(true);
        }
    });

    it('quantity of bidders doesn\'t surpass products available and smaller bids are reimbursed per new bid', async () => {

        await auction.methods.submitBid().send({ from: accounts[2], value: web3.utils.toWei('0.3', 'ether'), gas: '1000000' });
        let curWei = await web3.eth.getBalance(accounts[2]);

        await auction.methods.submitBid().send({ from: accounts[1], value: web3.utils.toWei('0.4', 'ether'), gas: '1000000' });
        let finalWei = await web3.eth.getBalance(accounts[2]);
        assert(finalWei > curWei);

        let bids = await auction.methods.getAllBids().call({ from: accounts[0] });
        let bidders = await auction.methods.getAllBidders().call({ from: accounts[0] });
        assert.equals(1, bids.length);
        assert.equals(1, bidders.length);
    });

    xit('auction owner can redeem etherium of highest bid. \nProduct quantity decreases and higuest bid is removed. \nNo bids are accepted when bidding time is over', async () => {
        await auction.methods.submitBid().send({ from: accounts[2], value: web3.utils.toWei('0.3', 'ether'), gas: '1000000' });

        //update time to expire auction
        let updatedDetails = {
            description: 'new description',
            qtyRemaining: '1',
            dueBy: Math.ceil(Date.now() / 1000),
            minimumWei: web3.utils.toWei('0.2', 'ether')
        }

        await auction.methods.editAuction(...Object.values(updatedDetails)).send({ from: accounts[0], gas: '1000000' });

        await console.log('success1')
        //consume 1 sec
        let bids = await auction.methods.getAllBids().call({ from: accounts[0] });
        await console.log('success2')
        await auction.methods.finalizeProductAuction().send({ from: accounts[0], gas: '1000000' });
        await console.log('success3')

        let balance = await auction.eth.getBalance();
        await console.log('success4')
        assert.equals(0, balance);

        let bidders = await auction.methods.getAllBidders().call({ from: account[0] });
        await console.log('success5')
        assert.equals(0, bidders.length);

        let storedProduct = await auction.methods.product(accounts[0]).call();
        await console.log('success6')
        assert.equals(0, storedProduct.qtyRemaining);

        try {
            await auction.methods.submitBid().send({ from: accounts[2], value: web3.utils.toWei('0.3', 'ether') });
            assert(false);
        } catch (err) {
            assert(true);
        }
    })
});

