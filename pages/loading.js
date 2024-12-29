import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { ethers } from "ethers";
import { getPoolContract, getDAOContract } from "../utils/contracts";

export default function Loading() {
  const router = useRouter();
  const { confidenceScore, amount, evidenceURI } = router.query;
  const [showButtons, setShowButtons] = useState(false);
  const [loading, setLoading] = useState(false);

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
            {
              gasLimit: 1000000,  // Increased gas limit
              maxFeePerGas: ethers.parseUnits("50", "gwei"),  // Maximum total fee per gas
              maxPriorityFeePerGas: ethers.parseUnits("2", "gwei")  // Maximum priority fee per gas
            }
          );

          console.log("Transaction sent:", tx.hash);
          const receipt = await tx.wait();
          console.log("Transaction confirmed:", receipt);

        } catch (error) {
          console.error("Failed to submit claim:", error);
          alert("Failed to submit claim. Please try again.");
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

      // Treasury wallet address
      const treasuryAddress = "0xf503662da17ed5bb4904c6b789c539cbd8b19fd2";

      // Simple ETH transfer with explicit gas parameters
      const tx = await signer.sendTransaction({
        to: treasuryAddress,
        value: ethers.parseEther("0.001"),
        gasLimit: 100000,  // Increased gas limit for transfer
        maxFeePerGas: ethers.parseUnits("50", "gwei"),
        maxPriorityFeePerGas: ethers.parseUnits("2", "gwei")
      });

      console.log('Transfer sent:', tx.hash);
      await tx.wait();
      
      // After successful transfer, submit the claim
      const poolContract = getPoolContract(signer);
      const claimAmount = ethers.parseEther("1");
      
      console.log("Submitting appeal claim:", {
        amount: ethers.formatEther(claimAmount),
        evidenceURI: evidenceURI,
        confidenceScore: Math.floor(parseFloat(confidenceScore))
      });

      const claimTx = await poolContract.submitClaim(
        claimAmount,
        evidenceURI,
        Math.floor(parseFloat(confidenceScore)),
        {
          gasLimit: 1000000,
          maxFeePerGas: ethers.parseUnits("50", "gwei"),
          maxPriorityFeePerGas: ethers.parseUnits("2", "gwei")
        }
      );

      console.log("Claim transaction sent:", claimTx.hash);
      const receipt = await claimTx.wait();
      console.log("Claim transaction confirmed:", receipt);

      // Go to dashboard after successful claim submission
      router.push("/dashboard");

    } catch (error) {
      console.error("Appeal process failed:", error);
      alert("Failed to process appeal. Please try again.");
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
