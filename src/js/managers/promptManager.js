class PromptManager {
    constructor() {
        this.prompts = this.loadPrompts();
        this.currentPrompt = null;
        this.history = [];
        this.templates = this.loadTemplates();
        this.favorites = this.loadFavorites();
        this.tags = new Set();
        this.initializeTemplates();
    }

    getPrompts() {
        return this.prompts;
    }

    getPromptById(id) {
        return this.prompts.find(p => p.id === id);
    }

    initializeTemplates() {
        this.defaultTemplates = {
            'basic': {
                name: 'Basic Prompt',
                content: `# Prompt Title\n\n## Description\n[Describe your prompt here]\n\n## Input\n[Input format]\n\n## Output\n[Expected output]`,
                icon: 'fa-file-alt',
                color: '#3b82f6'
            },
            'cot': {
                name: 'Chain of Thought',
                content: `# Chain of Thought Prompt\n\n## Problem Statement\n[Define the problem]\n\n## Step-by-Step Reasoning\n1. First, let's understand...\n2. Next, we need to...\n3. Then, we should...\n4. Finally, we can...\n\n## Conclusion\n[Final answer]`,
                icon: 'fa-link',
                color: '#10b981'
            },
            'few-shot': {
                name: 'Few-Shot Learning',
                content: `# Few-Shot Learning Template\n\n## Task Description\n[Describe the task]\n\n## Examples\n\n### Example 1\n**Input:** [input]\n**Output:** [output]\n\n### Example 2\n**Input:** [input]\n**Output:** [output]\n\n### Example 3\n**Input:** [input]\n**Output:** [output]\n\n## New Input\n[Your input here]`,
                icon: 'fa-graduation-cap',
                color: '#f59e0b'
            },
            'role-play': {
                name: 'Role Playing',
                content: `# Role-Playing Prompt\n\n## Character/Role\nYou are a [role/character] with the following attributes:\n- Expertise: [areas of expertise]\n- Personality: [personality traits]\n- Background: [relevant background]\n\n## Scenario\n[Describe the scenario]\n\n## Task\n[What the AI should do in this role]\n\n## Constraints\n- Stay in character\n- Use appropriate tone and language\n- Consider the context`,
                icon: 'fa-theater-masks',
                color: '#ec4899'
            },
            'code-gen': {
                name: 'Code Generation',
                content: `# Code Generation Prompt\n\n## Language\n[Programming language]\n\n## Requirements\n- [ ] Requirement 1\n- [ ] Requirement 2\n- [ ] Requirement 3\n\n## Input/Output\n\`\`\`\nInput: [describe input]\nOutput: [describe output]\n\`\`\`\n\n## Constraints\n- Performance: [requirements]\n- Style: [coding style]\n- Libraries: [allowed libraries]\n\n## Example Usage\n\`\`\`[language]\n// Example code\n\`\`\``,
                icon: 'fa-code',
                color: '#8b5cf6'
            },
            'analysis': {
                name: 'Data Analysis',
                content: `# Data Analysis Prompt\n\n## Dataset Description\n[Describe the data]\n\n## Analysis Goals\n1. [Goal 1]\n2. [Goal 2]\n3. [Goal 3]\n\n## Methodology\n- Data cleaning\n- Statistical analysis\n- Visualization\n- Interpretation\n\n## Expected Insights\n[What insights are you looking for?]\n\n## Output Format\n- Summary statistics\n- Key findings\n- Recommendations`,
                icon: 'fa-chart-bar',
                color: '#06b6d4'
            },
            'creative': {
                name: 'Creative Writing',
                content: `# Creative Writing Prompt\n\n## Genre\n[Genre/Style]\n\n## Setting\n- Time: [when]\n- Place: [where]\n- Atmosphere: [mood/tone]\n\n## Characters\n- Protagonist: [description]\n- Antagonist: [description]\n- Supporting: [description]\n\n## Plot Elements\n- Hook: [opening]\n- Conflict: [main conflict]\n- Resolution: [how it ends]\n\n## Style Guidelines\n- Tone: [formal/informal/etc]\n- POV: [first/third person]\n- Length: [word count]`,
                icon: 'fa-pen-fancy',
                color: '#f97316'
            },
            'translation': {
                name: 'Translation',
                content: `# Translation Prompt\n\n## Source Language\n[Language]\n\n## Target Language\n[Language]\n\n## Context\n- Domain: [technical/literary/casual]\n- Audience: [who will read this]\n- Purpose: [why this translation]\n\n## Special Instructions\n- Tone preservation\n- Cultural adaptation\n- Technical terminology\n\n## Text to Translate\n[Insert text here]\n\n## Glossary\n- Term 1: [translation]\n- Term 2: [translation]`,
                icon: 'fa-language',
                color: '#0ea5e9'
            }
        };
    }

    loadPrompts() {
        try {
            const saved = localStorage.getItem('prompts');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error("Failed to load prompts from localStorage", e);
            return [];
        }
    }

    savePrompts() {
        localStorage.setItem('prompts', JSON.stringify(this.prompts));
    }

    loadTemplates() {
        try {
            const saved = localStorage.getItem('templates');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error("Failed to load templates from localStorage", e);
            return [];
        }
    }

    saveTemplates() {
        localStorage.setItem('templates', JSON.stringify(this.templates));
    }

    loadFavorites() {
        try {
            const saved = localStorage.getItem('favorites');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error("Failed to load favorites from localStorage", e);
            return [];
        }
    }

    saveFavorites() {
        localStorage.setItem('favorites', JSON.stringify(this.favorites));
    }

    createPrompt(data) {
        const prompt = {
            id: this.generateId(),
            name: data.name,
            content: data.content || '',
            description: data.description || '',
            category: data.category || 'General',
            tags: data.tags || [],
            model: data.model || 'gpt-4',
            parameters: data.parameters || {
                temperature: 0.7,
                maxTokens: 2048,
                topP: 1,
                frequencyPenalty: 0,
                presencePenalty: 0
            },
            created: new Date().toISOString(),
            modified: new Date().toISOString(),
            version: 1,
            versions: [],
            metrics: {
                uses: 0,
                tokens: 0,
                avgResponseTime: 0,
                successRate: 100
            }
        };

        this.prompts.push(prompt);
        this.savePrompts();
        this.addToHistory('created', prompt);

        // Update tags
        prompt.tags.forEach(tag => this.tags.add(tag));

        return prompt;
    }

    updatePrompt(id, updates) {
        const index = this.prompts.findIndex(p => p.id === id);
        if (index !== -1) {
            const oldPrompt = { ...this.prompts[index] };

            // Save version
            oldPrompt.versions.push({
                version: oldPrompt.version,
                content: oldPrompt.content,
                modified: oldPrompt.modified
            });

            // Update prompt
            this.prompts[index] = {
                ...this.prompts[index],
                ...updates,
                modified: new Date().toISOString(),
                version: oldPrompt.version + 1
            };

            this.savePrompts();
            this.addToHistory('updated', this.prompts[index]);

            return this.prompts[index];
        }
        return null;
    }

    deletePrompt(id) {
        const index = this.prompts.findIndex(p => p.id === id);
        if (index !== -1) {
            const deleted = this.prompts.splice(index, 1)[0];
            this.savePrompts();
            this.addToHistory('deleted', deleted);
            return true;
        }
        return false;
    }

    duplicatePrompt(id) {
        const prompt = this.prompts.find(p => p.id === id);
        if (prompt) {
            const duplicate = {
                ...prompt,
                id: this.generateId(),
                name: prompt.name + ' (Copy)',
                created: new Date().toISOString(),
                modified: new Date().toISOString(),
                version: 1,
                versions: [],
                metrics: {
                    uses: 0,
                    tokens: 0,
                    avgResponseTime: 0,
                    successRate: 100
                }
            };

            this.prompts.push(duplicate);
            this.savePrompts();
            this.addToHistory('duplicated', duplicate);

            return duplicate;
        }
        return null;
    }

    searchPrompts(query) {
        const lowerQuery = query.toLowerCase();
        return this.prompts.filter(prompt =>
            prompt.name.toLowerCase().includes(lowerQuery) ||
            prompt.description.toLowerCase().includes(lowerQuery) ||
            prompt.content.toLowerCase().includes(lowerQuery) ||
            prompt.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
        );
    }

    filterByCategory(category) {
        return this.prompts.filter(prompt => prompt.category === category);
    }

    filterByTags(tags) {
        return this.prompts.filter(prompt =>
            tags.every(tag => prompt.tags.includes(tag))
        );
    }

    addToFavorites(id) {
        if (!this.favorites.includes(id)) {
            this.favorites.push(id);
            this.saveFavorites();
            return true;
        }
        return false;
    }

    removeFromFavorites(id) {
        const index = this.favorites.indexOf(id);
        if (index !== -1) {
            this.favorites.splice(index, 1);
            this.saveFavorites();
            return true;
        }
        return false;
    }

    getFavorites() {
        return this.prompts.filter(prompt =>
            this.favorites.includes(prompt.id)
        );
    }

    exportPrompt(id, format = 'json') {
        const prompt = this.prompts.find(p => p.id === id);
        if (!prompt) return null;

        switch (format) {
            case 'json':
                return JSON.stringify(prompt, null, 2);
            case 'markdown':
                return this.promptToMarkdown(prompt);
            case 'txt':
                return this.promptToText(prompt);
            default:
                return null;
        }
    }

    importPrompt(data, format = 'json') {
        try {
            let prompt;
            switch (format) {
                case 'json':
                    prompt = JSON.parse(data);
                    break;
                case 'markdown':
                    prompt = this.markdownToPrompt(data);
                    break;
                default:
                    return null;
            }

            prompt.id = this.generateId();
            prompt.created = new Date().toISOString();
            prompt.modified = new Date().toISOString();

            this.prompts.push(prompt);
            this.savePrompts();

            return prompt;
        } catch (error) {
            console.error('Import failed:', error);
            return null;
        }
    }

    promptToMarkdown(prompt) {
        return `# ${prompt.name}

## Description
${prompt.description}

## Category
${prompt.category}

## Tags
${prompt.tags.join(', ')}

## Model
${prompt.model}

## Parameters
- Temperature: ${prompt.parameters.temperature}
- Max Tokens: ${prompt.parameters.maxTokens}
- Top P: ${prompt.parameters.topP}
- Frequency Penalty: ${prompt.parameters.frequencyPenalty}
- Presence Penalty: ${prompt.parameters.presencePenalty}

## Content
${prompt.content}

## Metrics
- Uses: ${prompt.metrics.uses}
- Total Tokens: ${prompt.metrics.tokens}
- Avg Response Time: ${prompt.metrics.avgResponseTime}ms
- Success Rate: ${prompt.metrics.successRate}%

---
*Created: ${new Date(prompt.created).toLocaleString()}*
*Modified: ${new Date(prompt.modified).toLocaleString()}*
*Version: ${prompt.version}*`;
    }

    promptToText(prompt) {
        return `${prompt.name}
${'='.repeat(prompt.name.length)}

${prompt.description}

Category: ${prompt.category}
Tags: ${prompt.tags.join(', ')}
Model: ${prompt.model}

Content:
${prompt.content}`;
    }

    markdownToPrompt(markdown) {
        // Simple markdown parser
        const lines = markdown.split('\n');
        const prompt = {
            name: '',
            description: '',
            category: 'General',
            tags: [],
            model: 'gpt-4',
            content: '',
            parameters: {
                temperature: 0.7,
                maxTokens: 2048,
                topP: 1,
                frequencyPenalty: 0,
                presencePenalty: 0
            }
        };

        let currentSection = '';
        for (const line of lines) {
            if (line.startsWith('# ')) {
                prompt.name = line.substring(2);
            } else if (line.startsWith('## ')) {
                currentSection = line.substring(3).toLowerCase();
            } else if (currentSection === 'description') {
                prompt.description += line + '\n';
            } else if (currentSection === 'content') {
                prompt.content += line + '\n';
            } else if (line.includes('Category:')) {
                prompt.category = line.split(':')[1].trim();
            } else if (line.includes('Tags:')) {
                prompt.tags = line.split(':')[1].split(',').map(t => t.trim());
            } else if (line.includes('Model:')) {
                prompt.model = line.split(':')[1].trim();
            }
        }

        return prompt;
    }

    generateId() {
        return 'prompt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    addToHistory(action, prompt) {
        this.history.unshift({
            action,
            prompt: { ...prompt },
            timestamp: new Date().toISOString()
        });

        // Keep only last 100 history items
        if (this.history.length > 100) {
            this.history = this.history.slice(0, 100);
        }

        localStorage.setItem('promptHistory', JSON.stringify(this.history));
    }

    getHistory() {
        return this.history;
    }

    getStatistics() {
        const stats = {
            total: this.prompts.length,
            byCategory: {},
            byModel: {},
            totalTokens: 0,
            totalUses: 0,
            avgTokens: 0,
            avgUses: 0,
            mostUsed: null,
            recentlyModified: [],
            tags: Array.from(this.tags)
        };

        this.prompts.forEach(prompt => {
            // By category
            stats.byCategory[prompt.category] = (stats.byCategory[prompt.category] || 0) + 1;

            // By model
            stats.byModel[prompt.model] = (stats.byModel[prompt.model] || 0) + 1;

            // Tokens and uses
            stats.totalTokens += prompt.metrics.tokens;
            stats.totalUses += prompt.metrics.uses;

            // Most used
            if (!stats.mostUsed || prompt.metrics.uses > stats.mostUsed.metrics.uses) {
                stats.mostUsed = prompt;
            }
        });

        // Averages
        if (this.prompts.length > 0) {
            stats.avgTokens = Math.round(stats.totalTokens / this.prompts.length);
            stats.avgUses = Math.round(stats.totalUses / this.prompts.length);
        }

        // Recently modified (last 5)
        stats.recentlyModified = [...this.prompts]
            .sort((a, b) => new Date(b.modified) - new Date(a.modified))
            .slice(0, 5);

        return stats;
    }
}
