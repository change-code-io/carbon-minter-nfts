require('dotenv').config();
const ethers = require('ethers');

// Get Alchemy App URL
const API_KEY = process.env.API_KEY;

const network = process.env.NETWORK;

// Define an Alchemy Provider
const provider = new ethers.AlchemyProvider(network, API_KEY);

// Get contract ABI file
const contract = require("../artifacts/contracts/BatchNFTs.sol/BatchNFTs.json");

// Create a signer
const privateKey = process.env.PRIVATE_KEY_MINTER;
const signer = new ethers.Wallet(privateKey, provider);

// Get contract ABI and address
const abi = contract.abi;
const contractAddress = '0x2580571A6a68f05a7EC1E535C2e539aB7dd07848';
const recieverAddress = "0x5CBaF6a447d44d52bE4b6e6a7241e067b614Da49";

// Create a contract instance
const BatchNFTs = new ethers.Contract(contractAddress, abi, signer);

// Get the NFT Metadata IPFS URL
const baseURI = "https://gateway.pinata.cloud/ipfs/QmPNVWssQVgCJT96nuUJDYdaLE2rTZ6U1k3FDtLAheo99W";

// Call mintNFT function
const mintNFT = async () => {
    let nftTxn = await BatchNFTs.mint(recieverAddress, 5, baseURI)
    await nftTxn.wait()
    console.log(`NFT Minted! Check it out at: https://mumbai.polygonscan.com/tx/${nftTxn.hash}`)
}

mintNFT()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });