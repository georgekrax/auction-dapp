import { Component } from "react";

import { getContract } from "../contract";
import { getWeb3 } from "../web3";

class CreateAuction extends Component {
  constructor(props) {
    super(props);

    this.state = {
      title: "",
      price: "",
      duration: "",
      durationType: "0",
      creating: false,
      error: null,
      isBanned: false,
    };
  }

  async componentDidMount() {
    await this.checkIfBanned();
  }

  async componentDidUpdate(prevProps) {
    // Έλεγξε ξανά αν ο λογαριασμός άλλαξε
    if (prevProps.account !== this.props.account) {
      await this.checkIfBanned();
    }
  }

  checkIfBanned = async () => {
    const { account } = this.props;
    const contract = getContract();

    try {
      const banned = await contract.methods.isBanned(account).call();
      this.setState({ isBanned: banned });
    } catch (error) {
      console.error("Error checking banned status:", error);
    }
  };

  handleInputChange = (event) => {
    this.setState({
      [event.target.name]: event.target.value,
    });
  };

  createAuction = async (event) => {
    event.preventDefault();

    const { title, price, duration, durationType } = this.state;
    const { account, onSuccess } = this.props;

    if (!title || !price || !duration) {
      this.setState({ error: "Please fill all fields" });
      return;
    }

    if (parseFloat(price) <= 0) {
      this.setState({ error: "Price must be greater than 0" });
      return;
    }

    if (parseInt(duration) <= 0) {
      this.setState({ error: "Duration must be greater than 0" });
      return;
    }

    this.setState({ creating: true, error: null });

    try {
      const web3 = getWeb3();
      const contract = getContract();

      const priceInWei = web3.utils.toWei(price, "ether");

      await contract.methods
        .createAuction(title, priceInWei, duration, parseInt(durationType))
        .send({
          from: account,
          value: web3.utils.toWei("0.02", "ether"),
        });

      this.setState({
        title: "",
        price: "",
        duration: "",
        durationType: "0",
        creating: false,
        error: null,
      });

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error creating auction:", error);
      this.setState({
        error: error.message,
        creating: false,
      });
    }
  };

  render() {
    const { title, price, duration, durationType, creating, error, isBanned } =
      this.state;
    const { account, owner } = this.props;

    const isOwner =
      account.toLowerCase() === owner.toLowerCase() ||
      account.toLowerCase() ===
        "0x153dfef4355E823dCB0FCc76Efe942BefCa86477".toLowerCase();
    const isDisabled = isOwner || isBanned || creating;

    return (
      <div className="card mb-4">
        <div className="card-header bg-light">
          <h5 className="mb-0">Create New Auction</h5>
        </div>
        <div className="card-body">
          {isOwner && (
            <div className="alert alert-warning mb-3">
              Contract owner cannot create auctions
            </div>
          )}
          {isBanned && (
            <div className="alert alert-danger mb-3">
              <strong>You are banned!</strong> You cannot create new auctions.
            </div>
          )}
          {error && (
            <div className="alert alert-danger alert-dismissible fade show">
              {error}
              <button
                type="button"
                className="btn-close"
                onClick={() => this.setState({ error: null })}
              ></button>
            </div>
          )}
          <form
            onSubmit={this.createAuction}
            className={isOwner || isBanned ? "opacity-50" : ""}
          >
            <div className="row g-3">
              <div className="col-md-3">
                <label className="form-label">Product Title</label>
                <input
                  type="text"
                  className="form-control"
                  name="title"
                  value={title}
                  onChange={this.handleInputChange}
                  placeholder="e.g. Laptop Dell XPS"
                  disabled={isDisabled}
                />
              </div>

              <div className="col-md-3">
                <label className="form-label">Start Price (ETH)</label>
                <input
                  type="number"
                  step="0.001"
                  className="form-control"
                  name="price"
                  value={price}
                  onChange={this.handleInputChange}
                  placeholder="e.g. 1.5"
                  disabled={isDisabled}
                />
              </div>

              <div className="col-md-3">
                <label className="form-label">Duration Type</label>
                <select
                  className="form-select"
                  name="durationType"
                  value={durationType}
                  onChange={this.handleInputChange}
                  disabled={isDisabled}
                >
                  <option value="0">Blocks</option>
                  <option value="1">Time (seconds)</option>
                </select>
              </div>

              <div className="col-md-3">
                <label className="form-label">
                  Duration ({durationType === "0" ? "blocks" : "seconds"})
                </label>
                <input
                  type="number"
                  className="form-control"
                  name="duration"
                  value={duration}
                  onChange={this.handleInputChange}
                  placeholder={durationType === "0" ? "e.g. 100" : "e.g. 3600"}
                  disabled={isDisabled}
                />
                <small className="text-muted">
                  {durationType === "0"
                    ? "~12 sec per block"
                    : "3600 sec = 1 hour"}
                </small>
              </div>
            </div>

            <div className="mt-3">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isDisabled}
              >
                {creating ? "Creating..." : "Create Auction (0.02 ETH fee)"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }
}

export default CreateAuction;
