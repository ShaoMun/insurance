import React, { createContext, useContext, useState } from 'react';
import { ethers } from 'ethers';

const WalletContext = createContext();

export const useWallet = () => useContext(WalletContext);

export const WalletProvider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("MetaMask not found! Please install MetaMask.");
      return;
    }

    try {
      // Initialize the provider using ethers.js v6
      const provider = new ethers.BrowserProvider(window.ethereum);

      // Request accounts directly from window.ethereum
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      setAccount(address);
      setIsConnected(true);
    } catch (error) {
      console.error("Error connecting to MetaMask:", error);
      alert("Failed to connect wallet.");
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setIsConnected(false);
  };

  return (
    <WalletContext.Provider value={{ account, isConnected, connectWallet, disconnectWallet }}>
      {children}
    </WalletContext.Provider>
  );
};
