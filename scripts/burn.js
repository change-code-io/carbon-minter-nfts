const hre = require("hardhat");

async function main() {

    const contractAddress = "0x14d82184f8CABECa455b22c2ea8d7d4Db67BD69E";
    const tokenIDs = [0, 2, 3, 4];
    const carbon = await hre.ethers.getContractAt("Carbon", contractAddress);
    
    const burnTokens = await carbon.burn_plus(tokenIDs);
    console.log(`Transaction Hash: https://mumbai.polygonscan.com/tx/${burnTokens.hash}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});