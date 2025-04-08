/**
 * 컴포넌트 정보 인터페이스
 */
export interface ComponentInfo {
    name: string;
    type: "atom" | "molecule" | "organism" | "template" | "unknown";
    path: string;
    children: ComponentInfo[];
}

/**
 * 템플릿 분석 결과 인터페이스
 */
export interface TemplateAnalysis {
    name: string;
    imports: string[];
    components: ComponentInfo[];
    hooks: string[];
    states: { name: string; initialValue: string }[];
    jsx: string[];
    mermaidDiagram: string;
}
