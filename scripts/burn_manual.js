const hre = require("hardhat");

async function main() {

    const contractAddress = "0x2580571A6a68f05a7EC1E535C2e539aB7dd07848";
    const batchNFTs = await hre.ethers.getContractAt("BatchNFTs", contractAddress);
    
    const burnTokens = await batchNFTs.burn(2);
    console.log(`Transaction Hash: https://mumbai.polygonscan.com/tx/${burnTokens.hash}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});