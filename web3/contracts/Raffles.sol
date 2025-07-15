// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract Raffles {
    struct Raffle {
        string title;
        string description;
        string imageUrl;
        string iconUrl;
        uint256 startDate;
        uint256 endDate;
        bool isActive;
        bool instantDraw;
        uint256 drawDate;
        bool isDrawn;
        bool dynamicWeight;
        uint256 participationLimit;
        uint256 participationLimitPerPlayer;

        string participationFeeAsset;
        string participationFeeAssetId;
        int256 participationFeeAmount;

        Prize[] prizes;
        uint256 totalQuantity;
        uint256 remainingQuantity;
    }

    enum PrizeType {
        EMPTY,
        ASSET,
        NFT,
        TOKEN
    }

    struct Prize {
        string title;
        string description;
        string imageUrl;
        string iconUrl;
        uint256 registeredTicketQuantity;
        uint256 pickedTicketQuantity;
        uint256 order;
        uint256 rarity;

        PrizeType prizeType;
        string assetId;
        address collectionAddress;
        uint256[] tokenIds;
        uint256 prizeQuantity;
        
        uint256 startTicketNumber;
    }

    struct Participant {
        address player;
        uint256 raffleId;
        bytes32 lotteryTicketNumber;
        uint256 participatedAt;
    }
    
    struct LotteryResult {
        bytes32 lotteryTicketNumber;
        address player;
        uint256 prizeIndex;
        uint256 drawnAt;
        bool claimed;
        uint256 claimedAt;
    }
    
    mapping(uint256 => Raffle) public raffles;
    uint256 private _raffleIdCounter = 1;
    
    mapping(uint256 => Participant) public participants;
    uint256 private _participantIdCounter = 1;

    mapping(uint256 => uint256[]) public raffleParticipants;

    mapping(uint256 => LotteryResult) public lotteryResults;
    uint256 private _lotteryResultIdCounter = 1;

    bool public paused;

    address public owner;
    mapping(address => bool) public admins;
    constructor() {
        owner = msg.sender;
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

    event RaffleCreated(uint256 indexed raffleId);
    function createRaffle(
        string memory title,
        string memory description,
        string memory imageUrl,
        string memory iconUrl,
        uint256 startDate,
        uint256 endDate,
        bool instantDraw,
        uint256 drawDate,
        bool dynamicWeight,
        uint256 participationLimit,
        uint256 participationLimitPerPlayer,
        string memory participationFeeAsset,
        string memory participationFeeAssetId,
        int256 participationFeeAmount,
        Prize[] memory prizes
    ) external onlyAdmin whenNotPaused returns (uint256) {
        require(bytes(title).length > 0, "TITLE_REQUIRED");
        require(endDate > startDate, "INVALID_DATE");

        uint256 raffleId = _raffleIdCounter++;

        Raffle storage newRaffle = raffles[raffleId];
        newRaffle.title = title;
        newRaffle.description = description;
        newRaffle.imageUrl = imageUrl;
        newRaffle.iconUrl = iconUrl;

        newRaffle.startDate = startDate;
        newRaffle.endDate = endDate;

        newRaffle.isActive = true;
        newRaffle.instantDraw = instantDraw;
        newRaffle.drawDate = drawDate;
        newRaffle.isDrawn = false;

        newRaffle.dynamicWeight = dynamicWeight;

        newRaffle.participationLimit = participationLimit;
        newRaffle.participationLimitPerPlayer = participationLimitPerPlayer;

        newRaffle.participationFeeAsset = participationFeeAsset;
        newRaffle.participationFeeAssetId = participationFeeAssetId;
        newRaffle.participationFeeAmount = participationFeeAmount;

        uint256 ticketNumber = 0;
        for (uint256 i = 0; i < prizes.length; i++) {
            prizes[i].pickedTicketQuantity = 0;
            prizes[i].startTicketNumber = ticketNumber;
            newRaffle.prizes.push(prizes[i]);
            newRaffle.totalQuantity += prizes[i].registeredTicketQuantity;
            ticketNumber += prizes[i].registeredTicketQuantity;
        }

        emit RaffleCreated(raffleId);

        return raffleId;
    }

    event Participated(uint256 indexed raffleId, uint256 indexed participantId, address indexed player);
    function participate(uint256 raffleId, address player) external whenNotPaused returns (uint256) {
        require(raffles[raffleId].isActive, "RAFFLE_NOT_ACTIVE");
        require(block.timestamp >= raffles[raffleId].startDate, "RAFFLE_NOT_STARTED");
        require(block.timestamp <= raffles[raffleId].endDate, "RAFFLE_ENDED");
        require(!raffles[raffleId].isDrawn, "RAFFLE_ENDED");
        require(raffles[raffleId].remainingQuantity > 0, "RAFFLE_ENDED");

        if (raffles[raffleId].participationLimit > 0) {
            require(
                raffleParticipants[raffleId].length < raffles[raffleId].participationLimit,
                "PARTICIPATION_LIMIT_REACHED"
            );
        }

        if (raffles[raffleId].participationLimitPerPlayer > 0) {
            uint256 playerParticipationCount = 0;
            for (uint256 i = 0; i < raffleParticipants[raffleId].length; i++) {
                if (participants[raffleParticipants[raffleId][i]].player == player) {
                    playerParticipationCount++;
                }
            }

            require(
                playerParticipationCount < raffles[raffleId].participationLimitPerPlayer,
                "PARTICIPATION_LIMIT_REACHED"
            );
        }

        bytes32 ticketNumber = keccak256(
            abi.encode(
                player,
                block.timestamp,
                block.prevrandao,
                raffleId,
                _participantIdCounter
            )
        );

        uint256 participantId = _participantIdCounter++;
        participants[participantId] = Participant({
            player: player,
            raffleId: raffleId,
            lotteryTicketNumber: ticketNumber,
            participatedAt: block.timestamp
        });

        raffleParticipants[raffleId].push(participantId);

        emit Participated(raffleId, participantId, player);

        return participantId;
    }

    event LotteryDrawn(
        uint256 indexed resultId, 
        uint256 indexed raffleId, 
        address indexed player, 
        uint256 participantId, 
        uint256 prizeIndex
    );
    
    function draw(uint256 raffleId, uint256 participantId) external whenNotPaused returns (uint256) {
        require(!raffles[raffleId].isDrawn, "ALREADY_DRAWN");
        require(raffles[raffleId].instantDraw || block.timestamp >= raffles[raffleId].drawDate, "TOO_EARLY");
        require(raffles[raffleId].remainingQuantity > 0, "RAFFLE_ENDED");

        return _drawForParticipant(participantId, raffles[raffleId], 0);
    }

    function batchDraw(uint256 raffleId) external onlyAdmin whenNotPaused returns (uint256[] memory) {
        require(!raffles[raffleId].isDrawn, "ALREADY_DRAWN");
        require(block.timestamp >= raffles[raffleId].drawDate, "TOO_EARLY");
        
        Raffle storage raffle = raffles[raffleId];
        uint256[] memory participantIds = raffleParticipants[raffleId];

        

        uint256[] memory prizeIndices = new uint256[](participantIds.length);
        for (uint256 i = 0; i < participantIds.length; i++) {
            uint256 prizeIndex = _drawForParticipant(
                participantIds[i],
                raffle,
                i
            );
            prizeIndices[i] = prizeIndex;
        }

        return prizeIndices;
    }

    function _drawForParticipant(
        uint256 participantId,
        Raffle storage raffle,
        uint256 nonce
    ) private returns (uint256) {
        Participant memory participant = participants[participantId];
        require(participant.player != address(0), "INVALID_PARTICIPANT");

        bytes32 randomSeed = keccak256(
            abi.encode(raffle.drawDate, participant.lotteryTicketNumber, block.prevrandao, participantId, nonce)
        );
        
        uint256 randomValue = uint256(randomSeed) % raffle.totalQuantity;
        uint256 prizeIndex = _selectPrize(raffle, randomValue);

        if (raffle.dynamicWeight) {
            raffle.prizes[prizeIndex].pickedTicketQuantity++;
            raffle.totalQuantity--;
        }
        
        uint256 resultId = _lotteryResultIdCounter++;
        lotteryResults[resultId] = LotteryResult({
            lotteryTicketNumber: participant.lotteryTicketNumber,
            player: participant.player,
            prizeIndex: prizeIndex,
            drawnAt: block.timestamp,
            claimed: false,
            claimedAt: 0
        });

        raffle.remainingQuantity--;

        if (raffle.remainingQuantity == 0) {
            raffle.isDrawn = true;
        }
        
        emit LotteryDrawn(
            resultId,
            participant.raffleId,
            participant.player,
            participantId,
            prizeIndex
        );

        return prizeIndex;
    }

    function _selectPrize(
        Raffle storage raffle,
        uint256 randomValue
    ) private view returns (uint256) {
        uint256 currentStart = 0;
        for (uint256 i = 0; i < raffle.prizes.length; i++) {
            uint256 availableTickets;
            
            if (raffle.dynamicWeight) {
                availableTickets = raffle.prizes[i].registeredTicketQuantity - raffle.prizes[i].pickedTicketQuantity;
            } else {
                availableTickets = raffle.prizes[i].registeredTicketQuantity;
            }
            
            // 이 prize의 범위에 속하는지 확인
            if (randomValue >= currentStart && randomValue < currentStart + availableTickets) {
                return i;
            }
            
            currentStart += availableTickets;
        }

        return raffle.prizes.length - 1;
    }
}