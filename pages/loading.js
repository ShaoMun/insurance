import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { ethers } from "ethers";
import { getPoolContract, getDAOContract } from "../utils/contracts";

export default function Loading() {
  const router = useRouter();
  const { confidenceScore, amount, evidenceURI } = router.query;
  const [showButtons, setShowButtons] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!confidenceScore || !amount || !evidenceURI) return;

    const timer = setTimeout(async () => {
      if (parseFloat(confidenceScore) >= 60) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const poolContract = getPoolContract(signer);

          // Submit claim with IPFS URL
          const claimAmount = ethers.parseEther("1");
          console.log("Submitting claim:", {
            amount: ethers.formatEther(claimAmount),
            evidenceURI: evidenceURI,
            confidenceScore: Math.floor(parseFloat(confidenceScore))
          });

          const tx = await poolContract.submitClaim(
            claimAmount,
            evidenceURI,
            Math.floor(parseFloat(confidenceScore)),
            { gasLimit: 500000 }
          );

          console.log("Transaction sent:", tx.hash);
          const receipt = await tx.wait();
          console.log("Transaction confirmed:", receipt);

        } catch (error) {
          console.error("Failed to submit claim:", error);
          setError(error.message || "Failed to submit claim");
        }
      }
      setShowButtons(true);
    }, 6000);

    return () => clearTimeout(timer);
  }, [confidenceScore, amount, evidenceURI]);

  const handleResubmit = () => {
    router.push("/claim-insurance");
  };

  const handleAppeal = async () => {
    try {
      setLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const daoContract = getDAOContract(signer);

      // Submit appeal to DAO
      const tx = await daoContract.submitAppeal(
        amount,
        evidenceURI,
        parseFloat(confidenceScore),
        { value: ethers.parseEther("0.1") } // Appeal fee
      );
      await tx.wait();

      router.push("/dashboard");
    } catch (error) {
      console.error("Failed to appeal:", error);
      alert("Failed to submit appeal: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProceed = () => {
    router.push("/dashboard");
  };

  if (!showButtons) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <h2 className="loading-text">Analyzing Your Documents</h2>
        <p className="loading-text">Running AI Verification...</p>
      </div>
    );
  }

  return (
    <div className="result-container">
      <h1>AI Verification Results</h1>
      <div className="confidence-score">
        <p>Confidence Score: {confidenceScore}%</p>
      </div>

      {parseFloat(confidenceScore) >= 60 ? (
        <div>
          <p className="success-message">
            ✓ Your claim has been approved by our AI system!
          </p>
          <button 
            className="success-button"
            onClick={handleProceed}
          >
            View on Dashboard
          </button>
        </div>
      ) : (
        <div>
          <p className="error-message">! Low confidence score detected</p>
          <div className="button-container">
            <button 
              className="resubmit-button" 
              onClick={handleResubmit}
              disabled={loading}
            >
              Resubmit Claim
            </button>
            <button 
              className="appeal-button" 
              onClick={handleAppeal}
              disabled={loading}
            >
              {loading ? "Processing..." : "Appeal to DAO"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
