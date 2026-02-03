import AUCTION_ABI from "./AuctionABI.json";
import { getWeb3 } from "./web3";

const CONTRACT_ADDRESS = "0x2a6608127c44be3d7f96c27840710464583a4777";

let contract;

// Αρχικοποίηση συμβολαίου
export const initContract = () => {
  const web3 = getWeb3();
  contract = new web3.eth.Contract(AUCTION_ABI, CONTRACT_ADDRESS);
  return contract;
};

// Λήψη συμβολαίου
export const getContract = () => {
  if (!contract) {
    throw new Error("Contract not initialized. Call initContract() first.");
  }
  return contract;
};

export const getCurrentBlock = async () => {
  const web3 = getWeb3();
  return await web3.eth.getBlockNumber();
};

export const getOwner = async () => {
  const contract = getContract();
  return await contract.methods.owner().call();
};

export const getAuctionCounter = async () => {
  const contract = getContract();
  return await contract.methods.auctionCounter().call();
};

export const getTotalFees = async () => {
  const contract = getContract();
  const web3 = getWeb3();
  const fees = await contract.methods.getTotalFees().call();
  return web3.utils.fromWei(fees, "ether");
};

export const getContractBalance = async () => {
  const contract = getContract();
  const web3 = getWeb3();
  const balance = await contract.methods.getContractBalance().call();
  return web3.utils.fromWei(balance, "ether");
};

// Γενική function για να γίνει λήψη των δημοπρασιών βάση του ID τους
const loadAuctionDetails = async (auctionIds) => {
  const contract = getContract();
  const auctions = [];

  for (let id of auctionIds) {
    const auction = await contract.methods.auctions(id).call();
    auctions.push({
      id: auction.id,
      title: auction.title,
      seller: auction.seller,
      startPrice: auction.startPrice,
      endValue: auction.endValue,
      durationType: auction.durationType,
      highestBid: auction.highestBid,
      highestBidder: auction.highestBidder,
      state: auction.state,
    });
  }

  return auctions;
};

export const getActiveAuctions = async () => {
  const contract = getContract();
  const auctionIds = await contract.methods.getActiveAuctions().call();
  return await loadAuctionDetails(auctionIds);
};

export const getCompletedAuctions = async () => {
  const contract = getContract();
  const auctionIds = await contract.methods.getCompletedAuctions().call();
  return await loadAuctionDetails(auctionIds);
};

export const getCancelledAuctions = async () => {
  const contract = getContract();
  const auctionIds = await contract.methods.getCancelledAuctions().call();
  return await loadAuctionDetails(auctionIds);
};

// Έλεγξε πόσο οφείλει το συμβόλαιο στον πλειοδότη
export const getBidderOwedAmount = async (bidderAddress) => {
  const contract = getContract();
  const web3 = getWeb3();
  let totalOwed = 0;

  const auctionCounter = await contract.methods.auctionCounter().call();

  for (let i = 0; i < auctionCounter; i++) {
    const fundsInAuction = await contract.methods
      .bidderFunds(bidderAddress, i)
      .call();

    if (fundsInAuction !== "0" && parseInt(fundsInAuction) > 0) {
      const auction = await contract.methods.auctions(i).call();

      const isCancelled = parseInt(auction.state) === 1; // ? Convert to number
      const isNotHighestBidder =
        auction.highestBidder.toLowerCase() !== bidderAddress.toLowerCase();

      if (isCancelled || isNotHighestBidder) {
        totalOwed += parseInt(fundsInAuction);
      }
    }
  }

  return totalOwed > 0
    ? web3.utils.fromWei(totalOwed.toString(), "ether")
    : "0";
};

export const compensateBidder = async (account) => {
  const contract = getContract();
  return await contract.methods.compensateBidder().send({ from: account });
};

// ---- ADMIN FUNCTIONS/FEATURES ---- //
export const withdrawFees = async (account) => {
  const contract = getContract();
  return await contract.methods.withdrawFees().send({ from: account });
};

export const banSeller = async (account, sellerAddress) => {
  const contract = getContract();
  return await contract.methods
    .banSeller(sellerAddress)
    .send({ from: account });
};

export const transferOwnership = async (account, newOwner) => {
  const contract = getContract();
  return await contract.methods
    .transferOwnership(newOwner)
    .send({ from: account });
};

export const destroyContract = async (account) => {
  const contract = getContract();
  return await contract.methods.destroyContract().send({ from: account });
};
