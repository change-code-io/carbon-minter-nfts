const hre = require("hardhat");

async function main() {

    const contractAddress = "0x2580571A6a68f05a7EC1E535C2e539aB7dd07848";
    const recieverAddress = "0x5CBaF6a447d44d52bE4b6e6a7241e067b614Da49";
    const baseURI = "https://gateway.pinata.cloud/ipfs/QmPNVWssQVgCJT96nuUJDYdaLE2rTZ6U1k3FDtLAheo99W";
    const batchNFTs = await hre.ethers.getContractAt("BatchNFTs", contractAddress);
    
    const mintTokens = await batchNFTs.mint(recieverAddress, 5, baseURI);
    console.log(`Transaction Hash: https://mumbai.polygonscan.com/tx/${mintTokens.hash}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});