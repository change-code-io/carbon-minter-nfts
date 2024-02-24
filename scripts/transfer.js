const hre = require("hardhat");

async function main() {

    const contractAddress = "0x9eEc4b5d97cC3DeF70c9D8e843FDDdFB93D34cA9";
    const targetID = 6;

    const carbon_dev_recipient_1 = "0x1FFF5A920dA884A0977C08caa3518F1Ae7e7aFD9";
    const carbon_dev_recipient_2 = "0x78Fa5c18a80eef995a4e50b74ED8CC13aF033A93";

    const carbon_dev = await hre.ethers.getContractAt("Carbon_dev", contractAddress);
   
    const transferTokens = await carbon_dev.safeTransferFrom(carbon_dev_recipient_1, carbon_dev_recipient_2, targetID);
    console.log(`Transaction Hash: https://mumbai.polygonscan.com/tx/${transferTokens.hash}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});