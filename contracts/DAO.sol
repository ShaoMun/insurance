// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IPool {
    function approveClaim(uint256 claimId) external;
    function rejectClaim(uint256 claimId) external;
    function getStakeWeight(address user) external view returns (uint256);
}

contract DAO {
    struct Member {
        uint256 premiumWeight; // Voting weight based on premiums paid
        bool isMember;
    }

    struct Proposal {
        uint256 claimId;
        int256 totalVotes; // Sum of positive (YES) and negative (NO) votes
        uint256 endTime;
        bool executed;
        address proposer; // Address that created the proposal
    }

    mapping(address => Member) public members; // DAO members
    mapping(uint256 => Proposal) public proposals; // Track proposals
    uint256 public proposalCounter;
    uint256 public minimumQuorum = 20; // Minimum quorum percentage
    uint256 public votingDuration = 3 days; // Duration for voting
    uint256 public proposalFee = 0.01 ether; // Fee for manually proposing a claim

    address public poolContract; // Address of the Insurance Pool contract
    address public aiProcessor; // Authorized AI processor address

    // Events
    event MemberJoined(address indexed member, uint256 premiumWeight);
    event ProposalCreated(uint256 indexed proposalId, uint256 claimId, address proposer, uint256 endTime);
    event VoteCast(uint256 indexed proposalId, address indexed voter, bool support, uint256 weight);
    event ProposalExecuted(uint256 indexed proposalId, bool approved);
    event AIProcessorUpdated(address newAIProcessor);
    event ProposalFeeUpdated(uint256 newFee);

    // Modifiers
    modifier onlyMember() {
        require(members[msg.sender].isMember, "Only DAO members can perform this action");
        _;
    }

    modifier onlyAIProcessor() {
        require(msg.sender == aiProcessor, "Only the AI processor can perform this action");
        _;
    }

    constructor(address _poolContract) {
        poolContract = _poolContract;
        aiProcessor = msg.sender; // Initially set the deployer as the AI processor
    }

    // Add a member to the DAO
    function joinDAO(address member, uint256 premiumWeight) external {
        require(!members[member].isMember, "Already a DAO member");
        members[member] = Member({ premiumWeight: premiumWeight, isMember: true });
        emit MemberJoined(member, premiumWeight);
    }

    // Propose a claim automatically after AI approval
    function proposeClaimAI(uint256 claimId) external onlyAIProcessor {
        proposalCounter++;
        proposals[proposalCounter] = Proposal({
            claimId: claimId,
            totalVotes: 0,
            endTime: block.timestamp + votingDuration,
            executed: false,
            proposer: msg.sender
        });

        emit ProposalCreated(proposalCounter, claimId, msg.sender, block.timestamp + votingDuration);
    }

    // Propose a claim manually by paying a fee
    function proposeClaimManual(uint256 claimId) external payable onlyMember {
        require(msg.value == proposalFee, "Incorrect proposal fee");

        proposalCounter++;
        proposals[proposalCounter] = Proposal({
            claimId: claimId,
            totalVotes: 0,
            endTime: block.timestamp + votingDuration,
            executed: false,
            proposer: msg.sender
        });

        emit ProposalCreated(proposalCounter, claimId, msg.sender, block.timestamp + votingDuration);
    }

    // Vote on a proposal
    function vote(uint256 proposalId, bool support) external onlyMember {
        Proposal storage proposal = proposals[proposalId];
        require(block.timestamp < proposal.endTime, "Voting period has ended");
        require(!proposal.executed, "Proposal already executed");

        uint256 premiumWeight = members[msg.sender].premiumWeight;
        uint256 stakeWeight = IPool(poolContract).getStakeWeight(msg.sender);
        uint256 totalWeight = premiumWeight + stakeWeight;

        // Add or subtract weight based on the vote
        if (support) {
            proposal.totalVotes += int256(totalWeight);
        } else {
            proposal.totalVotes -= int256(totalWeight);
        }

        emit VoteCast(proposalId, msg.sender, support, totalWeight);
    }

    // Execute the proposal after voting ends
    function executeProposal(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];
        require(block.timestamp >= proposal.endTime, "Voting period not ended");
        require(!proposal.executed, "Proposal already executed");

        // Ensure quorum is met
        require(
            uint256(proposal.totalVotes > 0 ? proposal.totalVotes : -proposal.totalVotes) >= (getTotalVotingWeight() * minimumQuorum) / 100,
            "Quorum not reached"
        );

        if (proposal.totalVotes > 0) {
            // Approve the claim
            IPool(poolContract).approveClaim(proposal.claimId);
        } else {
            // Reject the claim
            IPool(poolContract).rejectClaim(proposal.claimId);
        }

        proposal.executed = true;
        emit ProposalExecuted(proposalId, proposal.totalVotes > 0);
    }

    // Calculate the total voting weight
    function getTotalVotingWeight() public view returns (uint256) {
        uint256 totalWeight = 0;
        for (uint256 i = 1; i <= proposalCounter; i++) {
            if (!proposals[i].executed) {
                totalWeight += uint256(proposals[i].totalVotes > 0 ? proposals[i].totalVotes : -proposals[i].totalVotes);
            }
        }
        return totalWeight;
    }

    // Update AI processor address
    function setAIProcessor(address newAIProcessor) external onlyAIProcessor {
        aiProcessor = newAIProcessor;
        emit AIProcessorUpdated(newAIProcessor);
    }

    // Update proposal fee
    function updateProposalFee(uint256 newFee) external onlyAIProcessor {
        proposalFee = newFee;
        emit ProposalFeeUpdated(newFee);
    }
}
