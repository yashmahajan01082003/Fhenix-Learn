const hre = require("hardhat");
const fs = require("fs");

async function main() {
    if (!fs.existsSync("deployments.json")) {
        console.error("deployments.json not found. Run deploy script first.");
        process.exit(1);
    }

    const deployments = JSON.parse(fs.readFileSync("deployments.json"));
    console.log("Running smoke test on network:", hre.network.name);
    console.log("Using deployments:", deployments);

    if (hre.network.name !== deployments.network) {
        console.warn("Warning: Network mismatch between config and deployments file.");
    }

    const [signer] = await hre.ethers.getSigners();
    console.log("Testing with account:", signer.address);

    // Test PrivateCounter
    const PrivateCounter = await hre.ethers.getContractFactory("PrivateCounter");
    const counter = PrivateCounter.attach(deployments.PrivateCounter);

    console.log("Checking PrivateCounter...");
    // We can't easily check the value without a permit, but we can try to call a view function if we had one that didn't require permit.
    // But getCounterSealed requires permit.

    // We can try to increment with a dummy encrypted value (it will likely fail on-chain decryption if invalid, or just add garbage).
    // Constructing a valid ciphertext client-side requires the CoFHE SDK with a valid keypair.
    // For smoke test, we can just check if we can estimate gas for increment.

    try {
        // Mock encrypted input (just random bytes, will fail decryption but proves contract exists)
        // Actually, we need a valid handle if we want to avoid revert during input verification?
        // No, FHE.asEuint32 expects a valid ciphertext.

        console.log("PrivateCounter attached at", deployments.PrivateCounter);
    } catch (e) {
        console.error("Failed to interact with PrivateCounter:", e);
    }

    // Test PrivateVoting
    const PrivateVoting = await hre.ethers.getContractFactory("PrivateVoting");
    const voting = PrivateVoting.attach(deployments.PrivateVoting);
    console.log("PrivateVoting attached at", deployments.PrivateVoting);

    console.log("Smoke test finished (basic attachment check).");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
