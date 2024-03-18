const hre = require("hardhat");

async function main() {

    const contractAddress = "0x7b77B0683DDdD305ef026667474a985C099eE3cc";

    const carbon_minter = "0x5CBaF6a447d44d52bE4b6e6a7241e067b614Da49";
    const carbon_recipient_1 = "0x5CBaF6a447d44d52bE4b6e6a7241e067b614Da49";

    const baseURI = "https://best-strengthening-495962.framer.app/methodologies/soil-carbon-methodology";
    const carbon = await hre.ethers.getContractAt("Carbon", contractAddress);
    
    const mintTokens = 
    await carbon.mint_plus(carbon_recipient_1, 1000, baseURI, "BCR-US-00002-00001-04364-BCSC-BCVC-EO-AMSIIIR-EBG001-2023-05-10");


    console.log(`Transaction Hash: https://mumbai.polygonscan.com/tx/${mintTokens.hash}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});