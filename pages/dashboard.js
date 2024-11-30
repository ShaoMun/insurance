"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { ethers } from 'ethers';
import { getPoolContract, getDAOContract } from "../utils/contracts";

const Dashboard = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('pool');
  const [claimTab, setClaimTab] = useState('active');
  const [dashboardData, setDashboardData] = useState({
    userAddress: "",
    insurance: {
      coverage: "0 ETH",
      premium: "0 ETH",
      nextPayment: "-",
      status: "Inactive"
    },
    poolAndDao: {
      contribution: "0 ETH",
      totalPoolSize: "0 ETH",
      sharePercentage: "0%",
      votingPower: "0%",
      staking: {
        staked: "0 ETH",
        apr: "0%",
        rewards: "0 ETH",
        nextReward: "0 ETH",
        lockPeriod: "0 days"
      },
      activeVotes: {
        claims: 0,
        proposals: 0
      }
    },
    claims: []
  });

  const fetchDashboardData = useCallback(async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const poolContract = getPoolContract(signer);
      const daoContract = getDAOContract(signer);
      const userAddress = await signer.getAddress();

      // Fetch user's insurance data
      const user = await poolContract.users(userAddress);
      const coverage = ethers.formatEther(user.coverage);
      const premium = ethers.formatEther(user.totalPremiumPaid);

      // Fetch staking data
      const staker = await poolContract.stakers(userAddress);
      const stakedAmount = ethers.formatEther(staker.balance);
      const lockDuration = Number(staker.lockDuration);
      
      // Calculate APR based on lock duration
      let apr;
      if (lockDuration === 30 * 24 * 60 * 60) apr = "0.3";
      else if (lockDuration === 180 * 24 * 60 * 60) apr = "2.0";
      else if (lockDuration === 365 * 24 * 60 * 60) apr = "5.0";
      else apr = "0";

      // Fetch pool and DAO data
      const totalPremiums = await poolContract.totalPremiums();
      const totalStaked = await poolContract.totalStaked();
      const totalPoolSize = totalPremiums + totalStaked;
      const votingPower = await daoContract.calculateVotingPower(userAddress);
      
      // Fetch claims
      const claimCounter = await poolContract.claimCounter();
      const claims = [];
      
      for(let i = 1; i <= claimCounter; i++) {
        const claim = await poolContract.claims(i);
        if(claim.exists) {
          try {
            const proposal = await daoContract.proposals(i);
            
            console.log("Claim claimant:", claim.claimant);
            console.log("User address:", userAddress);
            
            claims.push({
              id: `CLM-${i.toString().padStart(3, '0')}`,
              type: "Insurance Claim",
              amount: ethers.formatEther(claim.amount) + " ETH",
              status: getClaimStatus(claim.status),
              date: new Date(Number(claim.unlockTime) * 1000).toISOString().split('T')[0],
              aiConfidence: Number(proposal.aiConfidence || 0),
              description: "Claim #" + i,
              claimant: claim.claimant,
              submittedBy: claim.claimant,
              votes: proposal.exists ? {
                yes: Number(proposal.yesVotes || 0),
                no: Number(proposal.noVotes || 0),
                votingEnds: getTimeRemaining(Number(proposal.timelockEnd))
              } : null
            });
          } catch (error) {
            console.error(`Error fetching proposal ${i}:`, error);
          }
        }
      }

      // Get active proposals count
      const activeProposalCount = await daoContract.activeProposalCount();

      // Filter claims for the current user
      const { usefulData } = await contract.getUserData(account);

      // Update state with real data
      setDashboardData({
        userAddress,
        insurance: {
          coverage: coverage + " ETH",
          premium: premium + " ETH",
          nextPayment: "-",
          status: coverage > 0 ? "Active" : "Inactive"
        },
        poolAndDao: {
          contribution: (Number(premium) + Number(stakedAmount)).toFixed(2) + " ETH",
          totalPoolSize: ethers.formatEther(totalPoolSize) + " ETH",
          sharePercentage: ((Number(premium) + Number(stakedAmount)) / Number(ethers.formatEther(totalPoolSize)) * 100).toFixed(2) + "%",
          votingPower: Number(votingPower).toFixed(2) + "%",
          staking: {
            staked: stakedAmount + " ETH",
            apr: apr + "%",
            rewards: "Calculating...",
            nextReward: "Calculating...",
            lockPeriod: (lockDuration / (24 * 60 * 60)) + " days"
          },
          activeVotes: {
            claims: claims.filter(c => c.status === "DAO Voting").length,
            proposals: Number(activeProposalCount)
          }
        },
        claims: claims
      });

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Helper function to get claim status string
  const getClaimStatus = (statusCode) => {
    const statuses = ["DAO Voting", "DAO Voting", "Claimed", "Rejected"];
    return statuses[Number(statusCode)] || "Unknown";
  };

  // Helper function to get time remaining
  const getTimeRemaining = (endTime) => {
    const remaining = endTime - (Date.now() / 1000);
    if (remaining <= 0) return "Ended";
    const hours = Math.floor(remaining / 3600);
    return `${hours} hours`;
  };

  const ClaimCard = ({ claim, isPast }) => {
    return (
      <div className="claim-card">
        <div className="claim-status">
          <span className={`status ${claim.status.toLowerCase().replace(' ', '-')}`}>
            {claim.status}
          </span>
          <h3>{claim.amount}</h3>
        </div>
        
        <div className="claim-info">
          <p>{claim.type}</p>
          <span>{claim.date}</span>
        </div>

        {/* Show AI and Vote details for both active and completed claims */}
        {claim.aiConfidence !== null && !claim.isAppeal && (
          <div className="ai-score">
            <div className="score-bar">
              <div 
                className="score-fill"
                style={{width: `${claim.aiConfidence}%`}}
              ></div>
            </div>
            <span>{claim.aiConfidence}% AI Confidence</span>
          </div>
        )}

        {claim.votes && (
          <div className="vote-stats">
            <div className="vote-bars">
              <div className="vote-bar">
                <div className="vote-label">Yes</div>
                <div className="vote-progress">
                  <div 
                    className="vote-fill yes"
                    style={{
                      width: `${claim.votes.yes + claim.votes.no > 0 
                        ? (claim.votes.yes / (claim.votes.yes + claim.votes.no)) * 100 
                        : 0}%`
                    }}
                  ></div>
                </div>
                <span>{claim.votes.yes}</span>
              </div>
              <div className="vote-bar">
                <div className="vote-label">No</div>
                <div className="vote-progress">
                  <div 
                    className="vote-fill no"
                    style={{
                      width: `${claim.votes.yes + claim.votes.no > 0 
                        ? (claim.votes.no / (claim.votes.yes + claim.votes.no)) * 100 
                        : 0}%`
                    }}
                  ></div>
                </div>
                <span>{claim.votes.no}</span>
              </div>
            </div>
            <div className="time-remaining">
              <span className="time-label">Time Remaining:</span>
              <span className="time-value">{claim.votes.votingEnds}</span>
            </div>
          </div>
        )}

        {/* Show result reason for completed/rejected claims */}
        {isPast && (
          <div className="claim-result">
            {claim.payout && (
              <div className="payout">
                <span>Payout:</span> {claim.payout}
              </div>
            )}
            {claim.reason && (
              <div className="reject-reason">
                <span>Reason:</span> {claim.reason}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="dashboard-new">
      {/* Top Section: Insurance Overview */}
      <div className="insurance-overview">
        <div className="insurance-card">
          <div className="insurance-status">
            <span className="status-active">Active</span>
            <h2>{dashboardData.insurance.coverage}</h2>
            <p>Insurance Coverage</p>
          </div>
          <div className="insurance-details">
            <div className="detail">
              <span>Premium</span>
              <h3>{dashboardData.insurance.premium}</h3>
            </div>
            <div className="detail">
              <span>Next Payment</span>
              <h3>{dashboardData.insurance.nextPayment}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Section: Pool & DAO */}
      <div className="pool-dao-overview">
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'pool' ? 'active' : ''}`}
            onClick={() => setActiveTab('pool')}
          >
            Pool Position
          </button>
          <button 
            className={`tab ${activeTab === 'staking' ? 'active' : ''}`}
            onClick={() => setActiveTab('staking')}
          >
            Staking
          </button>
          <button 
            className={`tab ${activeTab === 'dao' ? 'active' : ''}`}
            onClick={() => setActiveTab('dao')}
          >
            DAO
          </button>
        </div>

        <div className="content-area">
          {activeTab === 'pool' && (
            <div className="pool-content">
              <div className="main-stat">
                <h2>{dashboardData.poolAndDao.contribution}</h2>
                <p>Pool Contribution</p>
                <span className="percentage">{dashboardData.poolAndDao.sharePercentage} of total pool</span>
              </div>
              <div className="pool-chart">
                {/* Add your chart component here */}
              </div>
            </div>
          )}

          {activeTab === 'staking' && (
            <div className="staking-content">
              <div className="staking-stats">
                <div className="stat-box">
                  <h3>{dashboardData.poolAndDao.staking.staked}</h3>
                  <p>Total Staked</p>
                </div>
                <div className="stat-box highlight">
                  <h3>{dashboardData.poolAndDao.staking.apr}</h3>
                  <p>Current APR</p>
                </div>
                <div className="stat-box">
                  <h3>{dashboardData.poolAndDao.staking.rewards}</h3>
                  <p>Rewards Earned</p>
                </div>
              </div>
              <button 
                className="stake-action"
                onClick={() => router.push('/stake')}
              >
                Stake More
              </button>
            </div>
          )}

          {activeTab === 'dao' && (
            <div className="dao-content">
              <div className="voting-power">
                <h3>{dashboardData.poolAndDao.votingPower}</h3>
                <p>Voting Power</p>
              </div>
              <div className="active-proposals">
                <span>{dashboardData.poolAndDao.activeVotes.proposals} Active Proposals</span>
                <button onClick={() => router.push('/dao')}>View DAO</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section: Claims */}
      <div className="claims-overview">
        <div className="claims-header">
          <h2>Claims</h2>
          <button 
            className="new-claim"
            onClick={() => router.push('/claim-insurance')}
          >
            + New Claim
          </button>
        </div>
        
        <div className="claims-tabs">
          <button 
            className={`claim-tab ${claimTab === 'active' ? 'active' : ''}`}
            onClick={() => setClaimTab('active')}
          >
            Active Claims
          </button>
          <button 
            className={`claim-tab ${claimTab === 'past' ? 'active' : ''}`}
            onClick={() => setClaimTab('past')}
          >
            Past Claims
          </button>
        </div>

        <div className="claims-grid">
          {Array.isArray(dashboardData.claims) && (
            <>
              {claimTab === 'active' ? (
                // Active claims
                dashboardData.claims
                  .filter(claim => 
                    claim.submittedBy.toLowerCase() === dashboardData.userAddress.toLowerCase() &&
                    (claim.status === 'Timelock' || claim.status === 'DAO Voting')
                  )
                  .map((claim) => (
                    <ClaimCard key={claim.id} claim={claim} isPast={false} />
                  ))
              ) : (
                // Past claims
                dashboardData.claims
                  .filter(claim => 
                    claim.submittedBy.toLowerCase() === dashboardData.userAddress.toLowerCase() &&
                    (claim.status === 'Claimed' || claim.status === 'Rejected')
                  )
                  .map((claim) => (
                    <ClaimCard key={claim.id} claim={claim} isPast={true} />
                  ))
              )}
              {dashboardData.claims.length > 0 && 
                !dashboardData.claims.some(claim => 
                  claim.submittedBy.toLowerCase() === dashboardData.userAddress.toLowerCase()
                ) && (
                  <div className="no-claims">
                    <p>You haven't submitted any claims yet</p>
                  </div>
                )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
