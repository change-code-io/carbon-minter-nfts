const hre = require("hardhat");

async function main() {

    //get all signers
    const signers = await hre.ethers.getSigners();
    //select desired account for burning
    const burner = signers[0];  

    const contractAddress = "0x4F45eE5b1CAdAB61771400ce394f765f5755F226";
    const tokenIDs = Array.from({length: 2}, (_, i) => i);
    
    //get the contract instance
    const carbon = await hre.ethers.getContractAt("Carbon", contractAddress);
    
    //connect the burner signer with the contract
    const carbonSigned = carbon.connect(burner);

    await carbonSigned.burn_plus(tokenIDs);

    console.log("Tokens burned!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});