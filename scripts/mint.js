const hre = require("hardhat");

async function main() {

    const contractAddress = "0x2580571A6a68f05a7EC1E535C2e539aB7dd07848";
    const recieverAddress = "0x5CBaF6a447d44d52bE4b6e6a7241e067b614Da49";
    const baseURI = "https://jade-near-wasp-97.mypinata.cloud/ipfs/QmSwxPaCVq9oem7KBe6TVqqsHjuKymwAbRsJsfcUPu3eEG";
    const serializiedCredits = await hre.ethers.getContractAt("SerializiedCredits", contractAddress);
    
    const mintTokens = await serializiedCredits.mint(recieverAddress, 5, baseURI);
    console.log(`Transaction Hash: https://mumbai.polygonscan.com/tx/${mintTokens.hash}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});