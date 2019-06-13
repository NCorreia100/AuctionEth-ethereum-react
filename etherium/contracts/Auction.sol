pragma solidity ^0.5.1;

contract AuctionFactory{
    Auction[] public deployedAuctions;
    function createAuction(string memory name,string memory desc,uint qty,uint due,uint minWei) public{
        Auction newAuction = new Auction(msg.sender, name,desc,qty,due,minWei);
        deployedAuctions.push(newAuction);
    }
    function getDeployedAuctions() public view returns (Auction[] memory){
    return deployedAuctions;
    }
}
contract Auction{
    address payable public owner;
    address payable[] public bidders;
    uint[] public bids;
    mapping(address=>Product) public product; //for storing & retrieving struct
    struct Product{
        string name;
        string description;
        uint qtyRemaining;
        uint dueBy;
        uint minimumWei;
    }
    constructor(address payable creator,string memory name,string memory desc,uint qty,uint due,uint minWei) public{
        require(due>now,'Error: auction closing timestamp must be in the future');
        owner = creator;

        Product memory p = Product({
            name : name,
            description : desc,
            qtyRemaining : qty,
            dueBy: due,
            minimumWei : minWei
        });
        product[owner] = p;
    }
     //modifiers and getters
    modifier auctionOpen(){
       Product storage p = product[owner];
        require(now<p.dueBy,"Error: auction already closed");
        _;
    }
    modifier checkOwner(){
        require(msg.sender==owner,"Error: Unautorized");
        _;
    }
    function getAllBids() public view returns(uint[] memory){
        return bids;
    }
    function getAllBidders() public view returns(address payable[] memory){
        return bidders;
    }
    function submitBid() public payable auctionOpen{
        Product storage p = product[owner];
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
        require(due>now,"Error: Not allowed to alert due date to a past date");
        Product storage p = product[owner];
           p.description = desc;
           p.qtyRemaining = qty;
           p.dueBy = due;
           p.minimumWei = minWei;
    }
    function finalizeProductAuction() public payable checkOwner{
        Product storage p = product[owner];
        require(p.qtyRemaining>0,"Error: qunatity is already 0");
        require(p.dueBy<now,"Error: auction still ongoing");
        require(bidders.length>0,"Error no bids in record. Edit time to extend auction");
        owner.transfer(bids[bids.length]);
        bids.pop();
        bidders.pop();
        p.qtyRemaining--;
    }   
}