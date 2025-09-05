class UIRenderer {
    constructor() {
        this.promptListContainer = null;
        this.searchResults = [];
        this.currentFilter = 'all';
        this.sortBy = 'created';
        this.init();
    }

    init() {
        // Wait for DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupUI());
        } else {
            this.setupUI();
        }
    }

    setupUI() {
        // Create dynamic prompt list container
        this.createPromptListUI();
        // Setup real-time search
        this.setupRealtimeSearch();
        // Initial render
        this.renderPrompts();
    }

    createPromptListUI() {
        // Find or create prompt list container
        const sidebar = document.querySelector('.sidebar-menu');
        if (sidebar) {
            // Create dynamic prompts section
            const promptsSection = document.createElement('div');
            promptsSection.className = 'sidebar-section dynamic-prompts';
            promptsSection.innerHTML = `
                <div class="sidebar-section-title" style="display: flex; justify-content: space-between; align-items: center;">
                    <span>My Prompts</span>
                    <button class="btn-micro" onclick="uiRenderer.showCreatePromptModal()">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
                <div class="prompts-filter-bar">
                    <select class="filter-select" onchange="uiRenderer.filterPrompts(this.value)">
                        <option value="all">All Prompts</option>
                        <option value="favorites">Favorites</option>
                        <option value="recent">Recent</option>
                        <option value="Code Generation">Code</option>
                        <option value="Creative Writing">Writing</option>
                        <option value="Data Analysis">Data</option>
                    </select>
                </div>
                <div id="promptList" class="prompt-list"></div>
            `;

            // Insert after first section
            const firstSection = sidebar.querySelector('.sidebar-section');
            if (firstSection) {
                firstSection.after(promptsSection);
            } else {
                sidebar.appendChild(promptsSection);
            }

            this.promptListContainer = document.getElementById('promptList');
        }
    }

    renderPrompts(prompts = null) {
        if (!this.promptListContainer) return;

        const promptsToRender = prompts || promptManager.getPrompts();

        if (promptsToRender.length === 0) {
            this.promptListContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-file-alt" style="font-size: 2rem; opacity: 0.3;"></i>
                    <p style="margin-top: 0.5rem; opacity: 0.5;">No prompts yet</p>
                    <button class="btn btn-sm btn-primary" style="padding: 4px 8px; font-size: 12px;" onclick="uiRenderer.showCreatePromptModal()">
                        Create First Prompt
                    </button>
                </div>
            `;
            return;
        }

        // Sort prompts
        const sorted = this.sortPrompts(promptsToRender);

        // Render prompt items with animations
        this.promptListContainer.innerHTML = sorted.map((prompt, index) => `
            <div class="sidebar-item prompt-item animate-fadeIn"
                 data-id="${prompt.id}"
                 style="animation-delay: ${index * 0.05}s"
                 onclick="uiRenderer.selectPrompt('${prompt.id}')">
                <i class="fas ${this.getCategoryIcon(prompt.category)} sidebar-item-icon"></i>
                <div class="prompt-item-content">
                    <span class="sidebar-item-text">${this.escapeHtml(prompt.name)}</span>
                    <span class="prompt-item-meta">${prompt.category || 'General'}</span>
                </div>
                <div class="prompt-item-actions">
                    ${prompt.isFavorite ? '<i class="fas fa-star" style="color: var(--warning);"></i>' : ''}
                    <button class="btn-micro" onclick="event.stopPropagation(); uiRenderer.promptActions('${prompt.id}')">
                        <i class="fas fa-ellipsis-v"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    sortPrompts(prompts) {
        switch(this.sortBy) {
            case 'name':
                return prompts.sort((a, b) => a.name.localeCompare(b.name));
            case 'category':
                return prompts.sort((a, b) => (a.category || '').localeCompare(b.category || ''));
            case 'modified':
                return prompts.sort((a, b) => new Date(b.modified) - new Date(a.modified));
            case 'created':
            default:
                return prompts.sort((a, b) => new Date(b.created) - new Date(a.created));
        }
    }

    getCategoryIcon(category) {
        const icons = {
            'Code Generation': 'fa-code',
            'Creative Writing': 'fa-pen',
            'Data Analysis': 'fa-chart-bar',
            'Translation': 'fa-language',
            'Education': 'fa-graduation-cap',
            'Creative': 'fa-palette',
            'Business': 'fa-briefcase',
            'Research': 'fa-microscope'
        };
        return icons[category] || 'fa-file-alt';
    }

    selectPrompt(promptId) {
        const prompt = promptManager.getPromptById(promptId);
        if (prompt) {
            this.displayPromptInEditor(prompt);
            // Update active state
            document.querySelectorAll('.prompt-item').forEach(item => {
                item.classList.remove('active');
            });
            const selectedItem = document.querySelector(`.prompt-item[data-id="${promptId}"]`);
            if (selectedItem) {
                selectedItem.classList.add('active');
            }
        }
    }

    displayPromptInEditor(prompt) {
        // Update editor with prompt content
        if (monacoEditor && typeof monacoEditor.setValue === 'function') {
            monacoEditor.setValue(prompt.content);
        }

        // Update prompt details panel
        this.updatePromptDetails(prompt);

        // Show right panel if hidden
        const rightPanel = document.getElementById('rightPanel');
        if (rightPanel && rightPanel.classList.contains('collapsed')) {
            toggleRightPanel();
        }
    }

    updatePromptDetails(prompt) {
        const detailsContainer = document.querySelector('#rightPanel .panel-content');
        if (detailsContainer) {
            const panelTitle = document.querySelector('#rightPanel .panel-title');
            if (panelTitle) panelTitle.textContent = 'Prompt Details';

            const panelTabs = document.querySelector('#rightPanel .panel-tabs');
            if (panelTabs) panelTabs.style.display = 'none';

            detailsContainer.innerHTML = `
                <div class="prompt-details-header">
                    <h3 style="font-size: var(--text-lg); font-weight: 600;">${this.escapeHtml(prompt.name)}</h3>
                    <button class="btn btn-ghost btn-sm" onclick="uiRenderer.editPrompt('${prompt.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                </div>
                <div class="prompt-details-meta">
                    <span class="meta-item">
                        <i class="fas fa-folder"></i> ${prompt.category || 'General'}
                    </span>
                    <span class="meta-item">
                        <i class="fas fa-clock"></i> ${this.formatDate(prompt.created)}
                    </span>
                    <span class="meta-item">
                        <i class="fas fa-fire"></i> ${prompt.metrics.uses || 0} uses
                    </span>
                </div>
                <div class="prompt-details-tags">
                    ${(prompt.tags || []).map(tag => `
                        <span class="tag">${this.escapeHtml(tag)}</span>
                    `).join('')}
                </div>
                <div class="prompt-details-description">
                    ${this.escapeHtml(prompt.description || 'No description')}
                </div>
                <div class="prompt-details-actions">
                    <button class="btn btn-primary" onclick="uiRenderer.testPrompt('${prompt.id}')">
                        <i class="fas fa-play"></i> Test Prompt
                    </button>
                    <button class="btn btn-secondary" onclick="uiRenderer.duplicatePrompt('${prompt.id}')">
                        <i class="fas fa-copy"></i> Duplicate
                    </button>
                    <button class="btn btn-ghost" onclick="uiRenderer.exportPrompt('${prompt.id}')">
                        <i class="fas fa-download"></i> Export
                    </button>
                </div>
            `;
        }
    }

    setupRealtimeSearch() {
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.performSearch(e.target.value);
                }, 300);
            });
        }
    }

    performSearch(query) {
        if (!query) {
            this.renderPrompts();
            return;
        }

        const results = promptManager.searchPrompts(query);
        this.renderPrompts(results);

        showToast('Search Results', `Found ${results.length} prompts matching "${query}"`, 'info');
    }

    filterPrompts(filter) {
        this.currentFilter = filter;
        let filtered = promptManager.getPrompts();

        switch(filter) {
            case 'favorites':
                filtered = promptManager.getFavorites();
                break;
            case 'recent':
                filtered = [...promptManager.getPrompts()].sort((a, b) => new Date(b.modified) - new Date(a.modified)).slice(0, 10);
                break;
            case 'all':
                // no filter
                break;
            default: // Filter by category
                filtered = filtered.filter(p => p.category === filter);
                break;
        }

        this.renderPrompts(filtered);
    }

    showCreatePromptModal() {
        openModal();
    }

    createPromptFromModal() {
        const name = document.getElementById('newPromptName').value;
        const description = document.getElementById('newPromptDescription').value;
        const category = document.getElementById('newPromptCategory').value;
        const tags = document.getElementById('newPromptTags').value.split(',').map(t => t.trim()).filter(t => t);
        const templateValue = document.getElementById('newPromptTemplate').value;

        if (!name) {
            showToast('Error', 'Prompt name is required', 'error');
            return;
        }

        let content = '';
        const templateMap = {
            'Basic Prompt': 'basic',
            'Chain of Thought': 'cot',
            'Few-Shot Learning': 'few-shot'
        };
        const templateKey = templateMap[templateValue];

        if (templateKey && promptManager.defaultTemplates[templateKey]) {
            content = promptManager.defaultTemplates[templateKey].content;
        } else if (templateValue === 'System + User') {
            content = '## System\n\n## User\n';
        }

        const newPrompt = promptManager.createPrompt({
            name,
            description,
            category,
            tags,
            content
        });

        this.renderPrompts();
        this.selectPrompt(newPrompt.id);
        closeModal();
        showToast('Success', `Prompt "${name}" created successfully!`, 'success');
    }

    escapeHtml(text) {
        if (typeof text !== 'string') return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatDate(date) {
        const d = new Date(date);
        const now = new Date();
        const diffMs = now - d;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

        if (diffHours < 1) return 'Just now';
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffHours < 168) return `${Math.floor(diffHours / 24)}d ago`;

        return d.toLocaleDateString();
    }

    promptActions(promptId) {
        // Show context menu with actions
        console.log('Actions for prompt:', promptId);
        showToast('Info', 'Actions menu not yet implemented.', 'info');
    }

    editPrompt(promptId) {
        const prompt = promptManager.getPromptById(promptId);
        if (prompt) {
            showToast('Info', 'Edit functionality not yet implemented.', 'info');
        }
    }

    duplicatePrompt(promptId) {
        const prompt = promptManager.getPromptById(promptId);
        if (prompt) {
            const newPrompt = promptManager.duplicatePrompt(promptId);
            this.renderPrompts();
            showToast('Success', `Prompt duplicated as "${newPrompt.name}"`, 'success');
        }
    }

    exportPrompt(promptId) {
        const prompt = promptManager.getPromptById(promptId);
        if (prompt) {
            exportImportManager.exportData([prompt], 'json', `prompt-${prompt.name}`);
        }
    }

    testPrompt(promptId) {
        const prompt = promptManager.getPromptById(promptId);
        if (prompt) {
            // Open test modal or integrate with AI model
            showToast('Test Mode', 'Opening prompt test environment...', 'info');
        }
    }

    renderLibrary() {
        const container = document.getElementById('libraryContent');
        if (!container) return;

        const prompts = promptManager.getPrompts();
        if (prompts.length === 0) {
            container.innerHTML = '<p>No prompts in library.</p>';
            return;
        }

        container.innerHTML = `
            <div class="stats-grid">
                ${prompts.map(p => this.createPromptCard(p)).join('')}
            </div>
        `;

        this.addLibraryEventListeners();
    }

    createPromptCard(prompt) {
        return `
            <div class="prompt-card" data-id="${prompt.id}">
                <div class="prompt-header">
                    <h4 class="prompt-title">${this.escapeHtml(prompt.name)}</h4>
                </div>
                <div class="prompt-content">
                    ${this.escapeHtml(prompt.description.substring(0, 100))}...
                </div>
                <div class="prompt-tags">
                    ${prompt.tags.map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('')}
                </div>
            </div>
        `;
    }

    addLibraryEventListeners() {
        document.querySelectorAll('.prompt-card').forEach(card => {
            card.addEventListener('click', () => {
                const promptId = card.dataset.id;
                this.selectPrompt(promptId);
                switchNavTab('workspace'); // Switch back to the editor
            });
        });
    }
}
