class PreviewManager {
    constructor(sectionEditor) {
        this.sectionEditor = sectionEditor;
        this.format = 'xml'; // 'xml' or 'md'
        this.previewContentEl = document.getElementById('previewContent');
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.update();
    }

    setupEventListeners() {
        document.querySelectorAll('.preview-panel .toolbar-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const format = e.currentTarget.dataset.format;
                this.setFormat(format);

                document.querySelectorAll('.preview-panel .toolbar-btn').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
            });
        });
    }

    setFormat(format) {
        if (this.format !== format) {
            this.format = format;
            this.update();
        }
    }

    update() {
        if (!this.previewContentEl) return;

        const fullPrompt = this.buildFullPrompt();

        if (this.format === 'xml') {
            this.renderAsXML(fullPrompt);
        } else {
            this.renderAsMarkdown(fullPrompt);
        }
    }

    buildFullPrompt() {
        let text = '';
        const traverse = (nodes, indent = '') => {
            for (const node of nodes) {
                if (!node.content && (!node.children || node.children.length === 0)) continue;

                const tagName = (node.name || '').toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_-]/g, '');

                if (this.format === 'xml') {
                    text += `${indent}<${tagName}>\n`;
                    if (node.content) {
                        text += `${indent}  ` + node.content.replace(/\n/g, `\n${indent}  `) + '\n';
                    }
                    if (node.children && node.children.length > 0) {
                        traverse(node.children, indent + '  ');
                    }
                    text += `${indent}</${tagName}>\n\n`;
                } else {
                    // For markdown, just concatenate content
                    text += `# ${node.name}\n${node.content}\n\n`;
                }
            }
        };

        traverse(this.sectionEditor.sections);

        // In a real app, we'd also get content from the main monaco editor
        // For now, we just use the sections.

        return text.trim();
    }

    renderAsXML(promptText) {
        this.previewContentEl.textContent = promptText;
    }

    renderAsMarkdown(promptText) {
        if (window.marked && window.DOMPurify) {
            const rawHtml = marked.parse(promptText);
            const sanitizedHtml = DOMPurify.sanitize(rawHtml);
            this.previewContentEl.innerHTML = sanitizedHtml;
        } else {
            // Fallback to text if libraries not loaded
            this.previewContentEl.textContent = promptText;
        }
    }
}
