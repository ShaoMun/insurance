// utils/contracts.js

import { ethers } from "ethers";
import { poolABI, daoABI, iPoolABI } from "../constants/abi";

const poolAddress = "0x2A2120004Ba5D941724B4653A0c2A74b30691D32";
const daoAddress = "0x9eCC37c7C971d4ad1816fC2F49FC73d84b3118F9";

/**
 * Connect to the Pool contract
 * @param {ethers.providers.Provider | ethers.Signer} providerOrSigner
 * @returns {ethers.Contract} Pool contract instance
 */
export function getPoolContract(providerOrSigner) {
  return new ethers.Contract(poolAddress, poolABI, providerOrSigner);
}

/**
 * Connect to the DAO contract
 * @param {ethers.providers.Provider | ethers.Signer} providerOrSigner
 * @returns {ethers.Contract} DAO contract instance
 */
export function getDAOContract(providerOrSigner) {
  return new ethers.Contract(daoAddress, daoABI, providerOrSigner);
}

/**
 * Connect to the Pool contract using the IPool interface
 * @param {ethers.providers.Provider | ethers.Signer} providerOrSigner
 * @returns {ethers.Contract} IPool interface contract instance
 */
export function getIPoolContract(providerOrSigner) {
  return new ethers.Contract(poolAddress, iPoolABI, providerOrSigner);
}
