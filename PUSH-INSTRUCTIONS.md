# GitHub에 변경사항 푸시하기

다음 명령어를 사용하여 위키 문서와 템플릿 분석 도구의 변경사항을 GitHub에 푸시할 수 있습니다.

## 1. 변경된 파일 추가

```bash
# Wiki 관련 파일 추가
git add wiki/Home.md
git add wiki/template-analysis/README.md
git add wiki/template-analysis/Events.md
git add wiki/template-analysis/Main.md
git add wiki/template-analysis/Quests.md
git add wiki/template-analysis/User.md

# 템플릿 분석 도구 파일 추가
git add scripts/README.md
git add scripts/analyzeTemplate.ts
git add scripts/analyzeTemplates.ts
git add scripts/generateMermaidDiagram.ts
git add scripts/types.ts

# GitHub Actions 워크플로우 추가
git add .github/workflows/update-wiki.yml

# 프로젝트 README 추가
git add README.md
```

## 2. 변경사항 커밋

```bash
git commit -m "위키 문서 정비 및 템플릿 분석 도구 추가"
```

## 3. GitHub에 푸시

```bash
git push origin main
```

## 4. GitHub Wiki 설정

1. GitHub 저장소에서 Wiki 기능 활성화 (필요한 경우)
2. `WIKI-SETUP.md` 문서의 지침에 따라 작업

## 5. 자동화 설정 확인

GitHub Actions 워크플로우가 추가되었으므로, 이제 `wiki/` 디렉토리의 변경사항이 자동으로 GitHub Wiki에 반영됩니다.

참고: 최초 1회는 수동으로 Wiki 저장소를 클론하고 Push 해야 할 수도 있습니다.
