import { ComponentInfo, TemplateAnalysis } from "./types";

/**
 * 템플릿 분석 결과를 기반으로 Mermaid 다이어그램 생성
 */
export function generateMermaidDiagram(analysis: TemplateAnalysis): string {
    const { name, components, jsx } = analysis;
    const usedComponents = [
        ...new Set([...jsx, ...components.map((c: ComponentInfo) => c.name)]),
    ];

    // 컴포넌트 유형에 따른 색상 정의
    const styles = {
        template: { fill: "#7ec5da", stroke: "#2a6079" },
        organism: { fill: "#a1d6e6", stroke: "#3c7d9b" },
        molecule: { fill: "#c5e8f3", stroke: "#5a9ebd" },
        atom: { fill: "#e8f4f8", stroke: "#79c0d2" },
        unknown: { fill: "#f5f5f5", stroke: "#9e9e9e" },
    };

    // 노드 정의
    let nodes: string[] = [];
    let connections: string[] = [];
    let styleDefinitions: string[] = [];

    // 템플릿 노드 추가
    nodes.push(`    T["${name}.tsx (Template)"]`);
    styleDefinitions.push(
        `    style T fill:${styles.template.fill},stroke:${styles.template.stroke}`
    );

    // 각 컴포넌트 타입별로 그룹화
    const componentsByType: Record<string, ComponentInfo[]> = {
        organism: [],
        molecule: [],
        atom: [],
        unknown: [],
    };

    components.forEach((comp: ComponentInfo) => {
        const type = comp.type;
        if (componentsByType[type]) {
            componentsByType[type].push(comp);
        } else {
            componentsByType.unknown.push(comp);
        }
    });

    // Organism 컴포넌트 노드 추가
    componentsByType.organism.forEach((comp, i) => {
        const nodeId = `O${i + 1}`;
        nodes.push(`    ${nodeId}["${comp.name} (Organism)"]`);
        connections.push(`    T --> ${nodeId}`);
        styleDefinitions.push(
            `    style ${nodeId} fill:${styles.organism.fill},stroke:${styles.organism.stroke}`
        );
    });

    // Molecule 컴포넌트 노드 추가
    componentsByType.molecule.forEach((comp, i) => {
        const nodeId = `M${i + 1}`;
        nodes.push(`    ${nodeId}["${comp.name} (Molecule)"]`);

        // Organism에 연결되는지 확인
        let connected = false;
        for (let j = 0; j < componentsByType.organism.length; j++) {
            if (jsx.includes(comp.name)) {
                connections.push(`    O${j + 1} --> ${nodeId}`);
                connected = true;
                break;
            }
        }

        // 연결되지 않았다면 템플릿에 직접 연결
        if (!connected) {
            connections.push(`    T --> ${nodeId}`);
        }

        styleDefinitions.push(
            `    style ${nodeId} fill:${styles.molecule.fill},stroke:${styles.molecule.stroke}`
        );
    });

    // Atom 컴포넌트 노드 추가
    componentsByType.atom.forEach((comp, i) => {
        const nodeId = `A${i + 1}`;
        nodes.push(`    ${nodeId}["${comp.name} (Atom)"]`);

        // Molecule이나 Organism에 연결되는지 확인
        let connected = false;
        for (let j = 0; j < componentsByType.molecule.length; j++) {
            if (jsx.includes(comp.name)) {
                connections.push(`    M${j + 1} --> ${nodeId}`);
                connected = true;
                break;
            }
        }

        // Molecule에 연결되지 않았다면 Organism에 직접 연결
        if (!connected) {
            for (let j = 0; j < componentsByType.organism.length; j++) {
                if (jsx.includes(comp.name)) {
                    connections.push(`    O${j + 1} --> ${nodeId}`);
                    connected = true;
                    break;
                }
            }
        }

        // 아직도 연결되지 않았다면 템플릿에 직접 연결
        if (!connected) {
            connections.push(`    T --> ${nodeId}`);
        }

        styleDefinitions.push(
            `    style ${nodeId} fill:${styles.atom.fill},stroke:${styles.atom.stroke}`
        );
    });

    // 알 수 없는 컴포넌트 노드 추가
    componentsByType.unknown.forEach((comp, i) => {
        const nodeId = `U${i + 1}`;
        nodes.push(`    ${nodeId}["${comp.name} (Unknown)"]`);
        connections.push(`    T --> ${nodeId}`);
        styleDefinitions.push(
            `    style ${nodeId} fill:${styles.unknown.fill},stroke:${styles.unknown.stroke}`
        );
    });

    // 다이어그램 생성
    const diagram = [
        "graph TD",
        ...nodes,
        "",
        ...connections,
        "",
        ...styleDefinitions,
    ].join("\n");

    return diagram;
}
