// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@fhenixprotocol/cofhe-contracts/FHE.sol";
import {FunctionId, ITaskManager} from "@fhenixprotocol/cofhe-contracts/ICofhe.sol";
import "@fhenixprotocol/cofhe-mock-contracts/Permissioned.sol";

/**
 * @title PrivateVoting
 * @notice A private voting contract using FHE
 * @dev Demonstrates FHE.select for encrypted branching (NOT if/else on encrypted values)
 */
contract PrivateVoting is MockPermissioned {
    euint32 private yesVotes;
    euint32 private noVotes;
    mapping(address => bool) public hasVoted;
    
    event VoteCast(address indexed voter);
    
    /**
     * @notice Cast an encrypted vote
     * @param encryptedVote Encrypted boolean: true = yes, false = no
     */
    function vote(InEbool calldata encryptedVote) external {
        require(!hasVoted[msg.sender], "Already voted");
        hasVoted[msg.sender] = true;
        
        // Convert input to FHE type
        ebool voteYes = FHE.asEbool(encryptedVote);
        
        // Create encrypted constants
        euint32 one = FHE.asEuint32(1);
        euint32 zero = FHE.asEuint32(0);
        
        // Use FHE.select for encrypted branching (NOT if/else)
        // select(condition, valueIfTrue, valueIfFalse)
        euint32 yesIncrement = FHE.select(voteYes, one, zero);
        euint32 noIncrement = FHE.select(voteYes, zero, one);
        
        // Update vote counts
        yesVotes = FHE.add(yesVotes, yesIncrement);
        noVotes = FHE.add(noVotes, noIncrement);
        
        // ACL: Contract can use these values
        FHE.allowThis(yesVotes);
        FHE.allowThis(noVotes);
        
        emit VoteCast(msg.sender);
    }
    
    // Helper to access Task Manager directly since FHE.sol v0.0.13 lacks sealoutput
    // TASK_MANAGER_ADDRESS is imported from FHE.sol

    struct SealedUint {
        uint256 data;
    }

    function _sealoutput(euint32 value, bytes32 sealingKey) internal returns (uint256) {
        uint256[] memory inputs = new uint256[](1);
        inputs[0] = euint32.unwrap(value);
        
        uint256[] memory extra = new uint256[](1);
        extra[0] = uint256(sealingKey);

        return ITaskManager(TASK_MANAGER_ADDRESS).createTask(
            0, 
            FunctionId.sealoutput,
            inputs,
            extra
        );
    }

    /**
     * @notice Get sealed vote results (owner only for this demo)
     * @param permission The permit-derived permission
     * @return yesSealed Sealed yes vote count
     * @return noSealed Sealed no vote count
     */
    function getResultsSealed(
        Permission memory permission
    ) external withPermission(permission) returns (SealedUint memory yesSealed, SealedUint memory noSealed) {
        uint256 yesRaw = _sealoutput(yesVotes, permission.sealingKey);
        uint256 noRaw = _sealoutput(noVotes, permission.sealingKey);
        
        yesSealed = SealedUint(yesRaw);
        noSealed = SealedUint(noRaw);
    }
}
