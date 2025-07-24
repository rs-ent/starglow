// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

contract RafflesV2 is ReentrancyGuard, AccessControl, Pausable {
    
    using EnumerableSet for EnumerableSet.UintSet;
    using EnumerableSet for EnumerableSet.AddressSet;
    
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    error AdminRoleRequired();
    error TitleRequired();
    error InvalidDate();
    error DrawBeforeEnd();
    error NoPrizes();
    error TotalTicketsZero();
    error TooManyTickets();
    error RaffleAlreadyActive();
    error RaffleAlreadyDrawn();
    error InvalidPrizeIndex();
    error PrizeAlreadyAllocated();
    error PrizeNotAllocated();
    error NotReadyToActive();
    error RaffleNotActive();
    error RaffleNotEnded();
    error PrizeZeroQuantity();
    error InstantDrawNotSupported();
    error DrawDateNotReached();
    error InvalidStartIndex();
    error RaffleEnded();
    error RaffleNotStarted();
    error NoTicketsAvailable();
    error MaxParticipantsReached();
    error MaxEntriesPerPlayerReached();
    error InvalidParticipant();
    error ParticipantRaffleMismatch();
    error AlreadyDrawn();
    error EmptyRaffleIds();
    error TooManyRaffles();
    error RaffleNotExists();
    
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }
    
    struct RaffleBasicInfo {
        string title;
        string description;
        string imageUrl;
        string iconUrl;
    }
    
    struct RaffleTiming {
        uint256 startDate;
        uint256 endDate;
        uint256 drawDate;
        bool instantDraw;
    }
    
    struct RaffleSettings {
        uint256 maxParticipants;
        uint256 maxEntriesPerPlayer;
        bool allowMultipleWins;
        bool dynamicWeight;
    }
    
    struct RaffleFee {
        int256 participationFeeAmount;
        string participationFeeAsset;
        string participationFeeAssetId;
    }
    
    struct Prize {
        uint256 quantity;
        uint256 prizeQuantity;
        uint256 rarity;
        uint256 order;
        uint256[] tokenIds;
        address collectionAddress;
        PrizeType prizeType;
        bool allocated;
        string title;
        string description;
        string imageUrl;
        string iconUrl;
        string assetId;
    }
    
    enum PrizeType {
        EMPTY,
        ASSET,
        NFT,
        TOKEN
    }
    
    struct Participant {
        uint256 raffleId;
        uint256 ticketNumber;
        uint256 participatedAt;
        uint256 drawnAt;
        uint256 claimedAt;
        address player;
        bool hasResult;
        bool claimed;
    }
    
    struct RaffleStatus {
        uint256 totalTickets;
        uint256 pickedTickets;
        uint256 drawnCount;
        bool isActive;
        bool isDrawn;
        bool readyToActive;
    }
    
    struct Raffle {
        RaffleBasicInfo basicInfo;
        RaffleTiming timing;
        RaffleSettings settings;
        RaffleFee fee;
        RaffleStatus status;
        Prize[] prizes;
    }
    
    struct RaffleCreateParams {
        RaffleBasicInfo basicInfo;
        RaffleTiming timing;
        RaffleSettings settings;
        RaffleFee fee;
        Prize[] prizes;
    }

    mapping(uint256 => Raffle) public raffles;
    uint256 private _raffleIdCounter = 1;

    EnumerableSet.UintSet private _activeRaffleIds;
    EnumerableSet.UintSet private _completedRaffleIds;
    
    mapping(uint256 => EnumerableSet.AddressSet) private _raffleParticipants;
    mapping(uint256 => uint256[]) public raffleParticipantIds;

    // 범위 기반 할당 구조체 추가
    struct AllocationRange {
        uint256 startTicket;
        uint256 endTicket;
        bool allocated;
    }
    
    // 범위 기반 할당 저장소 (새로운 효율적 방식)
    mapping(uint256 => mapping(uint256 => AllocationRange)) public prizeRanges;
    
    // 할당된 상품 수 추적
    mapping(uint256 => uint256) public allocatedPrizesCount;

    mapping(uint256 => uint256[]) public prizeStartTickets;
    // 기존 비효율적 방식 제거: mapping(uint256 => mapping(uint256 => uint256)) public ticketNumbers;
    mapping(uint256 => mapping(uint256 => bool)) public usedTickets;
    
    mapping(uint256 => Participant) public participants;
    uint256 private _participantIdCounter = 1;

    mapping(uint256 => mapping(address => uint256)) public playerParticipationCount;
    mapping(uint256 => mapping(address => uint256[])) public playerParticipantIds;
    
    modifier onlyAdmin() {
        if (!hasRole(ADMIN_ROLE, msg.sender)) revert AdminRoleRequired();
        _;
    }

    function grantAdminRole(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(ADMIN_ROLE, account);
    }

    function revokeAdminRole(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        revokeRole(ADMIN_ROLE, account);
    }

    function pause() external onlyAdmin {
        _pause();
    }

    function unpause() external onlyAdmin {
        _unpause();
    }

    function isAdmin(address account) external view returns (bool) {
        return hasRole(ADMIN_ROLE, account);
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function getActiveRaffleIds() external view returns (uint256[] memory) {
        return _activeRaffleIds.values();
    }

    function getCompletedRaffleIds() external view returns (uint256[] memory) {
        return _completedRaffleIds.values();
    }

    
    function getRaffleParticipants(uint256 raffleId) external view returns (address[] memory) {
        return _raffleParticipants[raffleId].values();
    }
    
    function getRaffleParticipantIds(uint256 raffleId) external view returns (uint256[] memory) {
        return raffleParticipantIds[raffleId];
    }

    function getTotalParticipationCount(uint256 raffleId) external view returns (uint256) {
        return raffleParticipantIds[raffleId].length;
    }

    function getUniqueParticipantCount(uint256 raffleId) external view returns (uint256) {
        return _raffleParticipants[raffleId].length();
    }

    function isRaffleActive(uint256 raffleId) external view returns (bool) {
        return _activeRaffleIds.contains(raffleId);
    }

    function hasParticipated(uint256 raffleId, address player) external view returns (bool) {
        return _raffleParticipants[raffleId].contains(player);
    }

    function getActiveRaffleCount() external view returns (uint256) {
        return _activeRaffleIds.length();
    }

    function getRaffleParticipantCount(uint256 raffleId) external view returns (uint256) {
        return raffleParticipantIds[raffleId].length;
    }

    event RaffleCreated(uint256 indexed raffleId, uint256 totalTickets);
    event PrizeAllocated(uint256 indexed raffleId, uint256 indexed prizeIndex, uint256 startTicket, uint256 endTicket);
    event PrizeDeallocated(uint256 indexed raffleId, uint256 indexed prizeIndex, uint256 startTicket, uint256 endTicket);
    event RaffleReadyToActive(uint256 indexed raffleId);
    event RaffleActivated(uint256 indexed raffleId);
    event RaffleCompleted(uint256 indexed raffleId);

    function createRaffle(
        RaffleCreateParams memory params
    ) external onlyAdmin whenNotPaused returns (uint256) {
        if (bytes(params.basicInfo.title).length == 0) revert TitleRequired();
        if (params.timing.endDate <= params.timing.startDate) revert InvalidDate();
        if (!params.timing.instantDraw && params.timing.drawDate < params.timing.endDate) revert DrawBeforeEnd();
        if (params.prizes.length == 0) revert NoPrizes();

        uint256 raffleId = _raffleIdCounter++;
        
        uint256 totalTickets = _calculateTotalTickets(params.prizes);
        if (totalTickets == 0) revert TotalTicketsZero();
        if (totalTickets > 1000000) revert TooManyTickets();

        Raffle storage newRaffle = raffles[raffleId];
        newRaffle.basicInfo = params.basicInfo;
        newRaffle.timing = params.timing;
        newRaffle.settings = params.settings;
        newRaffle.fee = params.fee;
        newRaffle.status.isActive = false;
        newRaffle.status.isDrawn = false;
        newRaffle.status.readyToActive = false;
        newRaffle.status.totalTickets = totalTickets;
        newRaffle.status.pickedTickets = 0;
        newRaffle.status.drawnCount = 0;

        uint256 currentStartTicket = 0;
        for (uint256 i = 0; i < params.prizes.length; i++) {
            Prize memory prize = params.prizes[i];
            prize.allocated = false;
            newRaffle.prizes.push(prize);
            
            prizeStartTickets[raffleId].push(currentStartTicket);
            currentStartTicket += prize.quantity;
        }

        emit RaffleCreated(raffleId, totalTickets);
        return raffleId;
    }

    function allocatePrize(uint256 raffleId, uint256 prizeIndex) external onlyAdmin whenNotPaused {
        Raffle storage raffle = raffles[raffleId];
        if (raffle.status.isActive) revert RaffleAlreadyActive();
        if (raffle.status.isDrawn) revert RaffleAlreadyDrawn();
        if (prizeIndex >= raffle.prizes.length) revert InvalidPrizeIndex();
        if (raffle.prizes[prizeIndex].allocated) revert PrizeAlreadyAllocated();

        uint256 startTicket = _calculateStartTicket(raffleId, prizeIndex);
        uint256 endTicket = startTicket + raffle.prizes[prizeIndex].quantity - 1;

        // 🚀 O(1) 범위 기반 할당! (기존 O(n) for loop 제거)
        prizeRanges[raffleId][prizeIndex] = AllocationRange({
            startTicket: startTicket,
            endTicket: endTicket,
            allocated: true
        });

        raffle.prizes[prizeIndex].allocated = true;
        allocatedPrizesCount[raffleId]++;
        
        emit PrizeAllocated(raffleId, prizeIndex, startTicket, endTicket);

        if (_checkAllPrizesAllocated(raffleId)) {
            raffle.status.readyToActive = true;
            emit RaffleReadyToActive(raffleId);
        }
    }

    function deallocatePrize(uint256 raffleId, uint256 prizeIndex) external onlyAdmin whenNotPaused {
        Raffle storage raffle = raffles[raffleId];
        if (raffle.status.isActive) revert RaffleAlreadyActive();
        if (raffle.status.isDrawn) revert RaffleAlreadyDrawn();
        if (prizeIndex >= raffle.prizes.length) revert InvalidPrizeIndex();
        if (!raffle.prizes[prizeIndex].allocated) revert PrizeNotAllocated();

        uint256 startTicket = _calculateStartTicket(raffleId, prizeIndex);
        uint256 endTicket = startTicket + raffle.prizes[prizeIndex].quantity - 1;

        // 🚀 O(1) 범위 기반 할당 해제! (기존 O(n) for loop 제거)
        delete prizeRanges[raffleId][prizeIndex];

        raffle.prizes[prizeIndex].allocated = false;
        allocatedPrizesCount[raffleId]--;
        
        if (raffle.status.readyToActive) {
            raffle.status.readyToActive = false;
        }
        
        emit PrizeDeallocated(raffleId, prizeIndex, startTicket, endTicket);
    }

    function _calculateStartTicket(uint256 raffleId, uint256 prizeIndex) private view returns (uint256) {
        if (prizeIndex >= prizeStartTickets[raffleId].length) revert InvalidPrizeIndex();
        return prizeStartTickets[raffleId][prizeIndex];
    }

    function _checkAllPrizesAllocated(uint256 raffleId) private view returns (bool) {
        Prize[] storage prizes = raffles[raffleId].prizes;
        
        for (uint256 i = 0; i < prizes.length; i++) {
            if (!prizes[i].allocated) {
                return false;
            }
        }
        
        return true;
    }

    function _getTicketPrize(uint256 raffleId, uint256 ticketNumber) private view returns (uint256) {
        Raffle storage raffle = raffles[raffleId];
        
        for (uint256 i = 0; i < raffle.prizes.length; i++) {
            AllocationRange storage allocation = prizeRanges[raffleId][i];
            if (allocation.allocated && 
                ticketNumber >= allocation.startTicket && 
                ticketNumber <= allocation.endTicket) {
                return i;
            }
        }
        
        return 0; // 기본적으로 첫 번째 상품 (실제로는 발생하지 않아야 함)
    }

    function activateRaffle(uint256 raffleId) external onlyAdmin whenNotPaused {
        Raffle storage raffle = raffles[raffleId];
        if (raffle.status.isActive) revert RaffleAlreadyActive();
        if (raffle.status.isDrawn) revert RaffleAlreadyDrawn();
        if (!raffle.status.readyToActive) revert NotReadyToActive();
        
        raffle.status.isActive = true;
        _activeRaffleIds.add(raffleId);
        
        emit RaffleActivated(raffleId);
    }

    function completeRaffle(uint256 raffleId) external onlyAdmin {
        Raffle storage raffle = raffles[raffleId];
        if (!raffle.status.isActive) revert RaffleNotActive();
        if (block.timestamp <= raffle.timing.endDate) revert RaffleNotEnded();
        
        raffle.status.isActive = false;
        raffle.status.isDrawn = true;
        
        _activeRaffleIds.remove(raffleId);
        _completedRaffleIds.add(raffleId);
        
        emit RaffleCompleted(raffleId);
    }

    function _calculateTotalTickets(Prize[] memory prizes) private pure returns (uint256) {
        uint256 total = 0;
        for (uint256 i = 0; i < prizes.length; i++) {
            if (prizes[i].quantity == 0) revert PrizeZeroQuantity();
            total += prizes[i].quantity;
        }
        return total;
    }

    event Participated(uint256 indexed raffleId, address indexed player, uint256 participantId, uint256 ticketNumber);
    event LotteryDrawn(uint256 indexed raffleId, address indexed player, uint256 participantId, uint256 prizeIndex);
    event BatchDrawCompleted(uint256 indexed raffleId, uint256 startIndex, uint256 count, uint256 drawnCount);

    struct ParticipationResult {
        uint256 participantId;
        bool hasResult;
        uint256 prizeIndex;
    }

    struct BatchDrawResult {
        uint256 totalProcessed;
        uint256 totalDrawn;
        bool completed;
        string reason;
    }

    function batchDraw(
        uint256 raffleId, 
        uint256 startIndex, 
        uint256 maxCount
    ) external onlyAdmin whenNotPaused returns (BatchDrawResult memory) {
        Raffle storage raffle = raffles[raffleId];
        if (raffle.timing.instantDraw) revert InstantDrawNotSupported();
        if (!raffle.status.isActive) revert RaffleNotActive();
        if (block.timestamp < raffle.timing.drawDate) revert DrawDateNotReached();
        
        uint256 safeBatchSize = maxCount > 1000 ? 1000 : maxCount;
        
        uint256[] memory participantIds = raffleParticipantIds[raffleId];
        uint256 totalParticipations = participantIds.length;
        if (startIndex >= totalParticipations) revert InvalidStartIndex();
        
        uint256 endIndex = startIndex + safeBatchSize;
        if (endIndex > totalParticipations) {
            endIndex = totalParticipations;
        }
        
        uint256 processedCount = 0;
        uint256 drawnCount = 0;
        bool dynamicWeight = raffle.settings.dynamicWeight;
        
        for (uint256 i = startIndex; i < endIndex; ++i) {
            uint256 participantId = participantIds[i];
            Participant storage participant = participants[participantId];
            
            if (!participant.hasResult) {
                uint256 prizeIndex = _batchDrawSingle(raffleId, participantId, participant.ticketNumber, dynamicWeight);
                ++drawnCount;
                
                emit LotteryDrawn(raffleId, participant.player, participantId, prizeIndex);
            }
            
            ++processedCount;
            
            if (gasleft() < 50000) {
                break;
            }
        }
        
        bool isCompleted = (startIndex + processedCount) >= totalParticipations;
        
        emit BatchDrawCompleted(raffleId, startIndex, processedCount, drawnCount);
        
        return BatchDrawResult({
            totalProcessed: processedCount,
            totalDrawn: drawnCount,
            completed: isCompleted,
            reason: isCompleted ? "COMPLETED" : "PARTIAL_COMPLETED"
        });
    }

    function _batchDrawSingle(
        uint256 raffleId, 
        uint256 participantId, 
        uint256 ticketNumber,
        bool dynamicWeight
    ) private returns (uint256) {
        Participant storage participant = participants[participantId];
        
        uint256 prizeIndex = _getTicketPrize(raffleId, ticketNumber);

        if (dynamicWeight) {
            usedTickets[raffleId][ticketNumber] = true;
        }

        participant.hasResult = true;
        participant.claimed = false;
        participant.drawnAt = block.timestamp;
        participant.claimedAt = 0;

        ++raffles[raffleId].status.drawnCount;

        return prizeIndex;
    }

    function participate(uint256 raffleId, address player) external nonReentrant whenNotPaused returns (ParticipationResult memory) {
        Raffle storage raffle = raffles[raffleId];
        if (!raffle.status.isActive) revert RaffleNotActive();
        if (raffle.status.isDrawn) revert RaffleEnded();
        
        uint256 currentTime = block.timestamp;
        if (currentTime < raffle.timing.startDate) revert RaffleNotStarted();
        if (currentTime > raffle.timing.endDate) revert RaffleEnded();
        
        uint256 totalTickets = raffle.status.totalTickets;
        uint256 totalParticipations = raffleParticipantIds[raffleId].length;
        if (totalParticipations >= totalTickets) revert NoTicketsAvailable();

        uint256 maxParticipants = raffle.settings.maxParticipants;
        if (maxParticipants > 0) {
            uint256 uniqueParticipantCount = _raffleParticipants[raffleId].length();
            if (uniqueParticipantCount >= maxParticipants) revert MaxParticipantsReached();
        }

        uint256 maxEntriesPerPlayer = raffle.settings.maxEntriesPerPlayer;
        if (maxEntriesPerPlayer > 0) {
            if (playerParticipationCount[raffleId][player] >= maxEntriesPerPlayer) revert MaxEntriesPerPlayerReached();
        }

        uint256 participantId = _participantIdCounter++;
        uint256 ticketNumber = _pickTicket(raffleId, player, participantId);
        if (ticketNumber >= totalTickets) revert NoTicketsAvailable();
        ++raffle.status.pickedTickets;

        participants[participantId] = Participant({
            player: player,
            raffleId: raffleId,
            ticketNumber: ticketNumber,
            participatedAt: currentTime,
            hasResult: false,
            claimed: false,
            drawnAt: 0,
            claimedAt: 0
        });

        if (playerParticipationCount[raffleId][player] == 0) {
            _raffleParticipants[raffleId].add(player);
        }
        
        raffleParticipantIds[raffleId].push(participantId);
        ++playerParticipationCount[raffleId][player];
        playerParticipantIds[raffleId][player].push(participantId);

        emit Participated(raffleId, player, participantId, ticketNumber);

        if (raffle.timing.instantDraw) {
            uint256 prizeIndex = _draw(raffleId, participantId, ticketNumber);
            return ParticipationResult({
                participantId: participantId,
                hasResult: true,
                prizeIndex: prizeIndex
            });
        }

        return ParticipationResult({
            participantId: participantId,
            hasResult: false,
            prizeIndex: 0
        });
    }

    function _draw(uint256 raffleId, uint256 participantId, uint256 ticketNumber) private returns (uint256) {
        Participant storage participant = participants[participantId];
        if (participant.player == address(0)) revert InvalidParticipant();
        if (participant.raffleId != raffleId) revert ParticipantRaffleMismatch();
        if (participant.hasResult) revert AlreadyDrawn();

        uint256 prizeIndex = _getTicketPrize(raffleId, ticketNumber);

        if (raffles[raffleId].settings.dynamicWeight) {
            usedTickets[raffleId][ticketNumber] = true;
        }

        participant.hasResult = true;
        participant.claimed = false;
        participant.drawnAt = block.timestamp;
        participant.claimedAt = 0;

        raffles[raffleId].status.drawnCount++;

        emit LotteryDrawn(raffleId, participant.player, participantId, prizeIndex);

        return prizeIndex;
    }

    function _pickTicket(
        uint256 raffleId, 
        address player, 
        uint256 participantId
    ) private view returns (uint256) {
        Raffle storage raffle = raffles[raffleId];
        uint256 totalTickets = raffle.status.totalTickets;
        bool dynamicWeight = raffle.settings.dynamicWeight;

        bytes32 randomSeed = keccak256(abi.encode(
            player,
            raffleId,
            participantId,
            block.timestamp,
            block.prevrandao,
            blockhash(block.number - 1)
        ));

        if (!dynamicWeight) {
            return uint256(randomSeed) % totalTickets;
        }

        uint256 startIndex = uint256(randomSeed) % totalTickets;
        
        for (uint256 i = 0; i < totalTickets; ++i) {
            uint256 ticketIndex = (startIndex + i) % totalTickets;
            if (!usedTickets[raffleId][ticketIndex]) {
                return ticketIndex;
            }
        }

        return totalTickets;
    }

    function _calculateRemainingTickets(Raffle storage raffle, uint256 raffleId) private view returns (uint256) {
        uint256 totalTickets = raffle.status.totalTickets;
        uint256 pickedTickets = raffle.status.pickedTickets;
        uint256 maxParticipants = raffle.settings.maxParticipants;
        uint256 maxEntriesPerPlayer = raffle.settings.maxEntriesPerPlayer;
        bool dynamicWeight = raffle.settings.dynamicWeight;
        
        uint256 availableTickets;
        
        if (dynamicWeight) {
            availableTickets = totalTickets > pickedTickets ? totalTickets - pickedTickets : 0;
        } else {
            availableTickets = totalTickets;
        }
        
        uint256 uniqueParticipantCount = _raffleParticipants[raffleId].length();
        uint256 availableParticipationSlots;
        
        if (maxParticipants > 0) {
            availableParticipationSlots = maxParticipants > uniqueParticipantCount ? 
                maxParticipants - uniqueParticipantCount : 0;
        } else {
            availableParticipationSlots = type(uint256).max;
        }
        
        if (availableParticipationSlots == type(uint256).max) {
            return availableTickets;
        }
        
        uint256 maxPossibleEntries = maxEntriesPerPlayer > 0 ? 
            availableParticipationSlots * maxEntriesPerPlayer : availableParticipationSlots;
        
        return availableTickets < maxPossibleEntries ? availableTickets : maxPossibleEntries;
    }

    struct RaffleListCardInfo {
        string title;
        string imageUrl;
        string iconUrl;
        uint256 startDate;
        uint256 endDate;
        uint256 drawDate;
        bool instantDraw;
        uint256 participationLimit;
        uint256 uniqueParticipants;
        uint256 totalParticipations;
        int256 participationFeeAmount;
        string participationFeeAssetId;
        bool isActive;
        bool isDrawn;
        bool readyToActive;
        uint256 totalTickets;
        uint256 remainingTickets;
        uint256 raffleId;
    }

    function getRaffleListCardInfo(uint256 raffleId) external view returns (RaffleListCardInfo memory) {
        Raffle storage raffle = raffles[raffleId];
        if (raffle.timing.startDate == 0) revert RaffleNotExists();
        
        uint256 remainingTickets = _calculateRemainingTickets(raffle, raffleId);

        return RaffleListCardInfo({
            title: raffle.basicInfo.title,
            imageUrl: raffle.basicInfo.imageUrl,
            iconUrl: raffle.basicInfo.iconUrl,
            startDate: raffle.timing.startDate,
            endDate: raffle.timing.endDate,
            drawDate: raffle.timing.drawDate,
            instantDraw: raffle.timing.instantDraw,
            participationLimit: raffle.settings.maxParticipants,
            uniqueParticipants: _raffleParticipants[raffleId].length(),
            totalParticipations: raffleParticipantIds[raffleId].length,
            participationFeeAmount: raffle.fee.participationFeeAmount,
            participationFeeAssetId: raffle.fee.participationFeeAssetId,
            isActive: raffle.status.isActive,
            isDrawn: raffle.status.isDrawn,
            readyToActive: raffle.status.readyToActive,
            totalTickets: raffle.status.totalTickets,
            remainingTickets: remainingTickets,
            raffleId: raffleId
        });
    }

    function getRaffle(uint256 raffleId) external view returns (Raffle memory, uint256 remainingTickets) {
        if (raffles[raffleId].timing.startDate == 0) revert RaffleNotExists();
        remainingTickets = _calculateRemainingTickets(raffles[raffleId], raffleId);
        return (raffles[raffleId], remainingTickets);
    }

    struct UserParticipationDetail {
        uint256 participantId;
        uint256 ticketNumber;
        uint256 participatedAt;
        bool hasLotteryResult;
        uint256 prizeIndex;
        bool claimed;
        uint256 drawnAt;
        uint256 claimedAt;
    }

    struct UserParticipationInfo {
        uint256 participationCount;
        UserParticipationDetail[] participations;
        uint256 totalWins;
        uint256 revealedCount;
        uint256 unrevealedCount;
    }

    function getUserParticipationDetails(uint256 raffleId, address player) 
        external view returns (UserParticipationInfo memory) {
        
        uint256 participationCount = playerParticipationCount[raffleId][player];
        
        if (participationCount == 0) {
            return UserParticipationInfo({
                participationCount: 0,
                participations: new UserParticipationDetail[](0),
                totalWins: 0,
                revealedCount: 0,
                unrevealedCount: 0
            });
        }

        Raffle storage raffle = raffles[raffleId];
        if (raffle.timing.startDate == 0) revert RaffleNotExists();
        
        bool canViewResults = raffle.timing.instantDraw || 
                            (raffle.status.isDrawn && block.timestamp >= raffle.timing.drawDate);

        uint256[] memory userParticipantIds = playerParticipantIds[raffleId][player];
        UserParticipationDetail[] memory userParticipations = new UserParticipationDetail[](participationCount);
        
        uint256 totalWins = 0;
        uint256 revealedCount = 0;
        uint256 unrevealedCount = 0;
        
        for (uint256 i = 0; i < userParticipantIds.length; i++) {
            uint256 participantId = userParticipantIds[i];
            Participant storage participant = participants[participantId];
            
            UserParticipationDetail memory detail = UserParticipationDetail({
                participantId: participantId,
                ticketNumber: participant.ticketNumber,
                participatedAt: participant.participatedAt,
                hasLotteryResult: participant.hasResult,
                prizeIndex: 0,
                claimed: participant.claimed,
                drawnAt: participant.drawnAt,
                claimedAt: participant.claimedAt
            });

            if (canViewResults && participant.hasResult) {
                detail.prizeIndex = _getTicketPrize(raffleId, participant.ticketNumber);
                
                if (detail.prizeIndex > 0) {
                    totalWins++;
                }
                
                if (participant.claimed) {
                    revealedCount++;
                } else {
                    unrevealedCount++;
                }
            }

            userParticipations[i] = detail;
        }

        return UserParticipationInfo({
            participationCount: participationCount,
            participations: userParticipations,
            totalWins: totalWins,
            revealedCount: revealedCount,
            unrevealedCount: unrevealedCount
        });
    }

    function getUserParticipationCount(uint256 raffleId, address player) 
        external view returns (uint256) {
        return playerParticipationCount[raffleId][player];
    }

    function getUserParticipantIds(uint256 raffleId, address player) 
        external view returns (uint256[] memory) {
        return playerParticipantIds[raffleId][player];
    }
    function getBatchDrawProgress(uint256 raffleId) external view returns (uint256 total, uint256 drawn, uint256 remaining) {
        total = raffleParticipantIds[raffleId].length;
        drawn = raffles[raffleId].status.drawnCount;
        remaining = total > drawn ? total - drawn : 0;
        return (total, drawn, remaining);
    }

    struct TicketAllocationInfo {
        uint256 prizeIndex;
        uint256 startTicket;
        uint256 endTicket;
        uint256 ticketCount;
        bool allocated;
        string prizeTitle;
    }

    struct RaffleAllocationSummary {
        uint256 raffleId;
        uint256 totalTickets;
        uint256 allocatedTickets;
        uint256 totalPrizes;
        uint256 allocatedPrizes;
        bool allPrizesAllocated;
        TicketAllocationInfo[] allocations;
    }

    function getRaffleAllocationSummary(uint256 raffleId) external view returns (RaffleAllocationSummary memory) {
        Raffle storage raffle = raffles[raffleId];
        if (raffle.timing.startDate == 0) revert RaffleNotExists();
        
        uint256 totalPrizes = raffle.prizes.length;
        uint256 allocatedPrizes = 0;
        uint256 allocatedTickets = 0;
        
        TicketAllocationInfo[] memory allocations = new TicketAllocationInfo[](totalPrizes);
        
        for (uint256 i = 0; i < totalPrizes; i++) {
            Prize storage prize = raffle.prizes[i];
            uint256 startTicket = 0;
            
            if (i < prizeStartTickets[raffleId].length) {
                startTicket = prizeStartTickets[raffleId][i];
            }
            
            uint256 endTicket = startTicket + prize.quantity - 1;
            
            allocations[i] = TicketAllocationInfo({
                prizeIndex: i,
                startTicket: startTicket,
                endTicket: endTicket,
                ticketCount: prize.quantity,
                allocated: prize.allocated,
                prizeTitle: prize.title
            });
            
            if (prize.allocated) {
                allocatedPrizes++;
                allocatedTickets += prize.quantity;
            }
        }
        
        bool allPrizesAllocated = _checkAllPrizesAllocated(raffleId);
        
        return RaffleAllocationSummary({
            raffleId: raffleId,
            totalTickets: raffle.status.totalTickets,
            allocatedTickets: allocatedTickets,
            totalPrizes: totalPrizes,
            allocatedPrizes: allocatedPrizes,
            allPrizesAllocated: allPrizesAllocated,
            allocations: allocations
        });
    }

    function getTicketAllocationRange(uint256 raffleId, uint256 prizeIndex) external view returns (uint256 startTicket, uint256 endTicket, bool allocated) {
        Raffle storage raffle = raffles[raffleId];
        if (raffle.timing.startDate == 0) revert RaffleNotExists();
        if (prizeIndex >= raffle.prizes.length) revert InvalidPrizeIndex();
        
        startTicket = _calculateStartTicket(raffleId, prizeIndex);
        endTicket = startTicket + raffle.prizes[prizeIndex].quantity - 1;
        allocated = raffle.prizes[prizeIndex].allocated;
        
        return (startTicket, endTicket, allocated);
    }

    function verifyTicketAllocation(uint256 raffleId) external view returns (bool isValid, string memory errorMessage) {
        Raffle storage raffle = raffles[raffleId];
        if (raffle.timing.startDate == 0) {
            return (false, "RAFFLE_NOT_EXISTS");
        }
        
        uint256 totalCalculatedTickets = 0;
        uint256 lastEndTicket = 0;
        
        for (uint256 i = 0; i < raffle.prizes.length; i++) {
            Prize storage prize = raffle.prizes[i];
            
            if (prize.quantity == 0) {
                return (false, "PRIZE_ZERO_QUANTITY");
            }
            
            uint256 startTicket = _calculateStartTicket(raffleId, i);
            uint256 endTicket = startTicket + prize.quantity - 1;
            
            if (i > 0 && startTicket != lastEndTicket + 1) {
                return (false, "TICKET_RANGE_GAP");
            }
            
            totalCalculatedTickets += prize.quantity;
            lastEndTicket = endTicket;
            
            if (prize.allocated) {
                // 범위 기반 검증: 할당 범위가 올바른지 확인
                AllocationRange storage allocation = prizeRanges[raffleId][i];
                if (!allocation.allocated || 
                    allocation.startTicket != startTicket || 
                    allocation.endTicket != endTicket) {
                    return (false, "ALLOCATION_RANGE_MISMATCH");
                }
            }
        }
        
        if (totalCalculatedTickets != raffle.status.totalTickets) {
            return (false, "TOTAL_TICKETS_MISMATCH");
        }
        
        return (true, "VALID");
    }
}
