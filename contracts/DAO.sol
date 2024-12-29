// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Pool.sol";

contract DAO {
    Pool public immutable pool;
    
    struct Proposal {
        int256 totalVotes;
        bool exists;
        uint256 aiConfidence;
        string evidenceURI;
        uint256 yesVotes;
        uint256 noVotes;
        uint256 timestamp;
        uint256 timelockEnd;
        bool isAppealProposal;
        mapping(address => bool) hasVoted;
    }

    uint256 public activeProposalCount;
    mapping(uint256 => Proposal) public proposals;
    
    uint256 public constant VOTING_DURATION = 3 days;
    uint256 public constant TIMELOCK_DURATION = 2 days;
    uint256 public constant QUORUM_PERCENTAGE = 51;
    uint256 public constant AI_APPROVAL_THRESHOLD = 60;
    uint256 public appealFee = 0.1 ether;

    event ProposalCreated(
        uint256 indexed claimId,
        string evidenceURI,
        uint256 aiConfidence,
        uint256 timestamp,
        bool isAppeal
    );
    
    event AppealSubmitted(
        uint256 indexed claimId,
        address indexed appellant,
        uint256 appealFee
    );

    event VoteSubmitted(
        uint256 indexed claimId,
        address indexed voter,
        bool vote,
        uint256 votingPower
    );
    
    event ProposalExecuted(
        uint256 indexed claimId,
        bool approved,
        uint256 finalYesVotes,
        uint256 finalNoVotes
    );

    modifier onlyPool() {
        require(msg.sender == address(pool), "Only pool can call this function");
        _;
    }

    modifier proposalExists(uint256 claimId) {
        require(proposals[claimId].exists, "Proposal does not exist");
        _;
    }

    modifier proposalDoesNotExist(uint256 claimId) {
        require(!proposals[claimId].exists, "Proposal already exists");
        _;
    }

    modifier hasNotVoted(uint256 claimId) {
        require(!proposals[claimId].hasVoted[msg.sender], "Already voted");
        _;
    }

    modifier withinTimelockPeriod(uint256 claimId) {
        require(
            block.timestamp <= proposals[claimId].timelockEnd,
            "Timelock period ended"
        );
        _;
    }

    modifier timelockEnded(uint256 claimId) {
        require(block.timestamp >= proposals[claimId].timelockEnd, "Timelock not ended");
        _;
    }

    modifier hasVotingPower() {
        require(calculateVotingPower(msg.sender) > 0, "No voting power");
        _;
    }

    constructor(address payable _poolAddress) {
        pool = Pool(_poolAddress);
    }

    function createProposal(
        uint256 claimId,
        string memory evidenceURI,
        uint256 aiConfidence
    ) external onlyPool proposalDoesNotExist(claimId) {
        require(aiConfidence >= AI_APPROVAL_THRESHOLD, "AI confidence too low");

        activeProposalCount++;

        Proposal storage newProposal = proposals[claimId];
        newProposal.exists = true;
        newProposal.aiConfidence = aiConfidence;
        newProposal.evidenceURI = evidenceURI;
        newProposal.timestamp = block.timestamp;
        newProposal.timelockEnd = block.timestamp + TIMELOCK_DURATION;
        newProposal.isAppealProposal = false;

        emit ProposalCreated(
            claimId,
            evidenceURI,
            aiConfidence,
            block.timestamp,
            false
        );
    }

    function submitAppeal(
        uint256 claimId,
        string memory evidenceURI,
        uint256 aiConfidence
    ) external payable proposalDoesNotExist(claimId) {
        require(aiConfidence < AI_APPROVAL_THRESHOLD, "AI confidence too high");
        require(msg.value >= appealFee, "Insufficient appeal fee");

        (bool success, ) = address(pool).call{value: msg.value}("");
        require(success, "Fee transfer failed");

        activeProposalCount++;

        Proposal storage newProposal = proposals[claimId];
        newProposal.exists = true;
        newProposal.aiConfidence = aiConfidence;
        newProposal.evidenceURI = evidenceURI;
        newProposal.timestamp = block.timestamp;
        newProposal.timelockEnd = block.timestamp + TIMELOCK_DURATION;
        newProposal.isAppealProposal = true;

        emit AppealSubmitted(claimId, msg.sender, msg.value);
        emit ProposalCreated(
            claimId,
            evidenceURI,
            aiConfidence,
            block.timestamp,
            true
        );
    }

    function submitVote(uint256 claimId, bool vote) external 
        proposalExists(claimId)
        hasNotVoted(claimId)
        withinTimelockPeriod(claimId)
        hasVotingPower 
    {
        Proposal storage proposal = proposals[claimId];
        require(!proposal.hasVoted[msg.sender], "Already voted");

        uint256 votingPower = calculateVotingPower(msg.sender);
        require(votingPower > 0, "No voting power");

        if (vote) {
            proposal.yesVotes += votingPower;
            proposal.totalVotes += int256(votingPower);
        } else {
            proposal.noVotes += votingPower;
            proposal.totalVotes -= int256(votingPower);
        }

        proposal.hasVoted[msg.sender] = true;

        emit VoteSubmitted(claimId, msg.sender, vote, votingPower);
    }

    function executeProposal(uint256 claimId) public 
        proposalExists(claimId)
        timelockEnded(claimId) 
    {
        Proposal storage proposal = proposals[claimId];

        bool approved = proposal.totalVotes > 0 && 
            isQuorumReached(proposal.yesVotes + proposal.noVotes);

        if (approved) {
            pool.approveClaimByDAO(claimId);
        } else {
            pool.rejectClaimByDAO(claimId);
        }

        activeProposalCount--;
        
        emit ProposalExecuted(
            claimId,
            approved,
            proposal.yesVotes,
            proposal.noVotes
        );
    }

    function calculateVotingPower(address user) public view returns (uint256) {
        (uint256 premiumPaid, ) = pool.users(user);
        (uint256 stakedAmount, , , ) = pool.stakers(user);
        uint256 userContribution = premiumPaid + stakedAmount;
        
        uint256 totalPoolSize = pool.totalPremiums() + pool.totalStaked() + pool.totalAppealFees();
        if (totalPoolSize == 0) return 0;
        
        return (userContribution * 100) / totalPoolSize;
    }

    function isQuorumReached(uint256 totalVotes) internal view returns (bool) {
        uint256 totalPossibleVotes = pool.totalPremiums() + pool.totalStaked();
        return totalVotes * 100 >= totalPossibleVotes * QUORUM_PERCENTAGE;
    }

    function setAppealFee(uint256 newFee) external onlyPool {
        appealFee = newFee;
    }

    receive() external payable {}
}