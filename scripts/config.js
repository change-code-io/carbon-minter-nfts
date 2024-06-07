module.exports = {

// Accounts
carbon_minter: "0x3F58C00a19F58Bb60DeA9D6Ec87Fe954E31e19C1",
ecobalance: "0x0c973c16E7f4dAE55DEbBB774C4Dd9d3099E539D",

// Base URI for the token (testing)
baseURI: "https://changecode.io",

// # of tokens to be minted (testing)
// mint_quantity: 1,

// Chain address of the contract
contractAddress: "0x0986EE864CCb62d201337Df391Acd2ed1a1ca8d7",

// ID of token to be transfer
// transfer_targetID: 2,

// IDs of tokens ot be burned
burn_tokenIDs: Array.from({ length: 43 }, (_, i) => i + 64),
};