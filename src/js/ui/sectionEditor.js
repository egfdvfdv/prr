class SectionEditor {
    constructor() {
        this.sections = [];
        this.activeSectionId = null;
        this.sortable = null;
        this.init();
    }

    init() {
        this.resetDefaultSections();
        this.render();
        this.setupEventListeners();
    }

    uid() {
        return 's_' + Math.random().toString(36).slice(2, 9);
    }

    resetDefaultSections() {
        this.sections = [
          { id: this.uid(), name: 'system', icon: 'fa-shield-halved', deletable: false, content: 'You are an expert AI assistant.', children: [] },
          { id: this.uid(), name: 'context', icon: 'fa-layer-group', deletable: true, content: '', children: [] },
          { id: this.uid(), name: 'instructions', icon: 'fa-list-check', deletable: true, content: '', children: [] },
        ];
        this.activeSectionId = this.sections[0]?.id || null;
    }

    render() {
        const container = document.getElementById('sectionsContainer');
        if (!container) return;
        container.innerHTML = '';
        this.sections.forEach(section => this.renderSectionNode(section, container, 0));
        this.renderActiveSectionContent();
        this.initSortable();
    }

    renderSectionNode(section, parentElement, level) {
        const item = document.createElement('div');
        item.className = 'section-item';
        item.dataset.sectionId = section.id;
        item.style.paddingLeft = `${0.75 + level * 1.5}rem`;
        if (section.id === this.activeSectionId) {
            item.classList.add('active');
        }

        item.innerHTML = `
            <span class="drag-handle"><i class="fas fa-grip-vertical"></i></span>
            <i class="fas ${section.icon || 'fa-layer-group'}"></i>
            <span class="section-label">${this.escapeHtml(section.name)}</span>
            ${section.deletable !== false ? '<span class="close-section" title="Delete"><i class="fas fa-times"></i></span>' : ''}
        `;

        parentElement.appendChild(item);

        if (section.children && section.children.length > 0) {
            const childrenContainer = document.createElement('div');
            childrenContainer.className = 'section-children';
            childrenContainer.style.marginLeft = '20px';
            parentElement.appendChild(childrenContainer);
            section.children.forEach(child => this.renderSectionNode(child, childrenContainer, level + 1));
        }
    }

    renderActiveSectionContent() {
        const section = this.findNodeById(this.activeSectionId)?.node;
        const label = document.getElementById('sectionEditorLabel');
        const container = document.getElementById('section-textarea-container');

        if (label) {
            label.textContent = section ? `Content for: ${section.name}` : 'Section Content';
        }

        if (container) {
            if (section) {
                if (!this.sectionMonacoEditor) {
                    this.sectionMonacoEditor = monaco.editor.create(container, {
                        value: section.content || '',
                        language: 'markdown',
                        theme: document.documentElement.getAttribute('data-theme') === 'dark' ? 'vs-dark' : 'vs',
                        automaticLayout: true,
                        wordWrap: 'on',
                        minimap: { enabled: false }
                    });
                    this.sectionMonacoEditor.onDidBlurEditorText(() => {
                        const currentSection = this.findNodeById(this.activeSectionId)?.node;
                        if (currentSection) {
                            currentSection.content = this.sectionMonacoEditor.getValue();
                        }
                    });
                } else {
                    this.sectionMonacoEditor.setValue(section.content || '');
                }
            }
        }
    }

    initSortable() {
        const container = document.getElementById('sectionsContainer');
        if (container && !this.sortable) {
            this.sortable = new Sortable(container, {
                animation: 150,
                handle: '.drag-handle',
                group: 'sections',
                onEnd: (evt) => {
                    // Handle reordering logic here
                    const movedItemId = evt.item.dataset.sectionId;
                    // This is a simplified logic. A full implementation would need to handle nested structures.
                    const newIndex = evt.newIndex;
                    const oldIndex = evt.oldIndex;

                    const movedItem = this.sections.splice(oldIndex, 1)[0];
                    this.sections.splice(newIndex, 0, movedItem);

                    this.render(); // Re-render to reflect changes
                }
            });
        }
    }

    setupEventListeners() {
        document.getElementById('addSectionBtn')?.addEventListener('click', () => this.addSection());

        const sectionsContainer = document.getElementById('sectionsContainer');
        sectionsContainer?.addEventListener('click', (e) => {
            const sectionItem = e.target.closest('.section-item');
            if (!sectionItem) return;

            const sectionId = sectionItem.dataset.sectionId;

            if (e.target.closest('.close-section')) {
                this.deleteSection(sectionId);
            } else {
                this.selectSection(sectionId);
            }
        });
    }

    addSection() {
        const name = prompt("Enter section name:", "new-section");
        if (name) {
            const newSection = {
                id: this.uid(),
                name: name,
                icon: 'fa-layer-group',
                deletable: true,
                content: '',
                children: []
            };
            this.sections.push(newSection);
            this.render();
        }
    }

    deleteSection(id) {
        this.sections = this.sections.filter(s => s.id !== id);
        if (this.activeSectionId === id) {
            this.activeSectionId = this.sections[0]?.id || null;
        }
        this.render();
    }

    selectSection(id) {
        this.activeSectionId = id;
        this.render();
    }

    findNodeById(id, tree = this.sections) {
        if (!id) return null;
        for (const node of tree) {
          if (node.id === id) return { node, parent: null }; // Simplified parent finding
          if (node.children && node.children.length) {
            const r = this.findNodeById(id, node.children);
            if (r) return r;
          }
        }
        return null;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }

    addStrategySection(strategyKey) {
        const strategy = strategyManager.getStrategy(strategyKey);
        if (!strategy) {
            console.error(`Strategy ${strategyKey} not found.`);
            return;
        }

        let thinkingSection = this.sections.find(s => s.name === 'thinking');
        if (!thinkingSection) {
            thinkingSection = {
                id: this.uid(),
                name: 'thinking',
                icon: 'fa-brain',
                deletable: false,
                content: 'Reasoning steps and strategies.',
                children: []
            };
            this.sections.splice(1, 0, thinkingSection); // Insert after system
        }

        if (!thinkingSection.children) {
            thinkingSection.children = [];
        }

        const newSection = {
            id: this.uid(),
            name: strategyKey,
            icon: strategy.icon,
            deletable: true,
            content: strategy.content,
            children: []
        };

        thinkingSection.children.push(newSection);
        this.activeSectionId = newSection.id;
        this.render();
    }
}
