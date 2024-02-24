const hre = require("hardhat");

async function main() {

    const contractAddress = "0x7F5F0F8c6Eb957A931c57a1F7a966d15aCFF6adb";
    const targetID = 2
    const carbon_dev = await hre.ethers.getContractAt("Carbon_dev", contractAddress);
    
    const burnTokens = await carbon_dev.burn(targetID);
    console.log(`Transaction Hash: https://mumbai.polygonscan.com/tx/${burnTokens.hash}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});