require("dotenv").config();
require("@nomicfoundation/hardhat-ethers");
const { API_URL, PRIVATE_KEY_MINTER } = process.env;

module.exports = {
  solidity: "0.8.20",
  defaultNetwork: "mumbai",
  networks: {
    hardhat: {},
    mumbai: {
      url: API_URL,
      accounts: [`0x${PRIVATE_KEY_MINTER}`],
    },
  },
};