# 📊 Starglow 컨트랙트 가스 예상치

## 🏭 SPGNFTFactory

| 함수                    | 예상 가스  | 비용 (30 gwei) | 설명                            |
| ----------------------- | ---------- | -------------- | ------------------------------- |
| `deployCollection`      | ~4,500,000 | ~0.135 ETH     | 새 NFT 컬렉션 배포              |
| `deployStoryCollection` | ~4,500,000 | ~0.135 ETH     | Story Protocol 호환 컬렉션 배포 |

## 🖼️ SPGNFTCollection

| 함수                            | 예상 가스             | 비용 (30 gwei)  | 설명                 |
| ------------------------------- | --------------------- | --------------- | -------------------- |
| `mint(address)`                 | ~165,000              | ~0.00495 ETH    | 1개 NFT 민팅         |
| `mint(address, uint256)` - 5개  | ~485,000              | ~0.01455 ETH    | 5개 NFT 배치 민팅    |
| `mint(address, uint256)` - 10개 | ~880,000              | ~0.0264 ETH     | 10개 NFT 배치 민팅   |
| `mint` with tokenURIs           | +30,000/URI           | +0.0009 ETH/URI | URI 저장 추가 비용   |
| `escrowTransfer`                | ~130,000              | ~0.0039 ETH     | 서명 기반 전송 (1개) |
| `escrowTransferBatch`           | ~100,000 + 70,000/NFT | 가변            | 배치 전송            |
| `setTokenURI`                   | ~50,000               | ~0.0015 ETH     | 개별 토큰 URI 설정   |
| `addEscrowWallet`               | ~50,000               | ~0.0015 ETH     | 에스크로 지갑 추가   |
| `pause/unpause`                 | ~30,000               | ~0.0009 ETH     | 컨트랙트 일시정지    |

## 🔐 StarglowTBA

| 함수                      | 예상 가스      | 비용 (30 gwei)      | 설명                  |
| ------------------------- | -------------- | ------------------- | --------------------- |
| `initialize`              | ~120,000       | ~0.0036 ETH         | TBA 초기화 (기본)     |
| `initialize` with signers | +25,000/signer | +0.00075 ETH/signer | 허가된 서명자 추가    |
| `execute` (ETH 전송)      | ~50,000        | ~0.0015 ETH         | 단순 ETH 전송         |
| `execute` (컨트랙트 호출) | ~80,000+       | ~0.0024 ETH+        | 대상 함수에 따라 가변 |
| `executeWithSignature`    | +40,000        | +0.0012 ETH         | 서명 검증 추가 비용   |
| `addPermittedSigner`      | ~50,000        | ~0.0015 ETH         | 서명자 추가           |

## 💡 가스 최적화 팁

### 1. **배치 작업 활용**

- 개별 민팅보다 배치 민팅이 효율적
- 10개 민팅: 개별(1,650,000) vs 배치(880,000) = **47% 절약**

### 2. **URI 설정 최적화**

- baseURI 사용 시 개별 tokenURI 설정 불필요
- IPFS 해시 사전 준비로 가스 절약

### 3. **서명 기반 거래**

- 사용자 대신 릴레이어가 가스비 지불
- 대량 전송 시 escrowTransferBatch 활용

### 4. **스토리지 최적화**

```solidity
// 비효율적 ❌
mapping(address => uint256) balance1;
mapping(address => uint256) balance2;
mapping(address => uint256) balance3;

// 효율적 ✅
struct UserData {
    uint256 balance1;
    uint256 balance2;
    uint256 balance3;
}
mapping(address => UserData) userData;
```

## 📈 네트워크별 예상 비용

| 네트워크 | 평균 가스 가격 | Collection 배포 | 1 NFT 민팅       | 10 NFT 배치 민팅 |
| -------- | -------------- | --------------- | ---------------- | ---------------- |
| Ethereum | 30 gwei        | ~0.135 ETH      | ~0.00495 ETH     | ~0.0264 ETH      |
| Polygon  | 100 gwei       | ~0.00045 MATIC  | ~0.0000165 MATIC | ~0.000088 MATIC  |
| Story    | 1 gwei         | ~0.0045 IP      | ~0.000165 IP     | ~0.00088 IP      |

## ⚠️ 주의사항

1. **실제 가스는 다를 수 있음**

   - 네트워크 혼잡도
   - 스토리지 슬롯 상태
   - 컨트랙트 최적화 수준

2. **프록시 패턴 오버헤드**

   - TBA는 프록시로 배포되어 +10-20% 가스 추가

3. **첫 번째 작업이 더 비쌈**
   - 새 스토리지 슬롯 초기화
   - SSTORE opcode 비용

## 🛠️ 가스 측정 도구

```javascript
// Hardhat 가스 리포터 설정 (hardhat.config.js)
module.exports = {
  gasReporter: {
    enabled: true,
    currency: "USD",
    gasPrice: 30,
    coinmarketcap: "YOUR_API_KEY",
  },
};
```

실행: `REPORT_GAS=true npx hardhat test`
