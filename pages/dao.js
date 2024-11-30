"use client";

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { getPoolContract, getDAOContract } from "../utils/contracts";

const DAO = () => {
  const [activeTab, setActiveTab] = useState('claims');
  const [daoData, setDaoData] = useState({
    userStats: {
      votingPower: "0%",
      poolContribution: "0 ETH",
      votesParticipated: 0,
      proposalsCreated: 0
    },
    poolStats: {
      totalSize: "0 ETH",
      activeMembers: 0,
      totalClaims: "0",
      averageVotingRate: "0%"
    },
    pendingClaims: []
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const poolContract = getPoolContract(signer);
        const daoContract = getDAOContract(signer);
        const userAddress = await signer.getAddress();

        // Get user data
        const user = await poolContract.users(userAddress);
        const staker = await poolContract.stakers(userAddress);
        const totalPremiums = await poolContract.totalPremiums();
        const totalStaked = await poolContract.totalStaked();
        const claimCounter = await poolContract.claimCounter();

        // Calculate voting power
        const totalPoolSize = totalPremiums + totalStaked;
        const userContribution = user[0] + staker[0]; // user[1] is totalPremiumPaid, staker[0] is balance
        const votingPower = totalPoolSize > 0n 
          ? Number((userContribution * 100n * 100n / totalPoolSize)) / 100
          : 0;

        // Fetch pending claims
        const claims = [];
        for(let i = 1; i <= claimCounter; i++) {
          const claim = await poolContract.claims(i);
          // claim[0]: claimant
          // claim[1]: amount
          // claim[2]: unlockTime
          // claim[3]: status
          // claim[4]: evidenceURI
          // claim[5]: exists
          // claim[6]: aiConfidence
          
          if(claim[5] && claim[3] === 0n) { // exists and status is Timelock
            try {
              const proposal = await daoContract.proposals(i);
              
              // Get AI confidence directly from the proposal
              let aiConfidence = 0;
              try {
                // Convert the proposal's aiConfidence to number
                aiConfidence = Number(proposal.aiConfidence);
                console.log(`Claim ${i} confidence:`, aiConfidence);
              } catch (error) {
                console.log(`Error getting confidence for claim ${i}:`, error);
                aiConfidence = 0;
              }
              
              claims.push({
                id: `CLM-${i.toString().padStart(3, '0')}`,
                type: "Insurance Claim",
                amount: ethers.formatEther(claim[1]) + " ETH",
                submittedBy: claim[0],
                date: new Date(Number(claim[2]) * 1000).toISOString().split('T')[0],
                evidence: claim[4],
                aiConfidence: aiConfidence,
                votes: {
                  yes: Number(proposal.yesVotes || 0n),
                  no: Number(proposal.noVotes || 0n),
                  required: 100,
                  timeLeft: `${Math.max(0, Math.floor((Number(claim[2]) - Date.now() / 1000) / 3600))} hours`
                },
                yourVote: null
              });
            } catch (error) {
              console.error(`Error fetching proposal ${i}:`, error);
            }
          }
        }

        // Count unique claimants as active members
        const uniqueClaimants = new Set();
        for(let i = 1; i <= claimCounter; i++) {
          const claim = await poolContract.claims(i);
          if(claim[5]) { // if claim exists
            uniqueClaimants.add(claim[0]);
          }
        }

        setDaoData({
          userStats: {
            votingPower: votingPower.toFixed(2) + "%",
            poolContribution: ethers.formatEther(userContribution) + " ETH",
            votesParticipated: 0,
            proposalsCreated: 0
          },
          poolStats: {
            totalSize: ethers.formatEther(totalPoolSize) + " ETH",
            activeMembers: uniqueClaimants.size,
            totalClaims: claimCounter.toString(),
            averageVotingRate: claims.length > 0 ? 
              ((claims.reduce((acc, claim) => acc + claim.votes.yes + claim.votes.no, 0) / 
                (claims.length * 100)) * 100).toFixed(2) + "%" : "0%"
          },
          pendingClaims: claims
        });

      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };

    fetchData();
  }, []);

  const ProposalCard = ({ proposal }) => (
    <div className="proposal-card">
      <div className="proposal-header">
        <div className="proposal-title">
          <h3>{proposal.title}</h3>
          <span className="proposal-id">{proposal.id}</span>
        </div>
        <span className="proposal-type">{proposal.type}</span>
      </div>
      
      <p className="proposal-description">{proposal.description}</p>
      
      <div className="proposal-stats">
        <div className="creator">
          <label>Created by</label>
          <span>{proposal.creator}</span>
        </div>
        <div className="time-left">
          <label>Time Left</label>
          <span>{proposal.timeLeft}</span>
        </div>
      </div>

      <div className="voting-progress">
        <div className="progress-header">
          <span>Current Votes</span>
          <span>Quorum: {proposal.votes.quorum}</span>
        </div>
        <div className="progress-bar">
          <div 
            className="yes-votes"
            style={{ width: `${(proposal.votes.yes / proposal.votes.required) * 100}%` }}
          ></div>
          <div 
            className="no-votes"
            style={{ width: `${(proposal.votes.no / proposal.votes.required) * 100}%` }}
          ></div>
        </div>
        <div className="vote-counts">
          <span>Yes: {proposal.votes.yes}</span>
          <span>No: {proposal.votes.no}</span>
          <span>Required: {proposal.votes.required}</span>
        </div>
      </div>

      {!proposal.yourVote ? (
        <div className="voting-actions">
          <button className="vote-yes-btn">Vote Yes</button>
          <button className="vote-no-btn">Vote No</button>
        </div>
      ) : (
        <div className="your-vote">
          <span>Your vote: {proposal.yourVote}</span>
          <button className="change-vote-btn">Change Vote</button>
        </div>
      )}
    </div>
  );

  const ClaimReviewCard = ({ claim }) => {
    const handleVote = async (isApprove) => {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const daoContract = getDAOContract(signer);
        
        // Extract claim ID from the format "CLM-001"
        const claimId = parseInt(claim.id.split('-')[1]);
        
        // Submit vote to the DAO contract
        const tx = await daoContract.submitVote(claimId, isApprove, {
          gasLimit: 300000
        });

        console.log("Vote submitted:", tx.hash);
        await tx.wait();
        console.log("Vote confirmed");
        
        // Refresh the page to show updated voting status
        window.location.reload();

      } catch (error) {
        console.error("Failed to submit vote:", error);
        alert("Failed to submit vote: " + error.message);
      }
    };

    const handleViewEvidence = () => {
      if (!claim.evidence) {
        console.error("No evidence URL provided");
        return;
      }

      try {
        // If it's an IPFS link, format it properly
        let evidenceUrl = claim.evidence;
        if (evidenceUrl.startsWith('ipfs://')) {
          // Use multiple IPFS gateways as fallbacks
          const gateways = [
            'https://ipfs.io/ipfs/',
            'https://gateway.pinata.cloud/ipfs/',
            'https://cloudflare-ipfs.com/ipfs/'
          ];
          evidenceUrl = `${gateways[0]}${evidenceUrl.replace('ipfs://', '')}`;
        }
        console.log("Opening evidence URL:", evidenceUrl);
        window.open(evidenceUrl, '_blank', 'noopener,noreferrer');
      } catch (error) {
        console.error("Error opening evidence:", error);
      }
    };

    return (
      <div className="claim-review-card">
        <div className="claim-header">
          <div className="claim-info">
            <h3>{claim.id}</h3>
            <span className="claim-type">{claim.type}</span>
          </div>
          <div className="claim-amount">{claim.amount}</div>
        </div>

        <div className="claim-details">
          <div className="detail-row">
            <span>Submitted By</span>
            <span>{claim.submittedBy}</span>
          </div>
          <div className="detail-row">
            <span>Date</span>
            <span>{claim.date}</span>
          </div>
        </div>

        <div className="ai-assessment">
          <label>AI Confidence Score</label>
          <div className="confidence-bar">
            <div 
              className="confidence-fill"
              style={{ 
                width: `${claim.aiConfidence}%`,
                backgroundColor: claim.aiConfidence >= 60 ? '#00ff9d' : '#ff4d4d'
              }}
            ></div>
          </div>
          <span>{claim.aiConfidence}%</span>
        </div>

        <div className="voting-status">
          <div className="votes-progress">
            <div className="votes-bar">
              <div 
                className="yes-votes"
                style={{ width: `${(claim.votes.yes / claim.votes.required) * 100}%` }}
              ></div>
              <div 
                className="no-votes"
                style={{ width: `${(claim.votes.no / claim.votes.required) * 100}%` }}
              ></div>
            </div>
          </div>
          <div className="votes-info">
            <span>Yes: {claim.votes.yes}</span>
            <span>No: {claim.votes.no}</span>
            <span>Required: {claim.votes.required}</span>
          </div>
          <span className="time-remaining">Time remaining: {claim.votes.timeLeft}</span>
        </div>

        <div className="claim-actions">
          <button 
            className="view-evidence-btn"
            onClick={handleViewEvidence}
            title={claim.evidence}
          >
            View Evidence
            <span className="evidence-link">
              {claim.evidence ? claim.evidence.substring(0, 20) + '...' : 'No evidence'}
            </span>
          </button>
          {!claim.yourVote && (
            <div className="vote-buttons">
              <button 
                className="approve-btn"
                onClick={() => handleVote(true)}
              >
                Approve Claim
              </button>
              <button 
                className="reject-btn"
                onClick={() => handleVote(false)}
              >
                Reject Claim
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const ActivityFeed = ({ activities = [] }) => (
    <div className="activity-feed">
      {activities.length === 0 ? (
        <div className="no-activity">
          <p>No recent activity</p>
        </div>
      ) : (
        activities.map(activity => (
          <div key={activity.id} className="activity-item">
            <div className="activity-icon">
              {activity.type === 'Claim Approved' ? '✓' : 
               activity.type === 'Claim Rejected' ? '✗' : 
               activity.type === 'Vote Cast' ? '✋' : 
               activity.type === 'Appeal Submitted' ? '⚖️' : '+'}
            </div>
            <div className="activity-content">
              <p>{activity.description}</p>
              <span>{activity.time}</span>
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="dao-container">
      {/* DAO Overview Stats */}
      <div className="dao-header">
        <div className="user-dao-stats">
          <div className="stat-item">
            <label>Your Voting Power</label>
            <value>{daoData.userStats.votingPower}</value>
          </div>
          <div className="stat-item">
            <label>Pool Contribution</label>
            <value>{daoData.userStats.poolContribution}</value>
          </div>
          <div className="stat-item">
            <label>Votes Participated</label>
            <value>{daoData.userStats.votesParticipated}</value>
          </div>
        </div>
        <div className="pool-dao-stats">
          <div className="stat-item">
            <label>Total Pool Size</label>
            <value>{daoData.poolStats.totalSize}</value>
          </div>
          <div className="stat-item">
            <label>Active Members</label>
            <value>{daoData.poolStats.activeMembers}</value>
          </div>
          <div className="stat-item">
            <label>Voting Rate</label>
            <value>{daoData.poolStats.averageVotingRate}</value>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="dao-tabs">
        <button 
          className={`tab-btn ${activeTab === 'claims' ? 'active' : ''}`}
          onClick={() => setActiveTab('claims')}
        >
          Claims Review
        </button>

        <button 
          className={`tab-btn ${activeTab === 'activity' ? 'active' : ''}`}
          onClick={() => setActiveTab('activity')}
        >
          Activity
        </button>
      </div>

      {/* Content based on active tab */}
      <div className="dao-content">
        {activeTab === 'overview' && (
          <div className="overview-section">
            {/* Overview content */}
          </div>
        )}

        {activeTab === 'proposals' && (
          <div className="proposals-section">
            <div className="section-header">
              <h2>Active Proposals</h2>
              <button className="create-proposal-btn">Create Proposal</button>
            </div>
            <div className="proposals-list">
              {daoData.activeProposals.map(proposal => (
                <ProposalCard key={proposal.id} proposal={proposal} />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'claims' && (
          <div className="claims-review-section">
            <h2>Claims Needing Review</h2>
            <div className="claims-review-list">
              {daoData.pendingClaims.map(claim => (
                <ClaimReviewCard key={claim.id} claim={claim} />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="activity-section">
            <h2>Recent Activity</h2>
            <ActivityFeed activities={daoData.recentActivity} />
          </div>
        )}
      </div>
    </div>
  );
};

export default DAO;
