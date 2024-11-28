"use client";

import '../styles/Header.css';
import '../styles/globals.css';
import '../styles/LandingPage.css';
import '../styles/dashboard.css';
import '../styles/dao.css';
import '../styles/buy-insurance.css';
import '../styles/claim-insurance.css';
import '../styles/loading.css';

import Header from '../components/Header';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Header />
      <Component {...pageProps} />
    </>
  );
}
