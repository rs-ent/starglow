# Quests 템플릿 분석

## 컴포넌트 구조

```mermaid
graph TD
    C1["Quests (template)"]
    C2["QuestUtilBar (organism)"]
    C3["PartialLoading (atom)"]
    C4["QuestContents (organism)"]
    C5["QuestNavBar (organism)"]

    C1 --> C2
    C1 --> C3
    C1 --> C4
    C1 --> C5

    style C1 fill:#7ec5da,stroke:#2a6079
    style C2 fill:#a1d6e6,stroke:#3c7d9b
    style C3 fill:#e8f4f8,stroke:#79c0d2
    style C4 fill:#a1d6e6,stroke:#3c7d9b
    style C5 fill:#a1d6e6,stroke:#3c7d9b
```

## 사용된 컴포넌트

- **PartialLoading** (atom): `@/components/atoms/PartialLoading`
- **QuestUtilBar** (organism): `@/components/organisms/QuestUtilBar`
- **QuestContents** (organism): `@/components/organisms/QuestContents`
- **QuestNavBar** (organism): `@/components/organisms/QuestNavBar`

## 상태 관리

- `contentType`: "Today"

## 사용된 훅

- `useState`
- `usePlayer`

## 임포트된 모듈

```
react
@/components/organisms/QuestUtilBar
@/components/organisms/QuestContents
@/components/organisms/QuestNavBar
@prisma/client
@/app/hooks/usePlayer
@/components/atoms/PartialLoading
```

## 전체 컴포넌트 트리

- **Quests** (template)
  - **QuestUtilBar** (organism)
  - **PartialLoading** (atom)
  - **QuestContents** (organism)
  - **QuestNavBar** (organism)

