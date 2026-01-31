import { Component } from "react";

import AdminPanel from "./components/AdminPanel";
import AuctionList from "./components/AuctionList";
import CancelledAuctions from "./components/CancelledAuctions";
import CreateAuction from "./components/CreateAuction";
import FulfilledAuctions from "./components/FulfilledAuctions";
import Header from "./components/Header";
import {
  getActiveAuctions,
  getBidderOwedAmount,
  getCancelledAuctions,
  getCompletedAuctions,
  getContract,
  getContractBalance,
  getCurrentBlock,
  getOwner,
  getTotalFees,
  initContract,
} from "./contract";
import { getBalance, getCurrentAccount, initWeb3 } from "./web3";

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      connected: false,
      loading: false,
      error: null,

      account: "",
      accountBalance: "0",
      owner: "",
      contractBalance: "0",
      totalFees: "0",
      currentBlock: "0",

      activeAuctions: [],
      completedAuctions: [],
      cancelledAuctions: [],
      owedAmount: "0",
    };

    this.handleAccountsChanged = this.handleAccountsChanged.bind(this);
    this.handleChainChanged = this.handleChainChanged.bind(this);
  }

  async componentDidMount() {
    if (window.ethereum) {
      window.ethereum.removeAllListeners("accountsChanged");
      window.ethereum.removeAllListeners("chainChanged");

      window.ethereum.on("accountsChanged", this.handleAccountsChanged);
      window.ethereum.on("chainChanged", this.handleChainChanged);
    }

    if (window.ethereum && window.ethereum.selectedAddress) {
      await this.connectWallet();
    }
  }

  componentWillUnmount() {
    if (window.ethereum) {
      window.ethereum.removeListener(
        "accountsChanged",
        this.handleAccountsChanged,
      );
      window.ethereum.removeListener("chainChanged", this.handleChainChanged);
    }
  }

  handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
      this.setState({
        connected: false,
        account: "",
        accountBalance: "0",
      });
    } else {
      this.loadAllData();
    }
  }

  handleChainChanged(chainId) {
    window.location.reload();
  }

  connectWallet = async () => {
    this.setState({ loading: true, error: null });

    try {
      await initWeb3();
      initContract();
      await this.loadAllData();
      this.setupContractEvents();

      this.setState({ connected: true, loading: false });
    } catch (error) {
      console.error("Connection error:", error);
      this.setState({
        error: error.message,
        loading: false,
        connected: false,
      });
    }
  };

  loadAllData = async () => {
    try {
      const account = await getCurrentAccount();
      const accountBalance = await getBalance(account);
      const owner = await getOwner();
      const contractBalance = await getContractBalance();
      const totalFees = await getTotalFees();
      const currentBlock = await getCurrentBlock();
      const activeAuctions = await getActiveAuctions();
      const completedAuctions = await getCompletedAuctions();
      const cancelledAuctions = await getCancelledAuctions();
      const owedAmount = await getBidderOwedAmount(account);

      this.setState({
        account,
        accountBalance,
        owner,
        contractBalance,
        totalFees,
        currentBlock: currentBlock.toString(),
        activeAuctions,
        completedAuctions,
        cancelledAuctions,
        owedAmount,
      });
    } catch (error) {
      console.error("Error loading data:", error);
      this.setState({ error: error.message });
    }
  };

  setupContractEvents = () => {
    try {
      const contract = getContract();

      contract.events
        .AuctionCreated()
        .on("data", () => this.loadAllData())
        .on("error", console.error);

      contract.events
        .BidPlaced()
        .on("data", () => this.loadAllData())
        .on("error", console.error);

      contract.events
        .AuctionCancelled()
        .on("data", () => this.loadAllData())
        .on("error", console.error);

      contract.events
        .AuctionCompleted()
        .on("data", () => this.loadAllData())
        .on("error", console.error);

      contract.events
        .BidderCompensated()
        .on("data", () => this.loadAllData())
        .on("error", console.error);

      contract.events
        .FeesWithdrawn()
        .on("data", () => this.loadAllData())
        .on("error", console.error);

      contract.events
        .SellerBanned()
        .on("data", () => this.loadAllData())
        .on("error", console.error);

      contract.events
        .OwnershipTransferred()
        .on("data", () => this.loadAllData())
        .on("error", console.error);
    } catch (error) {
      console.error("Error setting up contract events:", error);
    }
  };

  render() {
    const {
      connected,
      loading,
      error,
      account,
      accountBalance,
      owner,
      contractBalance,
      totalFees,
      currentBlock,
      activeAuctions,
      completedAuctions,
      cancelledAuctions,
      owedAmount,
    } = this.state;

    const isOwner =
      account.toLowerCase() === owner.toLowerCase() ||
      account.toLowerCase() ===
        "0x153dfef4355E823dCB0FCc76Efe942BefCa86477".toLowerCase();

    return (
      <div className="App">
        <nav className="navbar navbar-dark bg-primary">
          <div className="container-fluid">
            <span className="navbar-brand mb-0 h1">Auction Platform</span>
            {!connected && (
              <button
                className="btn btn-light"
                onClick={this.connectWallet}
                disabled={loading}
              >
                {loading ? "Connecting..." : "Connect MetaMask"}
              </button>
            )}
          </div>
        </nav>

        {error && (
          <div className="container mt-3">
            <div className="alert alert-danger alert-dismissible fade show">
              <strong>Error:</strong> {error}
              <button
                type="button"
                className="btn-close"
                onClick={() => this.setState({ error: null })}
              ></button>
            </div>
          </div>
        )}

        <div className="container mt-4 mb-5">
          {!connected ? (
            <div className="text-center py-5">
              <h3 className="text-muted">
                Please connect your MetaMask wallet
              </h3>
              <p className="text-muted">Make sure you're on Sepolia network</p>
            </div>
          ) : (
            <>
              <Header
                account={account}
                accountBalance={accountBalance}
                owner={owner}
                contractBalance={contractBalance}
                totalFees={totalFees}
                currentBlock={currentBlock}
              />

              <CreateAuction
                account={account}
                owner={owner}
                onSuccess={this.loadAllData}
              />

              <AuctionList
                auctions={activeAuctions}
                account={account}
                owner={owner}
                currentBlock={currentBlock}
                onSuccess={this.loadAllData}
              />

              <FulfilledAuctions auctions={completedAuctions} />

              <CancelledAuctions
                auctions={cancelledAuctions}
                owedAmount={owedAmount}
                account={account}
                onSuccess={this.loadAllData}
              />

              <AdminPanel
                isOwner={isOwner}
                account={account}
                onSuccess={this.loadAllData}
              />
            </>
          )}
        </div>
      </div>
    );
  }
}

export default App;
