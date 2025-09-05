class TestManager {
    constructor(promptBuilder) {
        this.promptBuilder = promptBuilder; // A function that returns the current full prompt
        this.suites = this.loadSuites();
        this.activeSuite = null;
    }

    loadSuites() {
        const saved = localStorage.getItem('testSuites');
        return saved ? JSON.parse(saved) : {};
    }

    saveSuites() {
        localStorage.setItem('testSuites', JSON.stringify(this.suites));
    }

    createSuite(name) {
        if (!name || this.suites[name]) {
            console.error("Invalid or duplicate suite name");
            return;
        }
        this.suites[name] = {
            testCases: [],
            validationRules: [],
            models: ['GPT-4 Turbo']
        };
        this.activeSuite = name;
        this.saveSuites();
    }

    addTestCase(suiteName, testCase) {
        if (this.suites[suiteName]) {
            this.suites[suiteName].testCases.push(testCase);
            this.saveSuites();
        }
    }

    runSuite(suiteName) {
        const suite = this.suites[suiteName];
        if (!suite) return [];

        const results = [];
        const originalVariables = { ...this.promptBuilder.getVariableValues() };

        suite.testCases.forEach(testCase => {
            // This is a simplified simulation.
            // A real implementation would make API calls for each model.

            // Set variables for this test case
            this.promptBuilder.setVariableValues(testCase);
            const prompt = this.promptBuilder.buildFullPrompt();

            suite.models.forEach(model => {
                const result = {
                    testCase,
                    model,
                    output: `Simulated output for ${model} with vars: ${JSON.stringify(testCase)}`,
                    passed: this.validate(prompt, suite.validationRules),
                };
                results.push(result);
            });
        });

        // Restore original variables
        this.promptBuilder.setVariableValues(originalVariables);

        return results;
    }

    validate(output, rules) {
        if (!rules || rules.length === 0) return true;

        return rules.every(rule => {
            switch (rule.type) {
                case 'json':
                    try {
                        JSON.parse(output);
                        return true;
                    } catch {
                        return false;
                    }
                case 'contains':
                    return output.includes(rule.value);
                default:
                    return true;
            }
        });
    }

    parseCSV(text) {
        const lines = text.split('\n').filter(line => line.trim() !== '');
        if (lines.length < 2) return [];

        const headers = lines[0].split(',').map(h => h.trim());
        const testCases = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            const testCase = {};
            headers.forEach((header, index) => {
                testCase[header] = values[index] || '';
            });
            testCases.push(testCase);
        }
        return testCases;
    }
}
