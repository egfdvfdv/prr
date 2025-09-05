// ============================================
// INITIALIZATION
// ============================================
let monacoEditor = null;
let currentTheme = localStorage.getItem('theme') || 'light';
let sidebarCollapsed = false;
let rightPanelCollapsed = false;

// Set initial theme
document.documentElement.setAttribute('data-theme', currentTheme);
updateThemeToggle();

// ============================================
// MANAGERS and UI RENDERER INSTANTIATION
// ============================================
const promptManager = new PromptManager();
const modelManager = new ModelManager();
const analyticsManager = new AnalyticsManager();
const collaborationManager = new CollaborationManager();
const exportImportManager = new ExportImportManager();
const sectionEditor = new SectionEditor();
const previewManager = new PreviewManager(sectionEditor);
const strategyManager = new StrategyManager();
const testManager = new TestManager({
    getVariableValues: () => sectionEditor.variableValues,
    setVariableValues: (vars) => { sectionEditor.variableValues = vars; },
    buildFullPrompt: () => previewManager.buildFullPrompt(), // Use preview manager's build logic
});
const abTester = new ABTester({
    buildFullPrompt: () => previewManager.buildFullPrompt(),
});
const chatSimulator = new ChatSimulator({
    buildFullPrompt: () => previewManager.buildFullPrompt(),
});
const uiRenderer = new UIRenderer();
const autoSaveManager = new AutoSaveManager();
const keyboardManager = new KeyboardManager();
const searchEngine = new SearchEngine();


// ============================================
// THEME MANAGEMENT
// ============================================
function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('theme', currentTheme);
    updateThemeToggle();
    if (monacoEditor) {
        monaco.editor.setTheme(currentTheme === 'dark' ? 'vs-dark' : 'vs');
    }
    showToast('Theme changed', `Switched to ${currentTheme} mode`, 'info');
}

function updateThemeToggle() {
    const slider = document.querySelector('.theme-toggle-slider');
    if (slider) {
        if (currentTheme === 'dark') {
            slider.innerHTML = '<i class="fas fa-moon" style="font-size: 10px;"></i>';
        } else {
            slider.innerHTML = '<i class="fas fa-sun" style="font-size: 10px;"></i>';
        }
    }
}

// ... (other functions like toggleSidebar, toggleRightPanel, openModal, etc. would go here)
// For brevity, I will keep them out but they exist in the full code.

// ============================================
// DYNAMIC UI POPULATION
// ============================================
function populateStrategyMenu() {
    const menu = document.getElementById('strategyMenu');
    if (!menu) return;
    const strategies = strategyManager.getStrategies();
    menu.innerHTML = ''; // Clear existing items
    for (const key in strategies) {
        const strategy = strategies[key];
        const item = document.createElement('div');
        item.className = 'dropdown-item';
        item.dataset.strategy = key;
        item.innerHTML = `<i class="fas ${strategy.icon}"></i> <span>${strategy.title}</span>`;
        menu.appendChild(item);
    }
}

// ============================================
// VIEW/PAGE SWITCHING LOGIC
// ============================================
function switchNavTab(tabName) {
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabName);
    });
    loadTabContent(tabName);
}

function loadTabContent(tabName) {
    const workspaceTitle = document.querySelector('.workspace-title span');
    const icons = {
        workspace: 'fa-laptop-code',
        library: 'fa-book',
        analytics: 'fa-chart-line',
        models: 'fa-robot',
        team: 'fa-users',
        testing: 'fa-vial'
    };
    const titles = {
        workspace: 'Workspace',
        library: 'Prompt Library',
        analytics: 'Analytics Dashboard',
        models: 'Model Configuration',
        team: 'Team Collaboration',
        testing: 'Test Suites'
    };

    // Hide all page panels
    document.querySelectorAll('.page-panel').forEach(p => {
        p.style.display = 'none';
    });

    // Show the selected one
    const activePanel = document.getElementById(`${tabName}Panel`);
    if (activePanel) {
        activePanel.style.display = (tabName === 'workspace') ? 'flex' : 'block';
        if (tabName === 'library') {
            uiRenderer.renderLibrary();
        }
    } else {
        document.getElementById('workspacePanel').style.display = 'flex'; // Fallback
    }

    if (workspaceTitle) {
        workspaceTitle.textContent = titles[tabName] || 'Workspace';
        const icon = document.querySelector('.workspace-title-icon');
        if (icon) {
            icon.className = `fas ${icons[tabName] || 'fa-laptop-code'} workspace-title-icon`;
        }
    }

    showToast('Navigation', `Switched to ${titles[tabName] || 'Workspace'}`, 'info');
}

// ============================================
// MAIN EVENT LISTENERS (DOM-CONTENT-LOADED)
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Monaco Editor
    if (typeof require !== 'undefined') {
        require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs' }});
        require(['vs/editor/editor.main'], function() {
            monacoEditor = monaco.editor.create(document.getElementById('monaco-editor'), {
                value: "Welcome to LLM Studio Pro!",
                language: 'markdown',
                theme: currentTheme === 'dark' ? 'vs-dark' : 'vs',
                automaticLayout: true
            });
        });
    }

    // Populate dynamic menus
    populateStrategyMenu();

    // Setup Nav
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', () => switchNavTab(tab.dataset.tab));
    });

    // Setup Strategies Dropdown
    const strategyDropdown = document.getElementById('strategyDropdown');
    if(strategyDropdown) {
        const btn = strategyDropdown.querySelector('button');
        btn.addEventListener('click', () => strategyDropdown.classList.toggle('active'));
        const menu = strategyDropdown.querySelector('.dropdown-menu');
        menu.addEventListener('click', (e) => {
            const item = e.target.closest('.dropdown-item');
            if(item) {
                const strategyKey = item.dataset.strategy;
                sectionEditor.addStrategySection(strategyKey);
                strategyDropdown.classList.remove('active');
            }
        });
        document.addEventListener('click', (e) => {
            if (!strategyDropdown.contains(e.target)) {
                strategyDropdown.classList.remove('active');
            }
        });
    }

    // Setup Split View
    const splitViewBtn = document.querySelector('.toolbar-btn .fa-columns')?.parentElement;
    if(splitViewBtn) {
        splitViewBtn.addEventListener('click', () => {
            document.getElementById('editorContainer').classList.toggle('split-view-active');
            splitViewBtn.classList.toggle('active');
        });
    }

    // Setup Test Manager UI
    document.getElementById('addSuiteBtn')?.addEventListener('click', () => {
        const name = prompt("Enter new suite name:");
        if (name) {
            testManager.createSuite(name);
            showToast(`Suite "${name}" created!`, 'success');
            // A full implementation would re-render the list of suites
        }
    });

    document.getElementById('runSuitesBtn')?.addEventListener('click', (e) => {
        const btn = e.currentTarget;
        if (!testManager.activeSuite) {
            showToast('No active test suite. Please create one first.', 'warning');
            return;
        }

        btn.disabled = true;
        btn.innerHTML = '<span class="spinner" style="width: 16px; height: 16px; border-width: 2px;"></span> Running...';

        // Simulate async operation
        setTimeout(() => {
            const results = testManager.runSuite(testManager.activeSuite);
            const resultsEl = document.getElementById('testsResults');
            if(resultsEl) {
                resultsEl.textContent = JSON.stringify(results, null, 2);
            }
            showToast(`Test suite "${testManager.activeSuite}" finished.`, 'success');
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-play"></i> Run Active Suite';
        }, 1000);
    });

    // Connect section editor updates to preview manager
    const originalRender = sectionEditor.render.bind(sectionEditor);
    sectionEditor.render = function() {
        originalRender();
        if (previewManager) {
            previewManager.update();
        }
    };

    // Initial load
    switchNavTab('workspace');

    // Settings Panel Logic
    const settingsBtn = document.querySelector('.header-actions .btn-ghost .fa-cog')?.parentElement;
    settingsBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        // This is a simplified way to show a page.
        // A real app might use a router or a more robust view manager.
        document.querySelectorAll('.page-panel').forEach(p => p.style.display = 'none');
        const settingsPanel = document.getElementById('settingsPanel');
        if(settingsPanel) settingsPanel.style.display = 'block';
    });

    document.getElementById('saveApiKeysBtn')?.addEventListener('click', () => {
        const openaiKey = document.getElementById('openai_api_key').value;
        const anthropicKey = document.getElementById('anthropic_api_key').value;
        if(openaiKey) modelManager.setAPIKey('OpenAI', openaiKey);
        if(anthropicKey) modelManager.setAPIKey('Anthropic', anthropicKey);
        showToast('API Keys saved!', 'success');
    });

    document.getElementById('backupDataBtn')?.addEventListener('click', () => {
        exportImportManager.backup();
    });

    document.getElementById('restoreDataBtn')?.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = e => {
            const file = e.target.files[0];
            if (file) {
                exportImportManager.restore(file)
                    .then(() => {
                        showToast('Data restored successfully! Reloading...', 'success');
                        setTimeout(() => window.location.reload(), 1500);
                    })
                    .catch(err => showToast(`Error restoring data: ${err.message}`, 'error'));
            }
        };
        input.click();
    });

    // Editor/Chat view switcher
    const editorView = document.getElementById('editorView');
    const chatView = document.getElementById('chatView');
    document.querySelectorAll('.editor-modes .toolbar-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.dataset.view;
            if (view === 'chat') {
                editorView.style.display = 'none';
                chatView.style.display = 'block';
            } else {
                editorView.style.display = 'block';
                chatView.style.display = 'none';
            }
            document.querySelectorAll('.editor-modes .toolbar-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
});
