# Starglow 템플릿 분석 도구

이 도구는 Starglow 프로젝트의 템플릿 컴포넌트 구조를 분석하고 시각화하는 데 사용됩니다. Atomic Design 패턴(Atoms, Molecules, Organisms, Templates)에 따라 컴포넌트 간의 관계를 추적하고 마크다운 문서로 생성합니다.

## 주요 기능

- 템플릿 컴포넌트 구조 분석
- 컴포넌트 간의 계층 관계 시각화 (Mermaid 다이어그램)
- 상태 관리 및 훅 사용 패턴 분석
- 전체 컴포넌트 트리 문서화

## 설치 방법

```bash
# 의존성 설치
npm install @babel/parser @babel/traverse @babel/types
npm install --save-dev typescript ts-node @types/node
```

## 사용 방법

```bash
# scripts 디렉토리에서 실행
cd scripts
npx ts-node --project tsconfig.json analyzeTemplates.ts
```

분석 결과는 `wiki/template-analysis/` 디렉토리에 마크다운 파일로 생성됩니다.

## 구조

- `analyzeTemplates.ts`: 메인 스크립트
- `analyzeTemplate.ts`: 템플릿 분석 로직
- `generateMermaidDiagram.ts`: Mermaid 다이어그램 생성
- `types.ts`: 타입 정의
- `tsconfig.json`: TypeScript 설정

## 결과물

- 각 템플릿별 분석 문서 (Main.md, Events.md, Quests.md, User.md 등)
- 컴포넌트 구조 다이어그램
- 사용된 컴포넌트, 상태, 훅 목록
- 전체 컴포넌트 트리
