const hre = require("hardhat");

async function main() {

    const contractAddress = "0x3C6621C201d6A4FBbaFCcE13AD65770f1b96A3f2";
    const batchNFTs = await hre.ethers.getContractAt("BatchNFTs", contractAddress);

    const setBaseTokenURI = await batchNFTs.setBaseURI("https://gateway.pinata.cloud/ipfs/QmPNVWssQVgCJT96nuUJDYdaLE2rTZ6U1k3FDtLAheo99W")
    
    console.log(`baseURI set`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
