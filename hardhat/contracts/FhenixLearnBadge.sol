// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract FhenixLearnBadge is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    // Events to track minting
    event BadgeMinted(address indexed to, uint256 indexed tokenId, string uri);

    constructor() ERC721("Fhenix Learn Badge", "FHB") Ownable(msg.sender) {}

    /**
     * @dev Mints a new badge to the given address with the provided metadata URI.
     * In a fully strict environment, this might be restricted to an authorized backend (onlyOwner),
     * but for the current Fhenix Learn platform design, we allow public minting for completion.
     */
    function mint(string memory uri) public returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, uri);
        
        emit BadgeMinted(msg.sender, tokenId, uri);
        return tokenId;
    }

    /**
     * @dev Allows the owner to mint directly to a specific address if needed
     */
    function adminMint(address to, string memory uri) public onlyOwner returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        
        emit BadgeMinted(to, tokenId, uri);
        return tokenId;
    }
}
