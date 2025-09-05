class ModelManager {
    constructor() {
        this.models = this.initializeModels();
        this.activeModel = 'gpt-4-turbo';
        this.customModels = this.loadCustomModels();
        this.apiKeys = this.loadAPIKeys();
        this.usage = this.loadUsage();
    }

    initializeModels() {
        return {
            'gpt-4-turbo': {
                name: 'GPT-4 Turbo',
                provider: 'OpenAI',
                version: '1106-preview',
                contextWindow: 128000,
                outputTokens: 4096,
                trainingData: 'April 2023',
                capabilities: ['text', 'code', 'analysis', 'creative'],
                pricing: { input: 0.01, output: 0.03 },
                icon: 'fa-brain',
                color: '#10b981',
                description: 'Most capable GPT-4 model with improved instruction following'
            },
            'gpt-4': {
                name: 'GPT-4',
                provider: 'OpenAI',
                version: '0613',
                contextWindow: 8192,
                outputTokens: 4096,
                trainingData: 'September 2021',
                capabilities: ['text', 'code', 'analysis', 'creative'],
                pricing: { input: 0.03, output: 0.06 },
                icon: 'fa-brain',
                color: '#10b981',
                description: 'Original GPT-4 model with strong reasoning capabilities'
            },
            'gpt-3.5-turbo': {
                name: 'GPT-3.5 Turbo',
                provider: 'OpenAI',
                version: '1106',
                contextWindow: 16384,
                outputTokens: 4096,
                trainingData: 'September 2021',
                capabilities: ['text', 'code', 'analysis'],
                pricing: { input: 0.001, output: 0.002 },
                icon: 'fa-bolt',
                color: '#3b82f6',
                description: 'Fast and efficient model for most tasks'
            },
            'claude-3-opus': {
                name: 'Claude 3 Opus',
                provider: 'Anthropic',
                version: '20240229',
                contextWindow: 200000,
                outputTokens: 4096,
                trainingData: 'August 2023',
                capabilities: ['text', 'code', 'analysis', 'creative', 'vision'],
                pricing: { input: 0.015, output: 0.075 },
                icon: 'fa-robot',
                color: '#8b5cf6',
                description: 'Most powerful Claude model with superior reasoning'
            },
            'claude-3-sonnet': {
                name: 'Claude 3 Sonnet',
                provider: 'Anthropic',
                version: '20240229',
                contextWindow: 200000,
                outputTokens: 4096,
                trainingData: 'August 2023',
                capabilities: ['text', 'code', 'analysis', 'vision'],
                pricing: { input: 0.003, output: 0.015 },
                icon: 'fa-robot',
                color: '#a78bfa',
                description: 'Balanced performance and cost'
            },
            'claude-3-haiku': {
                name: 'Claude 3 Haiku',
                provider: 'Anthropic',
                version: '20240307',
                contextWindow: 200000,
                outputTokens: 4096,
                trainingData: 'August 2023',
                capabilities: ['text', 'code'],
                pricing: { input: 0.00025, output: 0.00125 },
                icon: 'fa-feather',
                color: '#c084fc',
                description: 'Fastest Claude model for simple tasks'
            },
            'gemini-pro': {
                name: 'Gemini Pro 1.5',
                provider: 'Google',
                version: '001',
                contextWindow: 1000000,
                outputTokens: 8192,
                trainingData: 'November 2023',
                capabilities: ['text', 'code', 'analysis', 'vision', 'audio'],
                pricing: { input: 0.00125, output: 0.005 },
                icon: 'fa-gem',
                color: '#ea580c',
                description: 'Multimodal model with massive context window'
            },
            'gemini-ultra': {
                name: 'Gemini Ultra',
                provider: 'Google',
                version: '001',
                contextWindow: 1000000,
                outputTokens: 8192,
                trainingData: 'November 2023',
                capabilities: ['text', 'code', 'analysis', 'creative', 'vision', 'audio'],
                pricing: { input: 0.007, output: 0.021 },
                icon: 'fa-crown',
                color: '#dc2626',
                description: 'Most capable Gemini model'
            },
            'mistral-large': {
                name: 'Mistral Large',
                provider: 'Mistral AI',
                version: '2402',
                contextWindow: 32000,
                outputTokens: 4096,
                trainingData: 'Unknown',
                capabilities: ['text', 'code', 'analysis'],
                pricing: { input: 0.008, output: 0.024 },
                icon: 'fa-wind',
                color: '#0ea5e9',
                description: 'Top-tier reasoning and multilingual capabilities'
            },
            'mixtral-8x7b': {
                name: 'Mixtral 8x7B',
                provider: 'Mistral AI',
                version: '0.1',
                contextWindow: 32000,
                outputTokens: 4096,
                trainingData: 'Unknown',
                capabilities: ['text', 'code'],
                pricing: { input: 0.0007, output: 0.0007 },
                icon: 'fa-layer-group',
                color: '#06b6d4',
                description: 'Mixture of experts model with great performance'
            }
        };
    }

    loadCustomModels() {
        const saved = localStorage.getItem('customModels');
        return saved ? JSON.parse(saved) : {};
    }

    saveCustomModels() {
        localStorage.setItem('customModels', JSON.stringify(this.customModels));
    }

    loadAPIKeys() {
        const saved = localStorage.getItem('apiKeys');
        return saved ? JSON.parse(saved) : {};
    }

    saveAPIKeys() {
        // Encrypt before saving (in production, use proper encryption)
        const encrypted = btoa(JSON.stringify(this.apiKeys));
        localStorage.setItem('apiKeys', encrypted);
    }

    loadUsage() {
        const saved = localStorage.getItem('modelUsage');
        return saved ? JSON.parse(saved) : {};
    }

    saveUsage() {
        localStorage.setItem('modelUsage', JSON.stringify(this.usage));
    }

    setAPIKey(provider, key) {
        this.apiKeys[provider] = key;
        this.saveAPIKeys();
    }

    getAPIKey(provider) {
        return this.apiKeys[provider] || null;
    }

    addCustomModel(model) {
        const id = 'custom_' + Date.now();
        this.customModels[id] = {
            ...model,
            id,
            provider: 'Custom',
            icon: 'fa-cog',
            color: '#64748b'
        };
        this.saveCustomModels();
        return id;
    }

    getAllModels() {
        return { ...this.models, ...this.customModels };
    }

    getModel(id) {
        return this.models[id] || this.customModels[id] || null;
    }

    setActiveModel(id) {
        if (this.getModel(id)) {
            this.activeModel = id;
            return true;
        }
        return false;
    }

    trackUsage(modelId, tokens, cost) {
        if (!this.usage[modelId]) {
            this.usage[modelId] = {
                requests: 0,
                tokens: 0,
                cost: 0,
                lastUsed: null
            };
        }

        this.usage[modelId].requests++;
        this.usage[modelId].tokens += tokens;
        this.usage[modelId].cost += cost;
        this.usage[modelId].lastUsed = new Date().toISOString();

        this.saveUsage();
    }

    getUsageStats() {
        const stats = {
            total: {
                requests: 0,
                tokens: 0,
                cost: 0
            },
            byModel: {},
            byProvider: {},
            topModels: []
        };

        Object.entries(this.usage).forEach(([modelId, usage]) => {
            const model = this.getModel(modelId);
            if (model) {
                // Total stats
                stats.total.requests += usage.requests;
                stats.total.tokens += usage.tokens;
                stats.total.cost += usage.cost;

                // By model
                stats.byModel[modelId] = usage;

                // By provider
                if (!stats.byProvider[model.provider]) {
                    stats.byProvider[model.provider] = {
                        requests: 0,
                        tokens: 0,
                        cost: 0
                    };
                }
                stats.byProvider[model.provider].requests += usage.requests;
                stats.byProvider[model.provider].tokens += usage.tokens;
                stats.byProvider[model.provider].cost += usage.cost;
            }
        });

        // Top models by requests
        stats.topModels = Object.entries(stats.byModel)
            .sort((a, b) => b[1].requests - a[1].requests)
            .slice(0, 5)
            .map(([id, usage]) => ({
                model: this.getModel(id),
                usage
            }));

        return stats;
    }

    estimateCost(modelId, inputTokens, outputTokens) {
        const model = this.getModel(id);
        if (!model || !model.pricing) return 0;

        const inputCost = (inputTokens / 1000) * model.pricing.input;
        const outputCost = (outputTokens / 1000) * model.pricing.output;

        return inputCost + outputCost;
    }

    compareModels(modelIds) {
        return modelIds.map(id => {
            const model = this.getModel(id);
            const usage = this.usage[id] || { requests: 0, tokens: 0, cost: 0 };

            return {
                ...model,
                usage,
                score: this.calculateModelScore(model, usage)
            };
        }).sort((a, b) => b.score - a.score);
    }

    calculateModelScore(model, usage) {
        // Simple scoring algorithm
        let score = 0;

        // Context window (normalized to 0-100)
        score += (model.contextWindow / 10000) * 20;

        // Capabilities
        score += model.capabilities.length * 10;

        // Usage (if frequently used, it's probably good)
        score += Math.min(usage.requests / 10, 30);

        // Cost efficiency (inverse of price)
        const avgPrice = (model.pricing.input + model.pricing.output) / 2;
        score += (1 / avgPrice) * 10;

        return Math.min(score, 100);
    }
}
