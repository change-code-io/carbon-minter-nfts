require("@nomicfoundation/hardhat-verify");
require("dotenv").config();
require("@nomicfoundation/hardhat-ethers");
const { ALCHEMY_API_URL_MUMBAI, PRIVATE_KEY_MINTER, PRIVATE_KEY_RECIPIENT_1, PRIVATE_KEY_RECIPIENT_2, POLYGONSCAN_API_KEY } = process.env;

module.exports = {
  solidity: "0.8.20",
  defaultNetwork: "mumbai",
  networks: {
    hardhat: {},
    mumbai: {
      url: ALCHEMY_API_URL_MUMBAI,
      accounts: [`0x${PRIVATE_KEY_MINTER}`, `0x${PRIVATE_KEY_RECIPIENT_1}`],
    },
  },
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey: {
      polygonMumbai: POLYGONSCAN_API_KEY
    }
  },
  sourcify: {
    // Disabled by default
    // Doesn't need an API key
    enabled: true
  }
};