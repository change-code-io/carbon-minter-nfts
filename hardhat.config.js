require("@nomicfoundation/hardhat-verify");
require("dotenv").config();
require("@nomicfoundation/hardhat-ethers");
require("@openzeppelin/hardhat-upgrades");
const {
  API_URL,
  TESTNET_API_URL,
  PRIVATE_KEY_MINTER,
  PRIVATE_KEY_MINTER_TESTNET,
  PRIVATE_KEY_DEVELOPER,
  PRIVATE_KEY_BUFFER,
  ETHERSCAN_API_KEY,
} = process.env;

module.exports = {
  solidity: "0.8.20",
  defaultNetwork: "amoy",
  networks: {
    hardhat: {},
    amoy: {
      url: TESTNET_API_URL,
      accounts: [
        `0x${PRIVATE_KEY_MINTER_TESTNET}`,
        `0x${PRIVATE_KEY_DEVELOPER}`,
        `0x${PRIVATE_KEY_BUFFER}`,
      ],
    },
    matic: {
      url: API_URL,
      accounts: [
        `0x${PRIVATE_KEY_MINTER}`,
        `0x${PRIVATE_KEY_DEVELOPER}`,
        `0x${PRIVATE_KEY_BUFFER}`,
      ],
      // No static gasPrice — EIP-1559 fees are set dynamically in the mint script
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
    customChains: [
      {
        network: "amoy",
        chainId: 80002,
        urls: {
          apiURL: "https://api.etherscan.io/v2/api?chainid=80002",
          browserURL: "https://amoy.polygonscan.com",
        },
      },
      {
        network: "matic",
        chainId: 137,
        urls: {
          apiURL: "https://api.etherscan.io/v2/api?chainid=137",
          browserURL: "https://polygonscan.com",
        },
      },
    ],
  },
  sourcify: {
    // Disabled by default
    // Doesn't need an API key
    enabled: false,
  },
};
