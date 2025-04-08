import fs from "fs";
import path from "path";
import { parse } from "@babel/parser";
import traverse from "@babel/traverse";
import * as t from "@babel/types";
import { generateMermaidDiagram } from "./generateMermaidDiagram";
import { ComponentInfo, TemplateAnalysis } from "./types";

/**
 * 컴포넌트 유형 결정하기
 */
function determineComponentType(
    importPath: string
): "atom" | "molecule" | "organism" | "template" | "unknown" {
    if (importPath.includes("/atoms/")) return "atom";
    if (importPath.includes("/molecules/")) return "molecule";
    if (importPath.includes("/organisms/")) return "organism";
    if (importPath.includes("/templates/")) return "template";
    return "unknown";
}

/**
 * 템플릿 컴포넌트 분석
 */
export function analyzeTemplate(templatePath: string): TemplateAnalysis {
    // 파일 존재 여부 확인
    if (!fs.existsSync(templatePath)) {
        throw new Error(`File not found: ${templatePath}`);
    }

    // 파일 읽기
    const content = fs.readFileSync(templatePath, "utf-8");

    // AST 파싱
    const ast = parse(content, {
        sourceType: "module",
        plugins: ["jsx", "typescript"],
    });

    const analysis: TemplateAnalysis = {
        name: path.basename(templatePath, path.extname(templatePath)),
        imports: [],
        components: [],
        hooks: [],
        states: [],
        jsx: [],
        mermaidDiagram: "",
    };

    // AST 순회하며 분석
    traverse(ast, {
        // 임포트 분석
        ImportDeclaration(nodePath) {
            const importPath = nodePath.node.source.value;
            analysis.imports.push(importPath);

            // 컴포넌트 임포트 분석
            if (importPath.includes("@/components/")) {
                nodePath.node.specifiers.forEach((specifier) => {
                    if (
                        t.isImportDefaultSpecifier(specifier) ||
                        t.isImportSpecifier(specifier)
                    ) {
                        let componentName = "";

                        if (t.isImportDefaultSpecifier(specifier)) {
                            componentName = specifier.local.name;
                        } else if (t.isImportSpecifier(specifier)) {
                            if (specifier.imported) {
                                if (t.isIdentifier(specifier.imported)) {
                                    componentName = specifier.imported.name;
                                } else if (
                                    t.isStringLiteral(specifier.imported)
                                ) {
                                    componentName = specifier.imported.value;
                                }
                            } else {
                                componentName = specifier.local.name;
                            }
                        }

                        analysis.components.push({
                            name: componentName,
                            type: determineComponentType(importPath),
                            path: importPath,
                            children: [],
                        });
                    }
                });
            }
        },

        // 훅 사용 분석
        CallExpression(nodePath) {
            if (
                t.isIdentifier(nodePath.node.callee) &&
                nodePath.node.callee.name.startsWith("use") &&
                nodePath.node.callee.name !== "useEffect" &&
                nodePath.node.callee.name !== "useCallback" &&
                nodePath.node.callee.name !== "useMemo"
            ) {
                analysis.hooks.push(nodePath.node.callee.name);
            }
        },

        // 상태 관리 분석
        VariableDeclarator(nodePath) {
            const init = nodePath.node.init;
            if (
                init &&
                t.isCallExpression(init) &&
                t.isIdentifier(init.callee) &&
                init.callee.name === "useState"
            ) {
                const id = nodePath.node.id;
                if (
                    t.isArrayPattern(id) &&
                    id.elements.length >= 1 &&
                    id.elements[0] &&
                    t.isIdentifier(id.elements[0])
                ) {
                    const stateName = id.elements[0].name;
                    let initialValue = "undefined";

                    if (init.arguments.length > 0) {
                        const arg = init.arguments[0];
                        if (t.isStringLiteral(arg))
                            initialValue = `"${arg.value}"`;
                        else if (t.isNumericLiteral(arg))
                            initialValue = String(arg.value);
                        else if (t.isBooleanLiteral(arg))
                            initialValue = String(arg.value);
                        else if (t.isNullLiteral(arg)) initialValue = "null";
                        else if (t.isObjectExpression(arg)) initialValue = "{}";
                        else if (t.isArrayExpression(arg)) initialValue = "[]";
                    }

                    analysis.states.push({ name: stateName, initialValue });
                }
            }
        },

        // JSX 요소 분석
        JSXElement(nodePath) {
            const jsxElement = nodePath.node;
            const openingElement = jsxElement.openingElement;

            if (t.isJSXIdentifier(openingElement.name)) {
                const elementName = openingElement.name.name;

                // 대문자로 시작하는 요소만 컴포넌트로 간주
                if (
                    elementName[0] === elementName[0].toUpperCase() &&
                    ![
                        "div",
                        "span",
                        "p",
                        "h1",
                        "h2",
                        "h3",
                        "h4",
                        "h5",
                        "h6",
                        "img",
                        "a",
                        "button",
                        "input",
                        "form",
                        "nav",
                        "header",
                        "footer",
                        "main",
                        "section",
                        "article",
                    ].includes(elementName)
                ) {
                    analysis.jsx.push(elementName);
                }
            }
        },
    });

    // 컴포넌트 중복 제거 및 정리
    analysis.components = Array.from(
        new Set(analysis.components.map((c) => c.name))
    )
        .map((name) => analysis.components.find((c) => c.name === name)!)
        .sort((a, b) => {
            const typeOrder = {
                atom: 1,
                molecule: 2,
                organism: 3,
                template: 4,
                unknown: 5,
            };
            return typeOrder[a.type] - typeOrder[b.type];
        });

    // 훅 중복 제거
    analysis.hooks = Array.from(new Set(analysis.hooks));

    // JSX 중복 제거 및 정리
    analysis.jsx = Array.from(new Set(analysis.jsx));

    // Mermaid 다이어그램 생성
    analysis.mermaidDiagram = generateMermaidDiagram(analysis);

    return analysis;
}

/**
 * 템플릿 분석 결과를 마크다운 파일로 내보내기
 */
export function exportTemplateAnalysisToMarkdown(
    analysis: TemplateAnalysis,
    outputPath: string
): void {
    const markdown = `# ${analysis.name} 템플릿 분석

## 컴포넌트 구조

\`\`\`mermaid
${analysis.mermaidDiagram}
\`\`\`

## 사용된 컴포넌트

${analysis.components
    .map((comp) => `- **${comp.name}** (${comp.type}): \`${comp.path}\``)
    .join("\n")}

## 상태 관리

${
    analysis.states.length > 0
        ? analysis.states
              .map((state) => `- \`${state.name}\`: ${state.initialValue}`)
              .join("\n")
        : "- 이 템플릿에서는 상태를 사용하지 않습니다."
}

## 사용된 훅

${
    analysis.hooks.length > 0
        ? analysis.hooks.map((hook) => `- \`${hook}\``).join("\n")
        : "- 이 템플릿에서는 커스텀 훅을 사용하지 않습니다."
}

## 임포트된 모듈

\`\`\`
${analysis.imports.join("\n")}
\`\`\`
`;

    // 파일 쓰기
    fs.writeFileSync(outputPath, markdown, "utf-8");
}

/**
 * 모든 템플릿 분석하기
 */
export function analyzeAllTemplates(
    templatesDir: string,
    outputDir: string
): void {
    // 디렉토리 존재 여부 확인
    if (!fs.existsSync(templatesDir)) {
        throw new Error(`Directory not found: ${templatesDir}`);
    }

    // 출력 디렉토리 생성
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // 모든 템플릿 파일 가져오기
    const templateFiles = fs
        .readdirSync(templatesDir)
        .filter((file) => file.endsWith(".tsx") || file.endsWith(".jsx"));

    // 각 템플릿 분석
    templateFiles.forEach((file) => {
        const templatePath = path.join(templatesDir, file);
        const templateName = path.basename(file, path.extname(file));
        const outputPath = path.join(outputDir, `${templateName}.md`);

        try {
            const analysis = analyzeTemplate(templatePath);
            exportTemplateAnalysisToMarkdown(analysis, outputPath);
            console.log(`분석 완료: ${templateName} -> ${outputPath}`);
        } catch (error) {
            console.error(`분석 실패: ${templateName}`, error);
        }
    });

    // 인덱스 파일 생성
    const indexContent = `# 템플릿 컴포넌트 분석 목록

${templateFiles
    .map((file) => {
        const templateName = path.basename(file, path.extname(file));
        return `- [${templateName}](${templateName}.md)`;
    })
    .join("\n")}
`;

    fs.writeFileSync(path.join(outputDir, "index.md"), indexContent, "utf-8");
    console.log(`인덱스 파일 생성: ${path.join(outputDir, "index.md")}`);
}
