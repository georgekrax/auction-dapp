import { Component } from 'react';

import { getContract } from '../contract';
import { getWeb3 } from '../web3';

class AuctionList extends Component {
  constructor(props) {
    super(props);

    this.state = {
      bidAmounts: {}, // Track bid input per auction
      bidding: {}, // Track loading state per auction
      cancelling: {},
      fulfilling: {},
    };
  }

  handleBidInputChange = (auctionId, value) => {
    this.setState({
      bidAmounts: {
        ...this.state.bidAmounts,
        [auctionId]: value,
      },
    });
  };

  placeBid = async (auctionId) => {
    const { account, onSuccess } = this.props;
    const bidAmount = this.state.bidAmounts[auctionId];

    if (!bidAmount || parseFloat(bidAmount) <= 0) {
      alert("Please enter a valid bid amount");
      return;
    }

    this.setState({
      bidding: { ...this.state.bidding, [auctionId]: true },
    });

    try {
      const web3 = getWeb3();
      const contract = getContract();

      await contract.methods.placeBid(auctionId).send({
        from: account,
        value: web3.utils.toWei(bidAmount, "ether"),
      });

      // Clear bid input
      this.setState({
        bidAmounts: { ...this.state.bidAmounts, [auctionId]: "" },
        bidding: { ...this.state.bidding, [auctionId]: false },
      });

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error placing bid:", error);
      alert("Failed to place bid: " + error.message);
      this.setState({
        bidding: { ...this.state.bidding, [auctionId]: false },
      });
    }
  };

  cancelAuction = async (auctionId) => {
    const { account, onSuccess } = this.props;

    if (!window.confirm("Are you sure you want to cancel this auction?")) {
      return;
    }

    this.setState({
      cancelling: { ...this.state.cancelling, [auctionId]: true },
    });

    try {
      const contract = getContract();

      await contract.methods.cancelAuction(auctionId).send({
        from: account,
      });

      this.setState({
        cancelling: { ...this.state.cancelling, [auctionId]: false },
      });

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error cancelling auction:", error);
      alert("Failed to cancel auction: " + error.message);
      this.setState({
        cancelling: { ...this.state.cancelling, [auctionId]: false },
      });
    }
  };

  fulfillAuction = async (auctionId) => {
    const { account, onSuccess } = this.props;

    this.setState({
      fulfilling: { ...this.state.fulfilling, [auctionId]: true },
    });

    try {
      const contract = getContract();

      await contract.methods.completeAuction(auctionId).send({
        from: account,
      });

      this.setState({
        fulfilling: { ...this.state.fulfilling, [auctionId]: false },
      });

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error fulfilling auction:", error);
      alert("Failed to fulfill auction: " + error.message);
      this.setState({
        fulfilling: { ...this.state.fulfilling, [auctionId]: false },
      });
    }
  };

  render() {
    const { auctions, account, owner, currentBlock } = this.props;
    const { bidAmounts, bidding, cancelling, fulfilling } = this.state;

    const web3 = getWeb3();
    const isOwner = account.toLowerCase() === owner.toLowerCase();

    if (!auctions || auctions.length === 0) {
      return (
        <div className="card mb-4">
          <div className="card-header bg-light">
            <h5 className="mb-0">Live Auctions</h5>
          </div>
          <div className="card-body text-center text-muted">
            <p>No active auctions</p>
          </div>
        </div>
      );
    }

    return (
      <div className="card mb-4">
        <div className="card-header bg-light">
          <h5 className="mb-0">Live Auctions</h5>
        </div>
        <div className="card-body">
          <div className="row g-3">
            {auctions.map((auction) => {
              const isBlocks = parseInt(auction.durationType) === 0;
              let isExpired, remainingText;

              if (isBlocks) {
                // Blocks
                const blocksRemaining = Math.max(
                  0,
                  parseInt(auction.endValue) - parseInt(currentBlock),
                );
                isExpired = blocksRemaining === 0;
                remainingText = isExpired
                  ? "EXPIRED"
                  : `${blocksRemaining} blocks`;
              } else {
                // Time
                const currentTime = Math.floor(Date.now() / 1000);
                const secondsRemaining = Math.max(
                  0,
                  parseInt(auction.endValue) - currentTime,
                );
                isExpired = secondsRemaining === 0;

                if (isExpired) {
                  remainingText = "EXPIRED";
                } else {
                  const hours = Math.floor(secondsRemaining / 3600);
                  const minutes = Math.floor((secondsRemaining % 3600) / 60);
                  remainingText = `${hours}h ${minutes}m`;
                }
              }

              const isSeller =
                auction.seller.toLowerCase() === account.toLowerCase();
              const isHighestBidder =
                auction.highestBidder &&
                account &&
                auction.highestBidder.toLowerCase() === account.toLowerCase();
              const hasBids =
                auction.highestBidder !==
                "0x0000000000000000000000000000000000000000";

              // Μπορεί να ακυρώσει: πωλητής ή ιδιοκτήτης, και δεν έχει λήξει
              const canCancel = (isSeller || isOwner) && !isExpired;

              // Μπορεί να ολοκληρώσει: πωλητής ή ιδιοκτήτης + έχει λήξει + έχει προσφορές
              const canFulfill = (isSeller || isOwner) && isExpired && hasBids;

              return (
                <div key={auction.id} className="col-12">
                  <div className="card">
                    <div className="card-body">
                      <div className="row align-items-center">
                        {/* Auction Info */}
                        <div className="col-md-7">
                          <h5 className="card-title mb-2">{auction.title}</h5>
                          <p className="mb-1">
                            <small className="text-muted">Seller:</small>{" "}
                            <code className="small">{auction.seller}</code>
                          </p>
                          <p className="mb-1">
                            <small className="text-muted">Highest Bid:</small>{" "}
                            <strong>
                              {hasBids
                                ? `${web3.utils.fromWei(auction.highestBid, "ether")} ETH`
                                : `${web3.utils.fromWei(auction.startPrice, "ether")} ETH (Initial)`}
                            </strong>
                          </p>
                          <p className="mb-1">
                            <small className="text-muted">
                              {isBlocks ? "Blocks" : "Time"} Remaining:&nbsp;
                            </small>
                            <span
                              className={
                                isExpired ? "text-danger" : "text-success"
                              }
                            >
                              {remainingText}
                            </span>
                          </p>
                          {isHighestBidder && hasBids && (
                            <span className="badge bg-success">
                              YOU ARE WINNING!
                            </span>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="col-md-5">
                          <div className="d-flex gap-2 flex-wrap align-items-center">
                            {/* Bid Input */}
                            {!isExpired && (
                              <div
                                className="input-group"
                                style={{ minWidth: "250px" }}
                              >
                                <input
                                  type="number"
                                  step="0.001"
                                  className="form-control"
                                  placeholder="Bid amount (ETH)"
                                  value={bidAmounts[auction.id] || ""}
                                  onChange={(e) =>
                                    this.handleBidInputChange(
                                      auction.id,
                                      e.target.value,
                                    )
                                  }
                                  disabled={bidding[auction.id]}
                                />
                                <button
                                  className="btn btn-success"
                                  onClick={() => this.placeBid(auction.id)}
                                  disabled={bidding[auction.id]}
                                >
                                  {bidding[auction.id] ? "Bidding..." : "Bid"}
                                </button>
                              </div>
                            )}

                            {/* Cancel Button */}
                            {canCancel && (
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => this.cancelAuction(auction.id)}
                                disabled={cancelling[auction.id]}
                              >
                                {cancelling[auction.id]
                                  ? "Cancelling..."
                                  : "Cancel"}
                              </button>
                            )}

                            {/* Fulfill Button */}
                            {canFulfill && (
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => this.fulfillAuction(auction.id)}
                                disabled={fulfilling[auction.id]}
                              >
                                {fulfilling[auction.id]
                                  ? "Fulfilling..."
                                  : "Fulfill"}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }
}

export default AuctionList;
