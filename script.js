(() => {
    console.log("Path of the Dragon website initialized.");

    const body = document.body;
    body.classList.add('dark-mode');

    // Detect special non-chapter pages that share the chapter template
    // container but should not receive chapter post-processing.
    const isTocPage = document.querySelector('.toc-grid') !== null;
    if (isTocPage) {
        body.classList.add('toc-page');
    }

    const normalizePath = (value) => String(value || '').replace(/\/+$/, '');
    const path = normalizePath(window.location && window.location.pathname ? window.location.pathname : '');
    const isSearchPage = path.endsWith('/search') || path.endsWith('/search.html');
    if (isSearchPage) {
        body.classList.add('pod-search-page');
    }

    const mobileToggle = document.querySelector('.pod-mobile-menu-toggle');
    const mobileDrawer = document.getElementById('pod-mobile-drawer');

    if (mobileToggle && mobileDrawer) {
        const setOpen = (open) => {
            body.classList.toggle('pod-mobile-nav-open', open);
            mobileToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
            mobileToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
            if (open) {
                mobileDrawer.removeAttribute('hidden');
            } else {
                mobileDrawer.setAttribute('hidden', '');
            }
        };

        const isOpen = () => body.classList.contains('pod-mobile-nav-open');

        // Ensure a clean initial state even if the browser restores prior DOM state.
        setOpen(isOpen());

        mobileToggle.addEventListener('click', () => {
            setOpen(!isOpen());
        });

        mobileDrawer.addEventListener('click', (event) => {
            const link = event.target && event.target.closest ? event.target.closest('a') : null;
            if (link) {
                setOpen(false);
            }
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && isOpen()) {
                setOpen(false);
            }
        });

        window.addEventListener('resize', () => {
            if (window.innerWidth >= 1024 && isOpen()) {
                setOpen(false);
            }
        });
    }

    const sharePanels = document.querySelectorAll('.share-panel');
    if (sharePanels.length > 0) {
        const canonicalLink = document.querySelector('link[rel="canonical"]');
        const defaultUrl = canonicalLink ? canonicalLink.href : window.location.href;
        const ogTitleEl = document.querySelector('meta[property="og:title"]');
        const metaDescriptionEl = document.querySelector('meta[name="description"]');
        const defaultTitle = ogTitleEl && ogTitleEl.content ? ogTitleEl.content : document.title;
        const defaultDescription = metaDescriptionEl && metaDescriptionEl.content ? metaDescriptionEl.content : defaultTitle;
        const isBlogPage = body.classList.contains('blog-page');
        const hasNavLinks = document.querySelector('.chapter-nav .prev-link, .chapter-nav .next-link') !== null;

        sharePanels.forEach((panel) => {
            if (!isBlogPage && (isTocPage || !hasNavLinks)) {
                panel.setAttribute('hidden', '');
                return;
            }

            const shareTitle = panel.getAttribute('data-share-title') || defaultTitle;
            const shareUrl = panel.getAttribute('data-share-url') || defaultUrl;
            const shareTextRaw = panel.getAttribute('data-share-text');
            const shareText = shareTextRaw && shareTextRaw.trim()
                ? shareTextRaw.trim()
                : (defaultDescription || shareTitle);
            const statusEl = panel.querySelector('.share-status');
            let statusTimeout = null;

            const updateStatus = (message) => {
                if (!statusEl) {
                    return;
                }
                statusEl.textContent = message;
                statusEl.classList.add('is-visible');
                if (statusTimeout) {
                    window.clearTimeout(statusTimeout);
                }
                statusTimeout = window.setTimeout(() => {
                    statusEl.textContent = '';
                    statusEl.classList.remove('is-visible');
                }, 2400);
            };

            const shareKind = isBlogPage ? 'blog' : 'chapter';

            const trackShare = (method, outcome = 'click') => {
                if (typeof window.gtag !== 'function') {
                    return;
                }
                window.gtag('event', 'share', {
                    method,
                    content_type: shareKind,
                    item_id: shareUrl,
                    content_title: shareTitle,
                    outcome,
                });
            };

            const copyToClipboard = async (message = 'Link copied.', method = 'copy') => {
                let copied = false;
                try {
                    if (navigator.clipboard && window.isSecureContext) {
                        await navigator.clipboard.writeText(shareUrl);
                        copied = true;
                    }
                } catch (err) {
                    // Fall through to the legacy fallback.
                }

                if (!copied) {
                    const tempInput = document.createElement('textarea');
                    tempInput.value = shareUrl;
                    tempInput.setAttribute('readonly', '');
                    tempInput.style.position = 'absolute';
                    tempInput.style.left = '-9999px';
                    document.body.appendChild(tempInput);
                    tempInput.select();

                    try {
                        copied = document.execCommand('copy');
                    } catch (err) {
                        copied = false;
                    } finally {
                        document.body.removeChild(tempInput);
                    }
                }

                if (copied) {
                    updateStatus(message);
                } else {
                    updateStatus('Copy failed. Use the address bar.');
                }

                trackShare(method, copied ? 'success' : 'fail');
            };

            const encodedUrl = encodeURIComponent(shareUrl);
            const encodedTitle = encodeURIComponent(shareTitle);
            const socialMessage = `${shareTitle} - ${shareUrl}`;
            const encodedMessage = encodeURIComponent(socialMessage);
            const emailBody = shareText ? `${shareText}\n\n${shareUrl}` : `${shareTitle}\n${shareUrl}`;
            const encodedBody = encodeURIComponent(emailBody);

            const xLink = panel.querySelector('[data-share="x"]');
            if (xLink && xLink.tagName === 'A') {
                xLink.href = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
            }

            const fbLink = panel.querySelector('[data-share="facebook"]');
            if (fbLink && fbLink.tagName === 'A') {
                fbLink.href = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
            }

            const linkedinLink = panel.querySelector('[data-share="linkedin"]');
            if (linkedinLink && linkedinLink.tagName === 'A') {
                linkedinLink.href = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
            }

            const whatsappLink = panel.querySelector('[data-share="whatsapp"]');
            if (whatsappLink && whatsappLink.tagName === 'A') {
                whatsappLink.href = `https://api.whatsapp.com/send?text=${encodedMessage}`;
            }

            const redditLink = panel.querySelector('[data-share="reddit"]');
            if (redditLink && redditLink.tagName === 'A') {
                redditLink.href = `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`;
            }

            const emailLink = panel.querySelector('[data-share="email"]');
            if (emailLink && emailLink.tagName === 'A') {
                emailLink.href = `mailto:?subject=${encodedTitle}&body=${encodedBody}`;
            }

            const copyButton = panel.querySelector('[data-share="copy"]');
            if (copyButton) {
                copyButton.addEventListener('click', (event) => {
                    event.preventDefault();
                    copyToClipboard('Link copied.', 'copy');
                });
            }

            const instagramButton = panel.querySelector('[data-share="instagram"]');
            if (instagramButton) {
                instagramButton.addEventListener('click', (event) => {
                    event.preventDefault();
                    copyToClipboard('Link copied for Instagram.', 'instagram');
                });
            }

            const nativeButton = panel.querySelector('[data-share="native"]');
            if (nativeButton) {
                if (!navigator.share) {
                    nativeButton.setAttribute('hidden', '');
                } else {
                    nativeButton.addEventListener('click', async (event) => {
                        event.preventDefault();
                        try {
                            const payload = { title: shareTitle, url: shareUrl };
                            if (shareText && shareText !== defaultDescription) {
                                payload.text = shareText;
                            }
                            await navigator.share({
                                ...payload,
                            });
                            trackShare('native', 'success');
                        } catch (err) {
                            if (err && err.name !== 'AbortError') {
                                copyToClipboard('Link copied.', 'native-fallback');
                            }
                        }
                    });
                }
            }

            const linkButtons = panel.querySelectorAll('a.share-button');
            linkButtons.forEach((link) => {
                const method = link.getAttribute('data-share');
                if (!method) {
                    return;
                }
                link.addEventListener('click', () => {
                    trackShare(method, 'click');
                });
            });
        });
    }

    // Group chapter content into soft section blocks:
    // - Intro text after each h2 (skipping leading blockquotes)
    // - Each h3 and its following content, until the next h3/hr/h2
    // - Content runs between <hr> markers, treated as “virtual” h3 sections
    const chapterContent = document.querySelector('.chapter-content');
    if (chapterContent && !isTocPage && !isSearchPage) {
        const isInfographicRoot = (element) => {
            if (!element || element.nodeType !== Node.ELEMENT_NODE) {
                return false;
            }
            if (element.hasAttribute('data-infographic-section-id')) {
                return true;
            }
            if (!element.classList) {
                return false;
            }
            return (
                element.classList.contains('infographic-deck') ||
                element.classList.contains('infographic-include') ||
                element.classList.contains('infographic-include-missing')
            );
        };

        const isChapterSection = (element) =>
            !!(element && element.classList && element.classList.contains('chapter-section'));

        const isStructuralBoundary = (element) =>
            !element ||
            element.tagName === 'H1' ||
            element.tagName === 'H2' ||
            element.tagName === 'H3' ||
            element.tagName === 'HR' ||
            isChapterSection(element) ||
            isInfographicRoot(element);

        // Give the opening "From My Heart" chapter a bit of extra
        // visual weight without changing the underlying markup.
        const directChildren = Array.from(chapterContent.children);
        const topLevelMajorHeadings = directChildren.filter((node) =>
            (node.tagName === 'H1' || node.tagName === 'H2') &&
            !(node.classList && node.classList.contains('part-title'))
        );
        const h2Headings = directChildren.filter((node) => node.tagName === 'H2');
        const firstMajorHeading = topLevelMajorHeadings[0] || null;
        if (firstMajorHeading && firstMajorHeading.textContent.trim() === 'From My Heart') {
            body.classList.add('from-my-heart-page');
            firstMajorHeading.classList.add('from-my-heart-heading');
        }

        // First, wrap intro text after each h2 as its own section
        h2Headings.forEach((h2) => {
            let start = h2.nextElementSibling;

            // Skip leading blockquotes directly under the h2
            while (start && start.tagName === 'BLOCKQUOTE') {
                start = start.nextElementSibling;
            }

            if (!start) {
                return;
            }

            // Do not create an intro section if the next element is another structural heading or rule
            if (isStructuralBoundary(start)) {
                return;
            }

            const introSection = document.createElement('section');
            introSection.className = 'chapter-section';
            chapterContent.insertBefore(introSection, start);

            let node = start;
            while (node) {
                const next = node.nextElementSibling;
                introSection.appendChild(node);
                if (isStructuralBoundary(next)) {
                    break;
                }
                node = next;
            }
        });

        // Then, wrap each h3 and its content (until next h3/hr/h2) as its own section
        let current = chapterContent.firstElementChild;
        while (current) {
            if (current.tagName === 'H3' && current.parentElement === chapterContent) {
                const section = document.createElement('section');
                section.className = 'chapter-section chapter-section-h3';
                chapterContent.insertBefore(section, current);

                let node = current;
                let next = null;
                while (node) {
                    next = node.nextElementSibling;
                    section.appendChild(node);
                    if (isStructuralBoundary(next)) {
                        break;
                    }
                    node = next;
                }
                current = next;
            } else {
                current = current.nextElementSibling;
            }
        }

        // Finally, wrap content between <hr> markers that is not already in a section
        let node = chapterContent.firstElementChild;
        while (node) {
            if (node.tagName === 'HR') {
                let start = node.nextElementSibling;

                // Skip over existing sections or structural markers
                while (
                    start &&
                    isChapterSection(start)
                ) {
                    start = start.nextElementSibling;
                }

                if (isStructuralBoundary(start)) {
                    node = start;
                    continue;
                }

                const section = document.createElement('section');
                section.className = 'chapter-section chapter-section-virtual';
                chapterContent.insertBefore(section, start);

                let cursor = start;
                while (cursor) {
                    const next = cursor.nextElementSibling;
                    section.appendChild(cursor);
                    if (isStructuralBoundary(next)) {
                        break;
                    }
                    cursor = next;
                }

                node = section.nextElementSibling;
            } else {
                node = node.nextElementSibling;
            }
        }

        // Post-process: ensure any section that begins immediately after an <hr>
        // and does not start with a heading is treated as a “virtual” section so
        // it gets the same first-line styling, even if it was created in an
        // earlier pass (intro or h3 grouping).
        const allHr = Array.from(chapterContent.children).filter(
            (element) => element.tagName === 'HR',
        );
        allHr.forEach((hr) => {
            const next = hr.nextElementSibling;
            if (!next || !next.classList || !next.classList.contains('chapter-section')) {
                return;
            }

            // Look for a top-level heading as the first meaningful child
            let child = next.firstElementChild;
            let hasHeading = false;
            while (child) {
                if (/^H[1-6]$/.test(child.tagName)) {
                    hasHeading = true;
                    break;
                }
                if (child.tagName !== 'SPAN' && child.tagName !== 'BR') {
                    // Treat the first non-trivial element as content
                    break;
                }
                child = child.nextElementSibling;
            }

            if (!hasHeading) {
                next.classList.add('chapter-section-virtual');
            }
        });

        // Tag “litany” style runs of short, single-sentence paragraphs
        // so CSS can tighten their vertical spacing without affecting
        // regular prose. We treat these as structural cadences rather
        // than just “short text everywhere”.

        const isShortSimpleSentence = (rawText) => {
            const text = rawText.trim();
            if (!text) {
                return false;
            }
            if (text.length > 90) {
                return false;
            }
            // Avoid dense, clause-heavy lines.
            if (/[;,]/.test(text)) {
                return false;
            }
            const sentenceMarks = (text.match(/[.!?]/g) || []).length;
            return sentenceMarks === 1;
        };

        const tagLitanyClosersInContainer = (container) => {
            const paragraphs = Array.from(container.children).filter(
                (el) => el.tagName === 'P'
            );
            if (!paragraphs.length) {
                return;
            }

            const run = [];
            for (let i = paragraphs.length - 1; i >= 0; i -= 1) {
                const p = paragraphs[i];
                const text = p.textContent.trim();
                if (isShortSimpleSentence(text)) {
                    run.push(p);
                } else {
                    break;
                }
            }

            if (run.length >= 3) {
                run.forEach((p) => p.classList.add('litany-line'));
            }
        };

        const tagLitanyRunsAfterIntro = (container) => {
            const paragraphs = Array.from(container.children).filter(
                (el) => el.tagName === 'P'
            );
            if (!paragraphs.length) {
                return;
            }

            const isIntroLine = (rawText) => {
                const text = rawText.trim();
                if (!text) {
                    return false;
                }
                if (/[：:—]\s*$/.test(text)) {
                    return true;
                }
                const lower = text.toLowerCase();
                return (
                    lower.includes('this rhythm pulses through:') ||
                    lower.includes('quick reference:') ||
                    lower.endsWith('try this:') ||
                    lower.endsWith('for example:')
                );
            };

            for (let i = 0; i < paragraphs.length; i += 1) {
                const intro = paragraphs[i];
                if (!isIntroLine(intro.textContent)) {
                    continue;
                }

                const run = [];
                for (let j = i + 1; j < paragraphs.length; j += 1) {
                    const candidate = paragraphs[j];
                    const text = candidate.textContent.trim();
                    if (!isShortSimpleSentence(text)) {
                        break;
                    }
                    run.push(candidate);
                }

                if (run.length >= 2) {
                    run.forEach((p) => p.classList.add('litany-line'));
                }
            }
        };

        // Apply litany heuristics to each section band and to any
        // remaining top-level paragraphs.
        const litanyContainers = [
            chapterContent,
            ...Array.from(chapterContent.querySelectorAll('.chapter-section')),
        ];

        litanyContainers.forEach((container) => {
            tagLitanyClosersInContainer(container);
            tagLitanyRunsAfterIntro(container);
        });

        // After tagging, merge runs of litany paragraphs into a single
        // paragraph with <br> between lines so they read as one cadence
        // rather than many tiny paragraphs.
        const mergeLitanyRuns = (container) => {
            let node = container.firstElementChild;

            while (node) {
                if (
                    node.tagName === 'P' &&
                    node.classList.contains('litany-line')
                ) {
                    const run = [];
                    let cursor = node;

                    while (
                        cursor &&
                        cursor.tagName === 'P' &&
                        cursor.classList.contains('litany-line')
                    ) {
                        run.push(cursor);
                        cursor = cursor.nextElementSibling;
                    }

                    if (run.length >= 2) {
                        const merged = document.createElement('p');
                        merged.className = run[0].className;

                        run.forEach((p, index) => {
                            while (p.firstChild) {
                                merged.appendChild(p.firstChild);
                            }
                            if (index < run.length - 1) {
                                merged.appendChild(
                                    document.createElement('br'),
                                );
                            }
                        });

                        container.insertBefore(merged, run[0]);
                        run.forEach((p) => container.removeChild(p));
                        node = merged.nextElementSibling;
                    } else {
                        node = node.nextElementSibling;
                    }
                } else {
                    node = node.nextElementSibling;
                }
            }
        };

        litanyContainers.forEach((container) => {
            mergeLitanyRuns(container);
        });

    }

    // Automatically create and add floating side navigation.
    const prevLinkSource = document.querySelector('.chapter-nav .prev-link');
    const nextLinkSource = document.querySelector('.chapter-nav .next-link');

    const getNavTitle = (sourceLink, fallback) => {
        if (!sourceLink) {
            return fallback;
        }
        const cleaned = String(sourceLink.textContent || '')
            .replace(/[←→‹›]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
        return cleaned || fallback;
    };

    const makeSideNavLink = (sourceLink, direction) => {
        if (!sourceLink) {
            return null;
        }

        const isPrev = direction === 'prev';
        const directionLabel = isPrev ? 'Previous' : 'Next';
        const chapterTitle = getNavTitle(
            sourceLink,
            isPrev ? 'Previous Chapter' : 'Next Chapter',
        );

        const link = document.createElement('a');
        link.href = sourceLink.href;
        link.className = `side-nav-link ${direction}`;
        link.setAttribute('aria-label', `${directionLabel} Chapter: ${chapterTitle}`);
        link.title = `${directionLabel}: ${chapterTitle}`;

        const handle = document.createElement('span');
        handle.className = 'side-nav-handle';
        handle.setAttribute('aria-hidden', 'true');
        handle.textContent = isPrev ? '‹' : '›';

        const chip = document.createElement('span');
        chip.className = 'side-nav-chip';
        chip.setAttribute('aria-hidden', 'true');

        const chipLabel = document.createElement('span');
        chipLabel.className = 'side-nav-chip-label';
        chipLabel.textContent = directionLabel;

        const chipTitle = document.createElement('span');
        chipTitle.className = 'side-nav-chip-title';
        chipTitle.textContent = chapterTitle;

        chip.appendChild(chipLabel);
        chip.appendChild(chipTitle);
        link.appendChild(handle);
        link.appendChild(chip);
        return link;
    };

    const sideNavPrev = makeSideNavLink(prevLinkSource, 'prev');
    if (sideNavPrev) {
        document.body.appendChild(sideNavPrev);
    }

    const sideNavNext = makeSideNavLink(nextLinkSource, 'next');
    if (sideNavNext) {
        document.body.appendChild(sideNavNext);
    }

    const positionSideNavLinks = () => {
        const mainEl = document.querySelector('main');
        if (!mainEl) {
            return;
        }

        const viewportWidth = window.innerWidth ||
            document.documentElement.clientWidth || 0;
        const hideElement = (element) => {
            if (!element) {
                return;
            }
            element.style.display = 'none';
        };

        if (viewportWidth <= 1100) {
            hideElement(sideNavPrev);
            hideElement(sideNavNext);
            return;
        }

        const contentEl = document.querySelector('.chapter-content, .blog-post-content') || mainEl;
        const contentRect = contentEl.getBoundingClientRect();
        const edgeGap = 12;

        const getReadingRect = () => {
            const selectors = [
                '.chapter-section',
                'p',
                'blockquote',
                'ul',
                'ol',
                'h1',
                'h2',
                'h3',
            ];

            for (const selector of selectors) {
                const candidates = contentEl.querySelectorAll(selector);
                for (const candidate of candidates) {
                    const rect = candidate.getBoundingClientRect();
                    if (
                        rect.width > 120 &&
                        rect.height > 0 &&
                        rect.width <= contentRect.width - 24
                    ) {
                        return rect;
                    }
                }
            }
            return contentRect;
        };

        const measureElement = (element) => {
            const wasCompact = element.classList.contains('side-nav-compact');
            element.classList.remove('side-nav-compact');
            element.style.display = 'flex';
            const width = element.getBoundingClientRect().width;
            element.classList.toggle('side-nav-compact', wasCompact);
            return width;
        };

        const measureChip = (element) => {
            const chip = element.querySelector('.side-nav-chip');
            if (!chip) {
                return 0;
            }

            const wasCompact = element.classList.contains('side-nav-compact');
            element.classList.remove('side-nav-compact');
            element.style.display = 'flex';
            const width = chip.getBoundingClientRect().width;
            element.classList.toggle('side-nav-compact', wasCompact);
            return width;
        };

        const placeElement = (element, left, compact = false) => {
            element.classList.toggle('side-nav-compact', compact);
            element.style.display = 'flex';
            element.style.left = `${left}px`;
            element.style.right = 'auto';
        };

        const clamp = (value, min, max) => {
            if (max < min) {
                return min;
            }
            return Math.min(Math.max(value, min), max);
        };

        const readingRect = getReadingRect();
        const leftMargin = Math.max(0, readingRect.left - contentRect.left);
        const rightMargin = Math.max(0, contentRect.right - readingRect.right);

        const placePrev = () => {
            if (!sideNavPrev) {
                return;
            }
            const prevWidth = measureElement(sideNavPrev);
            const prevChipWidth = measureChip(sideNavPrev);
            const requiredFull = prevWidth + prevChipWidth + edgeGap;
            const requiredCompact = prevWidth + (edgeGap * 2);

            if (leftMargin >= requiredFull) {
                const desiredLeft = readingRect.left - prevWidth - edgeGap;
                const left = clamp(
                    desiredLeft,
                    contentRect.left + edgeGap,
                    readingRect.left - prevWidth - edgeGap,
                );
                placeElement(sideNavPrev, left);
            } else if (leftMargin >= requiredCompact) {
                const desiredLeft = contentRect.left + ((leftMargin - prevWidth) / 2);
                const left = clamp(
                    desiredLeft,
                    contentRect.left + edgeGap,
                    readingRect.left - prevWidth - edgeGap,
                );
                placeElement(sideNavPrev, left, true);
            } else {
                hideElement(sideNavPrev);
            }
        };

        const placeNext = () => {
            if (!sideNavNext) {
                return;
            }
            const nextWidth = measureElement(sideNavNext);
            const nextChipWidth = measureChip(sideNavNext);
            const requiredFull = nextWidth + nextChipWidth + edgeGap;
            const requiredCompact = nextWidth + (edgeGap * 2);

            if (rightMargin >= requiredFull) {
                const desiredLeft = readingRect.right + edgeGap;
                const left = clamp(
                    desiredLeft,
                    readingRect.right + edgeGap,
                    contentRect.right - nextWidth - edgeGap,
                );
                placeElement(sideNavNext, left);
            } else if (rightMargin >= requiredCompact) {
                const desiredLeft = readingRect.right + ((rightMargin - nextWidth) / 2);
                const left = clamp(
                    desiredLeft,
                    readingRect.right + edgeGap,
                    contentRect.right - nextWidth - edgeGap,
                );
                placeElement(sideNavNext, left, true);
            } else {
                hideElement(sideNavNext);
            }
        };

        placePrev();
        placeNext();
    };

    if (sideNavPrev || sideNavNext) {
        window.requestAnimationFrame(positionSideNavLinks);
        window.addEventListener('resize', positionSideNavLinks);
    }
})();

window.addEventListener('load', () => {
    // Subtle “virtual particle” background for desktop void margins
    const prefersFinePointer = window.matchMedia &&
        window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const prefersReducedMotion = window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersFinePointer && !prefersReducedMotion && window.innerWidth >= 1024) {
        const particleLayer = document.createElement('div');
        particleLayer.className = 'particle-layer';
        document.body.appendChild(particleLayer);

	        const spawnParticle = () => {
	            const mainEl = document.querySelector('main');
	            if (!mainEl) {
	                return;
	            }
	            const rect = mainEl.getBoundingClientRect();
	            const vw = window.innerWidth;
	            const vh = window.innerHeight;
	            const headerEl = document.querySelector('.main-header');
	            const headerRect = headerEl ? headerEl.getBoundingClientRect() : null;
	            const headerIsSidebar = headerRect && headerRect.height > (vh * 0.6) && headerRect.width > 120;
	            const sidebarRight = headerIsSidebar ? headerRect.right : 0;

	            const leftVoidWidth = Math.max(0, rect.left - sidebarRight);
	            const rightVoidWidth = Math.max(0, vw - rect.right);
	            const minVoid = 24;
	            const canLeft = leftVoidWidth >= minVoid;
	            const canRight = rightVoidWidth >= minVoid;

	            // If there is essentially no side margin, skip.
	            if (!canLeft && !canRight) {
	                return;
	            }

	            const sideMarginTotal = (canLeft ? leftVoidWidth : 0) + (canRight ? rightVoidWidth : 0);

            const particle = document.createElement('div');
            particle.className = 'particle';

            // Small variation in size and color so the field feels
            // more organic. Most particles keep the warm tone; a
            // minority get a cooler blue tint.
            const baseSize = 4;
            const jitter = (Math.random() * 2) - 1; // -1..1
            const size = Math.max(2, baseSize + jitter);
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;

            if (Math.random() < 0.25) {
                particle.classList.add('particle--blue');
            }

	            const leftProbability = canLeft ? leftVoidWidth / sideMarginTotal : 0;
	            const onLeft = canLeft && (!canRight || Math.random() < leftProbability);
	            const y = Math.random() * vh;
	            let x;
	            if (onLeft) {
	                x = sidebarRight + (Math.random() * Math.max(1, leftVoidWidth - 1));
	            } else {
	                x = rect.right + (Math.random() * Math.max(1, rightVoidWidth - 1));
	            }

            particle.style.left = `${x}px`;
            particle.style.top = `${y}px`;

            particleLayer.appendChild(particle);

            const lifetime = 1200;
            setTimeout(() => {
                particle.remove();
            }, lifetime + 500);
        };

        const intervalId = setInterval(spawnParticle, 325);

        // On resize, if the viewport shrinks out of desktop range, clear particles.
        window.addEventListener('resize', () => {
            if (window.innerWidth < 1024) {
                clearInterval(intervalId);
                particleLayer.innerHTML = '';
            }
        });
    }

    // “Golden thread of awareness”: a subtle vertical line in the
    // side void that runs from the header toward the reader’s current
    // pointer depth within the chapter. This is purely decorative and
    // only activates for pointer devices.
    if (prefersFinePointer && !prefersReducedMotion) {
        const mainEl = document.querySelector('main');
        const headerEl = document.querySelector('.main-header');
        const contentEl = document.querySelector('.chapter-content') || mainEl;

        if (mainEl && headerEl && contentEl) {
            const thread = document.createElement('div');
            thread.className = 'awareness-thread';
            document.body.appendChild(thread);

            let lastPointerY = null;
            let fadeTimeout = null;
            let animationFrameId = null;

            const currentState = {
                left: 0,
                top: 0,
                height: 0,
                opacity: 0,
            };
            const targetState = {
                left: 0,
                top: 0,
                height: 0,
                opacity: 0,
            };

            const lerp = (start, end, factor) => start + ((end - start) * factor);

            const writeThreadState = () => {
                thread.style.left = `${currentState.left}px`;
                thread.style.top = `${currentState.top}px`;
                thread.style.height = `${Math.max(0, currentState.height)}px`;
                thread.style.opacity = `${currentState.opacity}`;
            };

            const animateThread = () => {
                animationFrameId = null;

                currentState.left = lerp(currentState.left, targetState.left, 0.18);
                currentState.top = lerp(currentState.top, targetState.top, 0.18);
                currentState.height = lerp(currentState.height, targetState.height, 0.2);
                currentState.opacity = lerp(currentState.opacity, targetState.opacity, 0.22);
                writeThreadState();

                const deltas = [
                    Math.abs(currentState.left - targetState.left),
                    Math.abs(currentState.top - targetState.top),
                    Math.abs(currentState.height - targetState.height),
                    Math.abs(currentState.opacity - targetState.opacity),
                ];
                const needsAnotherFrame = deltas.some((delta) => delta > 0.5);
                if (needsAnotherFrame) {
                    animationFrameId = window.requestAnimationFrame(animateThread);
                }
            };

            const scheduleAnimation = () => {
                if (animationFrameId !== null) {
                    return;
                }
                animationFrameId = window.requestAnimationFrame(animateThread);
            };

            const syncThreadTarget = (rawViewportY) => {
                const mainRect = mainEl.getBoundingClientRect();
                const headerRect = headerEl.getBoundingClientRect();
                const vh = window.innerHeight || document.documentElement.clientHeight || 0;

                const headerIsSidebar = headerRect.height > (vh * 0.6);
                let startY = headerIsSidebar ? mainRect.top : headerRect.bottom;
                startY = Math.max(0, startY);

                const minY = Math.max(startY + 8, mainRect.top + 16);
                const maxY = mainRect.bottom - 24;

                // Position the thread just outside the chapter card on the left,
                // so it lives in the dark “void” margin.
                const left = mainRect.left - 6;

                if (left < 0 || maxY <= minY) {
                    targetState.opacity = 0;
                    scheduleAnimation();
                    return;
                }

                const clampedY = Math.min(Math.max(rawViewportY, minY), maxY);
                targetState.left = left;
                targetState.top = startY;
                targetState.height = clampedY - startY;
                targetState.opacity = 1;
                scheduleAnimation();

                if (fadeTimeout) {
                    clearTimeout(fadeTimeout);
                }
                fadeTimeout = setTimeout(() => {
                    targetState.opacity = 0;
                    scheduleAnimation();
                }, 1800);
            };

            const handlePointerMove = (event) => {
                lastPointerY = event.clientY;
                syncThreadTarget(lastPointerY);
            };

            contentEl.addEventListener('pointermove', handlePointerMove);

            const handleScroll = () => {
                const mainRect = mainEl.getBoundingClientRect();
                if (mainRect.bottom <= 0 || mainRect.top >= window.innerHeight) {
                    targetState.opacity = 0;
                    scheduleAnimation();
                    return;
                }

                const fallbackY = window.innerHeight * 0.38;
                syncThreadTarget(lastPointerY == null ? fallbackY : lastPointerY);
            };

            window.addEventListener('scroll', handleScroll, { passive: true });
            window.addEventListener('resize', handleScroll);
            handleScroll();
        }
    }
}, { once: true });

(() => {
    // Contact form handling (Formspree)
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        const statusEl = document.querySelector('.contact-status');
        const submitButton = contactForm.querySelector('button[type="submit"]');

        const setStatus = (message, isError = false, email = '') => {
            if (!statusEl) return;
            let finalMessage = message;
            if (email) {
                finalMessage = `${message} (${email})`;
            }
            statusEl.textContent = finalMessage;
            statusEl.classList.remove('success', 'error');
            statusEl.classList.add(isError ? 'error' : 'success');
        };

        contactForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            if (typeof contactForm.reportValidity === 'function' && !contactForm.reportValidity()) {
                return;
            }

            const formData = new FormData(contactForm);
            const emailInput = contactForm.querySelector('input[name="email"]');
            const emailValue = emailInput && emailInput.value ? emailInput.value.trim() : '';

            if (submitButton) {
                submitButton.disabled = true;
                submitButton.textContent = 'Sending...';
            }

            try {
                const response = await fetch(contactForm.action, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        Accept: 'application/json',
                    },
                });

                if (response.ok) {
                    contactForm.reset();
                    setStatus('Thank you. Your message has been sent from', false, emailValue);
                } else {
                    let errorMessage = 'An error occurred while sending your message. Please try again later.';
                    try {
                        const data = await response.json();
                        if (data && Array.isArray(data.errors) && data.errors.length > 0) {
                            errorMessage = data.errors.map((e) => e.message).join(', ');
                        }
                    } catch {
                        // Ignore JSON parse errors and use the default message.
                    }
                    setStatus(errorMessage, true);
                }
            } catch (err) {
                setStatus('Network error while sending your message. Please check your connection and try again.', true);
            } finally {
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = 'Send';
                }
            }
        });
    }
})();
