import { Component } from "react";

import { getWeb3 } from "../web3";

class FulfilledAuctions extends Component {
  render() {
    const { auctions } = this.props;

    const web3 = getWeb3();

    if (!auctions || auctions.length === 0) {
      return (
        <div className="card mb-4">
          <div className="card-header bg-light">
            <h5 className="mb-0">Fulfilled Auctions</h5>
          </div>
          <div className="card-body text-center text-muted">
            <p>No fulfilled auctions</p>
          </div>
        </div>
      );
    }

    return (
      <div className="card mb-4">
        <div className="card-header bg-light">
          <h5 className="mb-0">Fulfilled Auctions</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Seller</th>
                  <th>Winner</th>
                  <th>Final Price</th>
                </tr>
              </thead>
              <tbody>
                {auctions.map((auction) => (
                  <tr key={auction.id}>
                    <td>
                      <strong>{auction.title}</strong>
                    </td>
                    <td>
                      <code className="small">{auction.seller}</code>
                    </td>
                    <td>
                      <code className="small">{auction.highestBidder}</code>
                    </td>
                    <td className="text-success">
                      <strong>
                        {web3.utils.fromWei(auction.highestBid, "ether")} ETH
                      </strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }
}

export default FulfilledAuctions;
