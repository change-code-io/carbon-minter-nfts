const hre = require("hardhat");

async function main() {
    //get all signers
    const signers = await hre.ethers.getSigners();

    //select desired account for deployment
    const deployer = signers[0];

  const latestBlock = await hre.ethers.provider.getBlock("latest")
  //const add100BlocksToCurrent = latestBlock.timestamp + 1000;

  const Carbon = await hre.ethers.getContractFactory("Carbon", deployer);
  const carbon = await Carbon.deploy();

  // await carbon.deployed(latestBlock.timestamp);

  console.log(`Contract successfully deployed to: ${carbon.target}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});