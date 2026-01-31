import { Component } from 'react';

import { compensateBidder, getContract } from '../contract';
import { getWeb3 } from '../web3';

class CancelledAuctions extends Component {
  constructor(props) {
    super(props);
    
    this.state = {
      claiming: false,
      userBids: {},
      claimablePerAuction: {}
    };
  }

  async componentDidMount() {
    await this.loadUserBids();
  }

  async componentDidUpdate(prevProps) {
    if (prevProps.auctions !== this.props.auctions || 
        prevProps.account !== this.props.account) {
      await this.loadUserBids();
    }
  }

  loadUserBids = async () => {
    const { auctions, account } = this.props;
    const contract = getContract();
    const userBids = {};
    const claimablePerAuction = {};
    
    for (let auction of auctions) {
      const bid = await contract.methods.bidderFunds(account, auction.id).call();
      userBids[auction.id] = bid;
      
      // Check if this specific auction is claimable
      if (bid !== '0' && parseInt(bid) > 0) {
        // Cancelled auctions are always claimable if you have funds
        // Active/Completed auctions claimable only if you're not the winner
        const isCancelled = parseInt(auction.state) === 1; // ? Number comparison
        const isNotWinner = auction.highestBidder.toLowerCase() !== account.toLowerCase();
        
        claimablePerAuction[auction.id] = isCancelled || isNotWinner;
      } else {
        claimablePerAuction[auction.id] = false;
      }
    }
    
    this.setState({ userBids, claimablePerAuction });
  };

  claimCompensation = async () => {
    const { account, onSuccess } = this.props;
    
    this.setState({ claiming: true });
    
    try {
      await compensateBidder(account);
      
      this.setState({ claiming: false });
      
      if (onSuccess) onSuccess();
      
    } catch (error) {
      console.error('Error claiming compensation:', error);
      alert('Failed to claim compensation: ' + error.message);
      this.setState({ claiming: false });
    }
  };

  render() {
    const { auctions, owedAmount } = this.props;
    const { claiming, userBids, claimablePerAuction } = this.state;
    
    const web3 = getWeb3();
    const hasCompensation = parseFloat(owedAmount) > 0;

    return (
      <div className="card mb-4">
        <div className="card-header bg-light d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Cancelled Auctions</h5>
          {hasCompensation && (
            <button
              className="btn btn-success"
              onClick={this.claimCompensation}
              disabled={claiming}
            >
              {claiming ? 'Claiming...' : `Claim ${owedAmount} ETH`}
            </button>
          )}
        </div>
        <div className="card-body">
          {!hasCompensation && auctions && auctions.length === 0 && (
            <div className="alert alert-info">
              No cancelled auctions
            </div>
          )}
          
          {!hasCompensation && auctions && auctions.length > 0 && (
            <div className="alert alert-info">
              No compensation available for you
            </div>
          )}
          
          {auctions && auctions.length > 0 && (
            <div className="table-responsive">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Seller</th>
                    <th>Your Bid</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {auctions.map(auction => {
                    const userBid = userBids[auction.id] || '0';
                    const hasBid = userBid !== '0' && parseInt(userBid) > 0;
                    const isClaimable = claimablePerAuction[auction.id] || false;
                    
                    return (
                      <tr key={auction.id}>
                        <td>{auction.title}</td>
                        <td>
                          <code className="small">
                            {auction.seller.substring(0, 10)}...
                          </code>
                        </td>
                        <td>
                          {hasBid 
                            ? `${web3.utils.fromWei(userBid, 'ether')} ETH`
                            : '-'
                          }
                        </td>
                        <td>
                          {hasBid && isClaimable && (
                            <span className="badge bg-warning text-dark">Pending Claim</span>
                          )}
                          {hasBid && !isClaimable && (
                            <span className="badge bg-success">Claimed</span>
                          )}
                          {!hasBid && (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default CancelledAuctions;