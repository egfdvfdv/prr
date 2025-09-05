class SearchEngine {
    constructor() {
        this.searchIndex = [];
        this.filters = {
            category: '',
            tags: [],
            dateRange: null,
            sortBy: 'relevance'
        };
        this.init();
    }

    init() {
        this.buildSearchIndex();
        this.setupAdvancedSearch();
    }

    buildSearchIndex() {
        // Build search index from all prompts
        this.searchIndex = promptManager.getPrompts().map(prompt => ({
            id: prompt.id,
            name: prompt.name.toLowerCase(),
            description: (prompt.description || '').toLowerCase(),
            content: prompt.content.toLowerCase(),
            category: (prompt.category || '').toLowerCase(),
            tags: (prompt.tags || []).map(t => t.toLowerCase()),
            created: new Date(prompt.created),
            modified: new Date(prompt.modified)
        }));
    }

    search(query, filters = {}) {
        const normalizedQuery = query.toLowerCase();
        const mergedFilters = { ...this.filters, ...filters };

        let results = this.searchIndex.filter(item => {
            // Text search
            const textMatch = !normalizedQuery ||
                item.name.includes(normalizedQuery) ||
                item.description.includes(normalizedQuery) ||
                item.content.includes(normalizedQuery) ||
                item.tags.some(tag => tag.includes(normalizedQuery));

            if (!textMatch) return false;

            // Category filter
            if (mergedFilters.category && item.category !== mergedFilters.category.toLowerCase()) {
                return false;
            }

            // Tags filter
            if (mergedFilters.tags.length > 0) {
                const hasAllTags = mergedFilters.tags.every(tag =>
                    item.tags.includes(tag.toLowerCase())
                );
                if (!hasAllTags) return false;
            }

            // Date range filter
            if (mergedFilters.dateRange) {
                const { start, end } = mergedFilters.dateRange;
                if (start && item.created < start) return false;
                if (end && item.created > end) return false;
            }

            return true;
        });

        // Sort results
        results = this.sortResults(results, normalizedQuery, mergedFilters.sortBy);

        // Map back to prompt objects
        return results.map(item => promptManager.getPromptById(item.id)).filter(p => p);
    }

    sortResults(results, query, sortBy) {
        switch(sortBy) {
            case 'relevance':
                return results.sort((a, b) => {
                    const scoreA = this.calculateRelevance(a, query);
                    const scoreB = this.calculateRelevance(b, query);
                    return scoreB - scoreA;
                });
            case 'name':
                return results.sort((a, b) => a.name.localeCompare(b.name));
            case 'created':
                return results.sort((a, b) => b.created - a.created);
            case 'modified':
                return results.sort((a, b) => b.modified - a.modified);
            default:
                return results;
        }
    }

    calculateRelevance(item, query) {
        if (!query) return 0;

        let score = 0;
        if (item.name.includes(query)) score += 10;
        if (item.name.startsWith(query)) score += 5;
        if (item.description.includes(query)) score += 5;
        if (item.tags.some(tag => tag === query)) score += 8;
        if (item.content.includes(query)) score += 2;

        return score;
    }

    setupAdvancedSearch() {
        // Create advanced search UI
        const searchContainer = document.querySelector('.search-container');
        if (searchContainer) {
            const advancedSearch = document.createElement('div');
            advancedSearch.className = 'advanced-search';
            advancedSearch.innerHTML = `
                <div class="advanced-search-filters">
                    <div class="filter-group">
                        <label>Category</label>
                        <select class="filter-select" id="searchCategory">
                            <option value="">All Categories</option>
                            <option value="Code Generation">Code Generation</option>
                            <option value="Writing">Writing</option>
                            <option value="Data Analysis">Data Analysis</option>
                            <option value="Translation">Translation</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label>Sort By</label>
                        <select class="filter-select" id="searchSort">
                            <option value="relevance">Relevance</option>
                            <option value="name">Name</option>
                            <option value="created">Newest</option>
                            <option value="modified">Recently Modified</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label>Tags</label>
                        <input type="text" class="form-control" id="searchTags"
                               placeholder="Enter tags, comma separated">
                    </div>
                    <div class="form-actions" style="border-top: none; padding-top: 0;">
                        <button class="btn btn-secondary" onclick="searchEngine.clearFilters()">
                            Clear
                        </button>
                        <button class="btn btn-primary" onclick="searchEngine.applyFilters()">
                            Apply
                        </button>
                    </div>
                </div>
            `;

            searchContainer.appendChild(advancedSearch);

            // Toggle advanced search on focus
            const searchInput = searchContainer.querySelector('.search-input');
            searchInput.addEventListener('focus', () => {
                advancedSearch.classList.add('active');
            });

            // Close on click outside
            document.addEventListener('click', (e) => {
                if (!searchContainer.contains(e.target)) {
                    advancedSearch.classList.remove('active');
                }
            });
        }
    }

    applyFilters() {
        const category = document.getElementById('searchCategory').value;
        const sortBy = document.getElementById('searchSort').value;
        const tags = document.getElementById('searchTags').value
            .split(',')
            .map(t => t.trim())
            .filter(t => t);

        this.filters = { category, sortBy, tags };

        const query = document.querySelector('.search-input').value;
        const results = this.search(query);
        uiRenderer.renderPrompts(results);

        document.querySelector('.advanced-search').classList.remove('active');
    }

    clearFilters() {
        document.getElementById('searchCategory').value = '';
        document.getElementById('searchSort').value = 'relevance';
        document.getElementById('searchTags').value = '';

        this.filters = {
            category: '',
            tags: [],
            dateRange: null,
            sortBy: 'relevance'
        };

        uiRenderer.renderPrompts();
    }
}
