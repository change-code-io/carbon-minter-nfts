require("@nomicfoundation/hardhat-verify");
require("dotenv").config();
require("@nomicfoundation/hardhat-ethers");
const { ALCHEMY_API_URL_MATIC, PRIVATE_KEY_MINTER, PRIVATE_KEY_ECOBALANCE, POLYGONSCAN_API_KEY } = process.env;

module.exports = {
  solidity: "0.8.20",
  defaultNetwork: "matic",
  networks: {
    hardhat: {},
    matic: {
      url: ALCHEMY_API_URL_MATIC,
      accounts: [`0x${PRIVATE_KEY_MINTER}`, `0x${PRIVATE_KEY_ECOBALANCE}`],
    },
  },
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey: {
      matic: POLYGONSCAN_API_KEY
    }
  },
  sourcify: {
    // Disabled by default
    // Doesn't need an API key
    enabled: false
  }
};