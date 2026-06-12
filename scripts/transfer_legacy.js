const hre = require("hardhat");
const { legacyContractAddress, carbon_developer } = require("./config");

// ── Transfer Configuration ───────────────────────────────────────────────────
const TRANSFER_START_ID = 0; // First token ID to transfer
const TRANSFER_COUNT = 3750; // Number of tokens to transfer
const RECIPIENT_ADDRESS = "0x6df01379895ba860b8468743036cD85c70D58be7"; // Address to receive the tokens
const TRANSFER_NOTE    = "CBX001-11/05/2025-CBX-MCR-GWP20-V1.2-TX-USA"; // On-chain note visible in calldata (decoded as UTF-8 in explorer)
const SIGNER_INDEX = 1; // 1 = developer (token holder), adjust as needed
const DELAY_MS = 250; // Delay between transactions (avoid rate limits)
// ─────────────────────────────────────────────────────────────────────────────

// Minimal ABI for the legacy (non-upgradeable) Carbon contract
const LEGACY_ABI = [
  "function safeTransferFrom(address from, address to, uint256 tokenId, bytes data) external",
  "function ownerOf(uint256) view returns (address)",
  "function totalSupply() view returns (uint256)",
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  if (!legacyContractAddress) {
    throw new Error(
      "Set legacyContractAddress in scripts/config.js before running."
    );
  }

  if (!RECIPIENT_ADDRESS) {
    throw new Error(
      "Set RECIPIENT_ADDRESS in scripts/retire_legacy.js before running."
    );
  }

  const signers = await hre.ethers.getSigners();
  const signer = signers[SIGNER_INDEX];

  const contract = new hre.ethers.Contract(
    legacyContractAddress,
    LEGACY_ABI,
    hre.ethers.provider
  );
  const contractSigned = contract.connect(signer);

  const fromAddress = signer.address;
  const toAddress = RECIPIENT_ADDRESS;

  // ── Pre-flight checks ─────────────────────────────────────────────────
  console.log(`\n📜 Legacy Carbon: ${legacyContractAddress}`);
  console.log(`📤 From: ${fromAddress} (signer index ${SIGNER_INDEX})`);
  console.log(`📥 To:   ${toAddress}`);
  console.log(
    `🎯 Tokens ${TRANSFER_START_ID}–${
      TRANSFER_START_ID + TRANSFER_COUNT - 1
    } (${TRANSFER_COUNT} total)`
  );
  console.log(`📝 Note: "${TRANSFER_NOTE || "(none)"}"`);
  console.log(`⏱️  Delay between txs: ${DELAY_MS}ms\n`);

  // Verify ownership of first and last token
  const firstOwner = await contract.ownerOf(TRANSFER_START_ID);
  if (firstOwner.toLowerCase() !== fromAddress.toLowerCase()) {
    throw new Error(
      `Signer does not own token ${TRANSFER_START_ID}. Owner is ${firstOwner}, signer is ${fromAddress}.`
    );
  }

  const lastId = TRANSFER_START_ID + TRANSFER_COUNT - 1;
  const lastOwner = await contract.ownerOf(lastId);
  if (lastOwner.toLowerCase() !== fromAddress.toLowerCase()) {
    throw new Error(
      `Signer does not own token ${lastId}. Owner is ${lastOwner}, signer is ${fromAddress}.`
    );
  }

  console.log("✅ Pre-flight: signer owns first and last token in range\n");

  // ── Transfer loop ─────────────────────────────────────────────────────
  let transferred = 0;
  let totalGasUsed = 0n;
  let totalCostWei = 0n;

  for (let i = 0; i < TRANSFER_COUNT; i++) {
    const tokenId = TRANSFER_START_ID + i;

    // Fetch fresh fee data periodically (every 100 tokens)
    let gasOptions;
    if (i % 100 === 0) {
      const feeData = await hre.ethers.provider.getFeeData();
      const baseFee = feeData.lastBaseFeePerGas ?? feeData.gasPrice;
      const priorityFee = hre.ethers.parseUnits("30", "gwei");
      const maxFee = (baseFee * 12n) / 10n + priorityFee;
      gasOptions = {
        maxPriorityFeePerGas: priorityFee,
        maxFeePerGas: maxFee,
      };
    }

    try {
      const tx = await contractSigned.safeTransferFrom(
        fromAddress,
        toAddress,
        tokenId,
        hre.ethers.toUtf8Bytes(TRANSFER_NOTE),
        gasOptions || {}
      );
      const receipt = await tx.wait(1);

      transferred++;
      const effectiveGasPrice = receipt.gasPrice ?? 0n;
      const txCost = receipt.gasUsed * effectiveGasPrice;
      totalGasUsed += receipt.gasUsed;
      totalCostWei += txCost;

      // Progress every 50 tokens or on the last one
      if (transferred % 50 === 0 || transferred === TRANSFER_COUNT) {
        console.log(
          `   ✅ Transferred ${transferred}/${TRANSFER_COUNT} | Last: token ${tokenId} | TX: ${tx.hash.slice(
            0,
            18
          )}...`
        );
      }
    } catch (err) {
      console.error(`\n   ❌ Failed on token ${tokenId}: ${err.message}`);

      // Check if we no longer own this token (already transferred?)
      try {
        const currentOwner = await contract.ownerOf(tokenId);
        if (currentOwner.toLowerCase() === toAddress.toLowerCase()) {
          console.log(
            `   ℹ️  Token ${tokenId} already belongs to recipient — skipping.`
          );
          continue;
        }
      } catch {
        // token may not exist
      }

      console.error(`   ⚠️  Resume by setting TRANSFER_START_ID = ${tokenId}`);
      console.log(
        `\n📊 Partial results: ${transferred}/${TRANSFER_COUNT} transferred`
      );
      console.log(`⛽ Total gas used: ${totalGasUsed.toString()}`);
      console.log(
        `💰 Total cost: ${hre.ethers.formatEther(totalCostWei)} MATIC`
      );
      process.exitCode = 1;
      return;
    }

    // Delay between transactions
    if (i < TRANSFER_COUNT - 1) {
      await sleep(DELAY_MS);
    }
  }

  // ── Summary ───────────────────────────────────────────────────────────
  console.log(`\n🎉 All ${transferred} tokens transferred successfully!`);
  console.log(`⛽ Total gas used: ${totalGasUsed.toString()}`);
  console.log(`💰 Total cost: ${hre.ethers.formatEther(totalCostWei)} MATIC`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
