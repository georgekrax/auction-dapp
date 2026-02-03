import { Component } from "react";

import {
  banSeller,
  destroyContract,
  transferOwnership,
  withdrawFees,
} from "../contract";

class AdminPanel extends Component {
  constructor(props) {
    super(props);

    this.state = {
      newOwnerAddress: "",
      banSellerAddress: "",
      withdrawing: false,
      banning: false,
      transferring: false,
      destroying: false,
    };
  }

  handleInputChange = (event) => {
    this.setState({
      [event.target.name]: event.target.value,
    });
  };

  handleWithdrawFees = async () => {
    const { account, onSuccess } = this.props;

    if (!window.confirm("Withdraw all available fees?")) {
      return;
    }

    this.setState({ withdrawing: true });

    try {
      await withdrawFees(account);

      this.setState({ withdrawing: false });

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error withdrawing fees:", error);
      alert("Failed to withdraw fees: " + error.message);
      this.setState({ withdrawing: false });
    }
  };

  handleBanSeller = async () => {
    const { banSellerAddress } = this.state;
    const { account, onSuccess } = this.props;

    if (!banSellerAddress) {
      alert("Please enter seller address");
      return;
    }

    if (
      !window.confirm(
        `Ban seller ${banSellerAddress}? All their active auctions will be cancelled.`,
      )
    ) {
      return;
    }

    this.setState({ banning: true });

    try {
      await banSeller(account, banSellerAddress);

      this.setState({
        banning: false,
        banSellerAddress: "",
      });

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error banning seller:", error);
      alert("Failed to ban seller: " + error.message);
      this.setState({ banning: false });
    }
  };

  handleTransferOwnership = async () => {
    const { newOwnerAddress } = this.state;
    const { account, onSuccess } = this.props;

    if (!newOwnerAddress) {
      alert("Please enter new owner address");
      return;
    }

    if (!window.confirm(`Transfer ownership to ${newOwnerAddress}?`)) {
      return;
    }

    this.setState({ transferring: true });

    try {
      await transferOwnership(account, newOwnerAddress);

      this.setState({
        transferring: false,
        newOwnerAddress: "",
      });

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error transferring ownership:", error);
      alert("Failed to transfer ownership: " + error.message);
      this.setState({ transferring: false });
    }
  };

  handleDestroyContract = async () => {
    const { account, onSuccess } = this.props;

    if (
      !window.confirm(
        "DESTROY CONTRACT? This will cancel all active auctions and withdraw all fees. This action cannot be undone!",
      )
    ) {
      return;
    }

    this.setState({ destroying: true });

    try {
      await destroyContract(account);

      this.setState({ destroying: false });

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error destroying contract:", error);
      alert("Failed to destroy contract: " + error.message);
      this.setState({ destroying: false });
    }
  };

  render() {
    const { isOwner } = this.props;
    const {
      newOwnerAddress,
      banSellerAddress,
      withdrawing,
      banning,
      transferring,
      destroying,
    } = this.state;

    if (!isOwner) {
      return null;
    }

    return (
      <div className="card mb-4 border-warning">
        <div className="card-header bg-warning">
          <h5 className="mb-0">Admin Control Panel</h5>
        </div>
        <div className="card-body">
          <div className="row g-3">
            {/* Withdraw Fees */}
            <div className="col-md-6">
              <div className="border rounded p-3">
                <h6>Withdraw Fees</h6>
                <p className="text-muted small">
                  Withdraw all accumulated fees (creation fees + 20% platform
                  fees)
                </p>
                <button
                  className="btn btn-success w-100"
                  onClick={this.handleWithdrawFees}
                  disabled={withdrawing}
                >
                  {withdrawing ? "Withdrawing..." : "Withdraw Fees"}
                </button>
              </div>
            </div>

            {/* Change Owner */}
            <div className="col-md-6">
              <div className="border rounded p-3">
                <h6>Transfer Ownership</h6>
                <div className="input-group mb-2">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="New owner address"
                    name="newOwnerAddress"
                    value={newOwnerAddress}
                    onChange={this.handleInputChange}
                    disabled={transferring}
                  />
                </div>
                <button
                  className="btn btn-primary w-100"
                  onClick={this.handleTransferOwnership}
                  disabled={transferring || !newOwnerAddress}
                >
                  {transferring ? "Transferring..." : "Change Owner"}
                </button>
              </div>
            </div>

            {/* Ban Seller */}
            <div className="col-md-6">
              <div className="border rounded p-3">
                <h6>Ban Seller</h6>
                <p className="text-muted small">
                  Ban a seller and cancel all their active auctions
                </p>
                <div className="input-group mb-2">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Seller address to ban"
                    name="banSellerAddress"
                    value={banSellerAddress}
                    onChange={this.handleInputChange}
                    disabled={banning}
                  />
                </div>
                <button
                  className="btn btn-danger w-100"
                  onClick={this.handleBanSeller}
                  disabled={banning || !banSellerAddress}
                >
                  {banning ? "Banning..." : "Ban Seller"}
                </button>
              </div>
            </div>

            {/* Destroy Contract */}
            <div className="col-md-6">
              <div className="border rounded p-3 bg-light">
                <h6 className="text-danger">Destroy Contract</h6>
                <p className="text-muted small">
                  Cancel all auctions, withdraw all fees, and disable new
                  auctions
                </p>
                <button
                  className="btn btn-danger w-100"
                  onClick={this.handleDestroyContract}
                  disabled={destroying}
                >
                  {destroying ? "Destroying..." : "Destroy Contract"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default AdminPanel;
