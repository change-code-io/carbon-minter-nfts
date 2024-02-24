const hre = require("hardhat");

async function main() {

  const latestBlock = await hre.ethers.provider.getBlock("latest")
  //const add100BlocksToCurrent = latestBlock.timestamp + 1000;

  const Carbon_dev = await hre.ethers.getContractFactory("Carbon_dev");
  const carbon_dev = await Carbon_dev.deploy();

  // await carbon_dev.deployed(latestBlock.timestamp);

  console.log(
    `Deploy ERC721A contract and schedule mint to open on block ${latestBlock.timestamp}`,
    `Deployed to ${carbon_dev.target}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});