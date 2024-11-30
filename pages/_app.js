"use client";

import '../styles/Header.css';
import '../styles/globals.css';
import '../styles/LandingPage.css';
import '../styles/dashboard.css';
import '../styles/dao.css';
import '../styles/buy-insurance.css';
import '../styles/claim-insurance.css';
import '../styles/loading.css';
import '../styles/stake.css';

import Header from '../components/Header';
import { WalletProvider } from '../context/WalletContext';

export default function App({ Component, pageProps }) {
  return (
    <WalletProvider>
      <Header />
      <Component {...pageProps} />
    </WalletProvider>
  );
}
