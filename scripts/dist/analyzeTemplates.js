"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const analyzeTemplate_1 = require("./analyzeTemplate");
// 프로젝트 루트 디렉토리
const projectRoot = path_1.default.resolve(__dirname, "..");
// 템플릿 디렉토리 경로
const templatesDir = path_1.default.join(projectRoot, "components", "templates");
// 분석 결과 저장 디렉토리
const outputDir = path_1.default.join(projectRoot, "wiki", "template-analysis");
// 템플릿 분석 실행
console.log("템플릿 컴포넌트 분석 시작...");
console.log(`템플릿 디렉토리: ${templatesDir}`);
console.log(`출력 디렉토리: ${outputDir}`);
(0, analyzeTemplate_1.analyzeAllTemplates)(templatesDir, outputDir, projectRoot);
console.log("템플릿 컴포넌트 분석 완료!");
console.log(`분석 결과: ${outputDir}`);
