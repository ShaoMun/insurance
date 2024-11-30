import React from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useWallet } from '../context/WalletContext';

export default function Header() {
  const router = useRouter();
  const { account, isConnected, connectWallet, disconnectWallet } = useWallet();

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
          <li 
            className={`navItem dropdown ${
              ['/buy-insurance', '/claim-insurance'].includes(router.pathname) ? 'active' : ''
            }`}
          >
            <span>Services</span>
            <ul className="dropdown-menu">
              <li>
                <Link href="/buy-insurance">Buy Insurance</Link>
              </li>
              <li>
                <Link href="/claim-insurance">Claim Insurance</Link>
              </li>
            </ul>
          </li>
          <li className={`navItem ${router.pathname === '/dashboard' ? 'active' : ''}`}>
            <Link href="/dashboard">Dashboard</Link>
          </li>
          <li className={`navItem ${router.pathname === '/dao' ? 'active' : ''}`}>
            <Link href="/dao">DAO</Link>
          </li>
          <li className={`navItem ${router.pathname === '/stake' ? 'active' : ''}`}>
            <Link href="/stake">Stake</Link>
          </li>
        </ul>
      </nav>
      <div className="walletStatus">
        {isConnected ? (
          <button 
            className="connectButton connected" 
            onClick={disconnectWallet}
          >
            {account.slice(0, 6)}...{account.slice(-4)}
          </button>
        ) : (
          <button 
            className="connectButton" 
            onClick={connectWallet}
          >
            Connect Wallet
          </button>
        )}
      </div>
    </header>
  );
}
