// utils/contracts.js

import { ethers } from "ethers";
import { poolABI, daoABI } from "../constants/abi";

const poolAddress = "0xf60cD21e3235930511F43450B2E8AA1542fc2117";
const daoAddress = "0x7c50CE48569f40158Ab19287B28297693CA2b9Df";

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

