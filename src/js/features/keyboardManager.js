class KeyboardManager {
    constructor() {
        this.shortcuts = new Map();
        this.init();
    }

    init() {
        this.registerShortcuts();
        this.setupListener();
    }

    registerShortcuts() {
        // Application shortcuts
        this.register('cmd+k, ctrl+k', () => this.focusSearch());
        this.register('cmd+n, ctrl+n', () => uiRenderer.showCreatePromptModal());
        this.register('cmd+s, ctrl+s', () => autoSaveManager.save());
        this.register('cmd+/, ctrl+/', () => this.toggleCommandPalette());
        this.register('cmd+\\, ctrl+\\', () => toggleSidebar());
        this.register('cmd+b, ctrl+b', () => toggleSidebar());
        this.register('cmd+shift+p, ctrl+shift+p', () => this.toggleRightPanel());

        // Navigation shortcuts
        this.register('alt+1', () => this.switchTab('workspace'));
        this.register('alt+2', () => this.switchTab('library'));
        this.register('alt+3', () => this.switchTab('analytics'));
        this.register('alt+4', () => this.switchTab('models'));
        this.register('alt+5', () => this.switchTab('team'));

        // Editor shortcuts
        this.register('cmd+enter, ctrl+enter', () => this.runPrompt());
        this.register('cmd+d, ctrl+d', () => this.duplicateCurrentPrompt());
        this.register('cmd+shift+d, ctrl+shift+d', () => this.deleteCurrentPrompt());
        this.register('escape', () => this.closeModals());
    }

    register(keys, callback) {
        keys.split(',').forEach(key => {
            this.shortcuts.set(key.trim(), callback);
        });
    }

    setupListener() {
        document.addEventListener('keydown', (e) => {
            const key = this.getKeyString(e);
            const handler = this.shortcuts.get(key);

            if (handler) {
                e.preventDefault();
                handler();
            }
        });
    }

    getKeyString(e) {
        const parts = [];

        if (e.metaKey) parts.push('cmd');
        if (e.ctrlKey) parts.push('ctrl');
        if (e.altKey) parts.push('alt');
        if (e.shiftKey) parts.push('shift');

        const key = e.key.toLowerCase();
        if (key !== 'control' && key !== 'alt' && key !== 'shift' && key !== 'meta') {
            parts.push(key === ' ' ? 'space' : key);
        }

        return parts.join('+');
    }

    focusSearch() {
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
            searchInput.focus();
            searchInput.select();
        }
    }

    toggleCommandPalette() {
        // Show command palette
        this.showCommandPalette();
    }

    showCommandPalette() {
        // This functionality requires a modal that can be dynamically filled.
        // For now, we'll just log it.
        console.log("Command Palette toggled");
        showToast('Info', 'Command Palette not yet implemented.', 'info');
    }

    filterCommands(query) {
        const items = document.querySelectorAll('.command-item');
        items.forEach(item => {
            const text = item.textContent.toLowerCase();
            item.style.display = text.includes(query.toLowerCase()) ? 'flex' : 'none';
        });
    }

    switchTab(tabName) {
        const tab = document.querySelector(`[data-tab="${tabName}"]`);
        if (tab) {
            switchNavTab(tabName);
        }
    }

    runPrompt() {
        // Run current prompt
        const activePrompt = document.querySelector('.prompt-item.active');
        if (activePrompt) {
            const promptId = activePrompt.dataset.id;
            uiRenderer.testPrompt(promptId);
        }
    }

    duplicateCurrentPrompt() {
        const activePrompt = document.querySelector('.prompt-item.active');
        if (activePrompt) {
            uiRenderer.duplicatePrompt(activePrompt.dataset.id);
        }
    }

    deleteCurrentPrompt() {
        const activePrompt = document.querySelector('.prompt-item.active');
        if (activePrompt && confirm('Delete this prompt?')) {
            promptManager.deletePrompt(activePrompt.dataset.id);
            uiRenderer.renderPrompts();
            showToast('Deleted', 'Prompt deleted successfully', 'info');
        }
    }

    closeModals() {
        const modal = document.getElementById('newPromptModal');
        if (modal && modal.classList.contains('active')) {
            closeModal();
        }
    }

    toggleRightPanel() {
        const panel = document.querySelector('.right-panel');
        if (panel) {
            toggleRightPanel();
        }
    }
}
