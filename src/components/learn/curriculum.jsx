export const CURRICULUM = [
  {
    id: 'module-1',
    slug: 'foundations-encrypted-computation',
    title: 'Module 1: Foundations of Encrypted Computation',
    description: 'Establish the conceptual base. Understand why Ethereum’s transparency creates privacy limitations, how PETs solve them, and what FHE uniquely unlocks.',
    estimatedHours: 3,
    lessons: [
      {
        id: 'm1-l1',
        title: 'The Transparency Problem on Ethereum',
        type: 'reading',
        content: `
# 1. The Transparency Problem on Ethereum

Ethereum was designed for *verifiable* computation, not *private* computation.
This means every step of a smart contract’s execution is visible to everyone observing the chain—including users, operators, competitors, adversaries, or bots.

Understanding the transparency problem is core to understanding why FHE matters.

## 1.1 Storage Is Public

All state variables—public, internal, private—are readable via \`eth_getStorageAt\`.

This reveals:
* account balances
* strategy parameters
* vault positions
* auction bids
* game state
* internal state machines
* anything stored in contract storage

“Private” variables in Solidity only restrict access from other contracts, not from observers.

## 1.2 Events Are Public

Every emitted event becomes part of the permanent log history:
* parameters
* indexed fields
* metadata
* transaction context

Events are globally visible and indexed by block explorers. Even if an event carries an encrypted value, its existence, ordering, and correlation leak information.

## 1.3 Branching Reveals Logic Paths

EVM branching (if/else, require) leaks information because:
* different branches use different gas
* different branches write different storage
* reverts vs success reveal condition results
* even silent conditions leave side effects

An attacker can infer:
* whether a condition was true
* whether a user’s balance exceeded a value
* whether a check failed
* whether a threshold was crossed

This makes *conditional privacy* impossible under normal Solidity semantics.

## 1.4 Gas Usage and Timing Leak Secrets

Gas differences reveal which code path executed:
* expensive vs cheap operations
* loops with different iterations
* storage writes vs no writes
* internal calls

Timing leaks occur through:
* mempool visibility
* block inclusion delays
* the time between successive dependent calls

These leak high-level information about user behavior even when values themselves are absent.

## 1.5 Transactions Reveal Intent

Plaintext calldata exposes:
* amounts
* targets
* routing parameters
* internal logic
* user strategies

This is what makes MEV extraction possible.

### Summary

Ethereum’s openness guarantees censorship resistance and verifiability, but it fundamentally prevents:
* private inputs
* private logic
* private state
* private outputs

To fix this, the ecosystem developed different classes of PETs.
        `
      },
      {
        id: 'm1-l2',
        title: 'Overview of PETs (Privacy Enhancing Technologies)',
        type: 'reading',
        content: `
# 2. Overview of PETs

Before introducing FHE, developers must understand the broader PET landscape—especially how ZK, MPC, TEEs, and FHE differ in their trust assumptions, capabilities, and trade-offs.

## 2.1 Zero-Knowledge Proofs (ZK)

ZK proves a statement is true without revealing how or why.

**Capabilities:**
* prove constraints were satisfied
* hide intermediate steps
* verify off-chain computation cheaply
* build private transaction systems (Zcash, Aztec)

**Limitations:**
* results are usually plaintext once settled
* circuits restrict general logic
* proving is computationally heavy
* generalized private state is complex

ZK hides proof of computation, not the values being manipulated during execution.

## 2.2 Multi-Party Computation (MPC)

MPC splits a secret across participants who jointly compute a function without revealing their shares.

**Capabilities:**
* shared-key decryption
* private collaborative computation
* threshold signing

**Limitations:**
* coordination overhead
* requires online participants
* complex to scale
* stateful MPC is difficult

MPC is excellent for distributed trust, but not ideal for general-purpose smart contract state.

## 2.3 Trusted Execution Environments (TEEs)

TEEs rely on secure hardware enclaves (e.g., SGX) to perform computation privately.

**Capabilities:**
* fast private compute
* low overhead
* good for certain enterprise environments

**Limitations:**
* centralization
* side-channel attacks
* opaque trust dependencies
* poor decentralization properties

Good for regulated environments; not ideal for trust-minimized blockchains.

## 2.4 Fully Homomorphic Encryption (FHE)

FHE allows computation directly on encrypted data without decrypting it.

**Capabilities:**
* compute on encrypted inputs
* maintain encrypted state
* preserve privacy end-to-end
* fully general logic (add, multiply, compare, bitwise, etc.)
* only decrypt when explicitly authorized

**Limitations:**
* native FHE is too slow and expensive to run on-chain
* ciphertexts are large
* operations require specialized compute

This is where CoFHE enters.

### Summary

Each PET solves a different slice of the privacy problem.
Only FHE supports general-purpose encrypted compute without revealing intermediate or final values.
        `
      },
      {
        id: 'm1-l3',
        title: 'Introduction to Fully Homomorphic Encryption',
        type: 'reading',
        content: `
# 3. Introduction to Fully Homomorphic Encryption

Fully Homomorphic Encryption (FHE) is a cryptographic primitive that allows arbitrary computation on encrypted data.
This is the conceptual core that powers encrypted smart contracts.

## 3.1 What FHE Actually Does

**Traditional encryption:**
\`Encrypt → [decrypt] → compute → [encrypt]\`

**FHE:**
\`Encrypt → compute on ciphertext → decrypt result at the end\`

This means:
* you never expose plaintext during execution
* computation is indistinguishable to observers
* encrypted results can be used as new inputs
* only authorized parties can decrypt

## 3.2 How FHE Works in CoFHE

Native FHE is too heavy to run on-chain, so Fhenix implements a hybrid architecture:
* encrypted inputs come from users
* smart contracts operate on **ciphertext handles** using \`euintX\`, \`FHE.add\`, \`FHE.mul\`, etc.
* contracts emit **operation descriptions**
* CoFHE’s off-chain FHEOS performs the actual homomorphic computation
* results are posted back as new handles
* users decrypt via threshold MPC when needed

This gives Solidity developers:
* encrypted state variables
* encrypted math
* encrypted comparisons
* encrypted conditional logic via \`FHE.select()\`
* async decryption
* user-controlled access control

FHE becomes a library-level abstraction built into the Solidity type system (\`euint8\`, \`euint16\`, \`euint32\`, etc.).

## 3.3 Why FHE Enables Private On-Chain Logic

Because every transformation is performed on ciphertexts:
* no node or validator sees plaintext
* storage only contains ciphertext handles
* events only refer to encrypted handles
* branching is replaced with oblivious selection
* outputs remain encrypted until deliberately unsealed

This is the only model that allows both:
1. **Private state**
2. **Private logic**
3. **Private output**
4. **Full composability with the EVM**

No other PET achieves all four simultaneously.
        `
      },
      {
        id: 'm1-l4',
        title: 'FHE Use Cases on Ethereum',
        type: 'reading',
        content: `
# 4. FHE Use Cases on Ethereum

This section covers the real problems FHE solves and why developers use it instead of ZK or MPC for certain applications.
The unifying theme: **FHE enables shared private state and private logic inside EVM-compatible smart contracts.**

## 4.1 Confidential DeFi

FHE enables DeFi systems where:
* users submit encrypted balances
* strategies run on encrypted data
* no frontrunning is possible
* order flow becomes private
* vault logic can operate privately
* LP positions remain secret

## 4.2 Private Auctions and Bidding

FHE supports full sealed-bid protocols without commit–reveal:
* bids are encrypted
* comparisons happen on ciphertexts
* winner and winning bid remain encrypted until authorized
* no leakage during bidding or evaluation
* no need for two-phase commit

## 4.3 Encrypted Games

Games require hidden state. FHE supports:
* hidden moves
* partial information games
* deterministic encrypted randomness
* encrypted scoring
* turn-based or real-time logic

## 4.4 Private Voting

With FHE:
* votes are encrypted
* the tallying algorithm runs on encrypted values
* no intermediate results leak
* individual votes never exposed
* final result can be decrypted collectively

## 4.5 Encrypted Analytics

Applications can maintain encrypted global aggregates:
* average scores
* risk metrics
* leaderboards
* KPIs
* financial ratios

All updated without ever revealing individual contributions.

## 4.6 Privacy-Preserving Identity and Reputation

You can compute logic over encrypted identity attributes:
* prove age comparisons
* compute trust scores
* evaluate risk
* check thresholds
* aggregate behavior
* maintain encrypted reputation

All without revealing underlying traits.

## 4.7 Enterprise Confidential Computation

FHE supports:
* encrypted supply chain data
* encrypted pricing models
* cross-organizational computation without data sharing
* privacy-preserving compliance logic

Because the data never becomes plaintext, even when processed by contracts.
        `
      },
      {
        id: 'm1-quiz',
        title: 'Module 1 Quiz',
        type: 'quiz',
        content: 'Quiz Content Placeholder'
      },
      {
        id: 'm1-final',
        title: 'Challenge: Encrypted Hello World',
        type: 'sandbox',
        content: `
# Challenge: Encrypted Hello World

In this challenge, you will verify that data is truly encrypted.

**Goal:**
1. Deploy a simple contract that stores an \`euint32\`.
2. Try to read the storage slot directly (simulated).
3. Use the FHE library to prove it is encrypted.

\`\`\`solidity
contract HiddenValue {
    euint32 private val;
    function set(inEuint32 memory v) public {
        val = FHE.asEuint32(v);
    }
}
\`\`\`
        `
      }
    ]
  },
  {
    id: 'module-2',
    slug: 'types-and-handles',
    title: 'Types, Handles, and Your First Encrypted Contract',
    description: 'Dive into FHE types (euintX), handles, and write your first encrypted smart contract.',
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
        type: 'reading',
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
      },
      {
        id: 'm2-final',
        title: 'Challenge: Implement Decrement',
        type: 'sandbox',
        content: `
# Challenge: Implement Decrement

**Goal:**
Modify the EncryptedCounter to support subtraction.

\`\`\`solidity
function sub(inEuint32 memory encryptedValue) public {
    euint32 value = FHE.asEuint32(encryptedValue);
    // Hint: use FHE.sub(counter, value)
    counter = FHE.sub(counter, value);
}
\`\`\`
        `
      }
    ]
  },
  {
    id: 'module-3',
    slug: 'cofhe-architecture',
    title: 'CoFHE Architecture and Data Flow',
    description: 'Deep dive into the architecture: On-chain components, Off-chain FHEOS, and the lifecycle of an encrypted transaction.',
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
      },
      {
        id: 'm3-final',
        title: 'Challenge: Trace the Transaction',
        type: 'sandbox',
        content: `
# Challenge: Trace the Transaction

**Goal:**
Visualize the flow of an FHE transaction.

1. Client generates keypair.
2. Client encrypts input x=10.
3. Smart contract receives x, adds 5.
4. Result y=15 stored as handle.

(Interactive trace visualization would appear here)
        `
      }
    ]
  },
  {
    id: 'module-4',
    slug: 'mental-models',
    title: 'Mental Models: Working With Encrypted Data',
    description: 'Master the mindset shift required for FHE: Oblivious execution, handling async decryption, and avoiding leaks.',
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
      },
      {
        id: 'm4-final',
        title: 'Challenge: Implement Blind Auction',
        type: 'sandbox',
        content: `
# Challenge: Implement Blind Auction

**Goal:**
Use \`FHE.select\` to update the highest bid without revealing if the new bid was higher.

\`\`\`solidity
function bid(inEuint32 memory encryptedBid) public {
    euint32 bid = FHE.asEuint32(encryptedBid);
    ebool isHighest = FHE.gt(bid, highestBid);
    
    // Update highest bid only if new bid is greater
    highestBid = FHE.select(isHighest, bid, highestBid);
}
\`\`\`
        `
      }
    ]
  },
  {
    id: 'module-5',
    slug: 'access-control',
    title: 'Access Control and Encrypted State',
    description: 'Managing permissions for encrypted data. Who can see what?',
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
      },
      {
        id: 'm5-final',
        title: 'Challenge: Permissioned Viewer',
        type: 'sandbox',
        content: `
# Challenge: Permissioned Viewer

**Goal:**
Create a function that only allows the owner to view the balance.

\`\`\`solidity
function viewBalance(Permission memory permission) public view returns (string memory) {
   // Validate permission...
   // If valid:
   return FHE.seal(balance, permission.publicKey);
}
\`\`\`
        `
      }
    ]
  },
  {
    id: 'module-6',
    slug: 'putting-it-together',
    title: 'Putting It All Together',
    description: 'Capstone module. Final checklists and building a complete DApp.',
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
      },
      {
        id: 'm6-final',
        title: 'Capstone Challenge: The Hidden Voting Booth',
        type: 'sandbox',
        content: `
# Capstone Challenge: The Hidden Voting Booth

**Goal:**
Build a voting contract where:
1. Votes are encrypted (0 or 1).
2. Tally is encrypted.
3. Result is decrypted only after voting ends.

Ready to build?
        `
      }
    ]
  }
];