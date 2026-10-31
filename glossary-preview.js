(() => {
    const payload = document.getElementById('glossary-entries');
    if (!payload) return;
    let entries;
    try {
        entries = JSON.parse(payload.textContent);
    } catch (error) {
        console.error('Invalid appendix lookup data', error);
        return;
    }
    const keys = Object.keys(entries).filter((key) => {
        const item = entries[key];
        return item && typeof item.term === 'string' && typeof item.definition === 'string'
            && typeof item.href === 'string' && typeof item.source === 'string';
    });
    if (!keys.length) return;
    const validKeys = new Set(keys);
    const targetKeys = (target) => (target.dataset.glossaryKey || '').split(/\s+/)
        .filter((key) => validKeys.has(key));
    const targetFor = (node) => node instanceof Element ? node.closest('[data-glossary-key]') : null;

    const preview = document.createElement('div');
    preview.className = 'glossary-preview';
    preview.id = 'glossary-preview';
    preview.hidden = true;
    preview.setAttribute('role', 'dialog');
    preview.setAttribute('aria-labelledby', 'glossary-preview-term');
    preview.setAttribute('aria-describedby', 'glossary-preview-definition');
    preview.innerHTML = `
        <button type="button" class="glossary-preview-close" aria-label="Close definition">×</button>
        <span class="glossary-preview-label"></span>
        <span class="glossary-preview-term" id="glossary-preview-term"></span>
        <label class="glossary-preview-choices" hidden>Choose an entry <select></select></label>
        <span class="glossary-preview-definition" id="glossary-preview-definition"></span>
        <a class="glossary-preview-entry">Read full entry <span aria-hidden="true">→</span></a>`;
    const closeButton = preview.querySelector('button');
    const label = preview.querySelector('.glossary-preview-label');
    const term = preview.querySelector('.glossary-preview-term');
    const definition = preview.querySelector('.glossary-preview-definition');
    const entry = preview.querySelector('a');
    const choices = preview.querySelector('.glossary-preview-choices');
    const choiceSelect = choices.querySelector('select');
    document.body.append(preview);

    const control = document.createElement('details');
    control.className = 'glossary-page-terms';
    control.innerHTML = `<summary>Terms on this page</summary>
        <label>Choose a term <select></select></label>
        <button type="button">Show definition</button>`;
    const pageSelect = control.querySelector('select');
    keys.sort((a, b) => entries[a].term.localeCompare(entries[b].term)).forEach((key) => {
        pageSelect.add(new Option(`${entries[key].term} — ${entries[key].source}`, key));
    });
    const pageButton = control.querySelector('button');
    pageSelect.setAttribute('aria-label', 'Terms on this page');
    pageButton.setAttribute('aria-haspopup', 'dialog');
    pageButton.setAttribute('aria-controls', preview.id);
    const content = document.querySelector('.chapter-content, .blog-post-content') || document.querySelector('main');
    if (content) content.before(control);
    else payload.before(control);

    document.querySelectorAll('a[data-glossary-key]').forEach((anchor) => {
        anchor.setAttribute('aria-haspopup', 'dialog');
        anchor.setAttribute('aria-controls', preview.id);
        anchor.removeAttribute('title');
    });

    let active = null;
    let openTimer;
    let closeTimer;
    let pointerType = 'keyboard';
    let pointerStart = null;
    let restoringFocus = false;
    let restoredNeutral = null;
    const position = () => {
        if (!active) return;
        const anchor = active.getBoundingClientRect();
        const box = preview.getBoundingClientRect();
        const left = Math.max(12, Math.min(anchor.left, innerWidth - box.width - 12));
        const top = anchor.bottom + box.height <= innerHeight - 12
            ? anchor.bottom : Math.max(12, anchor.top - box.height);
        preview.style.left = `${left}px`;
        preview.style.top = `${Math.max(12, Math.min(top, innerHeight - box.height - 12))}px`;
    };
    const hide = (restoreFocus = false) => {
        clearTimeout(openTimer);
        clearTimeout(closeTimer);
        const previous = active;
        active = null;
        preview.hidden = true;
        if (!previous) return;
        previous.removeAttribute('aria-expanded');
        previous.removeAttribute('aria-describedby');
        if (restoreFocus) {
            restoringFocus = true;
            if (!previous.matches('a, button, select')) {
                previous.setAttribute('tabindex', '-1');
                restoredNeutral = previous;
            }
            previous.focus({ preventScroll: true });
            restoringFocus = false;
        }
    };
    const renderEntry = (key) => {
        const item = entries[key];
        label.textContent = `From ${item.source}`;
        term.textContent = item.term;
        definition.textContent = item.definition;
        entry.href = item.href;
        position();
    };
    const show = (target, selectedKeys = targetKeys(target)) => {
        if (!selectedKeys.length) return;
        clearTimeout(openTimer);
        clearTimeout(closeTimer);
        if (active === target && !preview.hidden) return;
        hide();
        active = target;
        choiceSelect.replaceChildren();
        selectedKeys.forEach((key) => choiceSelect.add(new Option(
            `${entries[key].term} — ${entries[key].source}`, key)));
        choices.hidden = selectedKeys.length < 2;
        preview.hidden = false;
        target.setAttribute('aria-expanded', 'true');
        target.setAttribute('aria-describedby', 'glossary-preview-definition');
        renderEntry(selectedKeys[0]);
    };
    const scheduleClose = () => {
        clearTimeout(openTimer);
        clearTimeout(closeTimer);
        closeTimer = setTimeout(() => {
            if (!active || active.matches(':hover') || preview.matches(':hover')) return;
            if (active.contains(document.activeElement) || preview.contains(document.activeElement)) return;
            hide();
        }, 180);
    };
    document.addEventListener('pointerover', (event) => {
        if (preview.contains(event.target)) {
            clearTimeout(closeTimer);
            return;
        }
        const target = targetFor(event.target);
        if (event.pointerType !== 'mouse' || !target || target.contains(event.relatedTarget)) return;
        clearTimeout(closeTimer);
        clearTimeout(openTimer);
        openTimer = setTimeout(() => show(target), 650);
    });
    document.addEventListener('pointerout', (event) => {
        const target = targetFor(event.target);
        if ((target && !target.contains(event.relatedTarget))
            || (preview.contains(event.target) && !preview.contains(event.relatedTarget))) scheduleClose();
    });
    document.addEventListener('focusin', (event) => {
        if (preview.contains(event.target)) clearTimeout(closeTimer);
        const target = targetFor(event.target);
        if (target && !restoringFocus && pointerType === 'keyboard') show(target);
    });
    document.addEventListener('focusout', (event) => {
        if (event.target === restoredNeutral) {
            restoredNeutral.removeAttribute('tabindex');
            restoredNeutral = null;
        }
        scheduleClose();
    });
    document.addEventListener('pointerdown', (event) => {
        pointerType = event.pointerType;
        pointerStart = { x: event.clientX, y: event.clientY };
        if (active && !active.contains(event.target) && !preview.contains(event.target)) hide();
    });
    document.addEventListener('click', (event) => {
        if (event.target.closest('.glossary-preview-close')) return hide(true);
        if (event.target === pageButton) {
            hide();
            show(pageButton, [pageSelect.value]);
            closeButton.focus({ preventScroll: true });
            return;
        }
        const target = targetFor(event.target);
        if (!target || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        if (pointerType !== 'touch' && pointerType !== 'pen') return;
        if (target.closest('a')?.dataset.glossaryAuthored === 'true') return;
        if (window.getSelection()?.toString()) return;
        if (pointerStart && Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) > 10) return;
        // Leave native selection and scrolling alone; intercept only a completed tap.
        if (target.matches('a')) event.preventDefault();
        show(target);
        closeButton.focus({ preventScroll: true });
    });
    document.addEventListener('change', (event) => {
        if (event.target === choiceSelect) renderEntry(choiceSelect.value);
    });
    document.addEventListener('keydown', (event) => {
        pointerType = 'keyboard';
        if (event.key === 'Escape' && active) {
            event.preventDefault();
            hide(preview.contains(document.activeElement));
        } else if (event.key === 'Tab' && !event.shiftKey && active === document.activeElement) {
            event.preventDefault();
            closeButton.focus({ preventScroll: true });
        } else if (event.key === 'Tab' && event.shiftKey && document.activeElement === closeButton && active) {
            event.preventDefault();
            hide(true);
        }
    });
    window.addEventListener('resize', position);
    window.addEventListener('scroll', position, { passive: true });
})();
