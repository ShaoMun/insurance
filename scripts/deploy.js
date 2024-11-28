const hre = require("hardhat");

async function main() {
  console.log("Deploying contracts to Arbitrum Sepolia...");

  // Deploy Pool Contract
  const Pool = await hre.ethers.getContractFactory("Pool");
  const pool = await Pool.deploy();
  await pool.deployed();
  console.log("Pool contract deployed to:", pool.address);

  // Deploy DAO Contract
  const DAO = await hre.ethers.getContractFactory("DAO");
  const dao = await DAO.deploy(pool.address); // Pass Pool contract address to DAO
  await dao.deployed();
  console.log("DAO contract deployed to:", dao.address);

  // Save deployed contract addresses
  const deployedContracts = {
    poolAddress: pool.address,
    daoAddress: dao.address,
  };

  console.log("Deployment successful:", deployedContracts);
  return deployedContracts;
}

main().catch((error) => {
  console.error("Error during deployment:", error);
  process.exitCode = 1;
});
