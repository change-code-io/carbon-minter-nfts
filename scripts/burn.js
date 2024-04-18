const hre = require("hardhat");
const { contractAddress, burn_tokenIDs } = require("./config");

async function main() {

    //get all signers
    const signers = await hre.ethers.getSigners();
    //select desired account for burning
    const burner = signers[0];
    
    //get the contract instance
    const carbon = await hre.ethers.getContractAt("Carbon", contractAddress);
    
    //connect the burner signer with the contract
    const carbonSigned = carbon.connect(burner);

    // Correctly call the burn_plus function with burn_tokenIDs
    await carbonSigned.burn_plus(burn_tokenIDs);

    console.log("Tokens burned!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});