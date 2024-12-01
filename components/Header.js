import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { useWallet } from '../context/WalletContext';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const router = useRouter();
  const { account, isConnected, connectWallet, disconnectWallet } = useWallet();

  useEffect(() => {
    const handleRouteChange = () => {
      setIsMenuOpen(false);
      setIsServicesOpen(false);
    };

    router.events.on('routeChangeComplete', handleRouteChange);
    return () => router.events.off('routeChangeComplete', handleRouteChange);
  }, [router]);

  return (
    <header className="header">
      <div 
        className={`menuButton ${isMenuOpen ? 'active' : ''}`}
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        <span></span>
        <span></span>
        <span></span>
      </div>

      <div className="logo">
        <Link href="/">
          <Image 
            src="/logo.png" 
            alt="Logo" 
            width={75} 
            height={75}
            priority
          />
        </Link>
      </div>

      <nav className={`nav ${isMenuOpen ? 'active' : ''}`}>
        <ul className="navList">
          <li className={`navItem ${router.pathname === '/' ? 'active' : ''}`}>
            <Link href="/">Home</Link>
          </li>
          <li 
            className={`navItem dropdown ${
              ['/buy-insurance', '/claim-insurance'].includes(router.pathname) ? 'active' : ''
            } ${isServicesOpen ? 'open' : ''}`}
          >
            <span onClick={() => {
              if (window.innerWidth <= 768) {
                setIsServicesOpen(!isServicesOpen);
              }
            }}>Services</span>
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
