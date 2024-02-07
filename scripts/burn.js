const hre = require("hardhat");
const ethers = require('ethers');

async function main() {

    const contractAddress = "0x2580571A6a68f05a7EC1E535C2e539aB7dd07848";

    // Get Alchemy App URL
    const API_KEY = process.env.API_KEY;

    const network = process.env.NETWORK;

    // Define an Alchemy Provider
    const provider = new ethers.AlchemyProvider(network, API_KEY)
    
    // Get contract ABI file
    const contract = require("../artifacts/contracts/BatchNFTs.sol/BatchNFTs.json");

    // Get contract ABI and address
    const abi = contract.abi
    
    const signer = new ethers.Wallet(hre.network.config.accounts[1], provider); 
    
    const batchNFTs = new ethers.Contract(contractAddress, abi, signer);
    
    const burnTokens = await batchNFTs.burn(2);
    console.log(`Transaction Hash: https://mumbai.polygonscan.com/tx/${burnTokens.hash}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});