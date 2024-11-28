"use client";

import React, { useState } from 'react';

const DAO = () => {
  const [activeTab, setActiveTab] = useState('claims');

  const daoData = {
    userStats: {
      votingPower: "1.66%",
      poolContribution: "2.5 ETH",
      votesParticipated: 45,
      proposalsCreated: 3
    },
    poolStats: {
      totalSize: "150.5 ETH",
      activeMembers: 234,
      totalClaims: "25.5 ETH",
      averageVotingRate: "76%"
    },
    activeProposals: [
      {
        id: "PROP-001",
        title: "Increase Coverage Limit",
        description: "Proposal to increase maximum coverage from 5 ETH to 8 ETH per member",
        type: "Pool Management",
        creator: "0x1234...5678",
        status: "Active",
        timeLeft: "12 hours",
        votes: {
          yes: 156,
          no: 45,
          required: 250,
          quorum: "62.4%"
        },
        yourVote: null
      },
      {
        id: "PROP-002",
        title: "Adjust AI Confidence Threshold",
        type: "Claims Processing",
        description: "Lower AI confidence threshold for automatic approval from 60% to 55%",
        creator: "0x8765...4321",
        status: "Active",
        timeLeft: "2 days",
        votes: {
          yes: 89,
          no: 134,
          required: 250,
          quorum: "89.2%"
        },
        yourVote: "No"
      }
    ],
    pendingClaims: [
      {
        id: "CLM-004",
        type: "Fire Damage",
        amount: "3.2 ETH",
        submittedBy: "0x9876...5432",
        date: "2024-03-15",
        aiConfidence: 58,
        evidence: "ipfs://...",
        votes: {
          yes: 45,
          no: 12,
          required: 100,
          timeLeft: "24 hours"
        },
        yourVote: null
      }
    ],
    recentActivity: [
      {
        id: 1,
        type: "Claim Approved",
        description: "Claim CLM-003 approved with 75% votes",
        amount: "2.1 ETH",
        time: "2 hours ago"
      },
      {
        id: 2,
        type: "New Proposal",
        description: "New proposal for adjusting premium calculation",
        time: "5 hours ago"
      }
    ]
  };

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

  const ClaimReviewCard = ({ claim }) => (
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
        <button className="view-evidence-btn">
          View Evidence
          <span className="evidence-link">{claim.evidence}</span>
        </button>
        {!claim.yourVote && (
          <div className="vote-buttons">
            <button className="approve-btn">Approve Claim</button>
            <button className="reject-btn">Reject Claim</button>
          </div>
        )}
      </div>
    </div>
  );

  const ActivityFeed = ({ activities }) => (
    <div className="activity-feed">
      {activities.map(activity => (
        <div key={activity.id} className={`activity-item ${activity.type.toLowerCase().replace(' ', '-')}`}>
          <div className="activity-icon">
            {activity.type === 'Claim Approved' ? '✓' : '+'}
          </div>
          <div className="activity-content">
            <p className="activity-description">{activity.description}</p>
            <div>
              {activity.amount && (
                <span className="activity-amount">{activity.amount}</span>
              )}
              <span className="activity-time">{activity.time}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const handleButtonHover = (e) => {
    e.currentTarget.style.transform = 'translateY(-2px)';
  };

  const handleButtonLeave = (e) => {
    e.currentTarget.style.transform = 'translateY(0)';
  };

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
          className={`tab-btn ${activeTab === 'proposals' ? 'active' : ''}`}
          onClick={() => setActiveTab('proposals')}
        >
          Proposals
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
