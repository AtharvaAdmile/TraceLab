import type { ExtractedRequirement } from './aiService';
import type { FunctionMap } from './astService';

export interface ComplianceIssue {
    standard: string;
    severity: 'Critical' | 'High' | 'Medium' | 'Low';
    message: string;
    file_path?: string;
}

export const validateCompliance = (
    requirements: ExtractedRequirement[],
    functions: FunctionMap[],
    securityIssues: string[]
): ComplianceIssue[] => {
    const issues: ComplianceIssue[] = [];

    // 1. FDA 21 CFR Part 11 Validation
    const hasEncryption = requirements.some(r => r.content.toLowerCase().includes('encrypt') || r.compliance_tags.includes('FDA_21CFR11'));
    if (!hasEncryption) {
        issues.push({
            standard: 'FDA 21 CFR Part 11',
            severity: 'Critical',
            message: 'No explicit requirement for data encryption at rest found.',
        });
    }

    const hasAuditTrail = requirements.some(r => r.content.toLowerCase().includes('audit') || r.content.toLowerCase().includes('log'));
    if (!hasAuditTrail) {
        issues.push({
            standard: 'FDA 21 CFR Part 11',
            severity: 'High',
            message: 'No evidence of audit trail implementation found in requirements.',
        });
    }

    // 2. IEC 62304 Software Lifecycle
    const safetyRequirements = requirements.filter(r => r.risk_level === 'High');
    safetyRequirements.forEach(req => {
        // Check if safety critical requirements have corresponding implementation hints in functions
        const implemented = functions.some(f => f.docstring.includes(req.req_id) || f.name.toLowerCase().includes(req.req_id.toLowerCase()));
        if (!implemented) {
            issues.push({
                standard: 'IEC 62304',
                severity: 'High',
                message: `Safety-critical requirement ${req.req_id} has no mapped implementation in code docstrings.`,
            });
        }
    });

    // 3. ISO 27001 / HIPAA
    securityIssues.forEach(si => {
        issues.push({
            standard: 'ISO 27001 / HIPAA',
            severity: 'High',
            message: si,
        });
    });

    // 4. ISO 13485
    const hasDesignControl = requirements.some(r => r.content.toLowerCase().includes('design') || r.content.toLowerCase().includes('validation'));
    if (!hasDesignControl) {
        issues.push({
            standard: 'ISO 13485',
            severity: 'Medium',
            message: 'Design control and validation protocols are not explicitly documented in the repo.',
        });
    }

    return issues;
};
