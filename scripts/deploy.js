const hre = require("hardhat");

async function main() {

  const latestBlock = await hre.ethers.provider.getBlock("latest")
  //const add100BlocksToCurrent = latestBlock.timestamp + 1000;

  const Carbon = await hre.ethers.getContractFactory("Carbon");
  const carbon = await Carbon.deploy();

  // await carbon.deployed(latestBlock.timestamp);

  console.log(
    `Deploy ERC721A contract and schedule mint to open on block ${latestBlock.timestamp}`,
    `Deployed to ${carbon.target}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});