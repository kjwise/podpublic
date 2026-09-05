/* global window, document */

(function () {
    const normalizePath = (value) => (value || '').replace(/\/+$/, '');

    const SEARCH_UI_MARKUP = [
        '<div class="pod-search__controls">',
        '<div class="pod-search__input-row">',
        '<label class="pod-search__label" for="pod-search-input">Search</label>',
        '<input id="pod-search-input" class="pod-search__input" type="search" inputmode="search" autocomplete="off" placeholder="Search the book and blogs\u2026" />',
        '<button id="pod-search-clear" class="pod-search__clear" type="button" aria-label="Clear search">\u00d7</button>',
        '</div>',
        '',
        '<div class="pod-search__filters" aria-label="Search filters">',
        '<div class="pod-search__scope" role="group" aria-label="Search scope">',
        '<button type="button" class="pod-seg is-active" data-scope="all">All</button>',
        '<button type="button" class="pod-seg" data-scope="book">Book</button>',
        '<button type="button" class="pod-seg" data-scope="blogs">Blogs</button>',
        '</div>',
        '',
        '<div class="pod-search__part">',
        '<label class="pod-search__part-label" for="pod-search-part">Part</label>',
        '<select id="pod-search-part" class="pod-search__part-select">',
        '<option value="">All Parts</option>',
        '<option value="Preface">Preface</option>',
        '<option value="Part I">Part I</option>',
        '<option value="Part II">Part II</option>',
        '<option value="Part III">Part III</option>',
        '<option value="Part IV">Part IV</option>',
        '<option value="Part V">Part V</option>',
        '<option value="Part VI">Part VI</option>',
        '<option value="Part VII">Part VII</option>',
        '<option value="Part VIII">Part VIII</option>',
        '</select>',
        '</div>',
        '</div>',
        '',
        '<div id="pod-search-status" class="pod-search__status" aria-live="polite"></div>',
        '</div>',
        '',
        '<div id="pod-search-results" class="pod-search__results" aria-live="polite"></div>',
    ].join('\n');

    const ALLOWED_PARTS = new Set([
        'Preface',
        'Part I',
        'Part II',
        'Part III',
        'Part IV',
        'Part V',
        'Part VI',
        'Part VII',
        'Part VIII',
    ]);

    const normalizePartValue = (raw) => {
        const value = String(raw || '').trim();
        if (!value) return '';

        if (value.toLowerCase() === 'preface') return 'Preface';

        const partMatch = value.match(/\bpart\s+([ivx]+)\b/i);
        if (partMatch && partMatch[1]) {
            const normalized = `Part ${partMatch[1].toUpperCase()}`;
            return ALLOWED_PARTS.has(normalized) ? normalized : '';
        }

        const romanOnly = value.toUpperCase();
        if (/^[IVX]+$/.test(romanOnly)) {
            const normalized = `Part ${romanOnly}`;
            return ALLOWED_PARTS.has(normalized) ? normalized : '';
        }

        return ALLOWED_PARTS.has(value) ? value : '';
    };

    const getSearchStateFromUrl = () => {
        const params = new URLSearchParams(window.location.search || '');
        const q = (params.get('q') || '').trim();
        const scope = (params.get('scope') || 'all').trim();
        const part = normalizePartValue(params.get('part') || '');

        return {
            q,
            scope: scope === 'book' || scope === 'blogs' ? scope : 'all',
            part,
        };
    };

    const updateUrlState = (state) => {
        const params = new URLSearchParams(window.location.search || '');

        if (state.q) {
            params.set('q', state.q);
        } else {
            params.delete('q');
        }

        if (state.scope && state.scope !== 'all') {
            params.set('scope', state.scope);
        } else {
            params.delete('scope');
        }

        if (state.part) {
            params.set('part', state.part);
        } else {
            params.delete('part');
        }

        const qs = params.toString();
        const next = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
        window.history.replaceState(null, '', next);
    };

    const stripHtmlExtension = (value) => {
        const raw = String(value || '');
        const hashIndex = raw.indexOf('#');
        const beforeHash = hashIndex === -1 ? raw : raw.slice(0, hashIndex);
        const hash = hashIndex === -1 ? '' : raw.slice(hashIndex);
        const queryIndex = beforeHash.indexOf('?');
        const path = queryIndex === -1 ? beforeHash : beforeHash.slice(0, queryIndex);
        const query = queryIndex === -1 ? '' : beforeHash.slice(queryIndex);

        let prettyPath = path;
        if (prettyPath.endsWith('/index.html')) {
            prettyPath = prettyPath.slice(0, -'index.html'.length);
        } else if (prettyPath.endsWith('.html')) {
            prettyPath = prettyPath.slice(0, -'.html'.length);
        }

        return `${prettyPath}${query}${hash}`;
    };

    const normalizeUrl = (url) => {
        if (!url) return '';
        const withoutOrigin = String(url).replace(/^https?:\/\/[^/]+/i, '');
        const withLeadingSlash = withoutOrigin.startsWith('/') ? withoutOrigin : `/${withoutOrigin}`;
        return stripHtmlExtension(withLeadingSlash);
    };

    const isBlogUrl = (url) => {
        const normalized = (url || '').trim();
        return normalized.startsWith('/blogs/') || normalized.startsWith('blogs/');
    };

    const extractChapterNumber = (url) => {
        const normalized = normalizeUrl(url || '').toLowerCase();
        const match = normalized.match(/(?:^|\/)chapter-(\d+)(?:-|\.|$)/);
        if (!match || !match[1]) return null;
        const value = Number.parseInt(match[1], 10);
        return Number.isFinite(value) ? value : null;
    };

    const isRedirectStubUrl = (url) => {
        const normalized = normalizePath(normalizeUrl(url)).toLowerCase();
        return /^\/(?:chapter|epilogue)-\d+$/.test(normalized);
    };

    const isSearchResultUrl = (url) => {
        const normalized = normalizePath(normalizeUrl(url)).toLowerCase();
        return normalized === '/search' || normalized === '/search.html';
    };

    const pickTitle = (data) => {
        const meta = (data && data.meta) ? data.meta : {};
        const candidates = [meta.title, meta.page_title, meta.heading];

        for (const candidate of candidates) {
            const title = String(candidate || '').trim();
            if (title) return title;
        }

        return '';
    };

    const pickPart = (data) => {
        const meta = (data && data.meta) ? data.meta : {};
        const direct = String(meta.pod_part || '').trim();
        if (direct) return direct;

        const filters = data && data.filters ? data.filters : null;
        if (filters && filters.pod_part) {
            const value = filters.pod_part;
            if (Array.isArray(value)) {
                return String(value[0] || '').trim();
            }
            return String(value || '').trim();
        }

        return '';
    };

    const ensurePagefind = async () => {
        if (window.__podPagefindApi) {
            return window.__podPagefindApi;
        }

        if (!window.__podPagefindApiPromise) {
            window.__podPagefindApiPromise = import('/pagefind/pagefind.js')
                .then(async (mod) => {
                    window.__podPagefindApi = mod;
                    try {
                        if (typeof mod.options === 'function') {
                            await mod.options({ excerptLength: 18 });
                        }
                    } catch (err) {
                        // Non-fatal.
                    }
                    return mod;
                })
                .catch((err) => {
                    window.__podPagefindApiPromise = null;
                    throw err;
                });
        }

        return window.__podPagefindApiPromise;
    };

    const renderResultsGroup = (resultsEl, title, items) => {
        if (!items.length) {
            return;
        }

        const groupTitle = document.createElement('div');
        groupTitle.className = 'pod-search__group-title';
        groupTitle.textContent = title;
        resultsEl.appendChild(groupTitle);

        items.forEach((item) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'pod-search__result';

            const link = document.createElement('a');
            link.className = 'pod-search__result-link';
            link.href = item.url || '#';
            link.textContent = item.title || item.url || 'Untitled';
            wrapper.appendChild(link);

            const metaRow = document.createElement('div');
            metaRow.className = 'pod-search__result-meta';

            if (item.badges && item.badges.length) {
                item.badges.forEach((badgeText) => {
                    const badge = document.createElement('span');
                    badge.className = 'pod-search__badge';
                    badge.textContent = badgeText;
                    metaRow.appendChild(badge);
                });
            }

            wrapper.appendChild(metaRow);

            if (item.excerpt) {
                const excerpt = document.createElement('div');
                excerpt.className = 'pod-search__excerpt';
                excerpt.innerHTML = item.excerpt;
                wrapper.appendChild(excerpt);
            }

            if (item.subresults && item.subresults.length) {
                const sub = document.createElement('div');
                sub.className = 'pod-search__subresults';

                item.subresults.slice(0, 6).forEach((sr) => {
                    const srUrl = normalizeUrl(sr.url || '');
                    if (!srUrl) return;

                    const srLink = document.createElement('a');
                    srLink.className = 'pod-search__subresult-link';
                    srLink.href = srUrl;
                    srLink.textContent = sr.title || srUrl;
                    sub.appendChild(srLink);
                });

                wrapper.appendChild(sub);
            }

            resultsEl.appendChild(wrapper);
        });
    };

    const resultsToItems = async (searchResponse, accept) => {
        const response = searchResponse && Array.isArray(searchResponse.results)
            ? searchResponse
            : { results: [] };

        const items = [];
        for (const result of response.results) {
            if (!result || typeof result.data !== 'function') continue;
            let data = null;
            try {
                data = await result.data();
            } catch (err) {
                continue;
            }
            if (!data) continue;

            const url = normalizeUrl(data.url || '');
            if (!url || isSearchResultUrl(url) || isRedirectStubUrl(url)) continue;
            if (accept && !accept(data, url)) continue;

            const title = pickTitle(data) || url;
            const excerpt = data.excerpt || '';
            const meta = data.meta || {};
            const subresults = data.sub_results || data.subresults || data.subResults || [];

            items.push({
                url,
                title,
                excerpt,
                meta,
                subresults: Array.isArray(subresults) ? subresults : [],
            });
        }

        return items;
    };

    const searchItems = async ({ q, scope, part }) => {
        const api = await ensurePagefind();
        const query = String(q || '').trim();
        if (!query) {
            return { book: [], blogs: [] };
        }

        const buildFilters = (kind) => {
            const filters = {};
            if (kind) {
                filters.pod_type = [kind];
            }
            if (kind === 'book' && part) {
                filters.pod_part = [part];
            }
            return filters;
        };

        const run = async (kind, accept, allowFallback) => {
            const filters = buildFilters(kind);
            let response = null;

            try {
                response = await api.search(query, { filters });
            } catch (err) {
                response = null;
            }

            const hasResults = response && Array.isArray(response.results) && response.results.length > 0;
            if (!hasResults && allowFallback) {
                try {
                    response = await api.search(query);
                } catch (err) {
                    response = null;
                }
            }

            return resultsToItems(response, accept);
        };

        const acceptBook = (data, url) => {
            if (isBlogUrl(url)) return false;
            if (part) {
                const found = pickPart(data);
                return found ? found === part : false;
            }
            return true;
        };
        const acceptBlogs = (_data, url) => isBlogUrl(url);

        if (scope === 'book') {
            const book = await run('book', acceptBook, !part);
            return { book, blogs: [] };
        }

        if (scope === 'blogs') {
            const blogs = await run('blog', acceptBlogs, true);
            return { book: [], blogs };
        }

        const [book, blogs] = await Promise.all([
            run('book', acceptBook, !part),
            run('blog', acceptBlogs, true),
        ]);

        return { book, blogs };
    };

    const initSearch = (rootEl) => {
        const input = document.getElementById('pod-search-input');
        const clearBtn = document.getElementById('pod-search-clear');
        const scopeButtons = Array.from(rootEl.querySelectorAll('[data-scope]'));
        const partSelect = document.getElementById('pod-search-part');
        const statusEl = document.getElementById('pod-search-status');
        const resultsEl = document.getElementById('pod-search-results');

        if (!input || !clearBtn || !scopeButtons.length || !partSelect || !statusEl || !resultsEl) {
            return;
        }

        let state = getSearchStateFromUrl();
        let debounceTimer = null;
        let searchToken = 0;

        const setStatus = (text) => {
            statusEl.textContent = text || '';
        };

        const setScope = (scope) => {
            state.scope = scope;
            scopeButtons.forEach((btn) => {
                const isActive = btn.dataset.scope === scope;
                btn.classList.toggle('is-active', isActive);
            });

            const disablePart = scope === 'blogs';
            partSelect.disabled = disablePart;
            partSelect.setAttribute('aria-disabled', disablePart ? 'true' : 'false');
        };

        const scheduleSearch = () => {
            if (debounceTimer) {
                window.clearTimeout(debounceTimer);
            }
            debounceTimer = window.setTimeout(runSearch, 160);
        };

        const runSearch = async () => {
            updateUrlState(state);
            const query = String(state.q || '').trim();

            resultsEl.innerHTML = '';
            if (!query) {
                setStatus('');
                return;
            }

            const myToken = ++searchToken;
            setStatus('Searching\u2026');

            let groups = null;
            try {
                groups = await searchItems(state);
            } catch (err) {
                groups = null;
            }

            if (myToken !== searchToken) {
                return;
            }

            const bookItemsRaw = groups && Array.isArray(groups.book) ? groups.book : [];
            const blogItemsRaw = groups && Array.isArray(groups.blogs) ? groups.blogs : [];

            const bookItems = bookItemsRaw.map((item) => {
                const badges = ['Book'];
                const chapterNumber = extractChapterNumber(item.url);
                if (chapterNumber != null) {
                    badges.push(`Ch ${chapterNumber}`);
                }
                const partValue = pickPart(item) || pickPart({ meta: item.meta, filters: item.filters });
                if (partValue) badges.push(partValue);
                return { ...item, badges };
            });

            const blogItems = blogItemsRaw.map((item) => ({ ...item, badges: ['Blog'] }));

            const bookWithChapter = bookItems.map((item, idx) => ({
                ...item,
                __chapter: extractChapterNumber(item.url),
                __idx: idx,
            }));
            const chapterItems = bookWithChapter
                .filter((item) => item.__chapter != null)
                .sort((a, b) => (a.__chapter - b.__chapter) || (a.__idx - b.__idx))
                .map((item) => {
                    const copy = { ...item };
                    delete copy.__chapter;
                    delete copy.__idx;
                    return copy;
                });
            const otherBookItems = bookWithChapter
                .filter((item) => item.__chapter == null)
                .map((item) => {
                    const copy = { ...item };
                    delete copy.__chapter;
                    delete copy.__idx;
                    return copy;
                });

            const total = bookItems.length + blogItems.length;
            const statusParts = [];

            if (state.scope === 'book') {
                statusParts.push(`${total} result${total === 1 ? '' : 's'} in Book`);
            } else if (state.scope === 'blogs') {
                statusParts.push(`${total} result${total === 1 ? '' : 's'} in Blogs`);
            } else {
                statusParts.push(`${total} result${total === 1 ? '' : 's'}`);
                if (bookItems.length) statusParts.push(`${bookItems.length} Book`);
                if (blogItems.length) statusParts.push(`${blogItems.length} Blogs`);
            }

            setStatus(statusParts.join(' \u2022 '));

            if (!total) {
                const empty = document.createElement('div');
                empty.className = 'pod-search__empty';
                empty.textContent = 'No results found.';
                resultsEl.appendChild(empty);
                return;
            }

            if (state.scope === 'blogs') {
                renderResultsGroup(resultsEl, 'Blogs', blogItems);
                return;
            }

            if (state.scope === 'book') {
                renderResultsGroup(resultsEl, 'Chapters', chapterItems);
                renderResultsGroup(resultsEl, 'Book', otherBookItems);
                return;
            }

            renderResultsGroup(resultsEl, 'Chapters', chapterItems);
            renderResultsGroup(resultsEl, 'Book', otherBookItems);
            renderResultsGroup(resultsEl, 'Blogs', blogItems);
        };

        const setQuery = (value) => {
            state.q = String(value || '').trimStart();
            input.value = state.q;
            scheduleSearch();
        };

        clearBtn.addEventListener('click', () => setQuery(''));

        input.addEventListener('input', () => {
            state.q = input.value || '';
            scheduleSearch();
        });

        scopeButtons.forEach((btn) => {
            btn.addEventListener('click', () => {
                const next = btn.dataset.scope || 'all';
                setScope(next);
                scheduleSearch();
            });
        });

        partSelect.addEventListener('change', () => {
            state.part = partSelect.value || '';
            scheduleSearch();
        });

        // Apply URL state.
        input.value = state.q || '';
        partSelect.value = state.part || '';
        setScope(state.scope || 'all');
        runSearch();

        window.addEventListener('popstate', () => {
            state = getSearchStateFromUrl();
            input.value = state.q || '';
            partSelect.value = state.part || '';
            setScope(state.scope || 'all');
            runSearch();
        });
    };

    const isSearchPage = () => {
        const path = normalizePath(window.location && window.location.pathname ? window.location.pathname : '');
        return path.endsWith('/search') || path.endsWith('/search.html');
    };

    const bootOnce = () => {
        if (window.__podSearchInitialized) return true;

        const rootEl = document.querySelector('[data-pod-search]');
        if (!rootEl) return false;

        if (!rootEl.innerHTML || !rootEl.innerHTML.trim()) {
            rootEl.innerHTML = SEARCH_UI_MARKUP;
        }

        initSearch(rootEl);
        window.__podSearchInitialized = true;
        return true;
    };

    const bootWhenReady = () => {
        if (bootOnce()) return;

        const observer = new MutationObserver(() => {
            if (bootOnce()) {
                observer.disconnect();
            }
        });

        observer.observe(document.documentElement, { childList: true, subtree: true });

        window.setTimeout(() => observer.disconnect(), 12000);
    };

    if (!isSearchPage()) {
        return;
    }

    if (document && document.body) {
        document.body.classList.add('pod-search-page');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bootWhenReady);
    } else {
        bootWhenReady();
    }
})();
