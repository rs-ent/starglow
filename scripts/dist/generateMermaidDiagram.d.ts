import { ComponentInfo, TemplateAnalysis } from "./types";
/**
 * 템플릿 분석 결과를 기반으로 Mermaid 다이어그램 생성
 */
export declare function generateMermaidDiagram(analysis: TemplateAnalysis): string;
/**
 * 컴포넌트 트리 기반으로 Mermaid 다이어그램 생성
 */
export declare function generateComponentTreeDiagram(rootComponent: ComponentInfo | null): string;
