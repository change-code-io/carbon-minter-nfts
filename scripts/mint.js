const hre = require("hardhat");

async function main() {

    const contractAddress = "0x8910452Af676999424139fB31b2A20e2aB3a5582";
    const recieverAddress = "0x65C20b3E50Fc7575FDEa5a76F99a2c4140155531"
    const batchNFTs = await hre.ethers.getContractAt("BatchNFTs", contractAddress);

    const setBaseTokenURI = await batchNFTs.setBaseURI("https://gateway.pinata.cloud/ipfs/QmZvgEvGazKBFg9eugdp3Ybsyxci7wbe1FBBxM9SeXCKzG")
    
    const mintTokens = await batchNFTs.mint(recieverAddress, 4364);
    console.log(`Transaction Hash: https://sepolia.etherscan.io/tx/${mintTokens.hash}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});