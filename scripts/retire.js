const hre = require("hardhat");
const { contractAddress } = require("./config");

// ── Retire Configuration ─────────────────────────────────────────────────────
// Set RETIRE_MODE to "range" or "list":
//
//   "range" — retires a contiguous range of IDs from RETIRE_START_ID to
//             RETIRE_END_ID, split into batches of BATCH_SIZE.
//             Uses retire_range().
//
//   "list"  — retires an explicit array of IDs from RETIRE_TOKEN_IDS,
//             split into batches of BATCH_SIZE.
//             Uses retire_list().
//
const RETIRE_MODE     = "range";
const RETIRE_NOTE     = "";        // Optional note recorded on-chain (pass "" for none)
const BATCH_SIZE      = 500;       // Token IDs per transaction (keep well under gas limit)
const SIGNER_INDEX    = 0;         // 0 = first signer (typically owner), adjust for token holder

// ── Range mode config (used when RETIRE_MODE === "range") ────────────────────
const RETIRE_START_ID = 0;         // First token ID to retire
const RETIRE_END_ID   = 953968;    // Last token ID to retire (inclusive)

// ── List mode config (used when RETIRE_MODE === "list") ──────────────────────
//    Provide an explicit array of token IDs to retire. They do not need to be
//    sorted or contiguous. The caller must own all of them (unless contract owner).
const RETIRE_TOKEN_IDS = [
    1, 5, 10, 42, 100, 999
];
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
    if (RETIRE_MODE !== "range" && RETIRE_MODE !== "list") {
        throw new Error(`Invalid RETIRE_MODE "${RETIRE_MODE}". Use "range" or "list".`);
    }

    const signers = await hre.ethers.getSigners();
    const signer  = signers[SIGNER_INDEX];

    const carbon       = await hre.ethers.getContractAt("Carbon", contractAddress);
    const carbonSigned = carbon.connect(signer);

    // Fetch EIP-1559 fee data
    const feeData     = await hre.ethers.provider.getFeeData();
    const baseFee     = feeData.lastBaseFeePerGas ?? feeData.gasPrice;
    const priorityFee = hre.ethers.parseUnits("30", "gwei");
    const maxFee      = baseFee * 2n + priorityFee;

    const gasOptions = {
        maxPriorityFeePerGas: priorityFee,
        maxFeePerGas:         maxFee,
    };

    // Build the work items: each is a chunk to send in one transaction
    const workItems = [];

    if (RETIRE_MODE === "range") {
        const totalTokens = RETIRE_END_ID - RETIRE_START_ID + 1;
        if (totalTokens <= 0) throw new Error("RETIRE_END_ID must be >= RETIRE_START_ID");
        const totalBatches = Math.ceil(totalTokens / BATCH_SIZE);
        for (let batch = 0; batch < totalBatches; batch++) {
            const start = RETIRE_START_ID + batch * BATCH_SIZE;
            const end   = Math.min(start + BATCH_SIZE - 1, RETIRE_END_ID);
            workItems.push({ mode: "range", start, end, count: end - start + 1 });
        }
    } else {
        // List mode — chunk the explicit array
        if (RETIRE_TOKEN_IDS.length === 0) throw new Error("RETIRE_TOKEN_IDS is empty");
        for (let i = 0; i < RETIRE_TOKEN_IDS.length; i += BATCH_SIZE) {
            const chunk = RETIRE_TOKEN_IDS.slice(i, i + BATCH_SIZE);
            workItems.push({ mode: "list", ids: chunk, count: chunk.length });
        }
    }

    const totalCount = workItems.reduce((sum, w) => sum + w.count, 0);

    console.log(`\n♻️  RETIRE_MODE: ${RETIRE_MODE}`);
    if (RETIRE_MODE === "range") {
        console.log(`🎯 Tokens ${RETIRE_START_ID} – ${RETIRE_END_ID} (${totalCount} total)`);
    } else {
        console.log(`🎯 ${totalCount} token IDs from RETIRE_TOKEN_IDS`);
    }
    console.log(`👤 Signer: ${signer.address} (signer index ${SIGNER_INDEX})`);
    console.log(`📦 Batch size: ${BATCH_SIZE} | Total batches: ${workItems.length}`);
    console.log(`📝 Note: "${RETIRE_NOTE || "(none)"}"`);
    console.log(`⛽ Max Fee: ${hre.ethers.formatUnits(maxFee, "gwei")} Gwei | Priority: ${hre.ethers.formatUnits(priorityFee, "gwei")} Gwei\n`);

    let retired = 0;

    for (let i = 0; i < workItems.length; i++) {
        const item = workItems[i];
        const label = item.mode === "range"
            ? `IDs ${item.start}–${item.end}`
            : `${item.count} IDs`;

        console.log(`⏳ Batch ${i + 1}/${workItems.length}: retiring ${label}...`);

        try {
            let tx;
            if (item.mode === "range") {
                tx = await carbonSigned.retire_range(item.start, item.end, RETIRE_NOTE, gasOptions);
            } else {
                tx = await carbonSigned.retire_list(item.ids, RETIRE_NOTE, gasOptions);
            }

            console.log(`   📋 TX: ${tx.hash}`);
            const receipt = await tx.wait(1);
            retired += item.count;
            console.log(`   ✅ Confirmed in block ${receipt.blockNumber} | Gas: ${receipt.gasUsed.toString()} | Progress: ${retired}/${totalCount}`);
        } catch (err) {
            console.error(`   ❌ Batch ${i + 1} failed: ${err.message}`);
            if (item.mode === "range") {
                console.error(`   ⚠️  Resume from RETIRE_START_ID = ${item.start}`);
            } else {
                console.error(`   ⚠️  Failed on IDs starting at index ${i * BATCH_SIZE} in RETIRE_TOKEN_IDS`);
            }
            process.exitCode = 1;
            return;
        }
    }

    console.log(`\n🎉 All ${retired} tokens retired successfully!`);

    try {
        const totalSupply = await carbon.totalSupply();
        console.log(`📊 Remaining totalSupply: ${totalSupply.toString()}`);
    } catch (e) {
        console.log(`⚠️  Could not retrieve totalSupply: ${e.message}`);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
