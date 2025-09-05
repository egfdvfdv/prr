class ABTester {
    constructor(promptBuilder) {
        this.promptBuilder = promptBuilder;
        this.modal = document.getElementById('abModal');
        this.backdrop = document.getElementById('abModalBackdrop');
        this.promptA_el = document.getElementById('abPromptA');
        this.promptB_el = document.getElementById('abPromptB');
        this.resultA_el = document.getElementById('abResultA');
        this.resultB_el = document.getElementById('abResultB');
        this.init();
    }

    init() {
        document.getElementById('abTestBtn')?.addEventListener('click', () => this.open());
        document.getElementById('abModalClose')?.addEventListener('click', () => this.close());
        document.getElementById('runABTestBtn')?.addEventListener('click', () => this.run());
        document.getElementById('loadCurrentPromptABtn')?.addEventListener('click', () => this.loadCurrentPrompt());
    }

    open() {
        this.modal.style.display = 'flex';
        this.backdrop.style.display = 'block';
    }

    close() {
        this.modal.style.display = 'none';
        this.backdrop.style.display = 'none';
    }

    loadCurrentPrompt() {
        if (this.promptA_el) {
            this.promptA_el.value = this.promptBuilder.buildFullPrompt();
            showToast('Prompt A loaded from editor', 'success');
        }
    }

    run() {
        const promptA = this.promptA_el.value;
        const promptB = this.promptB_el.value;

        if (!promptA || !promptB) {
            showToast('Please provide both Prompt A and Prompt B', 'warning');
            return;
        }

        // Simulate running the prompts
        this.resultA_el.textContent = `Simulated output for Prompt A:\n\n${promptA.substring(0, 100)}...`;
        this.resultB_el.textContent = `Simulated output for Prompt B:\n\n${promptB.substring(0, 100)}...`;

        showToast('A/B Test complete (simulation)', 'success');
    }
}
