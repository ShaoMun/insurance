// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./DAO.sol";

contract Pool {
    DAO public dao;
    uint256 public constant TIMELOCK_DURATION = 2 days;
    uint256 public totalAppealFees;

    struct Plan {
        uint256 id;
        string name;
        uint256 premium;
        uint256 coverageAmount;
    }

    struct User {
        uint256 totalPremiumPaid;
        uint256 coverage;
    }

    struct Staker {
        uint256 balance;
        uint256 stakingTime;
        uint256 lockDuration;
        uint256 unlockTime;
    }

    struct Claim {
        address claimant;
        uint256 amount;
        uint256 unlockTime;
        ClaimStatus status;
        string evidenceURI;
        bool exists;
    }

    enum ClaimStatus { Timelock, DAO_Voting, Claimed, Rejected }

    mapping(address => User) public users;
    mapping(address => Staker) public stakers;
    mapping(uint256 => Claim) public claims;
    uint256 public claimCounter;
    uint256 public totalPremiums;
    uint256 public totalStaked;
    Plan[] public plans;

    event PremiumPaid(address indexed user, uint256 amount, uint256 coverage);
    event ClaimInitiated(uint256 claimId, address indexed claimant, uint256 amount, uint256 unlockTime, string evidenceURI);
    event ClaimApproved(uint256 claimId, address indexed claimant, uint256 amount);
    event ClaimRejected(uint256 claimId);
    event StakeDeposited(address indexed user, uint256 amount, uint256 lockDuration);
    event StakeWithdrawn(address indexed user, uint256 amount, bool withInterest);

    constructor() {
        _addPlan("Basic Shield", 0.01 ether, 5 ether);
        _addPlan("Premium Guard", 0.02 ether, 10 ether);
        _addPlan("Ultimate Protection", 0.03 ether, 20 ether);
    }

    function setDAO(address _daoAddress) external {
        require(address(dao) == address(0), "DAO already set");
        dao = DAO(payable(_daoAddress));
    }

    function _addPlan(string memory name, uint256 premium, uint256 coverageAmount) internal {
        plans.push(Plan({
            id: plans.length,
            name: name,
            premium: premium,
            coverageAmount: coverageAmount
        }));
    }

    function payPremium(uint256 planId) external payable {
        require(planId < plans.length, "Invalid plan ID");
        Plan memory plan = plans[planId];
        require(msg.value == plan.premium, "Incorrect premium amount");

        users[msg.sender].totalPremiumPaid += msg.value;
        users[msg.sender].coverage = plan.coverageAmount;
        totalPremiums += msg.value;

        emit PremiumPaid(msg.sender, msg.value, plan.coverageAmount);
    }

    function submitClaim(uint256 amount, string memory evidenceURI, uint256 aiConfidence) external {
        require(users[msg.sender].coverage >= amount, "Insufficient coverage");
        
        claimCounter++;
        claims[claimCounter] = Claim({
            claimant: msg.sender,
            amount: amount,
            unlockTime: block.timestamp + TIMELOCK_DURATION,
            status: ClaimStatus.Timelock,
            evidenceURI: evidenceURI,
            exists: true
        });

        if (aiConfidence >= dao.AI_APPROVAL_THRESHOLD()) {
            dao.createProposal(claimCounter, evidenceURI, aiConfidence);
        }

        emit ClaimInitiated(claimCounter, msg.sender, amount, block.timestamp + TIMELOCK_DURATION, evidenceURI);
    }

    function approveClaimByDAO(uint256 claimId) external {
        require(msg.sender == address(dao), "Only DAO can approve");
        Claim storage claim = claims[claimId];
        require(claim.exists, "Claim does not exist");
        require(claim.status == ClaimStatus.Timelock, "Invalid claim status");

        claim.status = ClaimStatus.Claimed;
        require(totalPremiums >= claim.amount, "Insufficient premiums");
        totalPremiums -= claim.amount;
        
        (bool success, ) = payable(claim.claimant).call{value: claim.amount}("");
        require(success, "Transfer failed");

        emit ClaimApproved(claimId, claim.claimant, claim.amount);
    }

    function rejectClaimByDAO(uint256 claimId) external {
        require(msg.sender == address(dao), "Only DAO can reject");
        Claim storage claim = claims[claimId];
        require(claim.exists, "Claim does not exist");
        claim.status = ClaimStatus.Rejected;
        emit ClaimRejected(claimId);
    }

    function stake(uint256 duration) external payable {
        require(msg.value > 0, "Must stake something");
        require(
            duration == 30 days || 
            duration == 180 days || 
            duration == 365 days, 
            "Invalid duration"
        );
        
        stakers[msg.sender].balance += msg.value;
        stakers[msg.sender].stakingTime = block.timestamp;
        stakers[msg.sender].lockDuration = duration;
        stakers[msg.sender].unlockTime = block.timestamp + duration;
        totalStaked += msg.value;

        emit StakeDeposited(msg.sender, msg.value, duration);
    }

    function unstake() external {
        Staker storage staker = stakers[msg.sender];
        require(staker.balance > 0, "No stake to withdraw");
        
        uint256 amount = staker.balance;
        uint256 stakingDuration = block.timestamp - staker.stakingTime;
        bool withInterest = stakingDuration >= staker.lockDuration;
        
        uint256 totalAmount = amount;
        if (withInterest) {
            totalAmount += _calculateInterest(amount, staker.lockDuration);
        }
        
        staker.balance = 0;
        staker.stakingTime = 0;
        staker.lockDuration = 0;
        staker.unlockTime = 0;
        totalStaked -= amount;

        (bool success, ) = payable(msg.sender).call{value: totalAmount}("");
        require(success, "Transfer failed");

        emit StakeWithdrawn(msg.sender, totalAmount, withInterest);
    }

    function _calculateInterest(uint256 amount, uint256 duration) internal pure returns (uint256) {
        if (duration == 30 days) return (amount * 3) / 1000;
        if (duration == 180 days) return (amount * 20) / 1000;
        if (duration == 365 days) return (amount * 50) / 1000;
        return 0;
    }

    receive() external payable {
        require(msg.sender == address(dao), "Only DAO can send funds");
        totalAppealFees += msg.value;
    }
}