// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Pool {
    struct Claim {
        address claimant;
        uint256 amount;
        uint256 unlockTime;
        ClaimStatus status;
        bool exists;
    }

    struct Staker {
        uint256 balance;
        uint256 lastStakeTime;
        uint256 lockDuration; // Chosen lock-up period
    }

    enum ClaimStatus { Timelock, DAO_Voting, Claimed, Rejected }

    mapping(address => uint256) public premiumsPaid; // Track premiums paid by each user
    mapping(address => Staker) public stakers; // Track staking balances
    mapping(uint256 => Claim) public claims; // Track claims
    uint256 public claimCounter;
    uint256 public totalPremiums; // Total premium pool
    uint256 public totalStaked; // Total staked pool

    // Fixed durations and interest rates for staking
    uint256 public constant ONE_MONTH = 30 days;
    uint256 public constant SIX_MONTHS = 180 days;
    uint256 public constant ONE_YEAR = 365 days;

    uint256 public constant ONE_MONTH_RATE = 3; // 0.3%
    uint256 public constant SIX_MONTHS_RATE = 20; // 2%
    uint256 public constant ONE_YEAR_RATE = 50; // 5%

    // Fixed claim time lock duration
    uint256 public constant CLAIM_TIME_LOCK = 2 days;

    // Events
    event PremiumPaid(address indexed user, uint256 amount);
    event TokensStaked(address indexed staker, uint256 amount, uint256 lockTime, uint256 duration);
    event StakeWithdrawn(address indexed staker, uint256 amount, bool interestEarned);
    event ClaimInitiated(uint256 claimId, address indexed claimant, uint256 amount, uint256 unlockTime);
    event ClaimCancelled(uint256 claimId);
    event ClaimApproved(uint256 claimId, address indexed claimant, uint256 amount);
    event ClaimRejected(uint256 claimId);

    // Premium payment function
    function payPremium(uint256 amount) external {
        require(amount > 0, "Amount must be greater than zero");
        premiumsPaid[msg.sender] += amount;
        totalPremiums += amount;
        emit PremiumPaid(msg.sender, amount);
    }

    // Stake tokens with a chosen lock-up period
    function stakeTokens(uint256 amount, uint256 duration) external {
        require(amount > 0, "Amount must be greater than zero");
        require(duration == ONE_MONTH || duration == SIX_MONTHS || duration == ONE_YEAR, "Invalid duration");

        stakers[msg.sender].balance += amount;
        stakers[msg.sender].lastStakeTime = block.timestamp;
        stakers[msg.sender].lockDuration = duration;
        totalStaked += amount;

        uint256 lockTime = block.timestamp + duration;
        emit TokensStaked(msg.sender, amount, lockTime, duration);
    }

    // Withdraw staked tokens after lock-up period
    function withdrawStake(uint256 amount) external {
        require(amount > 0, "Amount must be greater than zero");
        require(stakers[msg.sender].balance >= amount, "Insufficient balance");

        Staker storage staker = stakers[msg.sender];
        bool interestEarned = block.timestamp >= staker.lastStakeTime + staker.lockDuration;

        if (interestEarned) {
            // Add interest to the user's withdrawal amount
            uint256 interestRate = getInterestRate(staker.lockDuration);
            uint256 interest = (amount * interestRate) / 1000;
            staker.balance -= amount;
            totalStaked -= amount;

            emit StakeWithdrawn(msg.sender, amount + interest, true);
        } else {
            // Forfeit interest
            staker.balance -= amount;
            totalStaked -= amount;

            emit StakeWithdrawn(msg.sender, amount, false);
        }
    }

    // Get interest rate based on lock-up duration
    function getInterestRate(uint256 duration) public pure returns (uint256) {
        if (duration == ONE_MONTH) return ONE_MONTH_RATE;
        if (duration == SIX_MONTHS) return SIX_MONTHS_RATE;
        if (duration == ONE_YEAR) return ONE_YEAR_RATE;
        return 0;
    }

    // Initiate a claim with time lock
    function initiateClaim(address claimant, uint256 amount) external returns (uint256) {
        require(amount > 0, "Amount must be greater than zero");
        require(premiumsPaid[claimant] > 0, "User must pay a premium to initiate a claim");

        uint256 unlockTime = block.timestamp + CLAIM_TIME_LOCK;
        claimCounter++;

        claims[claimCounter] = Claim({
            claimant: claimant,
            amount: amount,
            unlockTime: unlockTime,
            status: ClaimStatus.Timelock,
            exists: true
        });

        emit ClaimInitiated(claimCounter, claimant, amount, unlockTime);
        return claimCounter;
    }

    // Approve the claim after DAO voting
    function approveClaim(uint256 claimId) external {
        Claim storage claim = claims[claimId];
        require(claim.exists, "Claim does not exist");
        require(block.timestamp >= claim.unlockTime, "Claim is still in timelock");
        require(claim.status == ClaimStatus.Timelock, "Claim not in timelock status");

        claim.status = ClaimStatus.Claimed;

        // Deduct claim amount from the premium pool
        require(totalPremiums >= claim.amount, "Insufficient funds in the pool");
        totalPremiums -= claim.amount;

        emit ClaimApproved(claimId, claim.claimant, claim.amount);
    }

    // Reject the claim during DAO voting
    function rejectClaim(uint256 claimId) external {
        Claim storage claim = claims[claimId];
        require(claim.exists, "Claim does not exist");
        require(claim.status == ClaimStatus.Timelock || claim.status == ClaimStatus.DAO_Voting, "Claim cannot be rejected");

        claim.status = ClaimStatus.Rejected;
        emit ClaimRejected(claimId);
    }

    // Cancel the claim before execution
    function cancelClaim(uint256 claimId) external {
        Claim storage claim = claims[claimId];
        require(claim.exists, "Claim does not exist");
        require(claim.status == ClaimStatus.Timelock, "Claim cannot be cancelled at this stage");

        claim.status = ClaimStatus.Rejected;
        emit ClaimCancelled(claimId);
    }
}
