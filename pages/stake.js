"use client";

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { getPoolContract } from "../utils/contracts";

const Stake = () => {
  const [stakeAmount, setStakeAmount] = useState('');
  const [duration, setDuration] = useState('30');
  const [loading, setLoading] = useState(false);
  const [stakerInfo, setStakerInfo] = useState({
    balance: "0",
    stakingTime: "0",
    unlockTime: "0",
    canUnstake: false,
    expectedReturn: "0"
  });

  useEffect(() => {
    const fetchStakerInfo = async () => {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const poolContract = getPoolContract(signer);
        const userAddress = await signer.getAddress();

        const staker = await poolContract.stakers(userAddress);
        
        // Convert BigInt to string before using it
        const balance = staker[0].toString();
        const stakingTime = staker[1].toString();
        const unlockTime = staker[3].toString(); // Using unlockTime directly from struct
        
        setStakerInfo({
          balance: ethers.formatEther(balance),
          stakingTime: new Date(Number(stakingTime) * 1000).toLocaleDateString(),
          unlockTime: new Date(Number(unlockTime) * 1000).toLocaleDateString(),
          canUnstake: BigInt(balance) > 0n,
          expectedReturn: calculateExpectedReturn(BigInt(balance), BigInt(duration) * 24n * 60n * 60n)
        });

      } catch (error) {
        console.error("Failed to fetch staker info:", error);
      }
    };

    fetchStakerInfo();
  }, [duration]);

  const calculateExpectedReturn = (amount, duration) => {
    if (!amount || amount === 0n) return "0";
    
    let rate;
    if (duration === 30n * 24n * 60n * 60n) rate = 0.003;
    else if (duration === 180n * 24n * 60n * 60n) rate = 0.02;
    else if (duration === 365n * 24n * 60n * 60n) rate = 0.05;
    else rate = 0;

    return (Number(ethers.formatEther(amount)) * rate).toFixed(4);
  };

  const handleStake = async () => {
    if (!stakeAmount || parseFloat(stakeAmount) <= 0) {
      alert("Please enter a valid stake amount");
      return;
    }

    try {
      setLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const poolContract = getPoolContract(signer);

      const durationInSeconds = parseInt(duration) * 24 * 60 * 60;
      const tx = await poolContract.stake(durationInSeconds, {
        value: ethers.parseEther(stakeAmount),
        gasLimit: 300000
      });

      await tx.wait();
      window.location.reload();

    } catch (error) {
      console.error("Failed to stake:", error);
      alert("Failed to stake: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUnstake = async () => {
    try {
      setLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const poolContract = getPoolContract(signer);

      const tx = await poolContract.unstake({ gasLimit: 300000 });
      await tx.wait();
      window.location.reload();

    } catch (error) {
      console.error("Failed to unstake:", error);
      alert("Failed to unstake: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="staking-container">
      <div className="staking-card">
        <div className="glow-effect"></div>
        <h1>Stake ETH</h1>
        
        <div className="staking-info">
          <div className="info-item">
            <label>Your Stake</label>
            <span>{stakerInfo.balance} ETH</span>
          </div>
          <div className="info-item">
            <label>Expected Return</label>
            <span>{stakerInfo.expectedReturn} ETH</span>
          </div>
          <div className="info-item">
            <label>Unlock Date</label>
            <span>{stakerInfo.unlockTime}</span>
          </div>
        </div>

        <div className="staking-form">
          <div className="input-group">
            <label>Stake Amount (ETH)</label>
            <input
              type="number"
              step="0.01"
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
              placeholder="Enter amount to stake"
              disabled={loading}
            />
          </div>

          <div className="input-group">
            <label>Lock Duration</label>
            <select 
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              disabled={loading}
            >
              <option value="30">30 Days (0.3% Return)</option>
              <option value="180">180 Days (2% Return)</option>
              <option value="365">365 Days (5% Return)</option>
            </select>
          </div>

          <div className="button-group">
            <button 
              className={`stake-button ${loading ? 'loading' : ''}`}
              onClick={handleStake}
              disabled={loading || !stakeAmount}
            >
              <span className="button-text">
                {loading ? "Processing..." : "Stake ETH"}
              </span>
            </button>

            {stakerInfo.canUnstake && (
              <button 
                className={`unstake-button ${loading ? 'loading' : ''}`}
                onClick={handleUnstake}
                disabled={loading}
              >
                <span className="button-text">
                  {loading ? "Processing..." : "Unstake ETH"}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stake;
