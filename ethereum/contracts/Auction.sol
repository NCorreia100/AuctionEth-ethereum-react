pragma solidity ^0.5.1;

contract AuctionFactory{
       Auction[] public deployedAuctions;
        //
        function createAuction(string memory name,string memory desc,uint qty,uint due,uint minWei) public{
            Auction newAuction = new Auction(msg.sender, name,desc,qty,due,minWei);
            deployedAuctions.push(newAuction);
        }
        function getDeployedAuctions() public view returns (Auction[] memory){
            return deployedAuctions;
        }
}
contract Auction{
    address payable public auctionOwner;
    address payable[] public bidders;
    uint[] public bids;
    Product[1] public product; //storing the struct
    struct Product{
        string name;
        string description;
        uint qtyRemaining;
        uint dueBy;
        uint minimumWei;
    }
    constructor(address payable owner,string memory name,string memory desc,uint qty,uint due,uint minWei) public{
        auctionOwner = owner;

        Product memory p = Product({
            name : name,
            description : desc,
            qtyRemaining : qty,
            dueBy: due,
            minimumWei : minWei
        });
        product[0] = p;
    }
    modifier dateCheck(){
       Product storage p = product[0];
        require(now<p.dueBy,"Error: auction already closed");
        _;
    }
    modifier checkOwner(){
        require(msg.sender==auctionOwner,"Error: Unautorized");
        _;
    }
    function submitBid() public payable dateCheck{
        Product storage p = product[0];
        uint highestBid;
        //new bid has to be higher than the previous and minimum value
        if(bids.length>0) highestBid = bids[bids.length-1];
        else highestBid = p.minimumWei;
        require(msg.value>=highestBid,"Error: Insuficient wei");
        //store bid and bidder
        bids.push(msg.value);
        bidders.push(msg.sender);
        //
        if(bidders.length>p.qtyRemaining){
        //remove and refund lowest bid
            address payable lowestBidder = bidders[0];
            uint lowestBid = bids[0];
            lowestBidder.transfer(lowestBid);
            delete bidders[0];
        }
    }
    function editAuction(string memory desc, uint qty,uint due,uint minWei) public checkOwner{
        Product storage p = product[0];
           p.description = desc;
           p.qtyRemaining = qty;
           p.dueBy = due;
           p.minimumWei = minWei;
    }
    function finalizeProductAuction() public payable checkOwner{
        Product storage p = product[0];
        require(p.qtyRemaining>0,"Error: qunatity is already 0");
        require(p.dueBy<now,"Error: auction still ongoing");
        require(bidders.length>0,"Error no bids in record. Edit time to extend auction");
        auctionOwner.transfer(bids[bids.length]);
        bids.pop();
        bidders.pop();
        p.qtyRemaining--;
    }
}