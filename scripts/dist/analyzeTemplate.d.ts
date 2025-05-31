import { TemplateAnalysis } from "./types";
/**
 * 템플릿 컴포넌트 분석
 */
export declare function analyzeTemplate(templatePath: string, projectRoot: string): TemplateAnalysis;
/**
 * 템플릿 분석 결과를 마크다운 파일로 내보내기
 */
export declare function exportTemplateAnalysisToMarkdown(analysis: TemplateAnalysis, outputPath: string): void;
/**
 * 모든 템플릿 분석하기
 */
export declare function analyzeAllTemplates(templatesDir: string, outputDir: string, projectRoot: string): void;
