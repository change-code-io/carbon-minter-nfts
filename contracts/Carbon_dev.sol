// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import 'erc721a/contracts/ERC721A.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import "./Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "erc721a/contracts/extensions/ERC721ABurnable.sol";

contract Carbon_dev is Ownable, ERC721ABurnable{

    uint256 public constant MAX_SUPPLY = 1000000;

    string private _baseTokenURI;

    constructor() ERC721A("Change Code -- Carbon", "CC-CO2") Ownable(msg.sender){}

    function mint(address to, uint256 quantity, string calldata baseURI) external payable onlyOwner {

        require(_totalMinted() + quantity <= MAX_SUPPLY, "Max Supply Hit");

        _mint(to, quantity);
        _baseTokenURI = baseURI;
    }

    function setBaseURI(string calldata baseURI) external onlyOwner {
        _baseTokenURI = baseURI;
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

//  Can only be called by contract owner. To implement a burn function that can be called by the token holder, include ERC721ABurnable
    function _burn(uint256 tokenId) internal override(ERC721A) {
        super._burn(tokenId);
    }

// Must be called by token holder.    
///    function transferFrom(address from, address to, uint256 tokenId) public virtual {
///        _transferFrom(from, to, tokenId);
///    }
///}

}