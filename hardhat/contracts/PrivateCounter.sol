// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@fhenixprotocol/cofhe-contracts/FHE.sol";
import {FunctionId, ITaskManager} from "@fhenixprotocol/cofhe-contracts/ICofhe.sol";
import "@fhenixprotocol/cofhe-mock-contracts/Permissioned.sol";

/**
 * @title PrivateCounter
 * @notice A simple FHE-enabled counter for learning challenges
 * @dev Demonstrates encrypted state, FHE.add, allowThis, allow, and sealed outputs
 */
contract PrivateCounter is MockPermissioned {
    euint32 private counter;
    
    event CounterIncremented(address indexed user);
    
    /**
     * @notice Increment the counter by an encrypted amount
     * @param encryptedAmount The encrypted uint32 to add
     */
    function increment(InEuint32 calldata encryptedAmount) external {
        // Convert input to FHE type
        euint32 amount = FHE.asEuint32(encryptedAmount);
        
        // Perform encrypted addition
        counter = FHE.add(counter, amount);
        
        // ACL: Contract can use this value in future transactions
        FHE.allowThis(counter);
        
        // ACL: Caller can unseal this value off-chain
        FHE.allow(counter, msg.sender);
        
        emit CounterIncremented(msg.sender);
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

        // FunctionId.sealoutput is 3
        return ITaskManager(TASK_MANAGER_ADDRESS).createTask(
            0, // returnType (not used for sealoutput?)
            FunctionId.sealoutput,
            inputs,
            extra
        );
    }

    /**
     * @notice Get the counter value as a sealed output
     * @param permission The permit-derived permission for access control
     * @return Sealed uint32 that can be unsealed client-side
     */
    function getCounterSealed(
        Permission memory permission
    ) external withPermission(permission) returns (SealedUint memory) {
        uint256 sealedVal = _sealoutput(counter, permission.sealingKey);
        return SealedUint(sealedVal);
    }
}
