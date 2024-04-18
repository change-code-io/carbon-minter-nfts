const hre = require("hardhat");
// Import required variables from config.js
const { contractAddress, carbon_recipient_1, mint_quantity, baseURI } = require("./config");

async function main() {
    //get all signers
    const signers = await hre.ethers.getSigners();

    //select desired account for minting
    const minter = signers[0];

    //get the contract instance
    const carbon = await hre.ethers.getContractAt("Carbon", contractAddress);

    //connect the minter signer with the contract
    const carbonSigned = carbon.connect(minter);
    
    // Capture the transaction response
    const txResponse = await carbonSigned.mint_plus(carbon_recipient_1, mint_quantity, baseURI, "data");
    
    // Wait for the transaction to be mined
    const receipt = await txResponse.wait(1);

    // Log the transaction hash
    console.log(`Tokens minted!`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});