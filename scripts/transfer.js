const hre = require("hardhat");

async function main() {
    //get all signers
    const signers = await hre.ethers.getSigners();

    //select desired account to transfer from
    const transferFrom = signers[1];

    const contractAddress = "0x4F45eE5b1CAdAB61771400ce394f765f5755F226";
    const carbon_minter = "0x5CBaF6a447d44d52bE4b6e6a7241e067b614Da49";
    const carbon_buffer = "0x5CBaF6a447d44d52bE4b6e6a7241e067b614Da49";
    const carbon_recipient_1 = "0x1FFF5A920dA884A0977C08caa3518F1Ae7e7aFD9";
    const carbon_recipient_2 = "0x78Fa5c18a80eef995a4e50b74ED8CC13aF033A93";

    const targetID = 0;

    //get the contract instance
    const carbon = await hre.ethers.getContractAt("Carbon", contractAddress);

    //connect the transferFrom signer with the contract
    const carbonSigned = carbon.connect(transferFrom);
   
    await carbonSigned.safeTransferFrom(carbon_recipient_1, carbon_recipient_2, targetID);

    console.log("Tokens transferred!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});