import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { getPoolContract } from "../utils/contracts";

const insurancePlans = [
  {
    id: 1,
    name: "Basic Shield",
    badge: "POPULAR",
    coverage: "Essential Health & Accident",
    monthlyPremium: 0.01,
    yearlyDiscount: "10",
    maxCoverage: "5 ETH",
    features: [
      "24/7 Emergency Support",
      "Basic Health Coverage",
      "Accident Protection",
      "30-day Money Back Guarantee",
    ],
    color: "blue",
  },
  {
    id: 2,
    name: "Premium Guard",
    badge: "RECOMMENDED",
    coverage: "Comprehensive Protection",
    monthlyPremium: 0.02,
    yearlyDiscount: "15",
    maxCoverage: "10 ETH",
    features: [
      "24/7 Priority Support with Personal Agent",
      "Full Health Coverage + Specialists",
      "Enhanced Accident Protection",
      "Global Emergency Coverage",
      "Preventive Care Included",
    ],
    color: "purple",
  },
  {
    id: 3,
    name: "Ultimate Protection",
    badge: "ELITE",
    coverage: "All-Inclusive Coverage",
    monthlyPremium: 0.03,
    yearlyDiscount: "20",
    maxCoverage: "20 ETH",
    features: [
      "24/7 VIP Concierge Support",
      "Comprehensive Global Coverage",
      "Premium Dental & Vision",
      "Advanced Preventive Care",
      "Family Coverage Options",
      "Mental Health Support",
    ],
    color: "emerald",
  },
];

export default function BuyInsurance() {
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [account, setAccount] = useState("");
  const [paymentType, setPaymentType] = useState("monthly");
  const [balance, setBalance] = useState(null);
  const [coverage, setCoverage] = useState(null);

  useEffect(() => {
    checkWalletConnection();
    if (account) fetchUserCoverage();
  }, [account]);

  const checkWalletConnection = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        const accounts = await window.ethereum.request({ method: "eth_accounts" });
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          fetchBalance(accounts[0]);
        }
      } catch (err) {
        setError("Failed to connect wallet. Please try again.");
      }
    }
  };

  const fetchBalance = async (address) => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const balance = await provider.getBalance(address);
      setBalance(ethers.formatEther(balance));
    } catch (err) {
      console.error("Failed to fetch balance:", err);
    }
  };

  const fetchUserCoverage = async () => {
    if (!account) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const poolContract = getPoolContract(provider);
      const userData = await poolContract.users(account);
      const [, userCoverage] = userData;
      setCoverage(ethers.formatEther(userCoverage));
    } catch (err) {
      console.error("Failed to fetch user coverage:", err);
    }
  };

  const connectWallet = async () => {
    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      setAccount(accounts[0]);
      fetchBalance(accounts[0]);
    } catch (err) {
      setError("Failed to connect wallet");
    }
  };

  const handlePurchase = async (plan) => {
    try {
      setLoading(plan.id);
      setError("");
      setSuccess("");

      if (!account) throw new Error("Please connect your wallet first.");

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const poolContract = getPoolContract(signer);

      // Calculate premium amount based on payment type
      const premiumAmount = ethers.parseEther(
        paymentType === "yearly"
          ? (plan.monthlyPremium * 12 * (1 - parseInt(plan.yearlyDiscount) / 100)).toString()
          : plan.monthlyPremium.toString()
      );

      // Call the payPremium function with explicit gas parameters
      const tx = await poolContract.payPremium(
        plan.id - 1, 
        { 
          value: premiumAmount,
          gasLimit: 1000000,
          maxFeePerGas: ethers.parseUnits("50", "gwei"),
          maxPriorityFeePerGas: ethers.parseUnits("2", "gwei")
        }
      );

      console.log("Transaction sent:", tx.hash);
      await tx.wait();
      console.log("Transaction confirmed");

      // Update user coverage
      fetchUserCoverage();
      setSuccess(`Successfully purchased ${plan.name}.`);
    } catch (err) {
      console.error("Purchase failed:", err);
      setError(err.message || "Transaction failed. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="container">
      <div className="inner-container">
        <div className="buy-header">
          <h1 className="title">Decentralized Insurance Plans</h1>
          <p className="subtitle">
            Secure your future with blockchain-powered insurance coverage.
          </p>
          <div className="wallet-info">
            {account ? (
              <p>
                Wallet: {account.slice(0, 6)}...{account.slice(-4)} | 
                Balance: {balance ? `${balance} ETH` : "Loading..."} |
                Coverage: {coverage ? `${coverage} ETH` : "No coverage"}
              </p>
            ) : (
              <button onClick={connectWallet}>Connect Wallet</button>
            )}
          </div>
          <div className="payment-toggle">
            <button
              onClick={() => setPaymentType("monthly")}
              className={`toggle-button ${
                paymentType === "monthly" ? "active" : ""
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setPaymentType("yearly")}
              className={`toggle-button ${
                paymentType === "yearly" ? "active" : ""
              }`}
            >
              Yearly
            </button>
          </div>
        </div>

        {error && <div className="alert alert-error">⚠️ {error}</div>}

        {success && <div className="alert alert-success">✓ {success}</div>}

        <div className="plans-grid">
          {insurancePlans.map((plan) => (
            <div key={plan.id} className="plan-card">
              {plan.badge && (
                <div className={`plan-badge badge-${plan.color}`}>
                  {plan.badge}
                </div>
              )}
              <h2 className="plan-name">{plan.name}</h2>
              <p className="plan-coverage">{plan.coverage}</p>
              <div className="plan-price">
                {paymentType === "yearly"
                  ? (
                      plan.monthlyPremium *
                      12 *
                      (1 - parseInt(plan.yearlyDiscount) / 100)
                    ).toFixed(3)
                  : plan.monthlyPremium}{" "}
                ETH / {paymentType}
              </div>
              <ul className="features-list">
                {plan.features.map((feature, index) => (
                  <li key={index} className="feature-item">
                    ✓ {feature}
                  </li>
                ))}
              </ul>
              <button
                className={`purchase-button button-${plan.color}`}
                onClick={() => handlePurchase(plan)}
                disabled={loading === plan.id || !account}
              >
                {loading === plan.id ? "Processing..." : "Purchase Now"}
              </button>
            </div>
          ))}
        </div>

        {/* Additional Information Section */}
        <div className="info-section">
          <h2 className="info-title">Why Choose Our Insurance?</h2>
          <div className="info-grid">
            <div className="info-card">
              <h3>Blockchain Security</h3>
              <p>All policies are stored on the blockchain, ensuring transparency and immutability.</p>
            </div>
            <div className="info-card">
              <h3>Instant Claims</h3>
              <p>Smart contracts enable automated claim processing and instant payouts.</p>
            </div>
            <div className="info-card">
              <h3>Global Coverage</h3>
              <p>Access your insurance benefits anywhere in the world.</p>
            </div>
            <div className="info-card">
              <h3>24/7 Support</h3>
              <p>Round-the-clock assistance for all your insurance needs.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
