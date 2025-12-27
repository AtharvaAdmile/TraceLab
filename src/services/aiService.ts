import axios from 'axios'
import { logService } from './logService'
import { GoogleGenAI } from '@google/genai'

const OLLAMA_URL = '/api/ollama/generate'
const OLLAMA_MODEL = 'alibayram/medgemma:4b'
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const GEMINI_MODEL = 'gemini-3-flash-preview'

export type AIProvider = 'Ollama' | 'Gemini';

export interface ExtractedRequirement {
    req_id: string;
    content: string;
    source: string;
    type: 'Functional' | 'Security' | 'Performance' | 'Usability';
    priority: 'Critical' | 'High' | 'Medium' | 'Low';
    compliance_tags: string[];
    risk_level: 'High' | 'Medium' | 'Low';
    rationale: string;
}

export interface TestCase {
    test_case_id: string;
    title: string;
    type: 'Positive' | 'Negative' | 'Boundary' | 'Security' | 'Compliance';
    priority: 'Critical' | 'High' | 'Medium' | 'Low';
    preconditions: string[];
    steps: string[];
    test_data: any;
    expected_result: string;
    compliance_verification: string;
    risk_mitigation: string;
    code: string;
    // New fields for executable test cases
    test_script: string;           // Executable Python test code
    dependencies: string[];         // Required pip packages (e.g., ["pytest", "requests"])
    target_files: string[];         // Repo files the test applies to (e.g., ["src/auth/login.py"])
}

let activeProvider: AIProvider = 'Ollama';

export const setAIProvider = (provider: AIProvider) => {
    activeProvider = provider;
    logService.log('INFO', 'AI', `AI Provider switched to ${provider}`);
};

export const getAIProvider = () => activeProvider;

// Helper to extract JSON array from potentially messy AI response
const extractJsonArray = (text: string): any[] => {
    // Try to find JSON array in the response
    const arrayMatch = text.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
        try {
            return JSON.parse(arrayMatch[0]);
        } catch (e) {
            // If that fails, try cleaning up the text
            const cleaned = arrayMatch[0]
                .replace(/[\x00-\x1F\x7F]/g, ' ') // Remove control characters
                .replace(/,\s*]/g, ']') // Remove trailing commas
                .replace(/,\s*}/g, '}'); // Remove trailing commas in objects
            return JSON.parse(cleaned);
        }
    }
    // If no array found, try parsing the whole thing
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [parsed];
};

const callOllama = async (prompt: string): Promise<string> => {
    const response = await axios.post(OLLAMA_URL, {
        model: OLLAMA_MODEL,
        prompt: prompt,
        stream: false,
        format: 'json'
    });
    return response.data.response;
};

const callGemini = async (prompt: string): Promise<string> => {
    if (!GEMINI_API_KEY) {
        throw new Error('Gemini API Key is not configured. Add VITE_GEMINI_API_KEY to your .env file.');
    }
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt + '\n\nIMPORTANT: Respond ONLY with a valid JSON array. No markdown, no explanation, no preamble, no text after the array.',
    });
    return response.text ?? '';
};


export const analyzeCodebase = async (digest: string): Promise<ExtractedRequirement[]> => {
    const prompt = `
You are analyzing a healthcare software repository.

Extract ALL requirements from this code, including:
1. Explicit requirements (marked with REQ-*, @requirement, etc.)
2. Implicit requirements (business logic that implies a requirement)
3. Compliance hints (mentions of FDA, IEC, HIPAA, ISO)
4. Security patterns (encryption, authentication, validation)

For each requirement found, output JSON:
{
  "req_id": "REQ-FN-001" or "IMPLICIT-001" (if not explicitly marked),
  "content": "Clear requirement statement",
  "source": "filename.py::function_name or line_number",
  "type": "Functional|Security|Performance|Usability",
  "priority": "Critical|High|Medium|Low",
  "compliance_tags": ["FDA_21CFR11", "IEC_62304"],
  "risk_level": "High|Medium|Low",
  "rationale": "Why this requirement exists"
}

Code digest:
${digest}

Output only valid JSON array. No preamble.
`;

    try {
        logService.log('INFO', 'AI', `Sending digest to ${activeProvider} for analysis...`);
        let responseText: string;

        if (activeProvider === 'Gemini') {
            responseText = await callGemini(prompt);
        } else {
            responseText = await callOllama(prompt);
        }

        logService.log('INFO', 'AI', `Received response from ${activeProvider}`, responseText.substring(0, 500));

        const result = extractJsonArray(responseText);
        logService.log('INFO', 'AI', `Extracted ${result.length} requirements`);
        return result;
    } catch (error: any) {
        logService.log('ERROR', 'AI', `${activeProvider} analysis failed`, error.message);
        console.error(`Error analyzing codebase with ${activeProvider}:`, error);
        return [];
    }
};

export const generateTestCasesForRequirement = async (requirement: ExtractedRequirement, relatedCode: string, repoUrl?: string): Promise<TestCase[]> => {
    const prompt = `
You are a healthcare QA automation expert creating EXECUTABLE test cases for medical device software.

Requirement:
${requirement.content}

Compliance Standards: ${requirement.compliance_tags?.join(', ') || 'General'}
Risk Level: ${requirement.risk_level || 'Medium'}
Source Code Context:
${relatedCode}
${repoUrl ? `Repository URL: ${repoUrl}` : ''}

Generate exactly 3 EXECUTABLE test cases (with real Python pytest code):
1. Positive scenario (happy path)
2. Negative scenario (invalid input)
3. Boundary/Compliance scenario

For EACH test case, output JSON with these EXACT fields:
{
  "test_case_id": "TC-001",
  "title": "Short descriptive title",
  "type": "Positive",
  "steps": ["Step 1", "Step 2", "Step 3"],
  "expected_result": "What should happen",
  "compliance_tag": "IEC_62304",
  "test_script": "import pytest\\n\\ndef test_example():\\n    # Test implementation\\n    assert True",
  "dependencies": ["pytest", "requests"],
  "target_files": ["src/auth/login.py", "src/utils/validator.py"]
}
IMPORTANT RULES for test_script:
- Write complete, FULLY IMPLEMENTED Python pytest code.
- DO NOT use "assert True" or "# TODO". All logic must be concrete.
- Include necessary imports at the top.
- Use descriptive function names starting with test_.
- Implement actual mock logic or logic that tests the specific code context provided.
- Reference the target_files if testing specific functionality.
- If dependencies are needed (like mock or requests), include them in the 'dependencies' array.

IMPORTANT RULES for dependencies:
- List ONLY the pip packages needed to run this specific test
- Always include "pytest" as the test runner
- Include any libraries used in the test (requests, numpy, etc.)

IMPORTANT RULES for target_files:
- List the specific source files from the repository that this test validates
- Use relative paths from repo root (e.g., "src/auth/login.py")
- If testing general functionality, use empty array []

Output ONLY a valid JSON array with 3 objects. No markdown, no explanation.
`;

    try {
        logService.log('INFO', 'AI', `Generating test cases using ${activeProvider}...`);
        let responseText: string;

        if (activeProvider === 'Gemini') {
            responseText = await callGemini(prompt);
        } else {
            responseText = await callOllama(prompt);
        }

        logService.log('INFO', 'AI', `Raw AI response: ${responseText.substring(0, 500)}`);

        const result = extractJsonArray(responseText);
        logService.log('INFO', 'AI', `Parsed ${result.length} test cases`);
        return result;
    } catch (error: any) {
        logService.log('ERROR', 'AI', `${activeProvider} test generation failed`, error.message);
        console.error(`Error generating test cases with ${activeProvider}:`, error);
        return [];
    }
};