export interface FunctionMap {
    name: string;
    signature: string;
    docstring: string;
    lineNumber: number;
    filePath: string;
    calls: string[];
}

export const parseCodeStructure = (filePath: string, content: string): FunctionMap[] => {
    const functions: FunctionMap[] = [];
    const lines = content.split('\n');

    // Simple regex for Python/JS function detection
    const pyFuncRegex = /def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\((.*?)\):/;
    const jsFuncRegex = /(?:async\s+)?function\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\((.*?)\)/;
    const arrowFuncRegex = /const\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(?:async\s+)?\((.*?)\)\s*=>/;

    lines.forEach((line, index) => {
        let match = line.match(pyFuncRegex) || line.match(jsFuncRegex) || line.match(arrowFuncRegex);
        if (match) {
            const name = match[1];
            const signature = match[0];

            // Look for docstrings (heuristic)
            let docstring = '';
            if (filePath.endsWith('.py')) {
                // Python docstring follows the def line
                let nextLine = lines[index + 1]?.trim();
                if (nextLine?.startsWith('"""') || nextLine?.startsWith("'''")) {
                    docstring = nextLine;
                    // Simple multi-line docstring collection
                    for (let j = index + 2; j < lines.length; j++) {
                        docstring += '\n' + lines[j];
                        if (lines[j].includes('"""') || lines[j].includes("'''")) break;
                    }
                }
            } else {
                // JS/TS JSDoc precedes the function
                for (let j = index - 1; j >= 0; j--) {
                    const l = lines[j].trim();
                    if (l.endsWith('*/')) {
                        for (let k = j; k >= 0; k--) {
                            docstring = lines[k] + '\n' + docstring;
                            if (lines[k].trim().startsWith('/**')) break;
                        }
                        break;
                    }
                }
            }

            functions.push({
                name,
                signature,
                docstring: docstring.trim(),
                lineNumber: index + 1,
                filePath,
                calls: [], // Would need more complex parsing to map calls
            });
        }
    });

    return functions;
};

export const detectSecurityAntiPatterns = (content: string) => {
    const issues: string[] = [];
    if (content.includes('localStorage.set')) issues.push('Storing data in localStorage instead of secure storage');
    if (content.match(/password\s*=\s*(["']).*?\1/)) issues.push('Potential hardcoded password');
    if (content.includes('innerHTML =')) issues.push('Potential XSS via innerHTML');
    return issues;
};
