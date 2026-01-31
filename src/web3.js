// import Web3 from "web3";

// let web3;

// if (window.ethereum) {
//   web3 = new Web3(window.ethereum);
// } else {
//   alert("Please install MetaMask!");
// }

// export default web3;

import Web3 from "web3";

let web3;

// Initialize Web3
export const initWeb3 = async () => {
  if (window.ethereum) {
    web3 = new Web3(window.ethereum);
    try {
      // Request account access
      await window.ethereum.request({ method: "eth_requestAccounts" });
      return web3;
    } catch (error) {
      console.error("User denied account access");
      throw error;
    }
  } else {
    throw new Error("Please install MetaMask!");
  }
};

// Get Web3 instance
export const getWeb3 = () => {
  if (!web3) {
    throw new Error("Web3 not initialized. Call initWeb3() first.");
  }
  return web3;
};

// Get current account
export const getCurrentAccount = async () => {
  const web3 = getWeb3();
  const accounts = await web3.eth.getAccounts();
  return accounts[0];
};

// Get account balance
export const getBalance = async (address) => {
  const web3 = getWeb3();
  const balance = await web3.eth.getBalance(address);
  return web3.utils.fromWei(balance, "ether");
};
