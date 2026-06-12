const hre = require("hardhat");


/**
 * Upgrade script for Carbon UUPS proxy.
 *
 * Usage:
 *   npx hardhat run scripts/upgrade.js --network matic
 *
 * Prerequisites:
 *   1. Modify contracts/Carbon.sol (or create CarbonV2.sol) with your changes.
 *      - You may ADD new functions and new state variables (appended at the end).
 *      - You must NOT remove, reorder, or change types of existing state variables.
 *   2. Set PROXY_ADDRESS below (or in config.js) to the proxy address from deploy.js.
 */

const { contractAddress } = require("./config");

async function main() {
    const proxyAddress = contractAddress;
    if (!proxyAddress || proxyAddress === "") {
        throw new Error("Set contractAddress in scripts/config.js to your proxy address");
    }

    const signers = await hre.ethers.getSigners();
    const deployer = signers[0];

    console.log(`Upgrading proxy at: ${proxyAddress}`);
    console.log(`Deployer (must be owner): ${deployer.address}`);

    // Validate current implementation
    const currentImpl = await hre.upgrades.erc1967.getImplementationAddress(proxyAddress);
    console.log(`Current implementation: ${currentImpl}`);

    // Dynamic EIP-1559 settings
    const feeData = await hre.ethers.provider.getFeeData();
    const baseFee = feeData.lastBaseFeePerGas ?? feeData.gasPrice ?? 0n;
    const minPriorityFee = hre.ethers.parseUnits("25", "gwei");
    const suggestedPriorityFee = feeData.maxPriorityFeePerGas ?? minPriorityFee;
    const priorityFee = suggestedPriorityFee > minPriorityFee ? suggestedPriorityFee : minPriorityFee;
    const maxFee = baseFee * 2n + priorityFee;

    console.log(`Base fee: ${hre.ethers.formatUnits(baseFee, "gwei")} | Priority: ${hre.ethers.formatUnits(priorityFee, "gwei")} | Max: ${hre.ethers.formatUnits(maxFee, "gwei")} Gwei`);

    const Carbon = await hre.ethers.getContractFactory("Carbon", deployer);

    // Optionally pass an initializer for the new version:
    // const carbon = await upgrades.upgradeProxy(proxyAddress, Carbon, {
    //     call: { fn: "initializeV2", args: [...] },
    //     txOverrides: { maxFeePerGas: maxFee, maxPriorityFeePerGas: priorityFee },
    // });

    const carbon = await hre.upgrades.upgradeProxy(proxyAddress, Carbon, {
        txOverrides: {
            maxFeePerGas: maxFee,
            maxPriorityFeePerGas: priorityFee,
        },
    });

    console.log(`Waiting for confirmation...`);
    await carbon.waitForDeployment();

    const newImpl = await hre.upgrades.erc1967.getImplementationAddress(proxyAddress);
    console.log(`\n✅ Upgrade complete!`);
    console.log(`Proxy address (unchanged): ${proxyAddress}`);
    console.log(`New implementation: ${newImpl}`);
    console.log(`Transaction hash: ${carbon.deploymentTransaction()?.hash}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
