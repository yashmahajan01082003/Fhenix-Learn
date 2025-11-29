export const CURRICULUM = [
  {
    id: 'module-1',
    slug: 'why-privacy-matters',
    title: 'Why Privacy Matters and What FHE Is',
    description: 'Understand the foundation: what Fully Homomorphic Encryption (FHE) is, why it matters on Ethereum, and how CoFHE makes it usable.',
    difficulty: 'Beginner',
    estimatedHours: 3,
    lessons: [
      {
        id: 'm1-l1',
        title: 'What Leaks Information in Traditional Contracts',
        type: 'reading',
        content: `
# What Leaks Information in Traditional Contracts

1. **Storage is readable**
   - All state variables are accessible via \`eth_getStorageAt\`.
   - \`private\` in Solidity is only a compiler-level restriction, not a chain-level restriction.
   - Anyone can read your contract’s storage slots.

2. **Events are broadcast**
   - Every \`emit\` is permanently visible in transaction logs.
   - Events reveal user actions, amounts, and outcomes.
   - Block explorers index and display all events.

3. **Branching leaks via execution paths**
   - \`if/else\` statements reveal which condition was true.
   - Different code paths produce different gas consumption.
   - State changes indicate which branch executed.
   - Even failed transactions reveal attempted actions.

4. **Gas usage patterns**
   - Different operations cost different amounts of gas.
   - Complex vs simple paths have measurable differences.
   - Observers can infer what happened based on gas consumed.

5. **Timing**
   - When transactions occur reveals strategic information.
   - Transaction ordering in blocks is visible.
   - Mempool visibility exposes pending transactions.

6. **Transaction ordering**
   - The sequence of transactions reveals MEV opportunities.
   - Sandwich attacks exploit visible pending transactions.

### Real-World Impact: DEX Example

Consider a simple swap function:

\`\`\`solidity
function swap(uint256 amountIn) external {
    // ...
}
\`\`\`

**Attackers can exploit this via:**
- Front-running
- Sandwich attacks
- MEV extraction
- Strategy exposure
- Privacy loss
- Price manipulation
        `
      },
      {
        id: 'm1-l2',
        title: 'Why Existing Solutions Aren’t Enough',
        type: 'reading',
        content: `
# Why Existing Solutions Aren’t Enough

**Private Mempools (Flashbots, MEV-Blocker)**
These provide some protection against front-running by bypassing the public mempool, but they rely on trust assumptions with builders and do not encrypt state once the transaction is included in a block.

**Commit–Reveal Schemes**
Users commit a hash, then reveal the value later. This prevents front-running during the commit phase but requires a second transaction (bad UX) and eventually reveals the value in plaintext on-chain.

**Off-Chain Computation (zkRollups, Optimistic Rollups)**
Rollups scale execution but typically handle data in plaintext at the sequencer level (or rely on ZK for correctness, not privacy of the state itself). They do not inherently offer computation on encrypted data.

**Critical Gap**
None of these allow **persistent computation on encrypted values with full composability**. You strictly need FHE for that.
        `
      },
      {
        id: 'm1-l3',
        title: 'The FHE Value Proposition',
        type: 'reading',
        content: `
# The FHE Value Proposition

**What FHE Enables**
- **Compute on Encrypted Data:** Perform additions, multiplications, and logic on ciphertexts without ever decrypting them.
- **Encrypted Lifecycle:** Data remains encrypted from the user's wallet, through the smart contract logic, and back to storage.
- **Composability:** Contracts can operate on encrypted data from other contracts (permissions permitting).

**Contrast**
- **Traditional Computation:** Plaintext → [Compute] → Plaintext
- **FHE-based:** Encrypted → [Compute on encrypted] → Encrypted → [Decrypt only if needed]

## What Is FHE?
1. Encrypt input (Client-side).
2. Compute on ciphertext (Validators/Coprocessor).
3. Decrypt result (Only if authorized).
4. Validators **never** see plaintext.

\`\`\`visualizer
// This block renders the EncryptedOperationVisualizer
\`\`\`
        `
      },
      {
        id: 'm1-l4',
        title: 'FHE vs Other PETs & Ecosystem',
        type: 'reading',
        content: `
# FHE vs Other PETs (Privacy Enhancing Technologies)

| Technology | Primary capability | Short Version |
|------------|-------------------|---------------|
| **ZK (Zero Knowledge)** | Proving correctness | Proves something is true without revealing it. |
| **MPC (Multi-Party Computation)** | Distributed computation | Shares secrets across parties to compute jointly. |
| **FHE (Fully Homomorphic Encryption)** | Blind computation | Allows Ethereum to compute without knowing the data. |
| **TEE (Trusted Execution Environment)** | Hardware isolation | Relies on secure hardware (Intel SGX) rather than math. |

# FHE Ecosystem on Ethereum
- **Fhenix:** L2 Coprocessor for FHE on Ethereum.
- **Zama:** Provides the fhEVM cryptographic library.
- **Sunscreen:** Compiler toolchain.
- **Inco:** FHE Layer 1.
- **Encifher:** Tooling and wallets.
        `
      },
      {
        id: 'm1-quiz',
        title: 'Module 1 Quiz',
        type: 'quiz',
        content: 'Quiz Content Placeholder'
      }
    ]
  },
  {
    id: 'module-2',
    slug: 'types-and-handles',
    title: 'Types, Handles, and Your First Encrypted Contract',
    description: 'Dive into FHE types (euintX), handles, and write your first encrypted smart contract.',
    difficulty: 'Intermediate',
    estimatedHours: 4,
    lessons: [
      {
        id: 'm2-l1',
        title: 'FHE Types: euintX and ebool',
        type: 'reading',
        content: `
# FHE Types

FHE introduces new encrypted data types to Solidity via the FHE library.

- **euint8, euint16, euint32, euint64, euint128, euint256**: Encrypted unsigned integers.
- **ebool**: Encrypted boolean.

**Constraints:**
- You cannot directly read the value of an \`euint\`.
- You cannot use standard operators (\`+\`, \`-\`, \`*\`) directly. You must use \`FHE.add(a, b)\`, etc.

### Two Type Systems: Compute vs Input
1. **euintX (Compute):** These are "handles" to encrypted data stored on-chain. Used in contract logic.
2. **inEuintX (Input):** These are payloads coming from a user transaction. They contain the ciphertext + ZK proof of validity.
   - **Mandatory Conversion:** You MUST convert \`inEuintX\` to \`euintX\` using \`FHE.asEuintX(input)\` before using it.
   - **Never Store InEuint:** Never store the input type directly in state.

### Special Note on ebool
An \`ebool\` is essentially an \`euint8\` restricted to 0 or 1. It is critical for control flow replacement (using \`FHE.select\`).
        `
      },
      {
        id: 'm2-l2',
        title: 'Ciphertext Handles and Symbolic Execution',
        type: 'reading',
        content: `
# Ciphertext Handles

When you see an \`euint256\` in Solidity on Fhenix, you are actually holding a **Handle** (a \`uint256\` ID).

- The actual encrypted data (ciphertext) is huge and stored in the Data Availability (DA) layer or Ciphertext Registry.
- The EVM only passes around this pointer (Handle).
- When you call \`FHE.add(a, b)\`, the coprocessor looks up the ciphertexts for handles \`a\` and \`b\`, computes the addition, stores the new ciphertext, and returns a new handle.

**Symbolic Execution:**
Because the EVM doesn't see the value, it executes "symbolically" regarding the data. It knows "Handle C = Handle A + Handle B" but doesn't know the numbers.
        `
      },
      {
        id: 'm2-l3',
        title: 'Your First Encrypted Contract',
        type: 'sandbox',
        content: `
# Your First Encrypted Contract

Here is a minimal example of a counter that can be incremented privately.

\`\`\`solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@fhenixprotocol/contracts/FHE.sol";

contract EncryptedCounter {
    euint32 private counter;

    constructor() {
        // Initialize with encrypted zero
        counter = FHE.asEuint32(0);
    }

    function add(inEuint32 memory encryptedValue) public {
        // 1. Convert input to handle
        euint32 value = FHE.asEuint32(encryptedValue);
        
        // 2. Perform encrypted addition
        counter = FHE.add(counter, value);
    }
    
    // Note: We cannot simply "return" the counter because it is encrypted!
    // We would need a re-encryption/view function to see it.
}
\`\`\`

### Compare: Traditional vs Encrypted
See the difference in syntax side-by-side:

\`\`\`compare
// This block renders the CodeCompare component
\`\`\`

### Frontend Encryption with cofhejs
Encryption happens **client-side** so the network never sees plaintext.
\`cofhejs\` is the library used to:
1. Create an FHE instance.
2. Encrypt parameters (\`instance.encrypt8(5)\`).
3. Send the resulting ciphertext struct to the contract.
        `
      },
      {
        id: 'm2-quiz',
        title: 'Module 2 Quiz',
        type: 'quiz',
        content: 'Quiz Content Placeholder'
      }
    ]
  },
  {
    id: 'module-3',
    slug: 'cofhe-architecture',
    title: 'CoFHE Architecture and Data Flow',
    description: 'Deep dive into the architecture: On-chain components, Off-chain FHEOS, and the lifecycle of an encrypted transaction.',
    difficulty: 'Intermediate',
    estimatedHours: 3,
    lessons: [
      {
        id: 'm3-l1',
        title: 'CoFHE Architecture Overview',
        type: 'reading',
        content: `
# CoFHE Architecture

**On-Chain Components:**
- **FHE.sol:** The library interface developers use.
- **Event Bus:** Mechanism to signal the coprocessor to perform work.

**Off-Chain Components:**
- **Task Manager:** Picks up events from the chain.
- **FHEOS Server:** The engine performing the math on encrypted data.
- **Ciphertext Registry & DA Layer:** Stores the large encrypted blobs.
- **Threshold Network:** Manages the global decryption key. No single node holds the full key.
        `
      },
      {
        id: 'm3-l2',
        title: 'Core Data Flows',
        type: 'reading',
        content: `
# Core Data Flows

1. **Encryption Request Flow**
   - User encrypts locally -> Sends Transaction with \`inEuint\` -> Validator verifies ZK proof -> Contract converts to Handle.

2. **FHE Operation Flow**
   - Contract calls \`FHE.add(a, b)\` -> Emits event -> Coprocessor catches event -> Computes result -> Stores result in registry -> Returns new Handle to contract execution.

3. **Decryption Request Flow**
   - Contract calls \`FHE.decrypt(ciphertext)\` (usually restricted!) -> Coprocessor requests threshold signature -> Nodes sign partial keys -> Keys aggregated -> Plaintext revealed to contract.
   
4. **Seal/Unseal Flow**
   - Used for viewing data. User signs a permit -> Contract re-encrypts data with user's public key -> User decrypts locally.
        `
      }
    ]
  },
  {
    id: 'module-4',
    slug: 'mental-models',
    title: 'Mental Models: Working With Encrypted Data',
    description: 'Master the mindset shift required for FHE: Oblivious execution, handling async decryption, and avoiding leaks.',
    difficulty: 'Advanced',
    estimatedHours: 6,
    lessons: [
      {
        id: 'm4-l1',
        title: 'The "No If-Else" Reality',
        type: 'reading',
        content: `
# The "No If-Else" Reality

In FHE, you cannot branch on encrypted data.
Why? Because the validator executing the code **doesn't know** if the condition is true or false.

**WRONG:**
\`\`\`solidity
// This fails because 'amount > balance' is an encrypted boolean (ebool)
// Solidity requires a plaintext bool for 'if'
if (amount > balance) {
    revert("Insufficient funds");
}
\`\`\`

**RIGHT (Oblivious Execution):**
You must execute **both** paths and select the result mathematically.

\`\`\`solidity
ebool isAffordable = FHE.lte(amount, balance);
// If affordable, newBalance = balance - amount
// If not, newBalance = balance (unchanged)
euint32 newBalance = FHE.select(isAffordable, FHE.sub(balance, amount), balance);
\`\`\`
        `
      },
      {
        id: 'm4-l2',
        title: 'Avoiding Information Leaks',
        type: 'reading',
        content: `
# Avoiding Information Leaks

**Leak Vectors:**
1. **Bad Events:** Emitting \`FHE.decrypt(val)\` creates a permanent public log of the value.
2. **Execution Paths:** If you decrypt a boolean and then use it in a standard \`if\` statement, you leak which branch was taken.
3. **Reverts:** Reverting based on a decrypted check reveals the check failed.

**Safe Evaluation Patterns:**
- **Select-based fail states:** Instead of reverting, perform a "no-op" state update if the condition fails (like the balance example above).
- **Min/Max Clamping:** Use \`FHE.min\` and \`FHE.max\` to keep values within bounds without branching.
        `
      },
      {
        id: 'm4-l3',
        title: 'Async Decryption Model',
        type: 'reading',
        content: `
# Async Decryption Model

Decryption to plaintext is asynchronous because it requires coordination from the threshold network.

**Step 1: Request Decryption**
\`\`\`solidity
uint256 requestId = FHE.reqDecrypt(encryptedValue, callbackCallback);
\`\`\`

**Step 2: Callback**
The coprocessor waits for the threshold network to decrypt, then calls your callback function with the plaintext value.

**Security:**
Only the callback function receives the plaintext. This allows you to trigger logic based on hidden values (e.g., "Did the bid win?").
        `
      }
    ]
  },
  {
    id: 'module-5',
    slug: 'access-control',
    title: 'Access Control and Encrypted State',
    description: 'Managing permissions for encrypted data. Who can see what?',
    difficulty: 'Advanced',
    estimatedHours: 4,
    lessons: [
      {
        id: 'm5-l1',
        title: 'CoFHE Access Model',
        type: 'reading',
        content: `
# CoFHE Access Model

Since data is on-chain, "Access Control" essentially means "Who has the right to Re-Encrypt this data for their own key?"

**Key Functions:**
- \`FHE.seal(handle, publicKey)\`: Re-encrypts a value for a specific user's public key.
- \`FHE.allow(handle, address)\`: (Conceptually) marks a handle as accessible by an address for viewing.

**Viewing Encrypted State:**
To view your encrypted balance:
1. Generate a cryptographic **Permit** (signature) on the frontend.
2. Call a view function on the contract with this permit.
3. Contract validates permit.
4. Contract calls \`FHE.seal(balance, userPublicKey)\`.
5. Returns the "Sealed" ciphertext.
6. Frontend decrypts it.
        `
      }
    ]
  },
  {
    id: 'module-6',
    slug: 'putting-it-together',
    title: 'Putting It All Together',
    description: 'Capstone module. Final checklists and building a complete DApp.',
    difficulty: 'Advanced',
    estimatedHours: 2,
    lessons: [
      {
        id: 'm6-l1',
        title: 'FHE-Safe Design Checklist',
        type: 'reading',
        content: `
# FHE-Safe Design Checklist

- [ ] **No Branching on Secret Data:** Used \`FHE.select\` instead of \`if/else\`.
- [ ] **No Reverts on Secret Data:** Logic handles failure cases by preserving state mathematically.
- [ ] **Input Validation:** Used \`FHE.asEuintX\` for all inputs.
- [ ] **No Leaking Events:** Did not emit decrypted values unless strictly intended.
- [ ] **Access Control:** View functions use Permits to verify identity before returning Sealed data.
- [ ] **Type Safety:** Input types (\`inEuint\`) are never stored in state.
        `
      }
    ]
  }
];