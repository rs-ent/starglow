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
        Prize bestPrize;
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
        uint256 drawnParticipantCount;
    }

    struct RaffleCoreInfo {
        string title;
        string imageUrl;
        string iconUrl;
        uint256 startDate;
        uint256 endDate;
        uint256 drawDate;
        bool instantDraw;
        uint256 participationLimit;
        uint256 participationLimitPerPlayer;
        string participationFeeAssetId;
        int256 participationFeeAmount;
        uint256 raffleId;
        bool isActive;
        bool isDrawn;
        uint256 totalQuantity;
        uint256 participationCount;
        Prize defaultBestPrize;
        Prize currentBestPrize;
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



    bool public paused;
    mapping(address => bool) public admins;
    

    
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
    event RaffleStatusChanged(uint256 indexed raffleId, bool isActive, address indexed admin);
    event RefundProcessed(
        uint256 indexed raffleId,
        address indexed player,
        address indexed processedBy,
        string method,
        uint256 timestamp
    );



    function setRaffleActive(uint256 raffleId, bool _isActive) external onlyAdmin whenNotPaused {
        Raffle storage raffle = raffles[raffleId];
        require(raffle.timing.startDate > 0, "RAFFLE_NOT_EXISTS");
        require(!raffle.status.isDrawn, "RAFFLE_ALREADY_DRAWN");
        require(raffle.status.isActive != _isActive, "ALREADY_SET");
        
        raffle.status.isActive = _isActive;
        
        emit RaffleStatusChanged(raffleId, _isActive, msg.sender);
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
        require(params.timing.drawDate > params.timing.endDate, "DRAW_BEFORE_END");
        
        
        // 🔒 Safe delay calculation with overflow protection  
        uint256 delay = params.timing.drawDate - params.timing.endDate;
        require(delay >= 30 minutes, "DRAW_TOO_EARLY");
        
        // 🔒 Prevent far future dates (max 1 year)
        require(params.timing.drawDate <= block.timestamp + 365 days, "DRAW_TOO_FAR");

        uint256 raffleId = _raffleIdCounter++;

        Raffle storage newRaffle = raffles[raffleId];
        newRaffle.basicInfo = params.basicInfo;
        newRaffle.timing = params.timing;
        newRaffle.settings = params.settings;
        newRaffle.fee = params.fee;

        newRaffle.status.isActive = true;
        newRaffle.status.isDrawn = false;
        newRaffle.status.totalQuantity = 0;
        newRaffle.status.drawnParticipantCount = 0;
        newRaffle.basicInfo.bestPrize = _findBestPrizeFromMemory(params.prizes);

        return _initializeRafflePrizes(raffleId, newRaffle, params.prizes);
    }
    
    function _findBestPrize(Prize[] storage prizes) private view returns (Prize memory) {
        require(prizes.length > 0, "NO_PRIZES");
        
        Prize memory bestPrize;
        bool foundAvailable = false;
        
        for (uint256 i = 0; i < prizes.length;) {
            Prize storage currentPrize = prizes[i];
            
            // 🔒 underflow 방지: pickedTicketQuantity가 더 큰 경우 0으로 처리
            uint256 availableTickets = 0;
            if (currentPrize.registeredTicketQuantity > currentPrize.pickedTicketQuantity) {
                availableTickets = currentPrize.registeredTicketQuantity - currentPrize.pickedTicketQuantity;
            }
            
            if (availableTickets > 0) {
                if (!foundAvailable) {
                    bestPrize = currentPrize;
                    foundAvailable = true;
                } else {
                    if (currentPrize.rarity > bestPrize.rarity || 
                        (currentPrize.rarity == bestPrize.rarity && currentPrize.order > bestPrize.order)) {
                        bestPrize = currentPrize;
                    }
                }
            }
            
            unchecked { ++i; }
        }
        
        require(foundAvailable, "NO_AVAILABLE_PRIZES");
        return bestPrize;
    }
    
    function _findBestPrizeFromMemory(Prize[] memory prizes) private pure returns (Prize memory) {
        require(prizes.length > 0, "NO_PRIZES");
        
        Prize memory bestPrize = prizes[0];
        
        for (uint256 i = 1; i < prizes.length;) {
            Prize memory currentPrize = prizes[i];
            
            // rarity가 더 높거나, rarity가 같고 order가 더 높은 경우
            if (currentPrize.rarity > bestPrize.rarity || 
                (currentPrize.rarity == bestPrize.rarity && currentPrize.order > bestPrize.order)) {
                bestPrize = currentPrize;
            }
            
            unchecked { ++i; }
        }
        
        return bestPrize;
    }
    
    function _initializeRafflePrizes(
        uint256 raffleId,
        Raffle storage newRaffle,
        Prize[] memory prizes
    ) private returns (uint256) {
        require(prizes.length > 0, "NO_PRIZES_PROVIDED");
        
        uint256 ticketNumber = 0;
        uint256 prizesLength = prizes.length;
        uint256 totalTickets = 0;
        
        for (uint256 i = 0; i < prizesLength;) {
            Prize memory prize = prizes[i];
            require(prize.registeredTicketQuantity > 0, "PRIZE_ZERO_TICKETS");
            
            prize.pickedTicketQuantity = 0;
            prize.startTicketNumber = ticketNumber;
            
            newRaffle.prizes.push(prize);
            newRaffle.status.totalQuantity += prize.registeredTicketQuantity;
            totalTickets += prize.registeredTicketQuantity;
            ticketNumber += prize.registeredTicketQuantity;
            
            unchecked { ++i; }
        }

        // 🔒 최종 검증: 전체 티켓 수량이 0이 아닌지 확인
        require(totalTickets > 0, "TOTAL_TICKETS_ZERO");
        require(newRaffle.status.totalQuantity == totalTickets, "QUANTITY_MISMATCH");

        newRaffle.status.drawnParticipantCount = 0;

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
        require(raffle.status.totalQuantity > 0, "RAFFLE_ENDED");

        return _drawForParticipant(participantId, raffle, 0, raffleId);
    }

    function batchDraw(uint256 raffleId, uint256 startIndex, uint256 maxCount) external onlyAdmin nonReentrant whenNotPaused returns (uint256[] memory) {
        Raffle storage raffle = raffles[raffleId];
        
        require(!raffle.status.isDrawn, "ALREADY_DRAWN");
        require(block.timestamp >= raffle.timing.drawDate, "TOO_EARLY");
        
        uint256[] memory participantIds = raffleParticipants[raffleId];
        uint256 participantCount = participantIds.length;
        
        // 🔒 Enhanced boundary checks
        require(participantCount > 0, "NO_PARTICIPANTS");
        require(startIndex < participantCount, "START_INDEX_OUT_OF_BOUNDS");
        require(maxCount > 0, "INVALID_MAX_COUNT");
        require(maxCount <= 1000, "BATCH_SIZE_TOO_LARGE"); // Gas limit protection
        
        uint256 endIndex = startIndex + maxCount;
        if (endIndex > participantCount) {
            endIndex = participantCount;
        }
        
        uint256 processCount = endIndex - startIndex;
        require(processCount > 0, "NOTHING_TO_PROCESS");
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

        // 🔒 안전성 검사: totalQuantity 확인
        require(raffle.status.totalQuantity > 0, "NO_TICKETS_AVAILABLE");

        bytes32 randomSeed = _generateSecureRandom(
            participant.player,
            raffleId,
            participantId + nonce
        );
        
        uint256 randomValue = uint256(randomSeed) % raffle.status.totalQuantity;
        uint256 prizeIndex = _selectPrize(raffle, randomValue);
        
        // 🔒 Critical boundary check: validate prizeIndex
        require(prizeIndex < raffle.prizes.length, "INVALID_PRIZE_INDEX");

        // 🔒 안전한 수량 업데이트: underflow 방지
        if (raffle.settings.dynamicWeight) {
            raffle.prizes[prizeIndex].pickedTicketQuantity++;
            
            // totalQuantity 감소 전 underflow 방지
            require(raffle.status.totalQuantity > 0, "CANNOT_DECREASE_ZERO_QUANTITY");
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
        
        ticketToResultId[participant.lotteryTicketNumber] = resultId;

        raffle.status.drawnParticipantCount++;

        // 래플 완료 체크: 동적 가중치에서 티켓 소진 시
        if (raffle.settings.dynamicWeight && raffle.status.totalQuantity == 0) {
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
        uint256 randomValue
    ) private view returns (uint256) {
        return _selectPrizeOptimized(raffle, randomValue);
    }

    function _selectPrizeStatic(
        Raffle storage raffle,
        uint256 randomValue
    ) private view returns (uint256) {
        require(raffle.prizes.length > 0, "NO_PRIZES_AVAILABLE");
        
        // 🚀 안전한 선형 검색 방식 (블록 테이블 의존성 제거)
        uint256 currentStart = 0;
        uint256 prizesLength = raffle.prizes.length;
        
        for (uint256 i = 0; i < prizesLength;) {
            Prize storage prize = raffle.prizes[i];
            uint256 prizeEnd = currentStart + prize.registeredTicketQuantity;
            
            // 🔒 안전한 범위 검사
            if (randomValue >= currentStart && randomValue < prizeEnd) {
                return i;
            }
            
            currentStart = prizeEnd;
            unchecked { ++i; }
        }
        
        // 🔒 안전한 폴백: 마지막 유효한 상품 반환
        // randomValue가 totalQuantity를 초과하는 경우를 대비
        if (prizesLength > 0) {
            return prizesLength - 1;
        }
        
        revert("NO_VALID_PRIZE_FOUND");
    }

    function _selectPrizeDynamic(
        Raffle storage raffle,
        uint256 randomValue
    ) private view returns (uint256) {
        // 🎯 동적 가중치: 현재 남은 티켓 기준으로 재매핑된 randomValue 사용
        uint256 remainingTotalTickets = raffle.status.totalQuantity;
        require(remainingTotalTickets > 0, "NO_REMAINING_TICKETS");
        
        // 남은 티켓 수 기준으로 randomValue 재조정
        uint256 adjustedRandomValue = randomValue % remainingTotalTickets;
        
        // 🚀 선형 검색 방식으로 동적 가중치 처리 (가장 안전하고 정확함)
        uint256 currentPosition = 0;
        uint256 prizesLength = raffle.prizes.length;
        
        for (uint256 i = 0; i < prizesLength;) {
            Prize storage prize = raffle.prizes[i];
            
            // 🔒 안전한 availableTickets 계산
            uint256 availableTickets = 0;
            if (prize.registeredTicketQuantity > prize.pickedTicketQuantity) {
                availableTickets = prize.registeredTicketQuantity - prize.pickedTicketQuantity;
            }
            
            if (availableTickets > 0) {
                // 현재 상품의 범위에 속하는지 확인
                if (adjustedRandomValue >= currentPosition && 
                    adjustedRandomValue < currentPosition + availableTickets) {
                    return i;
                }
                currentPosition += availableTickets;
            }
            
            unchecked { ++i; }
        }
        
        // 🔒 폴백: 사용 가능한 첫 번째 상품 반환
        for (uint256 i = 0; i < prizesLength;) {
            Prize storage prize = raffle.prizes[i];
            if (prize.registeredTicketQuantity > prize.pickedTicketQuantity) {
                return i;
            }
            unchecked { ++i; }
        }
        
        // 🚨 최종 폴백: 마지막 상품 (이론적으로 도달하지 않아야 함)
        revert("NO_AVAILABLE_PRIZES_DYNAMIC");
    }



    function _selectPrizeOptimized(
        Raffle storage raffle,
        uint256 randomValue
    ) private view returns (uint256) {
        if (raffle.settings.dynamicWeight) {
            return _selectPrizeDynamic(raffle, randomValue);
        } else {
            return _selectPrizeStatic(raffle, randomValue);
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
                blockhash(block.number - 1)
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
        require(raffle.status.totalQuantity > 0, "RAFFLE_ENDED");
        
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





    function getRaffleCoreInfo(uint256 raffleId) external view returns (RaffleCoreInfo memory) {
        Raffle storage raffle = raffles[raffleId];
        require(raffle.timing.startDate > 0, "RAFFLE_NOT_EXISTS");

        Prize memory bestPrize = _findBestPrize(raffle.prizes);

        return RaffleCoreInfo({
            title: raffle.basicInfo.title,
            imageUrl: raffle.basicInfo.imageUrl,
            iconUrl: raffle.basicInfo.iconUrl,
            startDate: raffle.timing.startDate,
            endDate: raffle.timing.endDate,
            drawDate: raffle.timing.drawDate,
            instantDraw: raffle.timing.instantDraw,
            participationLimit: raffle.settings.participationLimit,
            participationLimitPerPlayer: raffle.settings.participationLimitPerPlayer,
            participationFeeAssetId: raffle.fee.participationFeeAssetId,
            participationFeeAmount: raffle.fee.participationFeeAmount,
            raffleId: raffleId,
            isActive: raffle.status.isActive,
            isDrawn: raffle.status.isDrawn,
            totalQuantity: raffle.status.totalQuantity,
            participationCount: raffleParticipants[raffleId].length,
            defaultBestPrize: raffle.basicInfo.bestPrize,
            currentBestPrize: bestPrize
        });
    }

    // 참가 + 즉시 추첨 + 배포 마킹 통합 함수
    function participateAndDraw(uint256 raffleId, address player) 
        external 
        nonReentrant 
        whenNotPaused 
        returns (uint256 participantId, uint256 prizeIndex, uint256 resultId) 
    {
        _validateParticipation(raffleId, player, true);
        
        Raffle storage raffle = raffles[raffleId];
        
        // 🔒 추가 안전성 검사: totalQuantity 재확인
        require(raffle.status.totalQuantity > 0, "NO_TICKETS_REMAINING");
        
        participantId = _participateInternal(raffleId, player);
        
        // 🔒 안전한 랜덤값 생성: totalQuantity 재확인 후 modulo 연산
        uint256 currentTotalQuantity = raffle.status.totalQuantity;
        require(currentTotalQuantity > 0, "RAFFLE_TICKETS_EXHAUSTED");
        
        Participant memory participant = participants[participantId];
        bytes32 randomSeed = _generateSecureRandom(player, raffleId, participantId);
        uint256 randomValue = uint256(randomSeed) % currentTotalQuantity;
        prizeIndex = _selectPrize(raffle, randomValue);
        
        // 🔒 안전한 수량 업데이트: underflow 방지
        if (raffle.settings.dynamicWeight) {
            raffle.prizes[prizeIndex].pickedTicketQuantity++;
            
            // totalQuantity 감소 전 underflow 방지
            require(raffle.status.totalQuantity > 0, "CANNOT_DECREASE_ZERO_QUANTITY");
            raffle.status.totalQuantity--;
        }
        raffle.status.drawnParticipantCount++;
        
        resultId = _lotteryResultIdCounter++;
        lotteryResults[resultId] = LotteryResult({
            lotteryTicketNumber: participant.lotteryTicketNumber,
            player: player,
            raffleId: raffleId,
            prizeIndex: prizeIndex,
            drawnAt: block.timestamp,
            claimed: true,
            claimedAt: block.timestamp
        });
        
        ticketToResultId[participant.lotteryTicketNumber] = resultId;
        
        // 래플 완료 체크: 동적 가중치에서 티켓 소진 시
        if (raffle.settings.dynamicWeight && raffle.status.totalQuantity == 0) {
            raffle.status.isDrawn = true;
        }
        
        emit ParticipatedAndDrawn(raffleId, player, participantId, prizeIndex, resultId, block.timestamp);
        
        return (participantId, prizeIndex, resultId);
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
        
        playerParticipantIds[raffleId][player].push(participantId);
        
        return participantId;
    }
    

    
    event ParticipatedAndDrawn(
        uint256 indexed raffleId,
        address indexed player,
        uint256 participantId,
        uint256 prizeIndex,
        uint256 resultId,
        uint256 timestamp
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