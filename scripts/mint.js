const hre = require("hardhat");

async function main() {

    const contractAddress = "0x14d82184f8CABECa455b22c2ea8d7d4Db67BD69E";

    const carbon_minter = "0x204e07573052aa523f2662F98A3057791B19208C";
    const carbon_recipient_1 = "0x4B214516602e8541550b7e0700e527ADf452C42C";

    const baseURI = "https://best-strengthening-495962.framer.app/methodologies/soil-carbon-methodology";
    const carbon = await hre.ethers.getContractAt("Carbon", contractAddress);
    
    const mintTokens = 
    await carbon.mint_plus(carbon_recipient_1, 4364, baseURI, "BCR-US-00002-00001-04364-BCSC-BCVC-EO-AMSIIIR-EBG001-2023-05-10");
    await carbon.mint_plus(carbon_recipient_1, 6817, baseURI, "BCR-US-00004-00001-06817-BCSC-BCVC-LVI-AMSIIIR-EBG001-2024-03-11");


    console.log(`Transaction Hash: https://mumbai.polygonscan.com/tx/${mintTokens.hash}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});