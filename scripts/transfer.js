const hre = require("hardhat");
const { contractAddress, carbon_recipient_1, carbon_recipient_2, transfer_targetID } = require("./config");

async function main() {
    //get all signers
    const signers = await hre.ethers.getSigners();

    //select desired account to transfer from
    const transferFrom = signers[1];

    //get the contract instance
    const carbon = await hre.ethers.getContractAt("Carbon", contractAddress);

    //connect the transferFrom signer with the contract
    const carbonSigned = carbon.connect(transferFrom);
   
    await carbonSigned.safeTransferFrom(carbon_recipient_1, carbon_recipient_2, transfer_targetID);

    console.log("Tokens transferred!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});