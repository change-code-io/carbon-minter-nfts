const { ethers } = require("hardhat");
require("dotenv").config();

// Colors for console output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

function log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
}

function logSection(title) {
    console.log(`\n${colors.bold}${colors.cyan}=== ${title} ===${colors.reset}`);
}

function logSuccess(message) {
    log(`✅ ${message}`, colors.green);
}

function logError(message) {
    log(`❌ ${message}`, colors.red);
}

function logWarning(message) {
    log(`⚠️  ${message}`, colors.yellow);
}

function logInfo(message) {
    log(`ℹ️  ${message}`, colors.blue);
}

async function checkChainHealth() {
    try {
        logSection("Polygon Amoy Chain Health Check");
        
        // Get provider from hardhat config
        const provider = ethers.provider;
        
        // Test 1: Basic connectivity
        logSection("1. Basic Connectivity Test");
        try {
            const network = await provider.getNetwork();
            logSuccess(`Connected to network: ${network.name} (Chain ID: ${network.chainId})`);
            
            if (network.chainId !== 80002n) {
                logWarning(`Expected Chain ID 80002 (Polygon Amoy), got ${network.chainId}`);
            }
        } catch (error) {
            logError(`Failed to connect to network: ${error.message}`);
            return;
        }

        // Test 2: Latest block information
        logSection("2. Latest Block Information");
        try {
            const latestBlock = await provider.getBlock("latest");
            const currentTime = Math.floor(Date.now() / 1000);
            const blockAge = currentTime - latestBlock.timestamp;
            
            logSuccess(`Latest block number: ${latestBlock.number}`);
            logInfo(`Block hash: ${latestBlock.hash}`);
            logInfo(`Block timestamp: ${new Date(latestBlock.timestamp * 1000).toISOString()}`);
            logInfo(`Block age: ${blockAge} seconds`);
            logInfo(`Gas limit: ${latestBlock.gasLimit.toString()}`);
            logInfo(`Gas used: ${latestBlock.gasUsed.toString()}`);
            logInfo(`Transaction count: ${latestBlock.transactions.length}`);
            
            if (blockAge > 300) { // 5 minutes
                logWarning(`Latest block is ${blockAge} seconds old - chain might be slow`);
            } else {
                logSuccess(`Chain is producing blocks normally (last block ${blockAge}s ago)`);
            }
        } catch (error) {
            logError(`Failed to get latest block: ${error.message}`);
        }

        // Test 3: Gas price check
        logSection("3. Gas Price Check");
        try {
            const gasPrice = await provider.getFeeData();
            logSuccess(`Current gas price: ${ethers.formatUnits(gasPrice.gasPrice, "gwei")} Gwei`);
            logInfo(`Max fee per gas: ${ethers.formatUnits(gasPrice.maxFeePerGas, "gwei")} Gwei`);
            logInfo(`Max priority fee: ${ethers.formatUnits(gasPrice.maxPriorityFeePerGas, "gwei")} Gwei`);
        } catch (error) {
            logError(`Failed to get gas price: ${error.message}`);
        }

        // Test 4: Account balance check
        logSection("4. Account Balance Check");
        try {
            const accounts = [
                process.env.PRIVATE_KEY_MINTER,
                process.env.PRIVATE_KEY_DEVELOPER,
                process.env.PRIVATE_KEY_BUFFER,
            ];
            
            for (let i = 0; i < accounts.length; i++) {
                if (accounts[i]) {
                    const wallet = new ethers.Wallet(accounts[i], provider);
                    const balance = await provider.getBalance(wallet.address);
                    const balanceInMatic = ethers.formatEther(balance);
                    
                    logInfo(`Account ${i + 1} (${wallet.address}): ${balanceInMatic} MATIC`);
                    
                    if (parseFloat(balanceInMatic) < 0.01) {
                        logWarning(`Account ${i + 1} has low balance: ${balanceInMatic} MATIC`);
                    }
                }
            }
        } catch (error) {
            logError(`Failed to check account balances: ${error.message}`);
        }

        // Test 5: Transaction count check
        logSection("5. Transaction Count Check");
        try {
            if (process.env.PRIVATE_KEY_MINTER) {
                const wallet = new ethers.Wallet(process.env.PRIVATE_KEY_MINTER, provider);
                const nonce = await provider.getTransactionCount(wallet.address);
                logInfo(`Minter account nonce: ${nonce}`);
            }
        } catch (error) {
            logError(`Failed to get transaction count: ${error.message}`);
        }

        // Test 6: Block history check
        logSection("6. Block History Check");
        try {
            const latestBlockNumber = await provider.getBlockNumber();
            const blocksToCheck = 5;
            
            logInfo(`Checking last ${blocksToCheck} blocks...`);
            
            for (let i = 0; i < blocksToCheck; i++) {
                const blockNumber = latestBlockNumber - i;
                const block = await provider.getBlock(blockNumber);
                const blockTime = new Date(block.timestamp * 1000);
                
                logInfo(`Block ${blockNumber}: ${block.transactions.length} txs, ${blockTime.toISOString()}`);
            }
            
            logSuccess("Block history retrieved successfully");
        } catch (error) {
            logError(`Failed to get block history: ${error.message}`);
        }

        // Test 7: Simple transaction simulation
        logSection("7. Transaction Simulation Test");
        try {
            if (process.env.PRIVATE_KEY_MINTER) {
                const wallet = new ethers.Wallet(process.env.PRIVATE_KEY_MINTER, provider);
                
                // Estimate gas for a simple transfer
                const gasEstimate = await provider.estimateGas({
                    to: wallet.address,
                    value: ethers.parseEther("0.001"),
                    from: wallet.address
                });
                
                logSuccess(`Gas estimation works: ${gasEstimate.toString()} gas for simple transfer`);
            }
        } catch (error) {
            logWarning(`Transaction simulation failed: ${error.message}`);
        }

        // Test 8: RPC endpoint response time
        logSection("8. RPC Response Time Test");
        const startTime = Date.now();
        try {
            await provider.getBlockNumber();
            const responseTime = Date.now() - startTime;
            logSuccess(`RPC response time: ${responseTime}ms`);
            
            if (responseTime > 5000) {
                logWarning(`Slow RPC response: ${responseTime}ms`);
            }
        } catch (error) {
            logError(`RPC response time test failed: ${error.message}`);
        }

        // Test 9: Contract interaction test (if contracts exist)
        logSection("9. Contract Interaction Test");
        try {
            // Check if there are any deployed contracts we can test
            const contractAddresses = [
                // Add any known contract addresses here for testing
            ];
            
            if (contractAddresses.length === 0) {
                logInfo("No contract addresses provided for testing");
            } else {
                for (const address of contractAddresses) {
                    const code = await provider.getCode(address);
                    if (code !== "0x") {
                        logSuccess(`Contract at ${address} exists and has code`);
                    } else {
                        logWarning(`No code found at ${address}`);
                    }
                }
            }
        } catch (error) {
            logError(`Contract interaction test failed: ${error.message}`);
        }

        // Test 10: Multiple rapid requests test
        logSection("10. Network Stability Test");
        try {
            const promises = [];
            const requestCount = 5;
            
            for (let i = 0; i < requestCount; i++) {
                promises.push(provider.getBlockNumber());
            }
            
            const results = await Promise.all(promises);
            const allSame = results.every(result => result === results[0]);
            
            if (allSame || Math.max(...results) - Math.min(...results) <= 1) {
                logSuccess(`Network stability test passed (${requestCount} concurrent requests)`);
            } else {
                logWarning(`Network stability test shows inconsistent results`);
            }
        } catch (error) {
            logError(`Network stability test failed: ${error.message}`);
        }

        // Summary
        logSection("Summary");
        logInfo("Chain health check completed!");
        logInfo("If most tests passed, the Polygon Amoy chain is likely working fine.");
        logInfo("If multiple tests failed, there might be an issue with the chain itself.");
        logInfo("Compare these results with the block explorer status to determine the root cause.");
        
    } catch (error) {
        logError(`Unexpected error during health check: ${error.message}`);
    }
}

// Additional utility function to check specific transaction
async function checkTransaction(txHash) {
    if (!txHash) {
        logError("Please provide a transaction hash");
        return;
    }
    
    logSection(`Transaction Check: ${txHash}`);
    
    try {
        const provider = ethers.provider;
        
        // Get transaction details
        const tx = await provider.getTransaction(txHash);
        if (!tx) {
            logError("Transaction not found");
            return;
        }
        
        logSuccess("Transaction found!");
        logInfo(`From: ${tx.from}`);
        logInfo(`To: ${tx.to}`);
        logInfo(`Value: ${ethers.formatEther(tx.value)} MATIC`);
        logInfo(`Gas limit: ${tx.gasLimit.toString()}`);
        logInfo(`Gas price: ${ethers.formatUnits(tx.gasPrice, "gwei")} Gwei`);
        logInfo(`Nonce: ${tx.nonce}`);
        logInfo(`Block number: ${tx.blockNumber || "Pending"}`);
        
        // Get transaction receipt if mined
        if (tx.blockNumber) {
            const receipt = await provider.getTransactionReceipt(txHash);
            logInfo(`Status: ${receipt.status === 1 ? "Success" : "Failed"}`);
            logInfo(`Gas used: ${receipt.gasUsed.toString()}`);
            logInfo(`Block hash: ${receipt.blockHash}`);
        } else {
            logWarning("Transaction is still pending");
        }
        
    } catch (error) {
        logError(`Failed to check transaction: ${error.message}`);
    }
}

// Main execution
async function main() {
    const args = process.argv.slice(2);
    
    if (args.length > 0 && args[0].startsWith("0x")) {
        // If a transaction hash is provided, check that specific transaction
        await checkTransaction(args[0]);
    } else {
        // Otherwise, run the full health check
        await checkChainHealth();
    }
}

// Handle script execution
if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            logError(`Script failed: ${error.message}`);
            process.exit(1);
        });
}

module.exports = { checkChainHealth, checkTransaction };