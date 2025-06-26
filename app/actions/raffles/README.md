# 🎰 Starglow 래플 시스템 v2.0

## 📋 시스템 개요

**핵심 철학**: "단순함이 최고의 복잡함이다"

- 상품 수량 기반의 직관적 확률 시스템
- 프론트엔드와 백엔드 책임 분리
- 날짜 기반 상태 관리
- 확장 가능한 UI 표현 방식

## 🎯 핵심 개념

### 1. 상품 풀 시스템 (Prize Pool)

```
총 1000개 슬롯 중:
- 전설 NFT: 1개 (0.1% 확률)
- 레어 굿즈: 49개 (4.9% 확률)
- 일반 스티커: 200개 (20% 확률)
- 꽝: 750개 (75% 확률)
```

**장점**:

- 확률 = 수량/총수량 (자동 계산)
- 꽝도 하나의 상품으로 취급
- 직관적이고 투명한 확률 시스템

### 2. 날짜 기반 상태 관리

```typescript
// Status는 계산된 값 (DB 저장 X)
const status = calculateStatus(startDate, endDate, drawDate);

function calculateStatus(start, end, draw) {
  const now = new Date();
  if (now < start) return "UPCOMING";
  if (now < end) return "ACTIVE";
  if (draw && now < draw) return "WAITING_DRAW";
  return "COMPLETED";
}
```

### 3. 즉시 공개 vs 일괄 공개

```typescript
// 즉시 공개: drawDate = null, instantReveal = true
// 일괄 공개: drawDate = 설정된 날짜, instantReveal = false
```

### 4. UI 표현 방식 (프론트엔드 전용)

```typescript
displayType: "SCRATCH_CARD" |
  "SLOT_MACHINE" |
  "ROULETTE" |
  "GACHA" |
  "CARD_FLIP";
// 백엔드는 신경 쓰지 않고, 프론트에서만 애니메이션/UI 다르게 처리
```

## 🏗️ 데이터베이스 설계

### Raffle 모델

```prisma
model Raffle {
  id          String   @id @default(cuid())
  title       String
  description String?
  imgUrl      String?

  // 📅 날짜 기반 관리 (상태는 계산으로)
  startDate   DateTime @default(now())
  endDate     DateTime
  drawDate    DateTime? // null이면 즉시 공개

  // ⚡ 공개 방식
  instantReveal Boolean @default(true) // 즉시 결과 확인 여부

  // 🎨 UI 표현 (프론트엔드 전용)
  displayType String @default("GACHA") // "SCRATCH_CARD", "SLOT_MACHINE", etc.

  // 👥 참가 조건
  maxParticipants   Int?
  minimumPoints     Int?
  minimumSGP        Int?
  entryFeeAssetId   String?
  entryFeeAmount    Int @default(0)
  allowMultipleEntry Boolean @default(false)

  // 🔧 설정
  isPublic     Boolean @default(true)
  isActive     Boolean @default(true)
  artistId     String?

  // 📊 통계 (자동 계산)
  totalSlots        Int @default(0) // 모든 상품 수량의 합
  totalParticipants Int @default(0)

  // Relations
  artist       Artist? @relation(fields: [artistId], references: [id])
  entryFeeAsset Asset? @relation(fields: [entryFeeAssetId], references: [id])
  prizes       RafflePrize[]
  participants RaffleParticipant[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### RafflePrize 모델

```prisma
model RafflePrize {
  id       String @id @default(cuid())
  raffleId String

  // 🎁 상품 정보
  title       String
  description String?
  imageUrl    String?
  order       Int @default(0)

  // 📦 수량 = 확률
  quantity Int // 이 상품의 총 개수 (확률은 quantity/totalSlots)

  // 🏆 상품 타입
  prizeType   RafflePrizeType // "ASSET", "NFT", "EMPTY" (꽝)

  // Asset 상품
  assetId     String?
  assetAmount Int?

  // NFT 상품
  spgAddress  String?
  nftQuantity Int?

  // 상태
  isActive Boolean @default(true)

  // Relations
  raffle      Raffle @relation(fields: [raffleId], references: [id])
  asset       Asset? @relation(fields: [assetId], references: [id])
  spg         Story_spg? @relation(fields: [spgAddress], references: [address])
  winners     RaffleWinner[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### RaffleParticipant 모델

```prisma
model RaffleParticipant {
  id       String @id @default(cuid())
  raffleId String
  playerId String

  // 🎲 추첨 결과
  prizeId       String? // 당첨된 상품 ID (null이면 미추첨)
  drawnAt       DateTime? // 추첨 실행 시간
  revealedAt    DateTime? // 사용자가 결과 확인한 시간
  isRevealed    Boolean @default(false)

  // 🔢 추첨 정보
  slotNumber    Int? // 뽑은 슬롯 번호 (검증용)
  randomSeed    String? // 추첨 시드 (검증용)

  // Relations
  raffle Raffle @relation(fields: [raffleId], references: [id])
  player Player @relation(fields: [playerId], references: [id])
  prize  RafflePrize? @relation(fields: [prizeId], references: [id])

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([raffleId, playerId])
}
```

### RaffleWinner 모델 (상품 지급 관리)

```prisma
model RaffleWinner {
  id      String @id @default(cuid())
  raffleId String
  prizeId  String
  playerId String

  // 🎁 지급 상태
  status          RafflePrizeStatus @default(PENDING)
  distributedAt   DateTime?
  transactionHash String?
  failureReason   String?

  // Relations
  raffle Raffle @relation(fields: [raffleId], references: [id])
  prize  RafflePrize @relation(fields: [prizeId], references: [id])
  player Player @relation(fields: [playerId], references: [id])

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## ⚙️ 핵심 로직

### 1. 참가 (Participate)

```typescript
async function participateRaffle(raffleId: string, playerId: string) {
  // 1. 참가 조건 검증
  // 2. 참가자 등록
  // 3. 즉시 공개인 경우 → 즉시 추첨 실행
  // 4. 일괄 공개인 경우 → 대기 상태
}
```

### 2. 추첨 로직 (단순화)

```typescript
function drawPrize(raffle: Raffle): RafflePrize {
  const totalSlots = raffle.totalSlots;
  const randomSlot = Math.floor(Math.random() * totalSlots);

  let currentSlot = 0;
  for (const prize of raffle.prizes.sort((p) => p.order)) {
    if (randomSlot < currentSlot + prize.quantity) {
      return prize; // 당첨!
    }
    currentSlot += prize.quantity;
  }

  throw new Error("Invalid prize configuration");
}
```

### 3. 상태 계산

```typescript
function getRaffleStatus(raffle: Raffle): RaffleStatus {
  const now = new Date();

  if (now < raffle.startDate) return "UPCOMING";
  if (now <= raffle.endDate) return "ACTIVE";
  if (raffle.drawDate && now < raffle.drawDate) return "WAITING_DRAW";
  return "COMPLETED";
}
```

## 🎨 프론트엔드 UI 방식

### Display Types

```typescript
type DisplayType =
  | "GACHA" // 가챠 머신 스타일
  | "SCRATCH_CARD" // 스크래치 카드
  | "SLOT_MACHINE" // 슬롯 머신
  | "ROULETTE" // 룰렛
  | "CARD_FLIP" // 카드 뒤집기
  | "DICE_ROLL"; // 주사위 굴리기
```

### 각 방식별 특징

- **GACHA**: 캡슐 뽑기, 애니메이션 화려
- **SCRATCH_CARD**: 긁어서 확인, 몰입감 높음
- **SLOT_MACHINE**: 클래식한 재미
- **ROULETTE**: 긴장감 있는 연출
- **CARD_FLIP**: 간단하고 깔끔

**중요**: 모든 방식의 **당첨 로직은 동일**하고, **UI 표현만 다름**

## 📊 확률 시스템

### 투명한 확률 공개

```typescript
// 예시: 1000슬롯 래플
const prizes = [
  { title: "전설 NFT", quantity: 1 }, // 0.1%
  { title: "레어 굿즈", quantity: 49 }, // 4.9%
  { title: "일반 스티커", quantity: 200 }, // 20%
  { title: "꽝", quantity: 750 }, // 75%
];

// 확률은 자동 계산되어 사용자에게 표시
const probability = (quantity / totalSlots) * 100;
```

### 확률 검증

- 모든 추첨에 `randomSeed` 저장
- 슬롯 번호와 상품 매핑 기록
- 투명하고 검증 가능한 시스템

## 🚀 API 엔드포인트

### 서버 액션으로 진행합니다.

- app\actions\raffles\actions.ts
- app\actions\raffles\mutations.ts
- app\actions\raffles\queries.ts
- app\actions\raffles\hooks.ts

```

## 🔧 관리자 기능

### 래플 생성

1. 기본 정보 (제목, 설명, 이미지)
2. 날짜 설정 (시작, 종료, 추첨일)
3. 공개 방식 (즉시 vs 일괄)
4. UI 방식 선택
5. 상품 풀 설정 (수량 기반)
6. 참가 조건 설정

### 상품 관리

- 상품별 수량 설정
- 확률 실시간 계산 표시
- 꽝 상품 포함 관리

### 결과 관리

- 추첨 실행 (일괄 공개)
- 당첨자 확인
- 상품 지급 관리

## 📈 통계 및 분석

### 래플 통계

- 참가자 수 추이
- 상품별 당첨 통계
- 확률 vs 실제 결과 분석

### 사용자 통계

- 참가 이력
- 당첨 이력
- 즐겨하는 래플 타입

## 🔮 확장 가능성

### 새로운 UI 방식 추가

- 백엔드 수정 없이 프론트엔드에서만 구현
- `displayType`에 새 값만 추가

### 새로운 상품 타입

- 현재: ASSET, NFT, EMPTY
- 확장: COUPON, EXPERIENCE, PHYSICAL 등

### 고급 기능

- 시간대별 다른 확률
- 사용자별 맞춤 상품 풀
- 연속 참가 보너스

## 🎯 성공 지표

### 사용자 경험

- 래플 참가율 증가
- 사용자 재참가율 증가
- UI 방식별 선호도 분석

### 시스템 안정성

- 추첨 정확성 100%
- 응답 시간 < 500ms
- 동시 접속 처리 능력

## 🛡️ 보안 고려사항

### 추첨 공정성

- 암호학적 안전한 난수 생성
- 추첨 과정 로그 저장
- 검증 가능한 추첨 결과

### 데이터 보안

- 사용자 개인정보 보호
- 상품 정보 암호화
- API 인증 및 권한 관리

---

## 📝 구현 순서

1. **Phase 1**: 기본 모델 및 API 구현
2. **Phase 2**: 관리자 기능 구현
3. **Phase 3**: 프론트엔드 UI 구현
4. **Phase 4**: 고급 기능 및 최적화

**목표**: 단순하지만 강력하고, 확장 가능한 래플 시스템 구축! 🚀
```
