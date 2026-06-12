const hre = require("hardhat");
// Import required variables from config.js
const { contractAddress, carbon_developer, carbon_buffer, mint_quantity, ipfs_data, BID, linked_transaction } = require("./config");

async function main() {
    // get all signers
    const signers = await hre.ethers.getSigners();

    // select desired account for minting
    const minter = signers[0];

    // get the contract instance
    const carbon = await hre.ethers.getContractAt("Carbon", contractAddress);

    // connect the minter signer with the contract
    const carbonSigned = carbon.connect(minter);

    const MAX_PER_TX = 5000;
    const totalToMint = Number(mint_quantity);

    if (!Number.isInteger(totalToMint) || totalToMint <= 0) {
        throw new Error(`mint_quantity must be a positive integer. Received: ${mint_quantity}`);
    }

    const totalBatches = Math.ceil(totalToMint / MAX_PER_TX);
    let mintedSoFar = 0;
    let totalGasUsed = 0n;
    let totalCostWei = 0n;

    console.log(`\n🚀 Minting ${totalToMint} NFTs in ${totalBatches} batch(es)...`);
    console.log(`📝 BID: ${BID}`);
    console.log(`🔗 IPFS Data: ${ipfs_data}`);
    console.log(`🔗 Linked Transaction: ${linked_transaction}`);

    for (let batch = 1; batch <= totalBatches; batch++) {
        const remaining = totalToMint - mintedSoFar;
        const batchQuantity = Math.min(MAX_PER_TX, remaining);

        // Fetch fresh fee data before each tx (safer for long mint runs)
        const feeData = await hre.ethers.provider.getFeeData();
        const baseFee = feeData.lastBaseFeePerGas ?? feeData.gasPrice ?? 0n;
        const minPriorityFee = hre.ethers.parseUnits("25", "gwei");
        const suggestedPriorityFee = feeData.maxPriorityFeePerGas ?? minPriorityFee;
        const priorityFee = suggestedPriorityFee > minPriorityFee ? suggestedPriorityFee : minPriorityFee;
        const maxFee = baseFee * 2n + priorityFee;

        const overrideOptions = {
            maxPriorityFeePerGas: priorityFee,
            maxFeePerGas: maxFee,
        };

        console.log(`\n⏳ Batch ${batch}/${totalBatches} | Quantity: ${batchQuantity}`);
        console.log(`⛽ Base: ${hre.ethers.formatUnits(baseFee, "gwei")} | Priority: ${hre.ethers.formatUnits(priorityFee, "gwei")} | Max: ${hre.ethers.formatUnits(maxFee, "gwei")} Gwei`);

        const txResponse = await carbonSigned.mint_plus(
            carbon_developer,
            batchQuantity,
            BID,
            ipfs_data,
            linked_transaction,
            overrideOptions
        );

        console.log(`📋 TX Hash: ${txResponse.hash}`);
        const receipt = await txResponse.wait(1);

        const effectiveGasPrice = receipt.gasPrice ?? 0n;
        const txCost = receipt.gasUsed * effectiveGasPrice;

        mintedSoFar += batchQuantity;
        totalGasUsed += receipt.gasUsed;
        totalCostWei += txCost;

        console.log(`✅ Batch confirmed in block ${receipt.blockNumber}`);
        console.log(`📈 Progress: ${mintedSoFar}/${totalToMint} minted`);
        console.log(`⛽ Batch gas used: ${receipt.gasUsed.toString()}`);
        console.log(`💸 Batch effective gas price: ${hre.ethers.formatUnits(effectiveGasPrice, "gwei")} Gwei`);
        console.log(`💰 Batch cost: ${hre.ethers.formatEther(txCost)} MATIC`);
    }

    console.log(`\n🎉 Mint run complete`);
    console.log(`📦 Total minted: ${mintedSoFar}`);
    console.log(`⛽ Total gas used: ${totalGasUsed.toString()}`);
    console.log(`💰 Total cost: ${hre.ethers.formatEther(totalCostWei)} MATIC`);

    // Get updated contract stats
    try {
        const totalSupply = await carbon.totalSupply();
        console.log(`\n📊 Updated Contract Stats:`);
        console.log(`🎯 Total NFTs Minted: ${totalSupply.toString()}`);
        console.log(`📍 Contract Address: ${contractAddress}`);
    } catch (error) {
        console.log(`⚠️  Could not retrieve updated stats: ${error.message}`);
    }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});