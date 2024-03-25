const hre = require("hardhat");

async function main() {

    const contractAddress = "0x7b77B0683DDdD305ef026667474a985C099eE3cc";
    const tokenIDs = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39];
    const carbon = await hre.ethers.getContractAt("Carbon", contractAddress);
    
    const burnTokens = await carbon.burn_plus(tokenIDs);
    console.log(`Transaction Hash: https://mumbai.polygonscan.com/tx/${burnTokens.hash}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});