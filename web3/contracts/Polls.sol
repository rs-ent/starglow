// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Polls is Ownable, ReentrancyGuard {
       
    enum PollCategory {
        PUBLIC,
        PRIVATE
    }
    
    struct PollOption {
        string optionId;
        string name;
        string shorten;
        string description;
        string imgUrl;
        string youtubeUrl;
    }
    
    struct BasicInfo {
        string title;
        string titleShorten;
        string description;
        PollCategory category;
        string imgUrl;
        string youtubeUrl;
        string artistId;
    }
    
    struct TimeInfo {
        uint256 startDate;
        uint256 endDate;
        uint256 answerAnnouncementDate;
    }
    
    struct VisibilityInfo {
        bool exposeInScheduleTab;
        bool showOnPollPage;
        bool showOnStarPage;
    }
    
    struct TokenGatingInfo {
        bool needToken;
        string needTokenAddress;
    }
    
    struct BettingInfo {
        bool bettingMode;
        string bettingAssetId;
        uint256 minimumBet;
        uint256 maximumBet;
        uint256 houseCommissionRate;
        uint256 totalCommissionAmount;
        uint256 totalBettingAmount;
    }
    
    struct ParticipationInfo {
        bool allowMultipleVote;
        string participationRewardAssetId;
        uint256 participationRewardAmount;
        string participationConsumeAssetId;
        uint256 participationConsumeAmount;
    }
    
    struct AnswerInfo {
        bool hasAnswer;
        bool hasAnswerAnnouncement;
    }
    
    struct StatusInfo {
        bool isActive;
        bool test;
        address creator;
        uint256 createdAt;
        uint256 uniqueVoters;
        uint256 totalVotes;
    }
    
    struct Poll {
        uint256 pollId;
        BasicInfo basic;
        TimeInfo time;
        VisibilityInfo visibility;
        TokenGatingInfo tokenGating;
        BettingInfo betting;
        ParticipationInfo participation;
        AnswerInfo answer;
        StatusInfo status;
    }
    
    struct CreatePollParams {
        BasicInfo basic;
        TimeInfo time;
        VisibilityInfo visibility;
        TokenGatingInfo tokenGating;
        BettingInfo betting;
        ParticipationInfo participation;
        AnswerInfo answer;
        PollOption[] options;
        string[] requiredQuests;
        string[] answerOptionIds;
        bool test;
    }
    
    uint256 private _pollIdCounter;
    
    mapping(uint256 => Poll) public polls;
    mapping(uint256 => PollOption[]) public pollOptions;
    mapping(uint256 => string[]) public pollAnswerOptionIds;
    mapping(uint256 => string[]) public pollRequiredQuests;
    mapping(uint256 => mapping(string => uint256)) public optionBetAmounts;
    mapping(uint256 => mapping(string => bool)) public pollValidOptions;
    mapping(uint256 => mapping(string => uint256)) public optionVoteCounts;
    mapping(uint256 => mapping(string => uint256)) public optionActualVoteCounts;
    
    mapping(uint256 => uint256) private _resultCacheTimestamp;
    uint256 private constant CACHE_DURATION = 30;
    
    struct PollParticipation {
        uint256 pollId;
        address participant;
        string optionId;
        uint256 participatedAt;
        bool isBetting;
        string bettingAssetId;
        uint256 bettingAmount;
    }
    
    mapping(uint256 => PollParticipation) public pollParticipations;
    mapping(uint256 => mapping(address => uint256[])) public userParticipations;
    uint256 private _participationIdCounter;
    
    mapping(address => bool) public authorizedCallers;
    
    event PollCreated(
        uint256 indexed pollId,
        string title,
        PollCategory category,
        address indexed creator,
        uint256 startDate,
        uint256 endDate
    );
    
    event PollActiveChanged(
        uint256 indexed pollId,
        bool isActive,
        address indexed admin
    );
    
    event PollParticipated(
        uint256 indexed participationId,
        uint256 indexed pollId,
        address indexed participant,
        string optionId,
        bool isBetting,
        string bettingAssetId,
        uint256 bettingAmount,
        uint256 timestamp
    );
    
    event AuthorizedCallerUpdated(address indexed caller, bool authorized);
    
    constructor() Ownable(msg.sender) {}
    
    modifier validPoll(uint256 pollId) {
        require(polls[pollId].status.creator != address(0), "Poll does not exist");
        _;
    }
    
    modifier onlyAuthorized() {
        require(authorizedCallers[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }
    
    function setAuthorizedCaller(address caller, bool authorized) external onlyOwner {
        authorizedCallers[caller] = authorized;
        emit AuthorizedCallerUpdated(caller, authorized);
    }
    
    function setPollActive(uint256 pollId, bool _isActive) external onlyOwner {
        require(polls[pollId].status.creator != address(0), "Poll does not exist");
        require(polls[pollId].status.isActive != _isActive, "Already set to this status");
        
        polls[pollId].status.isActive = _isActive;
        
        emit PollActiveChanged(pollId, _isActive, msg.sender);
    }
    
    function createPoll(CreatePollParams memory params) external onlyOwner returns (uint256) {
        require(bytes(params.basic.title).length > 0, "Title cannot be empty");
        require(params.options.length > 0, "At least one option required");
        require(params.time.startDate < params.time.endDate, "Start date must be before end date");
        require(params.time.endDate > block.timestamp, "End date must be in the future");
        
        if (params.betting.bettingMode) {
            require(bytes(params.betting.bettingAssetId).length > 0, "Betting asset required for betting mode");
            require(params.betting.minimumBet > 0, "Minimum bet must be greater than 0");
            require(params.betting.maximumBet >= params.betting.minimumBet, "Maximum bet must be >= minimum bet");
        }
        

        
        _pollIdCounter++;
        uint256 newPollId = _pollIdCounter;
        
        Poll storage newPoll = polls[newPollId];
        newPoll.pollId = newPollId;
        
        newPoll.basic = params.basic;
        newPoll.time = params.time;
        newPoll.visibility = params.visibility;
        newPoll.tokenGating = params.tokenGating;
        newPoll.betting = params.betting;
        newPoll.betting.totalCommissionAmount = 0;
        newPoll.betting.totalBettingAmount = 0;
        newPoll.participation = params.participation;
        newPoll.answer = params.answer;
        newPoll.status.isActive = true;
        newPoll.status.test = params.test;
        newPoll.status.creator = msg.sender;
        newPoll.status.createdAt = block.timestamp;
        newPoll.status.uniqueVoters = 0;
        newPoll.status.totalVotes = 0;
        
        for (uint256 i = 0; i < params.options.length; i++) {
            require(bytes(params.options[i].optionId).length > 0, "Option ID cannot be empty");
            require(bytes(params.options[i].name).length > 0, "Option name cannot be empty");
            pollOptions[newPollId].push(params.options[i]);
            pollValidOptions[newPollId][params.options[i].optionId] = true;
        }
        
        for (uint256 i = 0; i < params.requiredQuests.length; i++) {
            pollRequiredQuests[newPollId].push(params.requiredQuests[i]);
        }
        
        for (uint256 i = 0; i < params.answerOptionIds.length; i++) {
            pollAnswerOptionIds[newPollId].push(params.answerOptionIds[i]);
        }
        
        _resultCacheTimestamp[newPollId] = 0;
        
        emit PollCreated(newPollId, params.basic.title, params.basic.category, msg.sender, params.time.startDate, params.time.endDate);
        
        return newPollId;
    }
    
    function getPoll(uint256 pollId) external view validPoll(pollId) returns (
        Poll memory poll,
        PollOption[] memory options,
        string[] memory requiredQuests,
        string[] memory answerOptionIds
    ) {
        return (
            polls[pollId],
            pollOptions[pollId],
            pollRequiredQuests[pollId],
            pollAnswerOptionIds[pollId]
        );
    }
    
    function getPollOptions(uint256 pollId) external view validPoll(pollId) returns (PollOption[] memory) {
        return pollOptions[pollId];
    }
    
    function getCurrentPollId() external view returns (uint256) {
        return _pollIdCounter;
    }
    
    function isPollActive(uint256 pollId) external view validPoll(pollId) returns (bool) {
        Poll memory poll = polls[pollId];
        return poll.status.isActive &&  
               block.timestamp >= poll.time.startDate && 
               block.timestamp <= poll.time.endDate;
    }
    
    struct PollOptionResult {
        string optionId;
        string name;
        uint256 voteCount;
        uint256 voteRate;
        uint256 actualVoteCount;
        uint256 bettingAmount;
        uint256 bettingRate;
    }
    
    struct PollOptionDetailResult {
        string optionId;
        string name;
        string shorten;
        string description;
        string imgUrl;
        string youtubeUrl;
        uint256 voteCount;
        uint256 voteRate;
        uint256 actualVoteCount;
        uint256 bettingAmount;
        uint256 bettingRate;
    }
    
    struct PollResult {
        uint256 pollId;
        uint256 totalVotes;
        uint256 uniqueVoters;
        uint256 totalBettingAmount;
        PollOptionResult[] results;
    }
    
    struct PollDetailResult {
        uint256 pollId;
        uint256 totalVotes;
        uint256 uniqueVoters;
        uint256 totalBettingAmount;
        PollOptionDetailResult[] results;
    }
    
    function getPollResult(uint256 pollId) external view validPoll(pollId) returns (PollResult memory) {
        Poll memory poll = polls[pollId];
        PollOption[] memory options = pollOptions[pollId];
        
        uint256 totalBettingAmount = _getTotalBettingAmount(pollId);
        uint256 totalVotes = poll.status.totalVotes;
        
        PollOptionResult[] memory results = new PollOptionResult[](options.length);
        
        for (uint256 i = 0; i < options.length; i++) {
            uint256 optionVotes = optionVoteCounts[pollId][options[i].optionId];
            uint256 optionActualVotes = optionActualVoteCounts[pollId][options[i].optionId];
            uint256 optionBettingAmount = optionBetAmounts[pollId][options[i].optionId];
            
            uint256 voteRate = totalVotes > 0 ? (optionVotes * 10000) / totalVotes : 0;
            uint256 bettingRate = totalBettingAmount > 0 ? (optionBettingAmount * 10000) / totalBettingAmount : 0;
            
            results[i] = PollOptionResult({
                optionId: options[i].optionId,
                name: options[i].name,
                voteCount: optionVotes,
                voteRate: voteRate,
                actualVoteCount: optionActualVotes,
                bettingAmount: optionBettingAmount,
                bettingRate: bettingRate
            });
        }
        
        return PollResult({
            pollId: pollId,
            totalVotes: totalVotes,
            uniqueVoters: poll.status.uniqueVoters,
            totalBettingAmount: totalBettingAmount,
            results: results
        });
    }
    
    function getPollDetailResult(uint256 pollId) external view validPoll(pollId) returns (PollDetailResult memory) {
        Poll memory poll = polls[pollId];
        PollOption[] memory options = pollOptions[pollId];
        
        uint256 totalBettingAmount = _getTotalBettingAmount(pollId);
        uint256 totalVotes = poll.status.totalVotes;
        
        PollOptionDetailResult[] memory results = new PollOptionDetailResult[](options.length);
        
        for (uint256 i = 0; i < options.length; i++) {
            uint256 optionVotes = optionVoteCounts[pollId][options[i].optionId];
            uint256 optionActualVotes = optionActualVoteCounts[pollId][options[i].optionId];
            uint256 optionBettingAmount = optionBetAmounts[pollId][options[i].optionId];
            
            uint256 voteRate = totalVotes > 0 ? (optionVotes * 10000) / totalVotes : 0;
            uint256 bettingRate = totalBettingAmount > 0 ? (optionBettingAmount * 10000) / totalBettingAmount : 0;
            
            results[i] = PollOptionDetailResult({
                optionId: options[i].optionId,
                name: options[i].name,
                shorten: options[i].shorten,
                description: options[i].description,
                imgUrl: options[i].imgUrl,
                youtubeUrl: options[i].youtubeUrl,
                voteCount: optionVotes,
                voteRate: voteRate,
                actualVoteCount: optionActualVotes,
                bettingAmount: optionBettingAmount,
                bettingRate: bettingRate
            });
        }
        
        return PollDetailResult({
            pollId: pollId,
            totalVotes: totalVotes,
            uniqueVoters: poll.status.uniqueVoters,
            totalBettingAmount: totalBettingAmount,
            results: results
        });
    }
    
    function _getTotalBettingAmount(uint256 pollId) private view returns (uint256) {
        if (block.timestamp - _resultCacheTimestamp[pollId] < CACHE_DURATION) {
            return polls[pollId].betting.totalBettingAmount;
        }
        
        PollOption[] memory options = pollOptions[pollId];
        uint256 totalBettingAmount = 0;
        
        for (uint256 i = 0; i < options.length; i++) {
            totalBettingAmount += optionBetAmounts[pollId][options[i].optionId];
        }
        
        return totalBettingAmount;
    }
    
    function _updateBettingCache(uint256 pollId, uint256 additionalAmount) private {
        polls[pollId].betting.totalBettingAmount += additionalAmount;
        _resultCacheTimestamp[pollId] = block.timestamp;
    }
    
    function getUserParticipations(uint256 pollId, address user) external view validPoll(pollId) returns (PollParticipation[] memory) {
        uint256[] memory participationIds = userParticipations[pollId][user];
        PollParticipation[] memory participations = new PollParticipation[](participationIds.length);
        
        for (uint256 i = 0; i < participationIds.length; i++) {
            participations[i] = pollParticipations[participationIds[i]];
        }
        
        return participations;
    }
    
    function getUserParticipationIds(uint256 pollId, address user) external view validPoll(pollId) returns (uint256[] memory) {
        return userParticipations[pollId][user];
    }
    
    function getParticipationById(uint256 participationId) external view returns (PollParticipation memory) {
        return pollParticipations[participationId];
    }

    function participatePoll(
        uint256 pollId,
        string calldata optionId,
        address participant,
        bool isBetting,
        string calldata bettingAssetId,
        uint256 bettingAmount
    ) external nonReentrant returns (uint256) {
        Poll storage poll = polls[pollId];
        
        require(poll.status.creator != address(0), "NOT_EXIST");
        require(poll.status.isActive, "NOT_ACTIVE");
        require(block.timestamp >= poll.time.startDate, "NOT_STARTED");
        require(block.timestamp <= poll.time.endDate, "ENDED");
        require(pollValidOptions[pollId][optionId], "INVALID_OPTION");
        
        if (!poll.participation.allowMultipleVote) {
            require(userParticipations[pollId][participant].length == 0, "ALREADY_PARTICIPATED");
        }
        
        _participationIdCounter++;
        uint256 participationId = _participationIdCounter;
        
        pollParticipations[participationId] = PollParticipation({
            pollId: pollId,
            participant: participant,
            optionId: optionId,
            participatedAt: block.timestamp,
            isBetting: isBetting,
            bettingAssetId: bettingAssetId,
            bettingAmount: bettingAmount
        });
        
        userParticipations[pollId][participant].push(participationId);
        
        optionVoteCounts[pollId][optionId] += 1;
        optionActualVoteCounts[pollId][optionId] += 1;
        
        if (isBetting) {
            optionBetAmounts[pollId][optionId] += bettingAmount;
            _updateBettingCache(pollId, bettingAmount);
        }
        
        poll.status.totalVotes += 1;
        if (userParticipations[pollId][participant].length == 1) {
            poll.status.uniqueVoters++;
        }
        
        emit PollParticipated(
            participationId,
            pollId,
            participant,
            optionId,
            isBetting,
            bettingAssetId,
            bettingAmount,
            block.timestamp
        );
        
        return participationId;
    }
}
