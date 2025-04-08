import path from "path";
import { analyzeAllTemplates } from "./analyzeTemplate";

// 프로젝트 루트 디렉토리
const projectRoot = path.resolve(__dirname, "..");

// 템플릿 디렉토리 경로
const templatesDir = path.join(projectRoot, "components", "templates");

// 분석 결과 저장 디렉토리
const outputDir = path.join(projectRoot, "wiki", "template-analysis");

// 템플릿 분석 실행
console.log("템플릿 컴포넌트 분석 시작...");
console.log(`템플릿 디렉토리: ${templatesDir}`);
console.log(`출력 디렉토리: ${outputDir}`);
analyzeAllTemplates(templatesDir, outputDir);
console.log("템플릿 컴포넌트 분석 완료!");
console.log(`분석 결과: ${outputDir}`);
