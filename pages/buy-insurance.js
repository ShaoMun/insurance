import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const insurancePlans = [
  {
    id: 1,
    name: "Basic Shield",
    badge: "POPULAR",
    coverage: "Essential Health & Accident",
    monthlyPremium: 0.01,
    yearlyDiscount: "10%",
    coverageAmount: 1,
    maxCoverage: "5 ETH",
    features: [
      "24/7 Emergency Support",
      "Basic Health Coverage",
      "Accident Protection",
      "30-day Money Back Guarantee"
    ],
    additionalBenefits: [
      "Quick claim processing within 48 hours",
      "No waiting period for accidents",
      "Coverage in major hospitals"
    ],
    color: "blue"
  },
  {
    id: 2,
    name: "Premium Guard",
    badge: "RECOMMENDED",
    coverage: "Comprehensive Protection",
    monthlyPremium: 0.02,
    yearlyDiscount: "15%",
    coverageAmount: 2,
    maxCoverage: "10 ETH",
    features: [
      "24/7 Priority Support with Personal Agent",
      "Full Health Coverage + Specialists",
      "Enhanced Accident Protection",
      "Global Emergency Coverage",
      "Dental & Vision Basic",
      "Preventive Care Included"
    ],
    additionalBenefits: [
      "Express claim processing within 24 hours",
      "No waiting period for any coverage",
      "Access to premium healthcare network",
      "Annual health checkup included"
    ],
    color: "purple"
  },
  {
    id: 3,
    name: "Ultimate Protection",
    badge: "ELITE",
    coverage: "All-Inclusive Coverage",
    monthlyPremium: 0.03,
    yearlyDiscount: "20%",
    coverageAmount: 3,
    maxCoverage: "20 ETH",
    features: [
      "24/7 VIP Concierge Support",
      "Comprehensive Global Coverage",
      "Complete Medical & Specialists",
      "Premium Dental & Vision",
      "Advanced Preventive Care",
      "Family Coverage Options",
      "Alternative Medicine Coverage",
      "Mental Health Support"
    ],
    additionalBenefits: [
      "Instant claim processing",
      "Exclusive access to top-tier hospitals worldwide",
      "Private medical transportation",
      "Annual executive health screening",
      "Family discount plans available"
    ],
    color: "emerald"
  }
];

export default function Home() {
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [account, setAccount] = useState("");
  const [paymentType, setPaymentType] = useState("monthly");

  useEffect(() => {
    checkWalletConnection();
  }, []);

  const checkWalletConnection = async () => {
    if (typeof window.ethereum !== 'undefined') {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        setAccount(accounts[0]);
      }
    }
  };

  const connectWallet = async () => {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0]);
    } catch (err) {
      setError("Failed to connect wallet");
    }
  };

  const handlePurchase = async (plan) => {
    try {
      setLoading(plan.id);
      setError("");
      setSuccess("");
      
      if (!account) {
        throw new Error("Please connect your wallet first");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const amount = ethers.parseEther(
        paymentType === "yearly" 
          ? (plan.monthlyPremium * 12 * (1 - parseInt(plan.yearlyDiscount) / 100)).toString()
          : plan.monthlyPremium.toString()
      );
      
      const tx = await signer.sendTransaction({
        to: "YOUR_CONTRACT_ADDRESS",
        value: amount
      });

      await tx.wait();
      setSuccess(`Successfully purchased ${plan.name}!`);

    } catch (err) {
      setError(err.message || "Failed to process transaction");
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
            Transparent, immutable, and always accessible.
          </p>
          
          <div className="payment-toggle">
            <button
              onClick={() => setPaymentType("monthly")}
              className={`toggle-button ${paymentType === "monthly" ? "active" : ""}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setPaymentType("yearly")}
              className={`toggle-button ${paymentType === "yearly" ? "active" : ""}`}
            >
              Yearly
            </button>
          </div>
        </div>

        {error && (
          <div className="alert alert-error">
            ⚠️ {error}
          </div>
        )}
        
        {success && (
          <div className="alert alert-success">
            ✓ {success}
          </div>
        )}
        
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
                  ? (plan.monthlyPremium * 12 * (1 - parseInt(plan.yearlyDiscount) / 100)).toFixed(3)
                  : plan.monthlyPremium
                } ETH
                <span className="price-suffix">
                  /{paymentType === "yearly" ? "year" : "month"}
                </span>
              </div>
              
              {paymentType === "yearly" && (
                <div className="yearly-savings">
                  Save {plan.yearlyDiscount} with annual billing
                </div>
              )}
              
              <div className="max-coverage">
                Max Coverage: {plan.maxCoverage}
              </div>
              
              <div className="features-list">
                {plan.features.map((feature, index) => (
                  <div key={index} className="feature-item">
                    ✓ {feature}
                  </div>
                ))}
              </div>
              
              <div className="benefits-section">
                <h3 className="benefits-title">Additional Benefits:</h3>
                <ul className="benefits-list">
                  {plan.additionalBenefits.map((benefit, index) => (
                    <li key={index} className="benefit-item">
                      • {benefit}
                    </li>
                  ))}
                </ul>
              </div>
              
              <button 
                className={`purchase-button button-${plan.color}`}
                onClick={() => handlePurchase(plan)}
                disabled={loading === plan.id || !account}
              >
                {loading === plan.id ? 'Processing...' : 'Purchase Now'}
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