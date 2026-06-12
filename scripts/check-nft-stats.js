const hre = require("hardhat");
const { contractAddress } = require("./config");
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

async function checkNFTStats() {
    try {
        logSection("Carbon NFT Contract Statistics");
        
        // Get the contract instance
        const carbon = await hre.ethers.getContractAt("Carbon", contractAddress);
        
        logInfo(`Contract Address: ${contractAddress}`);
        
        // Test 1: Basic contract info
        logSection("1. Basic Contract Information");
        try {
            const name = await carbon.name();
            const symbol = await carbon.symbol();
            const owner = await carbon.owner();
            
            logSuccess(`Contract Name: ${name}`);
            logSuccess(`Contract Symbol: ${symbol}`);
            logSuccess(`Contract Owner: ${owner}`);
        } catch (error) {
            logError(`Failed to get basic contract info: ${error.message}`);
            return;
        }

        // Test 2: Supply information
        logSection("2. Supply Information");
        try {
            const totalSupply = await carbon.totalSupply();
            
            logSuccess(`Total Minted: ${totalSupply.toString()} NFTs`);
            
        } catch (error) {
            logError(`Failed to get supply information: ${error.message}`);
        }

        // Test 3: Token ownership analysis
        logSection("3. Token Ownership Analysis");
        try {
            const totalSupply = await carbon.totalSupply();
            
            if (totalSupply > 0) {
                // Check ownership of first few tokens
                const tokensToCheck = Math.min(10, Number(totalSupply));
                const ownershipMap = new Map();
                
                logInfo(`Checking ownership of first ${tokensToCheck} tokens...`);
                
                for (let tokenId = 0; tokenId < tokensToCheck; tokenId++) {
                    try {
                        const owner = await carbon.ownerOf(tokenId);
                        ownershipMap.set(owner, (ownershipMap.get(owner) || 0) + 1);
                        logInfo(`Token ${tokenId}: owned by ${owner}`);
                    } catch (error) {
                        logWarning(`Token ${tokenId}: ${error.message}`);
                    }
                }
                
                // Summary of ownership
                logInfo("\nOwnership Summary (first 10 tokens):");
                for (const [owner, count] of ownershipMap.entries()) {
                    logInfo(`${owner}: ${count} token(s)`);
                }
            } else {
                logWarning("No tokens have been minted yet");
            }
        } catch (error) {
            logError(`Failed to analyze token ownership: ${error.message}`);
        }

        // Test 4: Check specific addresses
        logSection("4. Balance Check for Known Addresses");
        try {
            const addresses = [
                { name: "Developer", address: "0xC4C59Df77FbF026C0987f49ba0b44BbF1D50408f" },
                { name: "Buffer", address: "0x730681c0254b6C8047A4F73c51E282084e82d447" },
            ];
            
            for (const addr of addresses) {
                try {
                    const balance = await carbon.balanceOf(addr.address);
                    logSuccess(`${addr.name} (${addr.address}): ${balance.toString()} NFTs`);
                } catch (error) {
                    logError(`Failed to get balance for ${addr.name}: ${error.message}`);
                }
            }
        } catch (error) {
            logError(`Failed to check address balances: ${error.message}`);
        }

        // Test 5: Base URI check
        logSection("5. Metadata Configuration");
        try {
            // Try to get token URI for token 0 if it exists
            const totalSupply = await carbon.totalSupply();
            
            if (totalSupply > 0) {
                const tokenURI = await carbon.tokenURI(0);
                logSuccess(`Token 0 URI: ${tokenURI}`);
            } else {
                logInfo("No tokens minted yet, cannot check token URI");
            }
        } catch (error) {
            logWarning(`Could not retrieve token URI: ${error.message}`);
        }

        // Test 6: Recent minting activity (via events)
        logSection("6. Recent Minting Activity");
        try {
            const provider = hre.ethers.provider;
            const latestBlock = await provider.getBlockNumber();
            const fromBlock = Math.max(0, latestBlock - 10000); // Check last ~10k blocks
            
            logInfo(`Checking Transfer events from block ${fromBlock} to ${latestBlock}...`);
            
            // Get Transfer events (minting events have from address as 0x0)
            const filter = carbon.filters.Transfer(ethers.ZeroAddress, null, null);
            const events = await carbon.queryFilter(filter, fromBlock, latestBlock);
            
            if (events.length > 0) {
                logSuccess(`Found ${events.length} minting event(s) in recent blocks:`);
                
                for (const event of events.slice(-5)) { // Show last 5 events
                    const block = await provider.getBlock(event.blockNumber);
                    const timestamp = new Date(block.timestamp * 1000);
                    
                    logInfo(`Block ${event.blockNumber}: Token ${event.args.tokenId} minted to ${event.args.to}`);
                    logInfo(`  Transaction: ${event.transactionHash}`);
                    logInfo(`  Time: ${timestamp.toISOString()}`);
                }
                
                if (events.length > 5) {
                    logInfo(`... and ${events.length - 5} more minting events`);
                }
            } else {
                logWarning("No recent minting events found");
            }
        } catch (error) {
            logError(`Failed to check minting activity: ${error.message}`);
        }

        // Test 7: Contract deployment info
        logSection("7. Contract Deployment Information");
        try {
            const provider = hre.ethers.provider;
            const code = await provider.getCode(contractAddress);
            
            if (code !== "0x") {
                logSuccess("Contract is deployed and has code");
                logInfo(`Code size: ${(code.length - 2) / 2} bytes`);
            } else {
                logError("No contract code found at this address");
            }
        } catch (error) {
            logError(`Failed to check contract deployment: ${error.message}`);
        }

        // Summary
        logSection("Summary");
        try {
            const totalSupply = await carbon.totalSupply();
            
            log(`\n${colors.bold}📊 NFT Production Summary:${colors.reset}`);
            log(`${colors.green}Total NFTs Minted: ${totalSupply.toString()}${colors.reset}`);
            
            if (totalSupply > 0) {
                logSuccess("✨ Your contract has successfully minted NFTs!");
            } else {
                logInfo("No NFTs have been minted yet from this contract");
            }
        } catch (error) {
            logError(`Failed to generate summary: ${error.message}`);
        }
        
    } catch (error) {
        logError(`Unexpected error during NFT stats check: ${error.message}`);
    }
}

// Function to check a specific token
async function checkSpecificToken(tokenId) {
    try {
        logSection(`Token ${tokenId} Details`);
        
        const carbon = await hre.ethers.getContractAt("Carbon", contractAddress);
        
        try {
            const owner = await carbon.ownerOf(tokenId);
            const tokenURI = await carbon.tokenURI(tokenId);
            
            logSuccess(`Token ${tokenId} exists!`);
            logInfo(`Owner: ${owner}`);
            logInfo(`Token URI: ${tokenURI}`);
            
        } catch (error) {
            if (error.message.includes("OwnerQueryForNonexistentToken")) {
                logWarning(`Token ${tokenId} does not exist`);
            } else {
                logError(`Error checking token ${tokenId}: ${error.message}`);
            }
        }
    } catch (error) {
        logError(`Failed to check token ${tokenId}: ${error.message}`);
    }
}

// Function to check balance of a specific address
async function checkAddressBalance(address) {
    try {
        logSection(`Balance Check for ${address}`);
        
        const carbon = await hre.ethers.getContractAt("Carbon", contractAddress);
        
        const balance = await carbon.balanceOf(address);
        logSuccess(`Address ${address} owns ${balance.toString()} NFTs`);
        
        // If they own tokens, show which ones
        if (balance > 0) {
            const totalSupply = await carbon.totalSupply();
            const ownedTokens = [];
            
            // Check ownership of all existing tokens (this might be slow for large supplies)
            const maxToCheck = Math.min(100, Number(totalSupply)); // Limit to first 100 tokens
            
            for (let tokenId = 0; tokenId < maxToCheck; tokenId++) {
                try {
                    const owner = await carbon.ownerOf(tokenId);
                    if (owner.toLowerCase() === address.toLowerCase()) {
                        ownedTokens.push(tokenId);
                    }
                } catch (error) {
                    // Token doesn't exist, skip
                }
            }
            
            if (ownedTokens.length > 0) {
                logInfo(`Owned token IDs: ${ownedTokens.join(", ")}`);
                if (maxToCheck < Number(totalSupply)) {
                    logInfo(`(Only checked first ${maxToCheck} tokens)`);
                }
            }
        }
        
    } catch (error) {
        logError(`Failed to check address balance: ${error.message}`);
    }
}

// Main execution
async function main() {
    const args = process.argv.slice(2);
    
    if (args.length > 0) {
        const arg = args[0];
        
        if (arg.startsWith("0x") && arg.length === 42) {
            // Address provided
            await checkAddressBalance(arg);
        } else if (!isNaN(arg)) {
            // Token ID provided
            await checkSpecificToken(parseInt(arg));
        } else {
            logError("Invalid argument. Provide an address (0x...) or token ID (number)");
        }
    } else {
        // Run full stats check
        await checkNFTStats();
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

module.exports = { checkNFTStats, checkSpecificToken, checkAddressBalance };