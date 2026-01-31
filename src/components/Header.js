import { Component } from 'react';

class Header extends Component {
  render() {
    const { account, accountBalance, owner, contractBalance, totalFees } =
      this.props;

    const isOwner = account.toLowerCase() === owner.toLowerCase();

    return (
      <div className="card mb-4">
        <div className="card-header bg-light">
          <h5 className="mb-0">Platform Information</h5>
        </div>
        <div className="card-body">
          <div className="row g-3">
            {/* Connected Wallet */}
            <div className="col-md-6">
              <div className="border rounded p-3 h-100">
                <small className="text-muted d-block mb-1">
                  Connected Wallet
                </small>
                <code className="d-block text-truncate">{account}</code>
                <small className="text-success mt-1 d-block">
                  Balance: {parseFloat(accountBalance).toFixed(4)} ETH
                </small>
              </div>
            </div>

            {/* Contract Owner */}
            <div className="col-md-6">
              <div className="border rounded p-3 h-100">
                <small className="text-muted d-block mb-1">
                  Contract Owner
                </small>
                <code className="d-block text-truncate">{owner}</code>
                {isOwner && (
                  <small className="text-info mt-1 d-block">
                    You are the owner
                  </small>
                )}
              </div>
            </div>

            {/* Contract Balance */}
            <div className="col-md-6">
              <div className="border rounded p-3 h-100 text-center">
                <small className="text-muted d-block mb-1">
                  Contract Balance
                </small>
                <h4 className="mb-0 text-primary">
                  {parseFloat(contractBalance).toFixed(4)} ETH
                </h4>
              </div>
            </div>

            {/* Fees Available */}
            <div className="col-md-6">
              <div className="border rounded p-3 h-100 text-center">
                <small className="text-muted d-block mb-1">
                  Fees Available
                </small>
                <h4 className="mb-0 text-success">
                  {parseFloat(totalFees).toFixed(4)} ETH
                </h4>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Header;
