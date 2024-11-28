require("@nomicfoundation/hardhat-toolbox");
require("hardhat-deploy");
require("dotenv").config();

module.exports = {
  solidity: "0.8.0",
  namedAccounts: {
    deployer: {
      default: 0, // The first account in the list will be used as the deployer
    },
  },
  networks: {
    arbitrumSepolia: {
      url: process.env.ARBITRUM_SEPOLIA_RPC_URL, // Add your RPC URL here
      accounts: [process.env.PRIVATE_KEY], // Add your private key here
    },
  },
};
