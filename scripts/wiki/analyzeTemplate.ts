import fs from "fs";
import path from "path";

import { parse } from "@babel/parser";
import traverse from "@babel/traverse";
import * as t from "@babel/types";

import { generateMermaidDiagram } from "./generateMermaidDiagram";

import type { ComponentInfo, TemplateAnalysis } from "./types";

// 분석한 컴포넌트 캐시 - 중복 분석 방지
const analyzedComponents: Map<string, ComponentInfo> = new Map();

/**
 * 컴포넌트 유형 결정하기
 */
function determineComponentType(
    componentPath: string
): "atom" | "molecule" | "organism" | "template" | "unknown" {
    // 파일 경로에서 유형 결정
    if (
        componentPath.includes("/atoms/") ||
        componentPath.includes("\\atoms\\")
    )
        return "atom";
    if (
        componentPath.includes("/molecules/") ||
        componentPath.includes("\\molecules\\")
    )
        return "molecule";
    if (
        componentPath.includes("/organisms/") ||
        componentPath.includes("\\organisms\\")
    )
        return "organism";
    if (
        componentPath.includes("/templates/") ||
        componentPath.includes("\\templates\\")
    )
        return "template";

    // 파일 이름에서 유형 추론 시도
    const fileName = path.basename(componentPath);

    if (fileName.includes(".atom.") || fileName.startsWith("atom."))
        return "atom";
    if (fileName.includes(".molecule.") || fileName.startsWith("molecule."))
        return "molecule";
    if (fileName.includes(".organism.") || fileName.startsWith("organism."))
        return "organism";
    if (fileName.includes(".template.") || fileName.startsWith("template."))
        return "template";

    // 템플릿 폴더의 기본 파일인 경우
    if (path.dirname(componentPath).endsWith("templates")) {
        return "template";
    }

    return "unknown";
}

/**
 * 임포트 경로를 기반으로 파일 경로 찾기
 */
function resolveComponentPath(
    importPath: string,
    baseDir: string,
    projectRoot: string
): string | null {
    try {
        // @/components/ 형식의 경로 처리
        if (importPath.startsWith("@/components/")) {
            const relativePath = importPath.replace("@/components/", "");
            return (
                path.join(projectRoot, "components", relativePath) +
                (relativePath.endsWith(".tsx") ? "" : ".tsx")
            );
        }

        // ../atoms/, ../molecules/, ../organisms/ 등의 상대 경로 처리
        if (
            importPath.startsWith("../atoms/") ||
            importPath.startsWith("../molecules/") ||
            importPath.startsWith("../organisms/") ||
            importPath.startsWith("../templates/")
        ) {
            // 기본 디렉토리에서 상대 경로 해결
            const resolvedPath =
                path.join(path.dirname(baseDir), importPath.slice(3)) +
                (importPath.endsWith(".tsx") ? "" : ".tsx");

            // 파일 존재 여부 확인
            if (fs.existsSync(resolvedPath)) {
                return resolvedPath;
            }
        }

        console.log(`경로 해결 실패: ${importPath} (baseDir: ${baseDir})`);
        return null;
    } catch (error) {
        console.error(`경로 해결 오류: ${importPath}`, error);
        return null;
    }
}

/**
 * 컴포넌트 파일 분석하여 하위 컴포넌트 찾기
 */
function analyzeComponentFile(
    componentPath: string,
    projectRoot: string,
    depth: number = 0,
    maxDepth: number = 3
): ComponentInfo | null {
    // 최대 깊이 제한 (무한 루프 방지)
    if (depth > maxDepth) return null;

    // 이미 분석한 컴포넌트 재사용
    const cacheKey = componentPath;
    if (analyzedComponents.has(cacheKey)) {
        return analyzedComponents.get(cacheKey)!;
    }

    // 파일 존재 확인
    if (!fs.existsSync(componentPath)) {
        console.log(`파일이 존재하지 않음: ${componentPath}`);
        return null;
    }

    // 파일 내용 읽기
    const content = fs.readFileSync(componentPath, "utf-8");
    const componentName = path.basename(
        componentPath,
        path.extname(componentPath)
    );

    // 컴포넌트 타입 결정
    const componentType = determineComponentType(componentPath);

    // 빈 컴포넌트 정보 생성
    const componentInfo: ComponentInfo = {
        name: componentName,
        type: componentType,
        path: componentPath,
        children: [],
    };

    // 캐시에 먼저 추가 (순환 참조 방지)
    analyzedComponents.set(cacheKey, componentInfo);

    try {
        // AST 파싱
        const ast = parse(content, {
            sourceType: "module",
            plugins: ["jsx", "typescript"],
        });

        // JSX 내에서 사용된 컴포넌트 추적
        const usedComponents = new Set<string>();

        // 하위 컴포넌트 임포트 처리 및 컴포넌트 정보 저장
        const importedComponents = new Map<
            string,
            { path: string; name: string }
        >();

        // 하위 컴포넌트 임포트 찾기
        traverse(ast, {
            ImportDeclaration(nodePath) {
                const importPath = nodePath.node.source.value;

                // 컴포넌트 관련 경로만 처리
                if (
                    importPath.includes("@/components/") ||
                    importPath.startsWith("../atoms/") ||
                    importPath.startsWith("../molecules/") ||
                    importPath.startsWith("../organisms/") ||
                    importPath.startsWith("../templates/")
                ) {
                    nodePath.node.specifiers.forEach((specifier) => {
                        if (
                            t.isImportDefaultSpecifier(specifier) ||
                            t.isImportSpecifier(specifier)
                        ) {
                            let childComponentName = "";

                            if (t.isImportDefaultSpecifier(specifier)) {
                                childComponentName = specifier.local.name;
                            } else if (t.isImportSpecifier(specifier)) {
                                if (specifier.imported) {
                                    if (t.isIdentifier(specifier.imported)) {
                                        childComponentName =
                                            specifier.imported.name;
                                    } else if (
                                        t.isStringLiteral(specifier.imported)
                                    ) {
                                        childComponentName =
                                            specifier.imported.value;
                                    }
                                } else {
                                    childComponentName = specifier.local.name;
                                }
                            }

                            // 로컬 변수명 (코드에서 사용되는 이름)
                            const localName = specifier.local.name;

                            // 임포트된 컴포넌트 정보 저장
                            importedComponents.set(localName, {
                                path: importPath,
                                name: childComponentName,
                            });
                        }
                    });
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
                        usedComponents.add(elementName);
                    }
                }
            },
        });

        // 실제 사용된 하위 컴포넌트만 분석
        for (const usedComp of usedComponents) {
            if (importedComponents.has(usedComp)) {
                const { path: importPath } = importedComponents.get(usedComp)!;

                // 하위 컴포넌트 파일 경로 해결
                const childComponentPath = resolveComponentPath(
                    importPath,
                    componentPath,
                    projectRoot
                );

                if (childComponentPath) {
                    // 하위 컴포넌트 재귀적으로 분석
                    const childComponentInfo = analyzeComponentFile(
                        childComponentPath,
                        projectRoot,
                        depth + 1,
                        maxDepth
                    );

                    // 하위 컴포넌트 추가
                    if (childComponentInfo) {
                        componentInfo.children.push(childComponentInfo);
                    }
                }
            }
        }

        return componentInfo;
    } catch (error) {
        console.error(`컴포넌트 분석 실패: ${componentPath}`, error);
        return componentInfo; // 오류가 있어도 부분적 정보 반환
    }
}

/**
 * 템플릿 컴포넌트 분석
 */
export function analyzeTemplate(
    templatePath: string,
    projectRoot: string
): TemplateAnalysis {
    // 분석 캐시 초기화
    analyzedComponents.clear();

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
        componentTree: null, // 전체 컴포넌트 트리
    };

    // 템플릿 자체를 루트 컴포넌트로 분석
    analysis.componentTree = analyzeComponentFile(
        templatePath,
        projectRoot,
        0,
        5
    );

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

## 전체 컴포넌트 트리

${generateComponentTreeMarkdown(analysis.componentTree)}
`;

    // 파일 쓰기
    fs.writeFileSync(outputPath, markdown, "utf-8");
}

/**
 * 컴포넌트 트리를 마크다운으로 변환
 */
function generateComponentTreeMarkdown(
    componentTree: ComponentInfo | null,
    depth: number = 0
): string {
    if (!componentTree) return "컴포넌트 트리를 생성할 수 없습니다.";

    const indent = "  ".repeat(depth);
    let markdown = `${indent}- **${componentTree.name}** (${componentTree.type})\n`;

    if (componentTree.children && componentTree.children.length > 0) {
        for (const child of componentTree.children) {
            markdown += generateComponentTreeMarkdown(child, depth + 1);
        }
    }

    return markdown;
}

/**
 * 모든 템플릿 분석하기
 */
export function analyzeAllTemplates(
    templatesDir: string,
    outputDir: string,
    projectRoot: string
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
            const analysis = analyzeTemplate(templatePath, projectRoot);
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
