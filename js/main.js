/* Site interactions. No build step or jQuery dependency. */
(() => {
    'use strict';

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const menu = document.querySelector('.overlay-menu');
    const menuButton = document.querySelector('.header .menu-btn');
    const panels = [...document.querySelectorAll('.overlay-menu, .signup-overlay, .fullvideo-overlay, .modal-article')];
    let activePanel = null;
    let returnFocus = null;
    let inertSiblings = [];

    const focusable = panel => [...panel.querySelectorAll('button, a[href], video[controls], [tabindex="0"]')]
        .filter(element => !element.disabled && !element.closest('[inert]') && element.getClientRects().length);

    panels.forEach((panel, index) => {
        panel.inert = true;
        panel.setAttribute('aria-hidden', 'true');
        panel.tabIndex = -1;
        if (panel !== menu) {
            panel.setAttribute('role', 'dialog');
            panel.setAttribute('aria-modal', 'true');
            const heading = panel.querySelector('.article-title');
            if (heading) {
                heading.id = `article-title-${index}`;
                panel.setAttribute('aria-labelledby', heading.id);
            } else {
                panel.setAttribute('aria-label', panel.matches('.signup-overlay') ? 'Контакти авторки' : 'Відео');
            }
        }
    });

    function closePanel(restoreFocus = true) {
        if (!activePanel) return;
        activePanel.querySelectorAll('video').forEach(video => video.pause());
        activePanel.classList.remove('active', 'full');
        activePanel.inert = true;
        activePanel.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('open', 'full');
        menuButton.setAttribute('aria-expanded', 'false');
        inertSiblings.forEach(element => { element.inert = false; });
        inertSiblings = [];
        activePanel = null;
        if (restoreFocus && returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
    }

    function openPanel(panel, trigger) {
        const originalTrigger = activePanel ? returnFocus : trigger;
        closePanel(false);
        activePanel = panel;
        returnFocus = originalTrigger;
        panel.inert = false;
        panel.setAttribute('aria-hidden', 'false');
        document.body.classList.add('full');
        if (panel === menu) {
            document.body.classList.add('open');
            menuButton.setAttribute('aria-expanded', 'true');
        } else {
            panel.classList.add(panel.matches('.modal-article') ? 'active' : 'full');
        }
        // Disable everything outside the panel, including nested page siblings.
        let branch = panel;
        while (branch.parentElement && branch !== document.body) {
            [...branch.parentElement.children].forEach(sibling => {
                if (sibling !== branch && !sibling.inert && !['SCRIPT', 'LINK', 'STYLE'].includes(sibling.tagName)) {
                    sibling.inert = true;
                    inertSiblings.push(sibling);
                }
            });
            branch = branch.parentElement;
        }
        panel.focus({ preventScroll: true });
    }

    menuButton.addEventListener('click', () => openPanel(menu, menuButton));
    document.querySelectorAll('.close-btn, .signup-close-btn, .fullvideo-close-btn, .modal-article-close-btn')
        .forEach(button => button.addEventListener('click', () => closePanel()));
    document.querySelectorAll('.menu-link').forEach(link => {
        link.addEventListener('click', event => {
            event.preventDefault();
            const name = link.closest('.menu-item').dataset.class;
            openPanel(document.querySelector(name === 'sign-up' ? '.signup-overlay' : `.modal-article_${name}`), link);
        });
    });
    document.querySelectorAll('.signup-link').forEach(button => {
        button.addEventListener('click', () => openPanel(document.querySelector('.signup-overlay'), button));
    });
    document.querySelectorAll('.articles-preview-item .more').forEach(link => {
        link.addEventListener('click', event => {
            event.preventDefault();
            openPanel(document.querySelector(`.modal-article_${link.closest('.articles-preview-item').dataset.class}`), link);
        });
    });
    document.querySelector('.play-btn').addEventListener('click', event => {
        openPanel(document.querySelector('.fullvideo-overlay'), event.currentTarget);
    });
    document.addEventListener('keydown', event => {
        if (!activePanel) return;
        if (event.key === 'Escape') {
            event.preventDefault();
            closePanel();
        } else if (event.key === 'Tab') {
            const controls = focusable(activePanel);
            const first = controls[0];
            const last = controls.at(-1);
            if (!first) { event.preventDefault(); return; }
            if (event.shiftKey && (document.activeElement === first || document.activeElement === activePanel)) {
                event.preventDefault(); last.focus();
            } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === activePanel)) {
                event.preventDefault(); first.focus();
            }
        }
    });

    document.querySelectorAll('.slider').forEach(slider => {
        const slides = [...slider.querySelectorAll('.slider__item')];
        let index = 0;
        function showSlide() {
            slides.forEach((slide, current) => {
                const selected = current === index;
                slide.classList.toggle('active', selected);
                slide.inert = !selected;
                slide.setAttribute('aria-hidden', String(!selected));
                if (!selected) slide.querySelectorAll('video').forEach(video => video.pause());
            });
        }
        slider.querySelectorAll('.slider__controls-btn').forEach(button => {
            button.addEventListener('click', () => {
                index = (index + (button.classList.contains('next') ? 1 : -1) + slides.length) % slides.length;
                showSlide();
            });
        });
        showSlide();
    });

    function updateMotion() {
        const enabled = !motion.matches && Boolean(window.AOS);
        document.documentElement.classList.toggle('animations-enabled', enabled);
        const backgroundVideo = document.querySelector('.video-bg video');
        if (motion.matches) backgroundVideo.pause();
        else backgroundVideo.play().catch(() => { /* The poster remains visible if autoplay is blocked. */ });
        if (enabled) window.AOS.refresh();
    }
    if (window.AOS) window.AOS.init();
    updateMotion();
    motion.addEventListener('change', updateMotion);
})();
