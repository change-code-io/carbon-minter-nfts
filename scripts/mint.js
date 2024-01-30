const hre = require("hardhat");

async function main() {

    const contractAddress = "0x3C6621C201d6A4FBbaFCcE13AD65770f1b96A3f2";
    const recieverAddress = "0x4B214516602e8541550b7e0700e527ADf452C42C";
    const baseURI = "https://gateway.pinata.cloud/ipfs/QmPNVWssQVgCJT96nuUJDYdaLE2rTZ6U1k3FDtLAheo99W";
    const batchNFTs = await hre.ethers.getContractAt("BatchNFTs", contractAddress);
    
    const mintTokens = await batchNFTs.mint(recieverAddress, 4364, baseURI);
    console.log(`Transaction Hash: https://mumbai.polyscan.com/tx/${mintTokens.hash}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});