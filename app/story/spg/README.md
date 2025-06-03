# SPG NFT Collection 커스터마이징 가이드

## 개요

Story Protocol의 SPG(Story Protocol Gateway)는 NFT 민팅과 IP Asset 등록을 하나의 트랜잭션으로 처리할 수 있는 강력한 도구입니다. 이 가이드는 커스텀 SPG NFT Collection을 만들고 사용하는 방법을 설명합니다.

## 두 가지 접근 방법

### 1. Story SDK의 createNFTCollection 사용 (권장)

가장 간단한 방법으로, Story Protocol이 제공하는 표준 SPG NFT Collection을 생성합니다.

```typescript
const newCollection = await client.nftClient.createNFTCollection({
  name: "My Collection",
  symbol: "MC",
  isPublicMinting: false,
  mintOpen: true,
  mintFeeRecipient: zeroAddress,
  contractURI: "ipfs://...",
  txOptions: { waitForTransaction: true },
});
```

**장점:**

- 구현이 간단함
- Story Protocol과 100% 호환
- 테스트와 검증이 완료됨

**단점:**

- 커스터마이징 제한
- 고정된 기능만 사용 가능

### 2. 커스텀 SPGNFTCollection 컨트랙트 배포

완전한 제어가 필요한 경우, 자체 NFT 컨트랙트를 배포할 수 있습니다.

```solidity
contract SPGNFTCollection is ERC721A, Ownable, Pausable {
    // 커스텀 로직 구현
}
```

**장점:**

- 완전한 커스터마이징 가능
- 특별한 기능 추가 가능 (예: 화이트리스트, 동적 가격책정)
- 자체 비즈니스 로직 통합

**단점:**

- 개발 및 테스트 필요
- 가스비 최적화 필요
- 보안 감사 권장

## 커스텀 SPGNFTCollection 주요 기능

### 1. 민팅 권한 관리

```solidity
// 특정 주소만 민팅 가능
mapping(address => bool) public minters;

function addMinter(address minter) external onlyOwner {
    minters[minter] = true;
}
```

### 2. 동적 가격 책정

```solidity
// 시간대별 다른 가격
function getMintPrice() public view returns (uint256) {
    if (block.timestamp < presaleEnd) {
        return presalePrice;
    }
    return publicPrice;
}
```

### 3. 로열티 자동 분배

```solidity
// 민팅 수익 자동 분배
function _distributeFees(uint256 amount) internal {
    uint256 artistShare = (amount * 70) / 100;
    uint256 platformShare = amount - artistShare;

    payable(artistWallet).transfer(artistShare);
    payable(platformWallet).transfer(platformShare);
}
```

## Story Protocol과의 통합

### 1. mintAndRegisterIp 사용

커스텀 컬렉션도 Story Protocol의 `mintAndRegisterIp`와 호환됩니다:

```typescript
const result = await storyClient.ipAsset.mintAndRegisterIp({
  spgNftContract: customCollectionAddress,
  ipMetadata: {
    ipMetadataURI: "ipfs://metadata",
    ipMetadataHash: "0x...",
    nftMetadataURI: "ipfs://nft-metadata",
    nftMetadataHash: "0x...",
  },
});
```

### 2. 기존 NFT 등록

이미 민팅된 NFT를 IP Asset으로 등록:

```typescript
const ipId = await storyClient.ipAsset.register({
  nftContract: customCollectionAddress,
  tokenId: "1",
  ipMetadata: {...}
});
```

## Starglow 플랫폼 특화 기능

### 1. 아티스트별 컬렉션

```typescript
// 각 아티스트마다 전용 SPG Collection 생성
const artistCollection = await createSPG({
  name: `${artist.name} Official Collection`,
  symbol: artist.code,
  artistId: artist.id,
  selectedMetadata: artistMetadata,
});
```

### 2. 팬 등급별 민팅 권한

```solidity
enum FanTier { BRONZE, SILVER, GOLD, PLATINUM }

mapping(address => FanTier) public fanTiers;

function mint(address to) external {
    require(fanTiers[msg.sender] >= FanTier.SILVER, "Silver tier required");
    // 민팅 로직
}
```

### 3. 스테이킹 연동

```solidity
interface IStakingContract {
    function getStakedAmount(address user) external view returns (uint256);
}

function mintWithStakingDiscount(address to) external payable {
    uint256 stakedAmount = stakingContract.getStakedAmount(msg.sender);
    uint256 discount = calculateDiscount(stakedAmount);
    uint256 finalPrice = basePrice - discount;

    require(msg.value >= finalPrice, "Insufficient payment");
    // 민팅 로직
}
```

## 보안 고려사항

1. **재진입 공격 방지**: `ReentrancyGuard` 사용
2. **권한 관리**: `Ownable` 패턴 적용
3. **일시정지 기능**: 긴급상황 대응용 `Pausable`
4. **검증된 라이브러리**: OpenZeppelin 컨트랙트 사용

## 가스 최적화

1. **ERC721A 사용**: 배치 민팅시 가스 절약
2. **스토리지 최적화**: 변수 패킹
3. **불필요한 연산 제거**: 체크 최소화

## 배포 체크리스트

- [ ] 컨트랙트 컴파일 및 테스트
- [ ] 테스트넷 배포 및 검증
- [ ] Story Protocol과 통합 테스트
- [ ] 보안 감사 (메인넷 배포 전)
- [ ] 프론트엔드 통합
- [ ] 모니터링 설정

## 예제 코드

전체 예제는 다음 파일들을 참고하세요:

- `/web3/contracts/SPGNFTCollection.sol` - 커스텀 컨트랙트
- `/app/examples/deployCustomSPGNFT.ts` - 배포 스크립트
- `/app/story/spg/actions.ts` - Story Protocol 통합

## FAQ

**Q: ISPGNFT 인터페이스를 반드시 구현해야 하나요?**
A: 아닙니다. 표준 ERC721 컨트랙트도 `register` 함수로 IP Asset 등록이 가능합니다.

**Q: 커스텀 컬렉션의 가스비는 얼마나 되나요?**
A: 배포시 약 2-3M 가스, 민팅시 ERC721A 사용시 약 50-150k 가스입니다.

**Q: Story Protocol의 라이선스는 커스텀 컬렉션에도 적용되나요?**
A: 네, IP Asset으로 등록하면 모든 Story Protocol 기능을 사용할 수 있습니다.
