const hre = require("hardhat");
const { legacyContractAddress } = require("./config");

// ── Retire Configuration ─────────────────────────────────────────────────────
// Run scripts/check-legacy-tokens.js first to find the RETIRE_START_ID.
// The legacy contract only has burn_plus(uint256[]) — owner-only batch burn.
const RETIRE_START_ID = 0;          // First token ID to burn (set from check-legacy-tokens output)
const RETIRE_COUNT    = 3750;       // Number of tokens to burn
const SIGNER_INDEX    = 0;          // 0 = minter (must be contract owner for burn_plus)
// ─────────────────────────────────────────────────────────────────────────────

// Minimal ABI for the legacy (non-upgradeable) Carbon contract
const LEGACY_ABI = [
    "function burn_plus(uint256[] calldata tokenIDs) external",
    "function totalSupply() view returns (uint256)",
    "function ownerOf(uint256) view returns (address)",
    "function owner() view returns (address)",
];

async function main() {
    if (!legacyContractAddress) {
        throw new Error("Set legacyContractAddress in scripts/config.js before running.");
    }

    const signers = await hre.ethers.getSigners();
    const signer  = signers[SIGNER_INDEX];

    const contract       = new hre.ethers.Contract(legacyContractAddress, LEGACY_ABI, hre.ethers.provider);
    const contractSigned = contract.connect(signer);

    // ── Pre-flight checks ─────────────────────────────────────────────────
    const [contractOwner, currentSupply] = await Promise.all([
        contract.owner(),
        contract.totalSupply(),
    ]);

    if (signer.address.toLowerCase() !== contractOwner.toLowerCase()) {
        throw new Error(`Signer ${signer.address} is NOT the contract owner (${contractOwner}). burn_plus is owner-only.`);
    }

    console.log(`\n📜 Legacy Carbon: ${legacyContractAddress}`);
    console.log(`👤 Owner: ${contractOwner}`);
    console.log(`👤 Signer: ${signer.address} (index ${SIGNER_INDEX})`);
    console.log(`📊 Current totalSupply: ${currentSupply}\n`);

    if (BigInt(RETIRE_COUNT) > currentSupply) {
        throw new Error(`RETIRE_COUNT (${RETIRE_COUNT}) exceeds totalSupply (${currentSupply}).`);
    }

    // ── Build token ID array ──────────────────────────────────────────────
    const tokenIDs = [];
    for (let i = 0; i < RETIRE_COUNT; i++) {
        tokenIDs.push(RETIRE_START_ID + i);
    }

    const endId = RETIRE_START_ID + RETIRE_COUNT - 1;
    console.log(`🔥 Burning tokens ${RETIRE_START_ID}–${endId} (${RETIRE_COUNT} total)`);

    // ── Fetch gas pricing ─────────────────────────────────────────────────
    const feeData     = await hre.ethers.provider.getFeeData();
    const baseFee     = feeData.lastBaseFeePerGas ?? feeData.gasPrice;
    const priorityFee = hre.ethers.parseUnits("30", "gwei");
    const maxFee      = baseFee * 12n / 10n + priorityFee;

    const gasOptions = {
        maxPriorityFeePerGas: priorityFee,
        maxFeePerGas:         maxFee,
    };

    console.log(`⛽ Max Fee: ${hre.ethers.formatUnits(maxFee, "gwei")} Gwei | Priority: ${hre.ethers.formatUnits(priorityFee, "gwei")} Gwei`);
    console.log(`📦 Single transaction with ${RETIRE_COUNT} token IDs\n`);

    // ── Execute burn_plus ─────────────────────────────────────────────────
    try {
        console.log("⏳ Submitting burn_plus transaction...");
        const tx = await contractSigned.burn_plus(tokenIDs, gasOptions);
        console.log(`   📋 TX: ${tx.hash}`);

        const receipt = await tx.wait(1);
        console.log(`   ✅ Confirmed in block ${receipt.blockNumber} | Gas used: ${receipt.gasUsed.toString()}`);
    } catch (err) {
        console.error(`   ❌ Transaction failed: ${err.message}`);

        // Check if the first token actually exists
        try {
            await contract.ownerOf(RETIRE_START_ID);
        } catch {
            console.error(`   ⚠️  Token ${RETIRE_START_ID} does not exist — check RETIRE_START_ID`);
        }

        process.exitCode = 1;
        return;
    }

    // ── Post-burn status ──────────────────────────────────────────────────
    try {
        const newSupply = await contract.totalSupply();
        console.log(`\n📊 New totalSupply: ${newSupply} (was ${currentSupply})`);
    } catch (e) {
        console.log(`\n⚠️  Could not retrieve post-burn totalSupply: ${e.message}`);
    }

    console.log(`\n🎉 ${RETIRE_COUNT} tokens burned successfully!`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
