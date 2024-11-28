module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
  
    console.log("Deploying contracts with deployer:", deployer);
  
    // Deploy Pool Contract
    const pool = await deploy("Pool", {
      from: deployer,
      args: [], // Constructor arguments for Pool (none in this case)
      log: true,
    });
  
    console.log("Pool deployed at:", pool.address);
  
    // Deploy DAO Contract
    const dao = await deploy("DAO", {
      from: deployer,
      args: [pool.address], // Pass Pool contract address to DAO constructor
      log: true,
    });
  
    console.log("DAO deployed at:", dao.address);
  };
  