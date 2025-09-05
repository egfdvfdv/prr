class AutoSaveManager {
    constructor() {
        this.isDirty = false;
        this.saveTimeout = null;
        this.saveInterval = 5000; // 5 seconds
        this.indicator = null;
        this.init();
    }

    init() {
        this.createIndicator();
        this.setupListeners();
        this.startAutoSave();
    }

    createIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'auto-save-indicator';
        indicator.id = 'autoSaveIndicator';
        indicator.innerHTML = `
            <i class="fas fa-save"></i>
            <span>Auto-saving...</span>
        `;
        document.body.appendChild(indicator);
        this.indicator = indicator;
    }

    markDirty() {
        this.isDirty = true;
        clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(() => this.save(), this.saveInterval);
    }

    async save() {
        if (!this.isDirty) return;

        this.showIndicator('Saving...');

        try {
            // Save all managers
            await Promise.all([
                promptManager.savePrompts(),
                modelManager.saveCustomModels(),
                analyticsManager.saveMetrics()
            ]);

            this.isDirty = false;
            this.showIndicator('Saved', 'success');

            setTimeout(() => this.hideIndicator(), 2000);
        } catch (error) {
            console.error('Auto-save failed:', error);
            this.showIndicator('Save failed', 'error');
        }
    }

    showIndicator(text, status = 'saving') {
        if (!this.indicator) return;

        this.indicator.className = `auto-save-indicator show ${status}`;
        this.indicator.querySelector('span').textContent = text;

        const icon = this.indicator.querySelector('i');
        switch(status) {
            case 'success':
                icon.className = 'fas fa-check';
                break;
            case 'error':
                icon.className = 'fas fa-exclamation-triangle';
                break;
            default:
                icon.className = 'fas fa-save';
        }
    }

    hideIndicator() {
        if (this.indicator) {
            this.indicator.classList.remove('show');
        }
    }

    setupListeners() {
        // Listen for changes
        document.addEventListener('input', (e) => {
            if (e.target.matches('.form-control, .editor-input')) {
                this.markDirty();
            }
        });

        // Listen for prompt changes
        window.addEventListener('promptChanged', () => this.markDirty());
        window.addEventListener('settingsChanged', () => this.markDirty());
    }

    startAutoSave() {
        // Auto-save every 30 seconds if dirty
        setInterval(() => {
            if (this.isDirty) {
                this.save();
            }
        }, 30000);
    }
}
