const hre = require("hardhat");
const { contractAddress } = require("./config");

// ── Burn Configuration ────────────────────────────────────────────────────────
// Set BURN_MODE to "range" or "list":
//
//   "range" — burns a contiguous range of IDs from BURN_START_ID to BURN_END_ID,
//             split into batches of BATCH_SIZE. Uses burn_range().
//
//   "list"  — burns an explicit array of IDs from BURN_TOKEN_IDS,
//             split into batches of BATCH_SIZE. Uses burn_list().
//
const BURN_MODE      = "range";
const BURN_NOTE      = "";        // Optional note recorded on-chain (pass "" for none)
const BATCH_SIZE     = 500;       // Token IDs per transaction (keep well under gas limit)

// ── Range mode config (used when BURN_MODE === "range") ───────────────────────
const BURN_START_ID  = 0;         // First token ID to burn (ERC721A starts at 0)
const BURN_END_ID    = 953968;    // Last token ID to burn (inclusive)

// ── List mode config (used when BURN_MODE === "list") ─────────────────────────
//    Provide an explicit array of token IDs to burn. They do not need to be
//    sorted or contiguous.
const BURN_TOKEN_IDS = [
    1, 5, 10, 42, 100, 999
];
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
    if (BURN_MODE !== "range" && BURN_MODE !== "list") {
        throw new Error(`Invalid BURN_MODE "${BURN_MODE}". Use "range" or "list".`);
    }

    const signers = await hre.ethers.getSigners();
    const burner  = signers[0];

    const carbon       = await hre.ethers.getContractAt("Carbon", contractAddress);
    const carbonSigned = carbon.connect(burner);

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

    if (BURN_MODE === "range") {
        const totalTokens = BURN_END_ID - BURN_START_ID + 1;
        if (totalTokens <= 0) throw new Error("BURN_END_ID must be >= BURN_START_ID");
        const totalBatches = Math.ceil(totalTokens / BATCH_SIZE);
        for (let batch = 0; batch < totalBatches; batch++) {
            const start = BURN_START_ID + batch * BATCH_SIZE;
            const end   = Math.min(start + BATCH_SIZE - 1, BURN_END_ID);
            workItems.push({ mode: "range", start, end, count: end - start + 1 });
        }
    } else {
        // List mode — chunk the explicit array
        if (BURN_TOKEN_IDS.length === 0) throw new Error("BURN_TOKEN_IDS is empty");
        for (let i = 0; i < BURN_TOKEN_IDS.length; i += BATCH_SIZE) {
            const chunk = BURN_TOKEN_IDS.slice(i, i + BATCH_SIZE);
            workItems.push({ mode: "list", ids: chunk, count: chunk.length });
        }
    }

    const totalCount = workItems.reduce((sum, w) => sum + w.count, 0);

    console.log(`\n🔥 BURN_MODE: ${BURN_MODE}`);
    if (BURN_MODE === "range") {
        console.log(`🎯 Tokens ${BURN_START_ID} – ${BURN_END_ID} (${totalCount} total)`);
    } else {
        console.log(`🎯 ${totalCount} token IDs from BURN_TOKEN_IDS`);
    }
    console.log(`📦 Batch size: ${BATCH_SIZE} | Total batches: ${workItems.length}`);
    console.log(`📝 Note: "${BURN_NOTE || "(none)"}"`);
    console.log(`⛽ Max Fee: ${hre.ethers.formatUnits(maxFee, "gwei")} Gwei | Priority: ${hre.ethers.formatUnits(priorityFee, "gwei")} Gwei\n`);

    let burned = 0;

    for (let i = 0; i < workItems.length; i++) {
        const item = workItems[i];
        const label = item.mode === "range"
            ? `IDs ${item.start}–${item.end}`
            : `${item.count} IDs`;

        console.log(`⏳ Batch ${i + 1}/${workItems.length}: burning ${label}...`);

        try {
            let tx;
            if (item.mode === "range") {
                tx = await carbonSigned.burn_range(item.start, item.end, BURN_NOTE, gasOptions);
            } else {
                tx = await carbonSigned.burn_list(item.ids, BURN_NOTE, gasOptions);
            }

            console.log(`   📋 TX: ${tx.hash}`);
            const receipt = await tx.wait(1);
            burned += item.count;
            console.log(`   ✅ Confirmed in block ${receipt.blockNumber} | Gas: ${receipt.gasUsed.toString()} | Progress: ${burned}/${totalCount}`);
        } catch (err) {
            console.error(`   ❌ Batch ${i + 1} failed: ${err.message}`);
            if (item.mode === "range") {
                console.error(`   ⚠️  Resume from BURN_START_ID = ${item.start}`);
            } else {
                console.error(`   ⚠️  Failed on IDs starting at index ${i * BATCH_SIZE} in BURN_TOKEN_IDS`);
            }
            process.exitCode = 1;
            return;
        }
    }

    console.log(`\n🎉 All ${burned} tokens burned successfully!`);

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
