const hre = require("hardhat");

async function main() {

    const contractAddress = "";
    const tokenIDs = [];
    const carbon = await hre.ethers.getContractAt("Carbon", contractAddress);
    
    const burnTokens = await carbon.burn_plus(tokenIDs);
    console.log(`Transaction Hash: https://mumbai.polygonscan.com/tx/${burnTokens.hash}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});