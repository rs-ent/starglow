# User 템플릿 분석

## 컴포넌트 구조

```mermaid
graph TD
    T["User.tsx (Template)"]
    O1["UserHeader (Organism)"]
    O2["UserSidebar (Organism)"]
    O3["UserContent (Organism)"]
    A1["Hamburger (Atom)"]

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

- **Hamburger** (atom): `@/components/atoms/Hamburger`
- **UserHeader** (organism): `@/components/organisms/UserHeader`
- **UserSidebar** (organism): `@/components/organisms/UserSidebar`
- **UserContent** (organism): `@/components/organisms/UserContent`

## 상태 관리

- `contentType`: "myassets"

## 사용된 훅

- `useState`
- `useMobileMenu`
- `useToast`

## 임포트된 모듈

```
react
@/components/organisms/UserHeader
@/components/organisms/UserSidebar
@/components/organisms/UserContent
@/components/atoms/Hamburger
@/app/hooks/useMobileMenu
@prisma/client
framer-motion
@/app/hooks/useToast
```
