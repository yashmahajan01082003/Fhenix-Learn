const hre = require("hardhat");

async function main() {
    console.log("Deploying contracts with the account:", (await hre.ethers.getSigners())[0].address);

    // Deploy PrivateCounter
    const PrivateCounter = await hre.ethers.getContractFactory("PrivateCounter");
    const privateCounter = await PrivateCounter.deploy();
    await privateCounter.waitForDeployment();
    const counterAddress = await privateCounter.getAddress();
    console.log("PrivateCounter deployed to:", counterAddress);

    // Deploy PrivateVoting
    const PrivateVoting = await hre.ethers.getContractFactory("PrivateVoting");
    const privateVoting = await PrivateVoting.deploy();
    await privateVoting.waitForDeployment();
    const votingAddress = await privateVoting.getAddress();
    console.log("PrivateVoting deployed to:", votingAddress);

    // Deploy HiddenValue (Module 1 Challenge)
    const HiddenValue = await hre.ethers.getContractFactory("HiddenValue");
    const hiddenValue = await HiddenValue.deploy();
    await hiddenValue.waitForDeployment();
    const hiddenValueAddress = await hiddenValue.getAddress();
    console.log("HiddenValue deployed to:", hiddenValueAddress);

    // Deploy FhenixLearnBadge
    const FhenixLearnBadge = await hre.ethers.getContractFactory("FhenixLearnBadge");
    const badge = await FhenixLearnBadge.deploy();
    await badge.waitForDeployment();
    const badgeAddress = await badge.getAddress();
    console.log("FhenixLearnBadge deployed to:", badgeAddress);

    // Save addresses to a file
    const fs = require("fs");
    const deployments = {
        PrivateCounter: counterAddress,
        PrivateVoting: votingAddress,
        HiddenValue: hiddenValueAddress,
        FhenixLearnBadge: badgeAddress,
        network: hre.network.name,
        timestamp: new Date().toISOString()
    };
    fs.writeFileSync("deployments.json", JSON.stringify(deployments, null, 2));
    console.log("Deployments saved to deployments.json");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
