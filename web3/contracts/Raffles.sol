// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Raffles is ReentrancyGuard, Ownable {
    struct RaffleBasicInfo {
        string title;
        string description;
        string imageUrl;
        string iconUrl;
    }
    
    struct RaffleTiming {
        uint256 startDate;
        uint256 endDate;
        bool instantDraw;
        uint256 drawDate;
    }
    
    struct RaffleSettings {
        bool dynamicWeight;
        uint256 participationLimit;
        uint256 participationLimitPerPlayer;
    }
    
    struct RaffleFee {
        string participationFeeAsset;
        string participationFeeAssetId;
        int256 participationFeeAmount;
    }
    
    struct RaffleCreateParams {
        RaffleBasicInfo basicInfo;
        RaffleTiming timing;
        RaffleSettings settings;
        RaffleFee fee;
        Prize[] prizes;
    }

    struct RaffleStatus {
        bool isActive;
        bool isDrawn;
        uint256 totalQuantity;
        uint256 remainingQuantity;
    }

    struct Raffle {
        RaffleBasicInfo basicInfo;
        RaffleTiming timing;
        RaffleSettings settings;
        RaffleFee fee;
        RaffleStatus status;
        Prize[] prizes;
    }

    enum PrizeType {
        EMPTY,
        ASSET,
        NFT,
        TOKEN
    }

    struct Prize {
        PrizeType prizeType;
        address collectionAddress;
        uint256 registeredTicketQuantity;
        uint256 pickedTicketQuantity;
        uint256 order;
        uint256 rarity;
        uint256 prizeQuantity;
        uint256 startTicketNumber;
        
        string title;
        string description;
        string imageUrl;
        string iconUrl;
        string assetId;
        uint256[] tokenIds;
    }

    struct Participant {
        address player;
        uint256 raffleId;
        bytes32 lotteryTicketNumber;
        uint256 participatedAt;
    }
    
    struct LotteryResult {
        address player;
        bool claimed;
        bytes32 lotteryTicketNumber;
        uint256 raffleId;
        uint256 prizeIndex;
        uint256 drawnAt;
        uint256 claimedAt;
    }
    
    mapping(uint256 => Raffle) public raffles;
    uint256 private _raffleIdCounter = 1;
    
    mapping(uint256 => Participant) public participants;
    uint256 private _participantIdCounter = 1;

    mapping(uint256 => uint256[]) public raffleParticipants;
    mapping(uint256 => mapping(address => uint256)) public playerParticipationCount;

    mapping(uint256 => LotteryResult) public lotteryResults;
    uint256 private _lotteryResultIdCounter = 1;

    uint256 constant TICKET_BLOCK_SIZE = 1000;
    mapping(uint256 => mapping(uint256 => uint256)) public raffleTicketBlocks;
    mapping(uint256 => mapping(uint256 => bool)) public excludedTickets;

    bool public paused;
    mapping(address => bool) public admins;
    
    uint256 public constant MIN_RAFFLE_DURATION = 1 hours;
    uint256 public constant MIN_DRAW_DELAY = 30 minutes;
    
    constructor() Ownable(msg.sender) {
        admins[msg.sender] = true;
    }

    modifier onlyAdmin() {
        require(admins[msg.sender], "Not Authorized");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }

    event AdminAdded(address indexed admin);
    event AdminRemoved(address indexed admin);
    event ContractPaused();
    event ContractUnpaused();

    function addAdmin(address admin) external onlyOwner {
        require(admin != address(0), "INVALID_ADDRESS");
        require(!admins[admin], "ALREADY_ADMIN");
        admins[admin] = true;
        emit AdminAdded(admin);
    }

    function removeAdmin(address admin) external onlyOwner {
        require(admin != address(0), "INVALID_ADDRESS");
        require(admins[admin], "NOT_ADMIN");
        require(admin != owner(), "CANNOT_REMOVE_OWNER");
        admins[admin] = false;
        emit AdminRemoved(admin);
    }

    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
        if (_paused) {
            emit ContractPaused();
        } else {
            emit ContractUnpaused();
        }
    }

    event RaffleCreated(uint256 indexed raffleId);
    event RaffleCancelled(uint256 indexed raffleId, string reason);
    event RaffleStatusChanged(uint256 indexed raffleId, bool isActive, address indexed admin);
    event PrizeClaimed(
        uint256 indexed resultId,
        uint256 indexed raffleId, 
        address indexed player,
        uint256 prizeIndex,
        string prizeTitle,
        uint256 timestamp
    );
    event PrizeDelivered(
        uint256 indexed resultId,
        address indexed admin,
        string deliveryMethod,
        string trackingInfo,
        uint256 timestamp
    );
    event RefundRequested(
        uint256 indexed raffleId,
        address indexed player,
        string reason,
        uint256 timestamp
    );
    event RefundProcessed(
        uint256 indexed raffleId,
        address indexed player,
        address indexed processedBy,
        string method,
        uint256 timestamp
    );

    function cancelRaffle(uint256 raffleId, string memory reason) external onlyAdmin whenNotPaused {
        Raffle storage raffle = raffles[raffleId];
        require(raffle.status.isActive, "RAFFLE_NOT_ACTIVE");
        require(!raffle.status.isDrawn, "ALREADY_DRAWN");
        require(bytes(reason).length > 0, "REASON_REQUIRED");
        
        raffle.status.isActive = false;
        raffle.status.isDrawn = true;
        
        emit RaffleCancelled(raffleId, reason);
    }

    function setRaffleActive(uint256 raffleId, bool _isActive) external onlyAdmin whenNotPaused {
        Raffle storage raffle = raffles[raffleId];
        require(raffle.timing.startDate > 0, "RAFFLE_NOT_EXISTS");
        require(!raffle.status.isDrawn, "RAFFLE_ALREADY_DRAWN");
        require(raffle.status.isActive != _isActive, "ALREADY_SET");
        
        raffle.status.isActive = _isActive;
        
        emit RaffleStatusChanged(raffleId, _isActive, msg.sender);
    }

    function markPrizeDelivered(
        uint256 resultId,
        string memory deliveryMethod,
        string memory trackingInfo
    ) external onlyAdmin whenNotPaused {
        LotteryResult storage result = lotteryResults[resultId];
        require(result.drawnAt > 0, "PRIZE_NOT_DRAWN");
        require(!result.claimed, "ALREADY_DELIVERED");
        require(bytes(deliveryMethod).length > 0, "DELIVERY_METHOD_REQUIRED");
        
        result.claimed = true;
        result.claimedAt = block.timestamp;
        
        Raffle storage raffle = raffles[result.raffleId];
        require(result.prizeIndex < raffle.prizes.length, "INVALID_PRIZE_INDEX");
        
        emit PrizeClaimed(
            resultId,
            result.raffleId,
            result.player,
            result.prizeIndex,
            raffle.prizes[result.prizeIndex].title,
            block.timestamp
        );
        
        emit PrizeDelivered(
            resultId,
            msg.sender,
            deliveryMethod,
            trackingInfo,
            block.timestamp
        );
    }

    function requestRefund(uint256 raffleId, string memory reason) external whenNotPaused {
        require(playerParticipationCount[raffleId][msg.sender] > 0, "NOT_PARTICIPATED");
        require(bytes(reason).length > 0, "REASON_REQUIRED");
        
        emit RefundRequested(
            raffleId,
            msg.sender,
            reason,
            block.timestamp
        );
    }

    function processRefund(
        uint256 raffleId,
        address player,
        string memory method
    ) external onlyAdmin whenNotPaused {
        require(playerParticipationCount[raffleId][player] > 0, "PLAYER_NOT_PARTICIPATED");
        require(bytes(method).length > 0, "METHOD_REQUIRED");
        
        emit RefundProcessed(
            raffleId,
            player,
            msg.sender,
            method,
            block.timestamp
        );
    }
    function createRaffle(
        RaffleCreateParams memory params
    ) external onlyAdmin whenNotPaused returns (uint256) {
        require(bytes(params.basicInfo.title).length > 0, "TITLE_REQUIRED");
        require(params.timing.endDate > params.timing.startDate, "INVALID_DATE");
        require(params.timing.endDate - params.timing.startDate >= MIN_RAFFLE_DURATION, "RAFFLE_TOO_SHORT");
        require(params.timing.drawDate >= params.timing.endDate + MIN_DRAW_DELAY, "DRAW_TOO_EARLY");
        require(params.timing.startDate >= block.timestamp, "START_DATE_IN_PAST");

        uint256 raffleId = _raffleIdCounter++;

        Raffle storage newRaffle = raffles[raffleId];
        newRaffle.basicInfo = params.basicInfo;
        newRaffle.timing = params.timing;
        newRaffle.settings = params.settings;
        newRaffle.fee = params.fee;

        newRaffle.status.isActive = true;
        newRaffle.status.isDrawn = false;
        newRaffle.status.totalQuantity = 0;
        newRaffle.status.remainingQuantity = 0;

        return _initializeRafflePrizes(raffleId, newRaffle, params.prizes);
    }
    
    function _initializeRafflePrizes(
        uint256 raffleId,
        Raffle storage newRaffle,
        Prize[] memory prizes
    ) private returns (uint256) {
        uint256 ticketNumber = 0;
        uint256 prizesLength = prizes.length;
        
        for (uint256 i = 0; i < prizesLength;) {
            prizes[i].pickedTicketQuantity = 0;
            prizes[i].startTicketNumber = ticketNumber;
            
            _createTicketBlocks(raffleId, i, ticketNumber, prizes[i].registeredTicketQuantity);
            
            newRaffle.prizes.push(prizes[i]);
            newRaffle.status.totalQuantity += prizes[i].registeredTicketQuantity;
            ticketNumber += prizes[i].registeredTicketQuantity;
            
            unchecked { ++i; }
        }

        newRaffle.status.remainingQuantity = newRaffle.status.totalQuantity;

        emit RaffleCreated(raffleId);

        return raffleId;
    }

    event Participated(
        uint256 indexed raffleId, 
        address indexed player, 
        uint256 participantId,
        bytes32 ticketNumber,
        uint256 timestamp
    );
    function participate(uint256 raffleId, address player) external nonReentrant whenNotPaused returns (uint256) {
        Raffle memory raffle = raffles[raffleId];
        
        require(raffle.status.isActive, "RAFFLE_NOT_ACTIVE");
        require(block.timestamp >= raffle.timing.startDate, "RAFFLE_NOT_STARTED");
        require(block.timestamp <= raffle.timing.endDate, "RAFFLE_ENDED");
        require(!raffle.status.isDrawn, "RAFFLE_ENDED");
        require(raffle.status.remainingQuantity > 0, "RAFFLE_ENDED");

        if (raffle.settings.participationLimit > 0) {
            require(
                raffleParticipants[raffleId].length < raffle.settings.participationLimit,
                "PARTICIPATION_LIMIT_REACHED"
            );
        }

        if (raffle.settings.participationLimitPerPlayer > 0) {
            require(
                playerParticipationCount[raffleId][player] < raffle.settings.participationLimitPerPlayer,
                "PARTICIPATION_LIMIT_REACHED"
            );
        }

        bytes32 ticketNumber = _generateSecureRandom(
            player,
            raffleId,
            _participantIdCounter
        );

        uint256 participantId = _participantIdCounter++;
        participants[participantId] = Participant({
            player: player,
            raffleId: raffleId,
            lotteryTicketNumber: ticketNumber,
            participatedAt: block.timestamp
        });

        raffleParticipants[raffleId].push(participantId);
        playerParticipationCount[raffleId][player]++;

        emit Participated(raffleId, player, participantId, ticketNumber, block.timestamp);

        return participantId;
    }

    event LotteryDrawn(
        uint256 indexed resultId, 
        uint256 indexed raffleId, 
        address indexed player, 
        uint256 participantId, 
        uint256 prizeIndex,
        bytes32 ticketNumber,
        uint256 randomValue,
        uint256 timestamp
    );
    
    function draw(uint256 raffleId, uint256 participantId) external nonReentrant whenNotPaused returns (uint256) {
        Raffle storage raffle = raffles[raffleId];
        
        require(!raffle.status.isDrawn, "ALREADY_DRAWN");
        require(raffle.timing.instantDraw || block.timestamp >= raffle.timing.drawDate, "TOO_EARLY");
        require(raffle.status.remainingQuantity > 0, "RAFFLE_ENDED");

        return _drawForParticipant(participantId, raffle, 0, raffleId);
    }

    function batchDraw(uint256 raffleId, uint256 startIndex, uint256 maxCount) external onlyAdmin nonReentrant whenNotPaused returns (uint256[] memory) {
        Raffle storage raffle = raffles[raffleId];
        
        require(!raffle.status.isDrawn, "ALREADY_DRAWN");
        require(block.timestamp >= raffle.timing.drawDate, "TOO_EARLY");
        
        uint256[] memory participantIds = raffleParticipants[raffleId];
        uint256 participantCount = participantIds.length;
        
        require(startIndex < participantCount, "START_INDEX_OUT_OF_BOUNDS");
        
        uint256 endIndex = startIndex + maxCount;
        if (endIndex > participantCount) {
            endIndex = participantCount;
        }
        
        uint256 processCount = endIndex - startIndex;
        uint256[] memory prizeIndices = new uint256[](processCount);
        
        for (uint256 i = 0; i < processCount;) {
            uint256 prizeIndex = _drawForParticipant(
                participantIds[startIndex + i],
                raffle,
                startIndex + i,
                raffleId
            );
            prizeIndices[i] = prizeIndex;
            
            unchecked { ++i; }
        }

        return prizeIndices;
    }

    function _drawForParticipant(
        uint256 participantId,
        Raffle storage raffle,
        uint256 nonce,
        uint256 raffleId
    ) private returns (uint256) {
        Participant memory participant = participants[participantId];
        require(participant.player != address(0), "INVALID_PARTICIPANT");

        bytes32 randomSeed = _generateSecureRandom(
            participant.player,
            raffleId,
            participantId + nonce
        );
        
        uint256 randomValue = uint256(randomSeed) % raffle.status.totalQuantity;
        uint256 prizeIndex = _selectPrize(raffle, randomValue, raffleId);

        if (raffle.settings.dynamicWeight) {
            raffle.prizes[prizeIndex].pickedTicketQuantity++;
            raffle.status.totalQuantity--;
        }
        
        uint256 resultId = _lotteryResultIdCounter++;
        lotteryResults[resultId] = LotteryResult({
            lotteryTicketNumber: participant.lotteryTicketNumber,
            player: participant.player,
            raffleId: raffleId,
            prizeIndex: prizeIndex,
            drawnAt: block.timestamp,
            claimed: false,
            claimedAt: 0
        });

        raffle.status.remainingQuantity--;

        if (raffle.status.remainingQuantity == 0) {
            raffle.status.isDrawn = true;
        }
        
        emit LotteryDrawn(
            resultId,
            participant.raffleId,
            participant.player,
            participantId,
            prizeIndex,
            participant.lotteryTicketNumber,
            randomValue,
            block.timestamp
        );

        return prizeIndex;
    }

    function _selectPrize(
        Raffle storage raffle,
        uint256 randomValue,
        uint256 raffleId
    ) private view returns (uint256) {
        if (raffle.settings.dynamicWeight) {
            return _selectPrizeDynamic(raffle, randomValue, raffleId);
        } else {
            return _selectPrizeStatic(raffleId, randomValue);
        }
    }

    function _selectPrizeStatic(
        uint256 raffleId,
        uint256 randomValue
    ) private view returns (uint256) {
        uint256 blockIndex = randomValue / TICKET_BLOCK_SIZE;
        return raffleTicketBlocks[raffleId][blockIndex];
    }

    function _selectPrizeDynamic(
        Raffle storage raffle,
        uint256 randomValue,
        uint256 raffleId
    ) private view returns (uint256) {
        uint256 maxRetries = 10;
        
        for (uint256 retry = 0; retry < maxRetries;) {
            uint256 blockIndex = (randomValue + retry) / TICKET_BLOCK_SIZE;
            uint256 candidatePrize = raffleTicketBlocks[raffleId][blockIndex];
            
            if (candidatePrize < raffle.prizes.length) {
                Prize storage prize = raffle.prizes[candidatePrize];
                uint256 availableTickets = prize.registeredTicketQuantity - prize.pickedTicketQuantity;
                
                if (availableTickets > 0) {
                    uint256 ticketInPrize = (randomValue + retry) - prize.startTicketNumber;
                    if (ticketInPrize < availableTickets) {
                        return candidatePrize;
                    }
                }
            }
            
            unchecked { ++retry; }
        }
        
        return _selectPrizeLinear(raffle, randomValue);
    }

    function _selectPrizeLinear(
        Raffle storage raffle,
        uint256 randomValue
    ) private view returns (uint256) {
        uint256 currentStart = 0;
        uint256 prizesLength = raffle.prizes.length;
        
        for (uint256 i = 0; i < prizesLength;) {
            Prize storage prize = raffle.prizes[i];
            uint256 availableTickets = prize.registeredTicketQuantity - prize.pickedTicketQuantity;
            
            if (randomValue >= currentStart && randomValue < currentStart + availableTickets) {
                return i;
            }
            
            currentStart += availableTickets;
            
            unchecked { ++i; }
        }

        return prizesLength - 1;
    }

    function _createTicketBlocks(
        uint256 raffleId,
        uint256 prizeIndex,
        uint256 startTicket,
        uint256 ticketQuantity
    ) private {
        uint256 endTicket = startTicket + ticketQuantity;
        
        for (uint256 ticket = startTicket; ticket < endTicket;) {
            uint256 blockIndex = ticket / TICKET_BLOCK_SIZE;
            raffleTicketBlocks[raffleId][blockIndex] = prizeIndex;
            
            unchecked { ticket += TICKET_BLOCK_SIZE; }
        }
    }

    function _generateSecureRandom(
        address player,
        uint256 raffleId,
        uint256 nonce
    ) private view returns (bytes32) {
        return keccak256(
            abi.encode(
                player,
                raffleId,
                nonce,
                block.timestamp,
                block.prevrandao,
                blockhash(block.number - 1),
                blockhash(block.number - 2),
                block.coinbase,
                tx.origin,
                gasleft()
            )
        );
    }

    function getLotteryResult(uint256 resultId) external view returns (LotteryResult memory) {
        return lotteryResults[resultId];
    }

    function getUserParticipation(uint256 raffleId, address player) external view returns (uint256) {
        return playerParticipationCount[raffleId][player];
    }

    function getRaffleParticipants(uint256 raffleId) external view returns (uint256[] memory) {
        return raffleParticipants[raffleId];
    }

    function isAdmin(address account) external view returns (bool) {
        return admins[account];
    }

    function getRaffle(uint256 raffleId) external view returns (Raffle memory) {
        require(raffles[raffleId].timing.startDate > 0, "RAFFLE_NOT_EXISTS");
        return raffles[raffleId];
    }

    function getRaffleStatus(uint256 raffleId) external view returns (bool isActive, bool isDrawn, uint256 remainingQuantity) {
        Raffle memory raffle = raffles[raffleId];
        require(raffle.timing.startDate > 0, "RAFFLE_NOT_EXISTS");
        return (raffle.status.isActive, raffle.status.isDrawn, raffle.status.remainingQuantity);
    }
}