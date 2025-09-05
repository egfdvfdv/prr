class ExportImportManager {
    constructor() {
        this.formats = ['json', 'markdown', 'txt', 'csv', 'yaml'];
    }

    exportData(data, format = 'json', filename = 'export') {
        let content;
        let mimeType;

        switch (format) {
            case 'json':
                content = JSON.stringify(data, null, 2);
                mimeType = 'application/json';
                break;
            case 'markdown':
                content = this.toMarkdown(data);
                mimeType = 'text/markdown';
                break;
            case 'txt':
                content = this.toText(data);
                mimeType = 'text/plain';
                break;
            case 'csv':
                content = this.toCSV(data);
                mimeType = 'text/csv';
                break;
            case 'yaml':
                content = this.toYAML(data);
                mimeType = 'text/yaml';
                break;
            default:
                content = JSON.stringify(data, null, 2);
                mimeType = 'application/json';
        }

        this.downloadFile(content, `${filename}.${format}`, mimeType);
    }

    importData(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const content = e.target.result;
                    const extension = file.name.split('.').pop().toLowerCase();

                    let data;
                    switch (extension) {
                        case 'json':
                            data = JSON.parse(content);
                            break;
                        case 'csv':
                            data = this.parseCSV(content);
                            break;
                        case 'yaml':
                        case 'yml':
                            data = this.parseYAML(content);
                            break;
                        default:
                            data = { raw: content };
                    }

                    resolve(data);
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = reject;
            reader.readAsText(file);
        });
    }

    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    toMarkdown(data) {
        if (Array.isArray(data)) {
            return data.map(item => this.itemToMarkdown(item)).join('\n\n---\n\n');
        }
        return this.itemToMarkdown(data);
    }

    itemToMarkdown(item) {
        let md = '';

        if (item.name) md += `# ${item.name}\n\n`;
        if (item.description) md += `${item.description}\n\n`;
        if (item.content) md += `## Content\n${item.content}\n\n`;
        if (item.tags) md += `**Tags:** ${item.tags.join(', ')}\n\n`;
        if (item.category) md += `**Category:** ${item.category}\n\n`;
        if (item.model) md += `**Model:** ${item.model}\n\n`;

        return md;
    }

    toText(data) {
        if (Array.isArray(data)) {
            return data.map(item => this.itemToText(item)).join('\n\n' + '='.repeat(50) + '\n\n');
        }
        return this.itemToText(data);
    }

    itemToText(item) {
        let text = '';

        Object.entries(item).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
                if (typeof value === 'object') {
                    text += `${key}:\n${JSON.stringify(value, null, 2)}\n\n`;
                } else {
                    text += `${key}: ${value}\n`;
                }
            }
        });

        return text;
    }

    toCSV(data) {
        if (!Array.isArray(data) || data.length === 0) {
            return '';
        }

        // Get all unique keys
        const keys = new Set();
        data.forEach(item => {
            Object.keys(item).forEach(key => keys.add(key));
        });

        const headers = Array.from(keys);
        const rows = data.map(item =>
            headers.map(header => {
                const value = item[header];
                if (typeof value === 'object') {
                    return JSON.stringify(value);
                }
                return value || '';
            })
        );

        // Create CSV
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        return csvContent;
    }

    toYAML(data) {
        // Simple YAML converter (for production, use a proper library)
        return this.objectToYAML(data, 0);
    }

    objectToYAML(obj, indent) {
        let yaml = '';
        const spaces = '  '.repeat(indent);

        if (Array.isArray(obj)) {
            obj.forEach(item => {
                yaml += `${spaces}- `;
                if (typeof item === 'object') {
                    yaml += '\n' + this.objectToYAML(item, indent + 1);
                } else {
                    yaml += `${item}\n`;
                }
            });
        } else if (typeof obj === 'object' && obj !== null) {
            Object.entries(obj).forEach(([key, value]) => {
                yaml += `${spaces}${key}: `;
                if (typeof value === 'object') {
                    yaml += '\n' + this.objectToYAML(value, indent + 1);
                } else {
                    yaml += `${value}\n`;
                }
            });
        }

        return yaml;
    }

    parseCSV(content) {
        const lines = content.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim()) {
                const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
                const item = {};

                headers.forEach((header, index) => {
                    const value = values[index];
                    try {
                        item[header] = JSON.parse(value);
                    } catch {
                        item[header] = value;
                    }
                });

                data.push(item);
            }
        }

        return data;
    }

    parseYAML(content) {
        // Simple YAML parser (for production, use a proper library)
        // This is a very basic implementation
        const lines = content.split('\n');
        const result = {};
        let currentKey = null;

        lines.forEach(line => {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
                const colonIndex = trimmed.indexOf(':');
                if (colonIndex !== -1) {
                    const key = trimmed.substring(0, colonIndex).trim();
                    const value = trimmed.substring(colonIndex + 1).trim();

                    if (value) {
                        result[key] = value;
                    } else {
                        currentKey = key;
                        result[key] = {};
                    }
                }
            }
        });

        return result;
    }

    backup() {
        const data = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            prompts: promptManager.prompts,
            templates: promptManager.templates,
            favorites: promptManager.favorites,
            models: modelManager.customModels,
            analytics: analyticsManager.metrics,
            team: collaborationManager.team,
            settings: {
                theme: currentTheme,
                // Add other settings
            }
        };

        const filename = `llm-studio-backup-${new Date().toISOString().split('T')[0]}`;
        this.exportData(data, 'json', filename);
    }

    restore(file) {
        return this.importData(file).then(data => {
            if (data.version && data.prompts) {
                // Restore prompts
                promptManager.prompts = data.prompts;
                promptManager.savePrompts();

                // Restore templates
                if (data.templates) {
                    promptManager.templates = data.templates;
                    promptManager.saveTemplates();
                }

                // Restore favorites
                if (data.favorites) {
                    promptManager.favorites = data.favorites;
                    promptManager.saveFavorites();
                }

                // Restore custom models
                if (data.models) {
                    modelManager.customModels = data.models;
                    modelManager.saveCustomModels();
                }

                // Restore analytics
                if (data.analytics) {
                    analyticsManager.metrics = data.analytics;
                    analyticsManager.saveMetrics();
                }

                // Restore team
                if (data.team) {
                    collaborationManager.team = data.team;
                    collaborationManager.saveTeam();
                }

                // Restore settings
                if (data.settings) {
                    if (data.settings.theme) {
                        currentTheme = data.settings.theme;
                        document.documentElement.setAttribute('data-theme', currentTheme);
                        localStorage.setItem('theme', currentTheme);
                        updateThemeToggle();
                    }
                }

                return true;
            }
            throw new Error('Invalid backup file');
        });
    }
}
