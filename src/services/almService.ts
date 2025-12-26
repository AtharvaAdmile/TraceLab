import axios from 'axios'

export interface JiraConfig {
    baseUrl: string
    email: string
    apiToken: string
    projectKey: string
}

export interface JiraIssue {
    summary: string
    description: string
    issuetype: string
}

/**
 * Jira Integration Service
 * Handles pushing test cases to Jira via REST API.
 * Note: In a real-world scenario, this would likely be proxied through a backend
 * to avoid CORS issues and expose API tokens on the frontend.
 * For this MVP, we assume a local or configured proxy.
 */
export async function pushToJira(testCases: any[], config: JiraConfig) {
    const auth = btoa(`${config.email}:${config.apiToken}`)

    const results = []

    for (const tc of testCases) {
        try {
            const payload = {
                fields: {
                    project: { key: config.projectKey },
                    summary: `[MedTest AI] ${tc.scenario}`,
                    description: {
                        type: "doc",
                        version: 1,
                        content: [
                            {
                                type: "paragraph",
                                content: [{ type: "text", text: `Expected Result: ${tc.expected_result}` }]
                            },
                            {
                                type: "paragraph",
                                content: [{ type: "text", text: "Steps:" }]
                            },
                            {
                                type: "bulletList",
                                content: tc.steps.map((step: string) => ({
                                    type: "listItem",
                                    content: [{
                                        type: "paragraph",
                                        content: [{ type: "text", text: step }]
                                    }]
                                }))
                            },
                            {
                                type: "paragraph",
                                content: [{ type: "text", text: `Type: ${tc.type}` }]
                            }
                        ]
                    },
                    issuetype: { name: "Test" } // Assumes Jira has a 'Test' issue type (e.g. via Xray or Zephyr)
                }
            }

            const response = await axios.post(`${config.baseUrl}/rest/api/3/issue`, payload, {
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            })

            results.push({ id: tc.id, jiraKey: response.data.key, success: true })
        } catch (err: any) {
            console.error(`Failed to push to Jira: ${err.message}`)
            results.push({ id: tc.id, error: err.message, success: false })
        }
    }

    return results
}

/**
 * CSV Export Utility
 */
export function exportToCsv(data: any[], filename: string) {
    const headers = ['Requirement', 'Scenario', 'Steps', 'Expected Result', 'Type']
    const rows = data.map(tc => [
        tc.requirement_id || '',
        tc.scenario,
        tc.steps.join('; '),
        tc.expected_result,
        tc.type
    ])

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(val => `"${val.replace(/"/g, '""')}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
}
