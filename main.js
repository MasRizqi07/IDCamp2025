/**
 * ============================================================
 *  BANDUNG — Paris Van Java | main.js
 *  Modular JavaScript: clean, modern, no library dependency
 * ============================================================
 */

'use strict';

/* ============================================================
   MODULE: Scroll Reveal
   Observe elements with .reveal class, toggle .revealed
   ============================================================ */
const ScrollReveal = (() => {
    const SELECTOR = '.reveal';
    const ACTIVE_CLASS = 'revealed';

    const options = {
        threshold: 0.12,
        rootMargin: '0px 0px -60px 0px',
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add(ACTIVE_CLASS);
                observer.unobserve(entry.target); // fire once, unsubscribe
            }
        });
    }, options);

    const init = () => {
        const targets = document.querySelectorAll(SELECTOR);
        targets.forEach((el) => observer.observe(el));
        console.log(`[ScrollReveal] Watching ${targets.length} elements.`);
    };

    return { init };
})();


/* ============================================================
   MODULE: Active Nav Highlight
   Tracks scroll position → updates navbar + TOC active state
   ============================================================ */
const ActiveNav = (() => {
    const sections = [];
    let navLinks = [];
    let tocLinks = [];
    let ticking = false;

    const getActiveSectionId = () => {
        const scrollY = window.scrollY + 140; // offset for sticky elements
        let activeId = '';

        sections.forEach(({ id, offsetTop, offsetBottom }) => {
            if (scrollY >= offsetTop && scrollY < offsetBottom) {
                activeId = id;
            }
        });

        return activeId;
    };

    const updateLinks = (links, activeId) => {
        links.forEach((a) => {
            const href = a.getAttribute('href');
            const isActive = href === `#${activeId}`;
            a.classList.toggle('active', isActive);
        });
    };

    const onScroll = () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                const activeId = getActiveSectionId();
                updateLinks(navLinks, activeId);
                updateLinks(tocLinks, activeId);
                ticking = false;
            });
            ticking = true;
        }
    };

    const cacheSections = () => {
        const articleEls = document.querySelectorAll('article[id]');
        articleEls.forEach((el, i) => {
            const next = articleEls[i + 1];
            sections.push({
                id: el.id,
                offsetTop: el.offsetTop,
                offsetBottom: next ? next.offsetTop : document.body.scrollHeight,
            });
        });
    };

    const init = () => {
        cacheSections();
        navLinks = Array.from(document.querySelectorAll('.navbar__links a'));
        tocLinks = Array.from(document.querySelectorAll('.sidebar__toc a'));

        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll(); // run once on load
        console.log(`[ActiveNav] Tracking ${sections.length} sections.`);
    };

    return { init };
})();


/* ============================================================
   MODULE: Navbar Scroll Behavior
   Adds .navbar--scrolled class when user scrolls past hero
   ============================================================ */
const NavbarScroll = (() => {
    let navbar = null;
    let heroHeight = 0;
    let ticking = false;

    const onScroll = () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                const scrolled = window.scrollY > heroHeight * 0.6;
                navbar.classList.toggle('navbar--scrolled', scrolled);
                ticking = false;
            });
            ticking = true;
        }
    };

    const init = () => {
        navbar = document.querySelector('.navbar');
        const hero = document.querySelector('.hero');
        if (!navbar || !hero) return;

        heroHeight = hero.offsetHeight;
        window.addEventListener('scroll', onScroll, { passive: true });
        console.log('[NavbarScroll] Initialized.');
    };

    return { init };
})();


/* ============================================================
   MODULE: Counter Animation
   Animates numbers in .stat-card__num on first view
   ============================================================ */
const CounterAnimation = (() => {
    const SELECTOR = '.stat-card';
    const DURATION = 1800; // ms

    const easeOut = (t) => 1 - Math.pow(1 - t, 3);

    const parseTarget = (el) => {
        // grab the text node number, ignore <small> tag
        const clone = el.cloneNode(true);
        clone.querySelectorAll('small').forEach((s) => s.remove());
        return parseFloat(clone.textContent.replace(/\./g, '').replace(',', '.').trim());
    };

    const animateCard = (card) => {
        const numEl = card.querySelector('.stat-card__num');
        const smallEl = card.querySelector('.stat-card__num small');
        if (!numEl) return;

        const target = parseTarget(numEl);
        const suffix = smallEl ? smallEl.outerHTML : '';
        const useDecimal = String(target).includes('.');
        let start = null;

        const step = (timestamp) => {
            if (!start) start = timestamp;
            const elapsed = timestamp - start;
            const progress = Math.min(elapsed / DURATION, 1);
            const eased = easeOut(progress);
            const current = target * eased;
            const display = useDecimal ? current.toFixed(0) : Math.floor(current);

            // format with dots for thousands (Indonesian style)
            const formatted = display.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
            numEl.innerHTML = formatted + suffix;

            if (progress < 1) requestAnimationFrame(step);
        };

        requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    animateCard(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.5 }
    );

    const init = () => {
        const cards = document.querySelectorAll(SELECTOR);
        cards.forEach((card) => observer.observe(card));
        console.log(`[CounterAnimation] Animating ${cards.length} stat cards.`);
    };

    return { init };
})();


/* ============================================================
   MODULE: Smooth Scroll (enhanced)
   Override default anchor behavior → smooth scroll with offset
   ============================================================ */
const SmoothScroll = (() => {
    const OFFSET = 80; // px offset from top (navbar height)

    const scrollTo = (targetId) => {
        const target = document.getElementById(targetId);
        if (!target) return;

        const top = target.getBoundingClientRect().top + window.scrollY - OFFSET;
        window.scrollTo({ top, behavior: 'smooth' });
    };

    const init = () => {
        document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
            anchor.addEventListener('click', (e) => {
                const href = anchor.getAttribute('href');
                if (href === '#') return;

                e.preventDefault();
                const id = href.slice(1);
                scrollTo(id);

                // update URL hash without jumping
                history.pushState(null, '', href);
            });
        });
        console.log('[SmoothScroll] Initialized.');
    };

    return { init };
})();


/* ============================================================
   MODULE: Mobile Nav Toggle
   Hamburger menu for mobile (toggling .navbar__links--open)
   ============================================================ */
const MobileNav = (() => {
    let burger = null;
    let navLinks = null;
    let isOpen = false;

    const toggle = () => {
        isOpen = !isOpen;
        navLinks.classList.toggle('navbar__links--open', isOpen);
        burger.setAttribute('aria-expanded', isOpen);
        burger.innerHTML = isOpen ? '✕' : '☰';
    };

    const close = () => {
        if (!isOpen) return;
        isOpen = false;
        navLinks.classList.remove('navbar__links--open');
        burger.setAttribute('aria-expanded', false);
        burger.innerHTML = '☰';
    };

    const init = () => {
        const navbar = document.querySelector('.navbar');
        navLinks = document.querySelector('.navbar__links');
        if (!navbar || !navLinks) return;

        // Inject burger button
        burger = document.createElement('button');
        burger.className = 'navbar__burger';
        burger.setAttribute('aria-label', 'Toggle navigation');
        burger.setAttribute('aria-expanded', false);
        burger.innerHTML = '☰';
        navbar.appendChild(burger);

        burger.addEventListener('click', toggle);

        // Close on nav link click (mobile UX)
        navLinks.querySelectorAll('a').forEach((a) =>
            a.addEventListener('click', close)
        );

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!navbar.contains(e.target)) close();
        });

        console.log('[MobileNav] Initialized.');
    };

    return { init };
})();


/* ============================================================
   MODULE: Read Progress Bar
   Shows a thin progress bar at top as user reads the page
   ============================================================ */
const ReadProgress = (() => {
    let bar = null;
    let ticking = false;

    const update = () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                const docHeight = document.body.scrollHeight - window.innerHeight;
                const scrolled = window.scrollY;
                const pct = docHeight > 0 ? (scrolled / docHeight) * 100 : 0;
                bar.style.width = `${Math.min(pct, 100)}%`;
                ticking = false;
            });
            ticking = true;
        }
    };

    const init = () => {
        bar = document.createElement('div');
        bar.className = 'read-progress';
        document.body.prepend(bar);

        window.addEventListener('scroll', update, { passive: true });
        console.log('[ReadProgress] Initialized.');
    };

    return { init };
})();


/* ============================================================
   MODULE: Wisata Card Tilt Effect
   Subtle 3D tilt on hover for wisata cards (desktop only)
   ============================================================ */
const CardTilt = (() => {
    const SELECTOR = '.wisata-card';
    const MAX_TILT = 6; // degrees

    const applyTilt = (card, e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const cx = rect.width / 2;
        const cy = rect.height / 2;

        const rotateX = ((y - cy) / cy) * -MAX_TILT;
        const rotateY = ((x - cx) / cx) * MAX_TILT;

        card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
    };

    const resetTilt = (card) => {
        card.style.transform = '';
    };

    const init = () => {
        // Skip on touch devices
        if (window.matchMedia('(hover: none)').matches) return;

        document.querySelectorAll(SELECTOR).forEach((card) => {
            card.addEventListener('mousemove', (e) => applyTilt(card, e));
            card.addEventListener('mouseleave', () => resetTilt(card));
        });
        console.log('[CardTilt] Initialized.');
    };

    return { init };
})();


/* ============================================================
   MODULE: Lazy Image Loading
   Adds loading="lazy" + fade-in on images not in viewport
   ============================================================ */
const LazyImages = (() => {
    const init = () => {
        const images = document.querySelectorAll('img');

        images.forEach((img) => {
            // set lazy loading attribute
            img.loading = 'lazy';

            // fade-in on load
            img.style.opacity = '0';
            img.style.transition = 'opacity 0.5s ease';

            if (img.complete) {
                img.style.opacity = '1';
            } else {
                img.addEventListener('load', () => {
                    img.style.opacity = '1';
                });
            }
        });

        console.log(`[LazyImages] Applied to ${images.length} images.`);
    };

    return { init };
})();


/* ============================================================
   MODULE: Back to Top Button
   Appears after scrolling 400px — smooth scroll to top
   ============================================================ */
const BackToTop = (() => {
    let btn = null;
    let visible = false;
    let ticking = false;

    const onScroll = () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                const shouldShow = window.scrollY > 400;
                if (shouldShow !== visible) {
                    visible = shouldShow;
                    btn.classList.toggle('back-to-top--visible', visible);
                }
                ticking = false;
            });
            ticking = true;
        }
    };

    const init = () => {
        btn = document.createElement('button');
        btn.className = 'back-to-top';
        btn.setAttribute('aria-label', 'Kembali ke atas');
        btn.innerHTML = '↑';
        document.body.appendChild(btn);

        btn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        window.addEventListener('scroll', onScroll, { passive: true });
        console.log('[BackToTop] Initialized.');
    };

    return { init };
})();


/* ============================================================
   MODULE: Tooltip on Profile Info
   Show a small tooltip on hover for .info-label items
   ============================================================ */
const InfoTooltip = (() => {
    const tooltipData = {
        'Negara': 'Indonesia — Negara kepulauan terbesar di dunia.',
        'Hari Jadi': 'Bandung resmi berdiri pada 25 September 1810.',
        'Luas Total': 'Luas wilayah administratif Kota Bandung.',
        'Bahasa Daerah': 'Bahasa Sunda digunakan oleh mayoritas penduduk asli.',
        'Kode Telepon': 'Kode area telepon lokal Kota Bandung.',
    };

    let tooltip = null;

    const showTooltip = (label, e) => {
        const text = tooltipData[label];
        if (!text) return;

        tooltip.textContent = text;
        tooltip.classList.add('tooltip--visible');

        positionTooltip(e);
    };

    const positionTooltip = (e) => {
        const x = e.clientX + 14;
        const y = e.clientY - 36;
        tooltip.style.left = `${x}px`;
        tooltip.style.top = `${y}px`;
    };

    const hideTooltip = () => {
        tooltip.classList.remove('tooltip--visible');
    };

    const init = () => {
        tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        document.body.appendChild(tooltip);

        document.querySelectorAll('.info-label').forEach((label) => {
            const labelText = label.textContent.trim();
            if (!tooltipData[labelText]) return;

            label.style.cursor = 'help';
            label.addEventListener('mouseenter', (e) => showTooltip(labelText, e));
            label.addEventListener('mousemove', positionTooltip);
            label.addEventListener('mouseleave', hideTooltip);
        });

        console.log('[InfoTooltip] Initialized.');
    };

    return { init };
})();


/* ============================================================
   INJECT DYNAMIC CSS (for JS-generated elements)
   Progress bar, back-to-top, navbar burger, tooltip
   ============================================================ */
const injectStyles = () => {
    const css = `
    /* Read Progress Bar */
    .read-progress {
      position: fixed;
      top: 0; left: 0;
      height: 3px;
      width: 0%;
      background: linear-gradient(90deg, #C0633A, #D4A847);
      z-index: 9999;
      transition: width 0.1s linear;
      border-radius: 0 2px 2px 0;
    }

    /* Back to Top Button */
    .back-to-top {
      position: fixed;
      bottom: 2.5rem; right: 2rem;
      width: 44px; height: 44px;
      border-radius: 50%;
      border: 1.5px solid #E0D8CC;
      background: #FDFAF5;
      color: #3D2B1F;
      font-size: 1.1rem;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(26,20,16,0.12);
      opacity: 0;
      transform: translateY(16px);
      pointer-events: none;
      transition: opacity 0.3s ease, transform 0.3s ease, background 0.2s;
      z-index: 200;
    }
    .back-to-top--visible {
      opacity: 1;
      transform: translateY(0);
      pointer-events: auto;
    }
    .back-to-top:hover {
      background: #C0633A;
      color: #fff;
      border-color: #C0633A;
    }

    /* Navbar Burger (mobile) */
    .navbar__burger {
      display: none;
      background: none;
      border: 1.5px solid rgba(255,255,255,0.4);
      color: #fff;
      width: 40px; height: 40px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 1.1rem;
      transition: background 0.2s;
    }
    .navbar__burger:hover { background: rgba(255,255,255,0.1); }

    @media (max-width: 480px) {
      .navbar__burger { display: flex; align-items: center; justify-content: center; }
      .navbar__links {
        position: fixed;
        top: 0; left: 0; right: 0;
        flex-direction: column;
        gap: 0;
        background: rgba(26,20,16,0.97);
        backdrop-filter: blur(12px);
        padding: 5rem 2rem 2rem;
        transform: translateY(-110%);
        transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        z-index: 99;
      }
      .navbar__links--open {
        transform: translateY(0);
      }
      .navbar__links li { border-bottom: 1px solid rgba(255,255,255,0.08); }
      .navbar__links a {
        display: block;
        padding: 1rem 0;
        font-size: 1.1rem;
      }
    }

    /* Navbar scrolled state */
    .navbar--scrolled {
      position: fixed;
      top: 0; left: 0; right: 0;
      background: rgba(26,20,16,0.92);
      backdrop-filter: blur(16px);
      box-shadow: 0 2px 20px rgba(0,0,0,0.2);
      animation: slideDown 0.35s ease;
      z-index: 100;
    }
    @keyframes slideDown {
      from { transform: translateY(-100%); opacity: 0; }
      to   { transform: translateY(0);    opacity: 1; }
    }

    /* Tooltip */
    .tooltip {
      position: fixed;
      background: #1A1410;
      color: rgba(255,255,255,0.88);
      font-family: 'DM Sans', sans-serif;
      font-size: 0.78rem;
      line-height: 1.5;
      padding: 0.5rem 0.85rem;
      border-radius: 8px;
      pointer-events: none;
      z-index: 9000;
      max-width: 220px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.25);
      opacity: 0;
      transform: translateY(6px);
      transition: opacity 0.2s ease, transform 0.2s ease;
    }
    .tooltip--visible {
      opacity: 1;
      transform: translateY(0);
    }
  `;

    const styleEl = document.createElement('style');
    styleEl.textContent = css;
    document.head.appendChild(styleEl);
};


/* ============================================================
   BOOTSTRAP — init semua modules setelah DOM ready
   ============================================================ */
const App = {
    init() {
        injectStyles();
        ScrollReveal.init();
        ActiveNav.init();
        NavbarScroll.init();
        CounterAnimation.init();
        SmoothScroll.init();
        MobileNav.init();
        ReadProgress.init();
        CardTilt.init();
        LazyImages.init();
        BackToTop.init();
        InfoTooltip.init();

        console.log('%c[Bandung App] ✅ All modules initialized.',
            'color: #D4A847; font-weight: bold; font-size: 12px;');
    },
};

// Wait for DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
} else {
    App.init();
}