# Quests 템플릿 분석

## 컴포넌트 구조

```mermaid
graph TD
    T["Quests.tsx (Template)"]
    O1["QuestUtilBar (Organism)"]
    O2["QuestContents (Organism)"]
    O3["QuestNavBar (Organism)"]
    A1["PartialLoading (Atom)"]

    T --> O1
    T --> O2
    T --> O3
    O1 --> A1

    style T fill:#7ec5da,stroke:#2a6079
    style O1 fill:#a1d6e6,stroke:#3c7d9b
    style O2 fill:#a1d6e6,stroke:#3c7d9b
    style O3 fill:#a1d6e6,stroke:#3c7d9b
    style A1 fill:#e8f4f8,stroke:#79c0d2
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
