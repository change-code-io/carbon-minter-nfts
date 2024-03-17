const hre = require("hardhat");

async function main() {

    const contractAddress = "";

    const carbon_minter = "";
    const carbon_recipient_1 = "";

    const baseURI = "https://changecode.io";
    const carbon = await hre.ethers.getContractAt("Carbon", contractAddress);
    
    const mintTokens = 
    await carbon.mint_plus(carbon_recipient_1, 0, baseURI, "");
    await carbon.mint_plus(carbon_recipient_1, 0, baseURI, "");


    console.log(`Transaction Hash: https://mumbai.polygonscan.com/tx/${mintTokens.hash}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});