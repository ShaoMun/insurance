import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers'; // Import ethers.js for blockchain interaction
import { useRouter } from 'next/router'; // Add this import
import Link from 'next/link'; // Add this import for better navigation

export default function Header() {
  const router = useRouter(); // Add this
  const [account, setAccount] = useState(null); // Store connected wallet address
  const [isConnected, setIsConnected] = useState(false); // Flag to check if wallet is connected

  // Check if MetaMask is installed
  const checkMetaMask = () => {
    if (window.ethereum) {
      return true;
    } else {
      alert("MetaMask not found! Please install MetaMask.");
      return false;
    }
  };

  // Connect to MetaMask
  const handleConnectWallet = async () => {
    if (!checkMetaMask()) return;

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []); // Request MetaMask accounts
      const signer = await provider.getSigner();
      const address = await signer.getAddress(); // Get wallet address
      setAccount(address);
      setIsConnected(true);
      console.log("Connected with:", address);
    } catch (error) {
      console.error("Error connecting to MetaMask:", error);
      alert("Failed to connect wallet.");
    }
  };

  // Disconnect MetaMask wallet
  const handleDisconnectWallet = () => {
    setAccount(null);
    setIsConnected(false);
  };

  return (
    <header className="header">
      <div className="logo">
        <Link href="/"><img src="/logo.png" alt="Logo" /></Link>
      </div>
      <nav className="nav">
        <ul className="navList">
          <li className={`navItem ${router.pathname === '/' ? 'active' : ''}`}>
            <Link href="/">Home</Link>
          </li>
          <li className={`navItem ${router.pathname === '/buy-insurance' ? 'active' : ''}`}>
            <Link href="/buy-insurance">Buy Insurance</Link>
          </li>
          <li className={`navItem ${router.pathname === '/claim-insurance' ? 'active' : ''}`}>
            <Link href="/claim-insurance">Claim Insurance</Link>
          </li>
          <li className={`navItem ${router.pathname === '/dashboard' ? 'active' : ''}`}>
            <Link href="/dashboard">Dashboard</Link>
          </li>
        </ul>
      </nav>
      <div className="walletStatus">
        {isConnected ? (
          <button 
            className="connectButton connected" 
            onClick={handleDisconnectWallet}
          >
            {account.slice(0, 6)}...{account.slice(-4)}
          </button>
        ) : (
          <button 
            className="connectButton" 
            onClick={handleConnectWallet}
          >
            Connect Wallet
          </button>
        )}
      </div>
    </header>
  );
}
