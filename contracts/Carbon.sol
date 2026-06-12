// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "erc721a-upgradeable/contracts/ERC721AUpgradeable.sol";
import "erc721a-upgradeable/contracts/IERC721AUpgradeable.sol";
import "erc721a-upgradeable/contracts/extensions/ERC721ABurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./TokenConfig.sol";

/**
 * @title Carbon (Upgradeable)
 * @dev ERC721A-based NFT contract deployed behind a UUPS proxy.
 *      Uses initializer instead of constructor. All storage is namespaced
 *      for safe future upgrades.
 *
 * Upgrade rules:
 *   - Can add new functions
 *   - Can add new state variables (only at the end)
 *   - Cannot change existing function signatures
 *   - Cannot remove, reorder, or change types of existing state variables
 */
contract Carbon is
    Initializable,
    OwnableUpgradeable,
    ERC721ABurnableUpgradeable,
    UUPSUpgradeable
{
    string public constant DISPLAY_INFO = TokenConfig.DISPLAY_INFO;

    string private _baseTokenURI;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Replaces the constructor. Called once by the proxy at deployment.
     * @param initialOwner The address that will own the contract.
     */
    function initialize(address initialOwner) public initializer initializerERC721A {
        __ERC721A_init(TokenConfig.NAME, TokenConfig.SYMBOL);
        __ERC721ABurnable_init();
        __Ownable_init(initialOwner);
        __UUPSUpgradeable_init();

        _baseTokenURI = TokenConfig.URI;
    }

    function mint_plus(
        address to,
        uint256 quantity,
        string memory /* bid */,
        string memory /* ipfs_data */,
        string memory /* linked_transaction */
    ) external payable onlyOwner {
        _mint(to, quantity);
    }

    function setBaseURI(string calldata baseURI) external onlyOwner {
        _baseTokenURI = baseURI;
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    // =============================================================
    //  TRANSFER — restricted to owner only
    // =============================================================

    /**
     * @dev Override of ERC721A.transferFrom. Only the contract owner can transfer.
     *      Token holders and approved operators cannot transfer directly.
     */
    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public payable override(ERC721AUpgradeable, IERC721AUpgradeable) onlyOwner {
        super.transferFrom(from, to, tokenId);
    }

    /**
     * @dev Override of ERC721A.safeTransferFrom. Only the contract owner can transfer.
     */
    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public payable override(ERC721AUpgradeable, IERC721AUpgradeable) onlyOwner {
        super.safeTransferFrom(from, to, tokenId);
    }

    /**
     * @dev Override of ERC721A.safeTransferFrom with data. Only the contract owner can transfer.
     */
    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        bytes memory data
    ) public payable override(ERC721AUpgradeable, IERC721AUpgradeable) onlyOwner {
        super.safeTransferFrom(from, to, tokenId, data);
    }

    // =============================================================
    //  BURN — restricted to owner only
    // =============================================================

    /**
     * @dev Emitted when an arbitrary list of tokens is burned.
     */
    event TokensBurned(uint256[] tokenIDs, string note);

    /**
     * @dev Emitted when a contiguous range of tokens is burned.
     *      More gas-efficient than TokensBurned for large ranges — no array to allocate/emit.
     */
    event TokensBurnedRange(uint256 fromId, uint256 toId, string note);

    /**
     * @dev Override of ERC721ABurnableUpgradeable.burn. Restricted to owner only.
     *      Token holders and approved operators cannot burn directly.
     */
    function burn(uint256 tokenId) public override onlyOwner {
        _burn(tokenId, false);
    }

    /**
     * @dev Owner-only batch burn for an arbitrary list of token IDs.
     *      Pass "" for note if no annotation is needed.
     *      Uses approvalCheck=false since onlyOwner ensures the caller is authorized.
     */
    function burn_list(uint256[] calldata tokenIDs, string calldata note) external onlyOwner {
        for (uint256 i = 0; i < tokenIDs.length; i++) {
            _burn(tokenIDs[i], false);
        }
        emit TokensBurned(tokenIDs, note);
    }

    /**
     * @dev Owner-only batch burn for a contiguous range of token IDs (inclusive).
     *      More calldata-efficient than burn_list for sequential IDs.
     *      Pass "" for note if no annotation is needed.
     */
    function burn_range(uint256 fromId, uint256 toId, string calldata note) external onlyOwner {
        require(fromId <= toId, "fromId must be <= toId");
        for (uint256 id = fromId; id <= toId; id++) {
            _burn(id, false);
        }
        emit TokensBurnedRange(fromId, toId, note);
    }

    // =============================================================
    //  RETIRE — callable by contract owner OR token holder
    // =============================================================

    /**
     * @dev Emitted when an arbitrary list of tokens is retired.
     */
    event TokensRetired(uint256[] tokenIDs, string note);

    /**
     * @dev Emitted when a contiguous range of tokens is retired.
     *      More gas-efficient than TokensRetired for large ranges — no array to allocate/emit.
     */
    event TokensRetiredRange(uint256 fromId, uint256 toId, string note);

    /**
     * @dev Retire an arbitrary list of tokens. Callable by:
     *      - Contract owner (can retire any tokens)
     *      - Token holder (must own all tokens in the list)
     *      Pass "" for note if no annotation is needed.
     */
    function retire_list(uint256[] calldata tokenIDs, string calldata note) external {
        bool isOwner = owner() == _msgSender();
        for (uint256 i = 0; i < tokenIDs.length; i++) {
            _burn(tokenIDs[i], !isOwner);
        }
        emit TokensRetired(tokenIDs, note);
    }

    /**
     * @dev Retire a contiguous range of tokens (inclusive). Callable by:
     *      - Contract owner (can retire any tokens)
     *      - Token holder (must own all tokens in the range)
     *      Pass "" for note if no annotation is needed.
     */
    function retire_range(uint256 fromId, uint256 toId, string calldata note) external {
        require(fromId <= toId, "fromId must be <= toId");
        bool isOwner = owner() == _msgSender();
        for (uint256 id = fromId; id <= toId; id++) {
            _burn(id, !isOwner);
        }
        emit TokensRetiredRange(fromId, toId, note);
    }

    /**
     * @dev Required by UUPSUpgradeable. Only the owner can authorize upgrades.
     */
    function _authorizeUpgrade(address) internal override onlyOwner {}
}