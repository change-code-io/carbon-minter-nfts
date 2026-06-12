const hre = require("hardhat");


async function main() {
    // Get all signers
    const signers = await hre.ethers.getSigners();

    // Select desired account for deployment
    const deployer = signers[0];

    console.log(`Deployer: ${deployer.address}`);

    // Dynamic EIP-1559 settings with Polygon minimum tip protection
    const feeData = await hre.ethers.provider.getFeeData();
    const baseFee = feeData.lastBaseFeePerGas ?? feeData.gasPrice ?? 0n;
    const minPriorityFee = hre.ethers.parseUnits("25", "gwei");
    const suggestedPriorityFee = feeData.maxPriorityFeePerGas ?? minPriorityFee;
    const priorityFee = suggestedPriorityFee > minPriorityFee ? suggestedPriorityFee : minPriorityFee;
    const maxFee = baseFee * 2n + priorityFee;

    console.log(`Base fee: ${hre.ethers.formatUnits(baseFee, "gwei")} Gwei`);
    console.log(`Priority fee: ${hre.ethers.formatUnits(priorityFee, "gwei")} Gwei`);
    console.log(`Max fee: ${hre.ethers.formatUnits(maxFee, "gwei")} Gwei`);

    const Carbon = await hre.ethers.getContractFactory("Carbon", deployer);

    // Deploy as a UUPS proxy. The initializer `initialize(address)` receives the initial owner.
    // Note: no manual nonce — deployProxy sends multiple transactions internally,
    // so we let the provider manage nonces automatically.
    const carbon = await hre.upgrades.deployProxy(Carbon, [deployer.address], {
        kind: "uups",
        initializer: "initialize",
        txOverrides: {
            maxFeePerGas: maxFee,
            maxPriorityFeePerGas: priorityFee,
        },
    });

    console.log(`Transaction sent, waiting for confirmation...`);
    await carbon.waitForDeployment();

    const proxyAddress = await carbon.getAddress();
    const implAddress = await hre.upgrades.erc1967.getImplementationAddress(proxyAddress);

    console.log(`\n✅ Proxy (permanent address) deployed to: ${proxyAddress}`);
    console.log(`📦 Implementation deployed to: ${implAddress}`);
    console.log(`🔗 Transaction hash: ${carbon.deploymentTransaction()?.hash}`);
    console.log(`\n⚠️  Save the proxy address in scripts/config.js as contractAddress.`);
    console.log(`⚠️  Only the proxy address matters — users/ scripts interact with it.`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
