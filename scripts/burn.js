const hre = require("hardhat");

async function main() {

    const contractAddress = "0x5CBaF6a447d44d52bE4b6e6a7241e067b614Da49";
    const tokenIDs = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
    const carbon = await hre.ethers.getContractAt("Carbon", contractAddress);
    
    const burnTokens = await carbon.burn_plus(tokenIDs);
    console.log(`Transaction Hash: https://mumbai.polygonscan.com/tx/${burnTokens.hash}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});