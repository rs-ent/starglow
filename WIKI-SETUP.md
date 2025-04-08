# GitHub Wiki로 문서 배포하기

이 가이드는 Starglow 프로젝트의 wiki 폴더에 있는 문서들을 GitHub Wiki로 배포하는 방법을 설명합니다.

## 1. GitHub Wiki 활성화

1. 프로젝트 GitHub 저장소로 이동합니다.
2. 상단 탭에서 "Settings"를 클릭합니다.
3. "Features" 섹션에서 "Wikis" 옵션을 활성화합니다.
4. 이제 저장소 탭 메뉴에 "Wiki" 항목이 나타납니다.

## 2. Wiki 저장소 클론

GitHub Wiki는 별도의 Git 저장소로 관리됩니다. 메인 저장소와는 별개로 클론해야 합니다.

```bash
# 메인 저장소와 같은 부모 디렉토리에 Wiki 저장소 클론
git clone https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.wiki.git
```

## 3. wiki 폴더의 내용 복사

```bash
# wiki 폴더 내용을 Wiki 저장소로 복사
cp -r ./wiki/* ../YOUR-REPOSITORY.wiki/
```

## 4. Wiki 저장소에 변경사항 커밋 및 푸시

```bash
# Wiki 저장소로 이동
cd ../YOUR-REPOSITORY.wiki

# 변경사항 확인
git status

# 모든 변경사항 추가
git add .

# 변경사항 커밋
git commit -m "Initial wiki content"

# 변경사항 푸시
git push origin master
```

## 5. 자동화 방법 (선택사항)

CI/CD 파이프라인을 설정하여 매번 메인 저장소의 wiki 폴더가 변경될 때마다 자동으로 GitHub Wiki를 업데이트할 수 있습니다:

1. GitHub 액션 워크플로우 파일을 `.github/workflows/update-wiki.yml`에 생성:

```yaml
name: Update GitHub Wiki

on:
  push:
    branches:
      - main
    paths:
      - "wiki/**"

jobs:
  update-wiki:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout main repository
        uses: actions/checkout@v3

      - name: Checkout wiki repository
        uses: actions/checkout@v3
        with:
          repository: ${{ github.repository }}.wiki
          path: temp-wiki

      - name: Copy wiki files
        run: |
          cp -r wiki/* temp-wiki/

      - name: Commit and push changes
        working-directory: temp-wiki
        run: |
          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"
          git add .
          git diff --quiet && git diff --staged --quiet || git commit -m "Update wiki content"
          git push
```

## 주의사항

- GitHub Wiki는 Mermaid 다이어그램을 기본적으로 지원하지 않을 수 있습니다. GitHub에서 지원하는 Markdown 형식으로 수정해야 할 수도 있습니다.
- 이미지, 다이어그램 등의 파일은 Wiki 저장소 내에 별도로 저장하고 상대 경로로 참조해야 합니다.
- 파일 이름에 공백이 없어야 하며, 파일명은 위키 페이지 제목이 됩니다.
