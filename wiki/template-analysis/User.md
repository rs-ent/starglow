# User 템플릿 분석

## 컴포넌트 구조

```mermaid
graph TD
    C1["User (template)"]
    C2["Hamburger (atom)"]
    C3["UserHeader (organism)"]
    C4["UserSidebar (organism)"]
    C5["UserContent (organism)"]

    C1 --> C2
    C1 --> C3
    C1 --> C4
    C1 --> C5

    style C1 fill:#7ec5da,stroke:#2a6079
    style C2 fill:#e8f4f8,stroke:#79c0d2
    style C3 fill:#a1d6e6,stroke:#3c7d9b
    style C4 fill:#a1d6e6,stroke:#3c7d9b
    style C5 fill:#a1d6e6,stroke:#3c7d9b
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

## 전체 컴포넌트 트리

- **User** (template)
  - **Hamburger** (atom)
  - **UserHeader** (organism)
  - **UserSidebar** (organism)
  - **UserContent** (organism)

