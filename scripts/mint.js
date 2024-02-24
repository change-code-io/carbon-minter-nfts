const hre = require("hardhat");

async function main() {

    const contractAddress = "0xB03fdE69FF7Cc8bf85Bbe14Fb45177C1383964a2";

    const carbon_dev_minter = "0x5CBaF6a447d44d52bE4b6e6a7241e067b614Da49";
    const carbon_dev_recipient_1 = "0x1FFF5A920dA884A0977C08caa3518F1Ae7e7aFD9";

    const baseURI = "https://jade-near-wasp-97.mypinata.cloud/ipfs/QmSwxPaCVq9oem7KBe6TVqqsHjuKymwAbRsJsfcUPu3eEG";
    const carbon_dev = await hre.ethers.getContractAt("Carbon_dev", contractAddress);
    
    const mintTokens = 
    await carbon_dev.mint(carbon_dev_minter, 5, baseURI);
    await carbon_dev.mint(carbon_dev_recipient_1, 10, baseURI);


    console.log(`Transaction Hash: https://mumbai.polygonscan.com/tx/${mintTokens.hash}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});