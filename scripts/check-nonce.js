const hre = require("hardhat");

async function main() {
    const signers = await hre.ethers.getSigners();
    const wallet = signers[0];
    
    // Get the current nonce (pending + confirmed transactions)
    const nonce = await wallet.nonce;
    console.log("Current nonce:", nonce);
    
    // Get network nonce (latest nonce from network)
    const providerNonce = await hre.ethers.provider.getTransactionCount(wallet.address);
    console.log("Network nonce:", providerNonce);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});