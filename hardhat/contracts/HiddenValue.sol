// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@fhenixprotocol/cofhe-contracts/FHE.sol";

contract HiddenValue {
    // Store an encrypted uint32 value
    euint32 private val;
    
    // Set the encrypted value
    function set(InEuint32 calldata encryptedInput) public {
        // Convert the input wrapper to euint32 and store it
        val = FHE.asEuint32(encryptedInput);
        
        // ACL: Grant contract access for future operations
        FHE.allowThis(val);
        
        // ACL: Grant caller access to decrypt/unseal this value
        FHE.allowSender(val);
    }
    
    // Get the encrypted value (returns a handle, not plaintext!)
    function get() public view returns (euint32) {
        return val;
    }
}
