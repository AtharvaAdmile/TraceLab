type LogEntry = {
    timestamp: string;
    level: 'INFO' | 'WARN' | 'ERROR';
    category: 'GITHUB' | 'AI' | 'SYSTEM';
    message: string;
    data?: any;
};

class LogService {
    private logs: LogEntry[] = [];

    log(level: LogEntry['level'], category: LogEntry['category'], message: string, data?: any) {
        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            category,
            message,
            data
        };
        this.logs.push(entry);
        console.log(`[${entry.category}] ${entry.message}`, data || '');
    }

    getLogs() {
        return this.logs;
    }

    clearLogs() {
        this.logs = [];
    }

    generateLogFileContent(): string {
        return this.logs.map(log =>
            `[${log.timestamp}] [${log.level}] [${log.category}] ${log.message}${log.data ? '\nData: ' + JSON.stringify(log.data, null, 2) : ''}`
        ).join('\n' + '-'.repeat(80) + '\n');
    }

    downloadLogs() {
        const content = this.generateLogFileContent();
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `medtest-analysis-log-${new Date().getTime()}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}

export const logService = new LogService();
