"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/router';

const Dashboard = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('pool');
  const [claimTab, setClaimTab] = useState('active');
  
  const dashboardData = {
    insurance: {
      coverage: "5.5 ETH",
      premium: "0.5 ETH",
      nextPayment: "2024-04-01",
      status: "Active"
    },
    poolAndDao: {
      contribution: "2.5 ETH",
      totalPoolSize: "150.5 ETH",
      sharePercentage: "1.66%",
      votingPower: "1.66%",
      staking: {
        staked: "1.8 ETH",
        apr: "12.5%",
        rewards: "0.12 ETH",
        nextReward: "0.03 ETH",
        lockPeriod: "30 days"
      },
      activeVotes: {
        claims: 3,
        proposals: 2
      }
    },
    claims: [
      {
        id: "CLM-001",
        type: "Accident",
        amount: "1.5 ETH",
        status: "Pending AI Review",
        date: "2024-03-15",
        aiConfidence: null,
        description: "Car accident damage claim"
      },
      {
        id: "CLM-002",
        type: "Theft",
        amount: "2.0 ETH",
        status: "DAO Voting",
        date: "2024-03-10",
        aiConfidence: 75,
        description: "Stolen items from vehicle",
        votes: {
          yes: 35,
          no: 15,
          votingEnds: "12 hours"
        }
      },
      {
        id: "CLM-003",
        type: "Natural Disaster",
        amount: "4.0 ETH",
        status: "DAO Voting",
        date: "2024-03-08",
        aiConfidence: 45,
        description: "Flood damage to property",
        votes: {
          yes: 12,
          no: 28,
          votingEnds: "6 hours"
        }
      },
      {
        id: "CLM-004",
        type: "Accident",
        amount: "1.2 ETH",
        status: "Completed",
        date: "2024-02-15",
        aiConfidence: 85,
        description: "Vehicle collision repair",
        votes: {
          yes: 45,
          no: 5
        },
        result: "Approved",
        payout: "1.2 ETH"
      },
      {
        id: "CLM-005",
        type: "Theft",
        amount: "3.0 ETH",
        status: "Rejected",
        date: "2024-02-01",
        aiConfidence: 35,
        description: "Home burglary claim",
        votes: {
          yes: 10,
          no: 40
        },
        reason: "Insufficient evidence provided"
      },
      {
        id: "CLM-006",
        type: "Natural Disaster",
        amount: "2.5 ETH",
        status: "Appeal",
        date: "2024-01-25",
        description: "Hurricane damage - under appeal",
        isAppeal: true,
        appealReason: "New evidence available",
        originalClaim: {
          aiConfidence: 60,
          votes: {
            yes: 20,
            no: 30
          }
        }
      },
      {
        id: "CLM-007",
        type: "Accident",
        amount: "0.8 ETH",
        status: "Completed",
        date: "2024-01-15",
        aiConfidence: 95,
        description: "Minor collision repair",
        votes: {
          yes: 50,
          no: 2
        },
        result: "Approved",
        payout: "0.8 ETH"
      }
    ]
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

        {claim.votes && !claim.isAppeal && (
          <div className="vote-stats">
            <div className="vote-bars">
              <div className="vote-bar">
                <div className="vote-label">Yes</div>
                <div className="vote-progress">
                  <div 
                    className="vote-fill yes"
                    style={{
                      width: `${(claim.votes.yes / (claim.votes.yes + claim.votes.no)) * 100}%`
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
                      width: `${(claim.votes.no / (claim.votes.yes + claim.votes.no)) * 100}%`
                    }}
                  ></div>
                </div>
                <span>{claim.votes.no}</span>
              </div>
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
              <button className="stake-action">Stake More</button>
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
          <button className="new-claim">+ New Claim</button>
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
          {claimTab === 'active' ? (
            // Active claims
            dashboardData.claims.filter(claim => 
              claim.status === 'Pending AI Review' || 
              claim.status === 'DAO Voting'
            ).map((claim) => (
              <ClaimCard key={claim.id} claim={claim} isPast={false} />
            ))
          ) : (
            // Past claims
            dashboardData.claims.filter(claim => 
              claim.status === 'Completed' || 
              claim.status === 'Rejected'
            ).map((claim) => (
              <ClaimCard key={claim.id} claim={claim} isPast={true} />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
