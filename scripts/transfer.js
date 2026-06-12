const hre = require("hardhat");
const { contractAddress, carbon_recipient_1, carbon_recipient_2, transfer_targetID } = require("./config");

async function main() {
    if (!carbon_recipient_1 || !carbon_recipient_2) {
        throw new Error("Set carbon_recipient_1 and carbon_recipient_2 in scripts/config.js");
    }

    const signers = await hre.ethers.getSigners();
    const owner = signers[0]; // Must be owner — transferFrom is restricted to owner only

    const carbon = await hre.ethers.getContractAt("Carbon", contractAddress);
    const carbonSigned = carbon.connect(owner);

    // Dynamic EIP-1559 settings
    const feeData = await hre.ethers.provider.getFeeData();
    const baseFee = feeData.lastBaseFeePerGas ?? feeData.gasPrice ?? 0n;
    const minPriorityFee = hre.ethers.parseUnits("25", "gwei");
    const suggestedPriorityFee = feeData.maxPriorityFeePerGas ?? minPriorityFee;
    const priorityFee = suggestedPriorityFee > minPriorityFee ? suggestedPriorityFee : minPriorityFee;
    const maxFee = baseFee * 2n + priorityFee;

    console.log(`\n🔄 Transferring token ${transfer_targetID}`);
    console.log(`📤 From: ${carbon_recipient_1}`);
    console.log(`📥 To:   ${carbon_recipient_2}`);
    console.log(`👤 Caller (owner): ${owner.address}`);
    console.log(`⛽ Max Fee: ${hre.ethers.formatUnits(maxFee, "gwei")} Gwei | Priority: ${hre.ethers.formatUnits(priorityFee, "gwei")} Gwei`);

    const tx = await carbonSigned.safeTransferFrom(
        carbon_recipient_1,
        carbon_recipient_2,
        transfer_targetID,
        {
            maxFeePerGas: maxFee,
            maxPriorityFeePerGas: priorityFee,
        }
    );

    console.log(`📋 TX Hash: ${tx.hash}`);
    const receipt = await tx.wait(1);

    console.log(`✅ Token ${transfer_targetID} transferred in block ${receipt.blockNumber}`);
    console.log(`⛽ Gas used: ${receipt.gasUsed.toString()}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
