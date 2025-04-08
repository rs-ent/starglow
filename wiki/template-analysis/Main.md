# Main 템플릿 분석

## 컴포넌트 구조

```mermaid
graph TD
    C1["Main (template)"]
    C2["NavBar (organism)"]
    C3["Hero.Gitbook (organism)"]
    C4["Hero.FollowUs (organism)"]
    C5["Footer (organism)"]

    C1 --> C2
    C1 --> C3
    C1 --> C4
    C1 --> C5

    style C1 fill:#7ec5da,stroke:#2a6079
    style C2 fill:#a1d6e6,stroke:#3c7d9b
    style C3 fill:#a1d6e6,stroke:#3c7d9b
    style C4 fill:#a1d6e6,stroke:#3c7d9b
    style C5 fill:#a1d6e6,stroke:#3c7d9b
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

## 전체 컴포넌트 트리

- **Main** (template)
  - **NavBar** (organism)
  - **Hero.Gitbook** (organism)
  - **Hero.FollowUs** (organism)
  - **Footer** (organism)

