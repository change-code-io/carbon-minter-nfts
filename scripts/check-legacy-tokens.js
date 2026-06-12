const hre = require("hardhat");
const { legacyContractAddress } = require("./config");

// ── Configuration ────────────────────────────────────────────────────────────
const SIGNER_INDEX    = 0;         // Signer to verify ownership (0 = minter/owner)
const SCAN_BATCH_SIZE = 200;       // Tokens per Multicall3 batch
const NEED_CONTIGUOUS = 3750;      // Stop scanning once we find this many in a row
const DELAY_MS        = 150;       // Delay between batches to avoid RPC rate limits
// ─────────────────────────────────────────────────────────────────────────────

// Minimal ABI for the legacy (non-upgradeable) Carbon contract
const LEGACY_ABI = [
    "function totalSupply() view returns (uint256)",
    "function ownerOf(uint256) view returns (address)",
    "function owner() view returns (address)",
    "function MAX_SUPPLY() view returns (uint256)",
];

// Multicall3 on Polygon mainnet
const MULTICALL3_ADDRESS = "0xcA11bde05977b3631167028862bE2a173976CA11";
const MULTICALL3_ABI = [
    "function aggregate3(tuple(address target, bool allowFailure, bytes callData)[] calls) payable returns (tuple(bool success, bytes returnData)[] results)",
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
    if (!legacyContractAddress) {
        throw new Error("Set legacyContractAddress in scripts/config.js before running.");
    }

    const provider = hre.ethers.provider;
    const contract  = new hre.ethers.Contract(legacyContractAddress, LEGACY_ABI, provider);
    const multicall = new hre.ethers.Contract(MULTICALL3_ADDRESS, MULTICALL3_ABI, provider);

    // ── Basic info ────────────────────────────────────────────────────────
    const [totalSupply, maxSupply, contractOwner] = await Promise.all([
        contract.totalSupply(),
        contract.MAX_SUPPLY(),
        contract.owner(),
    ]);

    console.log(`\n📜 Legacy Carbon: ${legacyContractAddress}`);
    console.log(`👤 Owner: ${contractOwner}`);
    console.log(`📊 Total Supply (unburned): ${totalSupply}`);
    console.log(`📊 Max Supply: ${maxSupply}`);

    if (totalSupply === 0n) {
        console.log("\n⚠️  No tokens exist. Nothing to scan.");
        return;
    }

    console.log(`\n🔍 Scanning from ID 0 upward, looking for ${NEED_CONTIGUOUS} contiguous tokens...`);
    console.log(`   Batch size: ${SCAN_BATCH_SIZE} | Delay: ${DELAY_MS}ms between batches\n`);

    // ── Scan upward, stop early once we have enough ───────────────────────
    let scanId        = 0;
    let rangeStart    = null;
    let rangeLength   = 0;
    const scanLimit   = Number(maxSupply);
    let batchNum      = 0;

    while (scanId < scanLimit) {
        const batchEnd = Math.min(scanId + SCAN_BATCH_SIZE, scanLimit);
        batchNum++;

        const calls = [];
        for (let id = scanId; id < batchEnd; id++) {
            calls.push({
                target: legacyContractAddress,
                allowFailure: true,
                callData: contract.interface.encodeFunctionData("ownerOf", [id]),
            });
        }

        const results = await multicall.aggregate3.staticCall(calls);

        for (let i = 0; i < results.length; i++) {
            const { success, returnData } = results[i];

            if (success && returnData.length > 0) {
                // Token exists
                if (rangeStart === null) {
                    rangeStart = scanId + i;
                    rangeLength = 1;
                } else {
                    rangeLength++;
                }

                if (rangeLength >= NEED_CONTIGUOUS) {
                    const rangeEnd = rangeStart + rangeLength - 1;
                    console.log(`✅ Found ${rangeLength} contiguous tokens: IDs ${rangeStart.toLocaleString()}–${rangeEnd.toLocaleString()}`);
                    console.log(`\n🎯 Set in retire_legacy.js:`);
                    console.log(`   RETIRE_START_ID = ${rangeStart}`);
                    console.log(`   (IDs ${rangeStart}–${rangeStart + NEED_CONTIGUOUS - 1})\n`);
                    return;
                }
            } else {
                // Token doesn't exist — gap found, reset
                if (rangeStart !== null) {
                    const rangeEnd = rangeStart + rangeLength - 1;
                    console.log(`   IDs ${rangeStart.toLocaleString()}–${rangeEnd.toLocaleString()} (${rangeLength.toLocaleString()} tokens) — gap at ${scanId + i}`);
                    rangeStart  = null;
                    rangeLength = 0;
                }
            }
        }

        scanId = batchEnd;

        // Progress
        process.stdout.write(`   Scanned up to ID ${scanId.toLocaleString()} (${batchNum} batches)\r`);

        // Delay to avoid rate limits
        await sleep(DELAY_MS);
    }

    // If we get here, we scanned everything without finding enough
    console.log(`\n\n⚠️  No contiguous range of ${NEED_CONTIGUOUS} tokens found.`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
