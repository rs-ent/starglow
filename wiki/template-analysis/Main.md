# Main 템플릿 분석

## 컴포넌트 구조

```mermaid
graph TD
    T["Main.tsx (Template)"]
    O1["NavBar (Organism)"]
    O2["HeroGitbook (Organism)"]
    O3["HeroFollowUs (Organism)"]
    O4["Footer (Organism)"]

    T --> O1
    T --> O2
    T --> O3
    T --> O4

    style T fill:#7ec5da,stroke:#2a6079
    style O1 fill:#a1d6e6,stroke:#3c7d9b
    style O2 fill:#a1d6e6,stroke:#3c7d9b
    style O3 fill:#a1d6e6,stroke:#3c7d9b
    style O4 fill:#a1d6e6,stroke:#3c7d9b
```

## 사용된 컴포넌트

- **NavBar** (organism): `@/components/organisms/NavBar`
- **HeroGitbook** (organism): `@/components/organisms/Hero.Gitbook`
- **HeroFollowUs** (organism): `@/components/organisms/Hero.FollowUs`
- **Footer** (organism): `@/components/organisms/Footer`

## 상태 관리

- 이 템플릿에서는 상태를 사용하지 않습니다.

## 사용된 훅

- 이 템플릿에서는 커스텀 훅을 사용하지 않습니다.

## 임포트된 모듈

```
@/components/organisms/NavBar
@/components/organisms/Hero.Gitbook
@/components/organisms/Hero.FollowUs
@/components/organisms/Footer
next/image
```
