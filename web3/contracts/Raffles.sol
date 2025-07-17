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

    // 🎯 효율성을 위한 새로운 매핑들
    mapping(uint256 => mapping(address => uint256[])) public playerParticipantIds;  // raffleId => player => participantIds[]
    mapping(bytes32 => uint256) public ticketToResultId;  // ticketNumber => resultId (추첨 결과 빠른 조회)

    mapping(uint256 => LotteryResult) public lotteryResults;
    uint256 private _lotteryResultIdCounter = 1;

    uint256 constant TICKET_BLOCK_SIZE = 10000;
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
    event PrizeDistributed(
        uint256 indexed resultId,
        uint256 indexed raffleId,
        address indexed player,
        uint256 prizeIndex,
        string prizeTitle,
        address admin,
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
        
        emit PrizeDistributed(
            resultId,
            result.raffleId,
            result.player,
            result.prizeIndex,
            raffle.prizes[result.prizeIndex].title,
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
        // 🚀 가스 최적화: 검증 순서 최적화 (빠른 실패)
        require(bytes(params.basicInfo.title).length > 0, "TITLE_REQUIRED");
        require(params.timing.endDate > params.timing.startDate, "INVALID_DATE");
        
        // 한 번에 계산하여 가스 절약
        unchecked {
            uint256 duration = params.timing.endDate - params.timing.startDate;
            require(duration >= MIN_RAFFLE_DURATION, "RAFFLE_TOO_SHORT");
            require(params.timing.drawDate >= params.timing.endDate + MIN_DRAW_DELAY, "DRAW_TOO_EARLY");
        }

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
            Prize memory prize = prizes[i];
            prize.pickedTicketQuantity = 0;
            prize.startTicketNumber = ticketNumber;
            
            _createTicketBlocks(raffleId, i, ticketNumber, prize.registeredTicketQuantity);
            
            newRaffle.prizes.push(prize);
            newRaffle.status.totalQuantity += prize.registeredTicketQuantity;
            ticketNumber += prize.registeredTicketQuantity;
            
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
        // 🚀 가스 최적화: 통합 검증 함수 사용
        _validateParticipation(raffleId, player, false);

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
        playerParticipantIds[raffleId][player].push(participantId);

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
        
        // 🎯 티켓 번호로 결과 ID 빠른 조회를 위한 매핑 업데이트
        ticketToResultId[participant.lotteryTicketNumber] = resultId;

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
        Raffle storage raffle = raffles[raffleId];
        
        // 🚀 대용량 상품이 있는 경우 선형 검색 사용
        uint256 currentStart = 0;
        uint256 prizesLength = raffle.prizes.length;
        
        for (uint256 i = 0; i < prizesLength;) {
            Prize storage prize = raffle.prizes[i];
            uint256 prizeEnd = currentStart + prize.registeredTicketQuantity;
            
            if (randomValue >= currentStart && randomValue < prizeEnd) {
                return i;
            }
            
            currentStart = prizeEnd;
            unchecked { ++i; }
        }
        
        // 폴백: 블록 테이블 방식 (소용량 상품들)
        uint256 blockIndex = randomValue / TICKET_BLOCK_SIZE;
        uint256 candidatePrize = raffleTicketBlocks[raffleId][blockIndex];
        
        // 유효성 검사
        if (candidatePrize < prizesLength) {
            return candidatePrize;
        }
        
        // 최종 폴백
        return prizesLength > 0 ? prizesLength - 1 : 0;
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
        // 🚀 대용량 상품 최적화: 10만개 이상은 블록 생성 생략
        if (ticketQuantity >= 100000) {
            // 큰 상품은 블록 테이블 사용하지 않음 (선형 검색으로 처리)
            return;
        }
        
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

    /**
     * @dev 래플 참가 공통 검증 로직 (가스 최적화)
     * @param raffleId 래플 ID
     * @param player 참가자 주소
     * @param requireInstantDraw 즉시 추첨 필수 여부
     */
    function _validateParticipation(
        uint256 raffleId, 
        address player, 
        bool requireInstantDraw
    ) private view {
        Raffle storage raffle = raffles[raffleId];
        
        // 존재 여부 확인
        require(raffle.timing.startDate > 0, "RAFFLE_NOT_EXISTS");
        
        // 즉시 추첨 검증 (필요한 경우만)
        if (requireInstantDraw) {
            require(raffle.timing.instantDraw, "INSTANT_DRAW_ONLY");
        }
        
        // 기본 상태 검증
        require(raffle.status.isActive, "RAFFLE_NOT_ACTIVE");
        require(!raffle.status.isDrawn, "RAFFLE_ENDED");
        require(raffle.status.remainingQuantity > 0, "RAFFLE_ENDED");
        
        // 시간 검증
        require(block.timestamp >= raffle.timing.startDate, "RAFFLE_NOT_STARTED");
        require(block.timestamp <= raffle.timing.endDate, "RAFFLE_ENDED");
        
        // 참가 제한 검증
        uint256 participationLimit = raffle.settings.participationLimit;
        if (participationLimit > 0) {
            require(
                raffleParticipants[raffleId].length < participationLimit,
                "PARTICIPATION_LIMIT_REACHED"
            );
        }

        uint256 participationLimitPerPlayer = raffle.settings.participationLimitPerPlayer;
        if (participationLimitPerPlayer > 0) {
            require(
                playerParticipationCount[raffleId][player] < participationLimitPerPlayer,
                "PARTICIPATION_LIMIT_REACHED"
            );
        }
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
        // 🚀 가스 최적화: 필요한 필드만 직접 읽기
        Raffle storage raffle = raffles[raffleId];
        require(raffle.timing.startDate > 0, "RAFFLE_NOT_EXISTS");
        return (raffle.status.isActive, raffle.status.isDrawn, raffle.status.remainingQuantity);
    }

    // 참가 + 즉시 추첨 + 배포 마킹 통합 함수
    function participateAndDraw(uint256 raffleId, address player) 
        external 
        nonReentrant 
        whenNotPaused 
        returns (uint256 participantId, uint256 prizeIndex, uint256 resultId) 
    {
        // 🚀 가스 최적화: 통합 검증 함수 사용 (즉시 추첨 포함)
        _validateParticipation(raffleId, player, true);
        
        // Storage reference for prize operations
        Raffle storage raffle = raffles[raffleId];
        
        // 1단계: 참가 처리
        participantId = _participateInternal(raffleId, player);
        
        // 2단계: 즉시 추첨 로직 (최적화된 버전)
        Participant memory participant = participants[participantId];
        bytes32 randomSeed = _generateSecureRandom(player, raffleId, participantId);
        uint256 randomValue = uint256(randomSeed) % raffle.status.totalQuantity;
        prizeIndex = _selectPrize(raffle, randomValue, raffleId);
        
        // 3단계: 상품 수량 업데이트
        if (raffle.settings.dynamicWeight) {
            raffle.prizes[prizeIndex].pickedTicketQuantity++;
            raffle.status.totalQuantity--;
        }
        raffle.status.remainingQuantity--;
        
        // 4단계: 즉시 배포 완료로 마킹
        resultId = _lotteryResultIdCounter++;
        lotteryResults[resultId] = LotteryResult({
            lotteryTicketNumber: participant.lotteryTicketNumber,
            player: player,
            raffleId: raffleId,
            prizeIndex: prizeIndex,
            drawnAt: block.timestamp,
            claimed: true,        // ✅ 즉시 배포 완료 마킹
            claimedAt: block.timestamp
        });
        
        // 🎯 매핑 업데이트
        ticketToResultId[participant.lotteryTicketNumber] = resultId;
        
        // 래플 완료 체크
        if (raffle.status.remainingQuantity == 0) {
            raffle.status.isDrawn = true;
        }
        
        emit ParticipatedAndDrawn(raffleId, player, participantId, prizeIndex, resultId, block.timestamp);
        
        return (participantId, prizeIndex, resultId);
    }
    
    // 배치 참가 + 추첨 + 상품 배포
    function batchParticipateDrawAndDistribute(
        uint256 raffleId,
        address[] calldata players,
        uint256[] calldata prizeIndices // 미리 계산된 상품 인덱스
    ) external onlyAdmin nonReentrant whenNotPaused returns (uint256[] memory) {
        require(players.length == prizeIndices.length, "ARRAY_LENGTH_MISMATCH");
        
        Raffle storage raffle = raffles[raffleId];
        require(raffle.status.isActive, "RAFFLE_NOT_ACTIVE");
        
        uint256[] memory resultIds = new uint256[](players.length);
        
        for (uint256 i = 0; i < players.length;) {
            // 1. 참가 처리
            uint256 participantId = _participateInternal(raffleId, players[i]);
            
            // 2. 추첨 결과 기록 (가스 절약을 위해 미리 계산된 인덱스 사용)
            uint256 resultId = _lotteryResultIdCounter++;
            lotteryResults[resultId] = LotteryResult({
                lotteryTicketNumber: participants[participantId].lotteryTicketNumber,
                player: players[i],
                raffleId: raffleId,
                prizeIndex: prizeIndices[i],
                drawnAt: block.timestamp,
                claimed: true, // 즉시 배포로 처리
                claimedAt: block.timestamp
            });
            
            // 🎯 매핑 업데이트
            ticketToResultId[participants[participantId].lotteryTicketNumber] = resultId;
            
            resultIds[i] = resultId;
            
            // 상품 수량 업데이트
            if (raffle.settings.dynamicWeight) {
                raffle.prizes[prizeIndices[i]].pickedTicketQuantity++;
                raffle.status.totalQuantity--;
            }
            raffle.status.remainingQuantity--;
            
            emit BatchProcessed(raffleId, players[i], participantId, prizeIndices[i], resultId);
            
            unchecked { ++i; }
        }
        
        // 래플 완료 체크
        if (raffle.status.remainingQuantity == 0) {
            raffle.status.isDrawn = true;
        }
        
        return resultIds;
    }
    
    // 참가 내부 함수 (중복 코드 제거)
    function _participateInternal(uint256 raffleId, address player) 
        internal 
        returns (uint256 participantId) 
    {
        
        bytes32 ticketNumber = _generateSecureRandom(player, raffleId, _participantIdCounter);
        
        participantId = _participantIdCounter++;
        participants[participantId] = Participant({
            player: player,
            raffleId: raffleId,
            lotteryTicketNumber: ticketNumber,
            participatedAt: block.timestamp
        });
        
        raffleParticipants[raffleId].push(participantId);
        playerParticipationCount[raffleId][player]++;
        
        // 🎯 매핑 업데이트
        playerParticipantIds[raffleId][player].push(participantId);
        
        return participantId;
    }
    
    // 상품 일괄 배포 (오프체인 처리 후 온체인 확정)
    function confirmBatchDistribution(
        uint256[] calldata resultIds,
        bool[] calldata distributionSuccess,
        string[] calldata deliveryMethods
    ) external onlyAdmin whenNotPaused {
        require(resultIds.length == distributionSuccess.length, "ARRAY_LENGTH_MISMATCH");
        require(resultIds.length == deliveryMethods.length, "ARRAY_LENGTH_MISMATCH");
        
        for (uint256 i = 0; i < resultIds.length;) {
            LotteryResult storage result = lotteryResults[resultIds[i]];
            
            if (distributionSuccess[i]) {
                result.claimed = true;
                result.claimedAt = block.timestamp;
                
                Raffle storage raffle = raffles[result.raffleId];
                emit PrizeDistributed(
                    resultIds[i],
                    result.raffleId,
                    result.player,
                    result.prizeIndex,
                    raffle.prizes[result.prizeIndex].title,
                    msg.sender,
                    deliveryMethods[i],
                    "Batch confirmed",
                    block.timestamp
                );
            }
            
            unchecked { ++i; }
        }
    }
    
    event ParticipatedAndDrawn(
        uint256 indexed raffleId,
        address indexed player,
        uint256 participantId,
        uint256 prizeIndex,
        uint256 resultId,
        uint256 timestamp
    );
    
    event BatchProcessed(
        uint256 indexed raffleId,
        address indexed player,
        uint256 participantId,
        uint256 prizeIndex,
        uint256 resultId
    );

    // 🎯 새로운 함수: 사용자 참가 상세 정보 일괄 조회
    struct UserParticipationDetail {
        uint256 participantId;
        bytes32 ticketNumber;
        uint256 participatedAt;
        bool hasLotteryResult;
        uint256 resultId;
        uint256 prizeIndex;
        bool claimed;
        uint256 drawnAt;
        uint256 claimedAt;
    }

    struct UserParticipationInfo {
        uint256 participationCount;
        UserParticipationDetail[] participations;
    }

    function getUserParticipationDetails(uint256 raffleId, address player) 
        external 
        view 
        returns (UserParticipationInfo memory) 
    {
        uint256 participationCount = playerParticipationCount[raffleId][player];
        
        if (participationCount == 0) {
            return UserParticipationInfo({
                participationCount: 0,
                participations: new UserParticipationDetail[](0)
            });
        }

        Raffle storage raffle = raffles[raffleId];
        require(raffle.timing.startDate > 0, "RAFFLE_NOT_EXISTS");
        
        // 🎯 추첨 결과 조회 가능 여부 확인
        bool canViewResults = raffle.timing.instantDraw || 
                            (raffle.status.isDrawn && block.timestamp >= raffle.timing.drawDate);

        // 🚀 O(1) 조회: 사용자의 참가자 ID 목록 직접 가져오기
        uint256[] memory userParticipantIds = playerParticipantIds[raffleId][player];
        UserParticipationDetail[] memory userParticipations = new UserParticipationDetail[](participationCount);
        
        // 🎯 사용자의 참가 정보 수집 (O(k) - k는 사용자 참가 횟수)
        for (uint256 i = 0; i < userParticipantIds.length; i++) {
            uint256 participantId = userParticipantIds[i];
            Participant storage participant = participants[participantId];
            
            UserParticipationDetail memory detail = UserParticipationDetail({
                participantId: participantId,
                ticketNumber: participant.lotteryTicketNumber,
                participatedAt: participant.participatedAt,
                hasLotteryResult: false,
                resultId: 0,
                prizeIndex: 0,
                claimed: false,
                drawnAt: 0,
                claimedAt: 0
            });

            // 🚀 O(1) 조회: 추첨 결과 빠른 조회
            if (canViewResults) {
                uint256 resultId = ticketToResultId[participant.lotteryTicketNumber];
                if (resultId > 0) {  // 결과가 존재하는 경우
                    LotteryResult storage result = lotteryResults[resultId];
                    detail.hasLotteryResult = true;
                    detail.resultId = resultId;
                    detail.prizeIndex = result.prizeIndex;
                    detail.claimed = result.claimed;
                    detail.drawnAt = result.drawnAt;
                    detail.claimedAt = result.claimedAt;
                }
            }

            userParticipations[i] = detail;
        }

        return UserParticipationInfo({
            participationCount: participationCount,
            participations: userParticipations
        });
    }
}