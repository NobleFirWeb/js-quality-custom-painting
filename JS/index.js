(function () {
    'use strict';

    /* ============================================================
       REGISTER GSAP PLUGINS
    ============================================================ */
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
    }


    /* ============================================================
       LENIS — smooth scroll, synced to GSAP's ticker + ScrollTrigger
    ============================================================ */
    let lenis = null;
    function initSmoothScroll() {
        if (typeof Lenis === 'undefined' || typeof gsap === 'undefined') return;
        lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smoothWheel: true,
            wheelMultiplier: 1
        });
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add((time) => {
            lenis.raf(time * 1000);
        });
        gsap.ticker.lagSmoothing(0);
    }
    initSmoothScroll();


    /* ============================================================
       OVERLAY MENU
    ============================================================ */
    const menuBtn      = document.getElementById('menuBtn');
    const overlayMenu  = document.getElementById('overlayMenu');
    const overlayClose = document.getElementById('overlayClose');
    const overlayLinks = document.querySelectorAll('.overlay-link');

    // Lock scrolling via Lenis (not body{overflow:hidden}) so the native
    // scrollbar stays visible and the fixed nav doesn't shift when the menu opens.
    const openMenu  = () => { overlayMenu.classList.add('open');    if (lenis) lenis.stop();  };
    const closeMenu = () => { overlayMenu.classList.remove('open'); if (lenis) lenis.start(); };

    if (menuBtn)      menuBtn.addEventListener('click', openMenu);
    if (overlayClose) overlayClose.addEventListener('click', closeMenu);
    overlayLinks.forEach(l => l.addEventListener('click', closeMenu));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });


    /* ============================================================
       GSAP ANIMATIONS (only when GSAP is available)
    ============================================================ */
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
        console.warn('GSAP / ScrollTrigger not loaded — animations disabled.');
        // Fall back: show all testimonial bodies + slide sections in
        document.querySelectorAll('.t-body').forEach(b => b.classList.add('revealed'));
        document.querySelector('.testimonials')?.classList.add('slid-in');
        document.querySelector('.cta-section')?.classList.add('slid-in');
        document.getElementById('footerScaleWrap').style.padding = '0';
        initForm();
        return;
    }


    /* ──────────────────────────────────────────────────────────
       HERO — stagger headline lines on load
    ────────────────────────────────────────────────────────── */
    gsap.from('.h-line', {
        y: 40,
        opacity: 0,
        duration: 1.1,
        ease: 'power3.out',
        stagger: 0.15,
        delay: 0.2
    });
    gsap.from('.hero-eyebrow', {
        y: 16, opacity: 0, duration: 0.9, ease: 'power2.out', delay: 0.1
    });
    gsap.from('.hero-body', {
        y: 16, opacity: 0, duration: 0.9, ease: 'power2.out', delay: 0.5
    });
    gsap.from('.hrg-desc, .hrg-est', {
        y: 12, opacity: 0, duration: 0.8, ease: 'power2.out', stagger: 0.12, delay: 0.6
    });
    gsap.from('.hero-svc-list li', {
        y: 10, opacity: 0, duration: 0.7, ease: 'power2.out', stagger: 0.1, delay: 0.7
    });


    /* ──────────────────────────────────────────────────────────
       HERO — curtain rise: hero-text-block sits on top of hero-photo,
       both pinned in place via sticky-wrap (same pattern as
       services/projects). The text-block translates up as the user
       scrolls, revealing the photo behind it; nothing else in the hero
       moves. It only rises 75% of its own height — leaving the bottom
       quarter (with "QUALITY PAINTING") still visible — then unpins,
       so that remainder scrolls away normally with the rest of the
       page, giving a parallax feel against the now-revealed photo.
    ────────────────────────────────────────────────────────── */
    const heroStickyWrap = document.getElementById('heroStickyWrap');
    const heroTextBlock  = document.getElementById('heroTextBlock');

    if (heroStickyWrap && heroTextBlock) {
        const VH            = window.innerHeight;
        const RISE_FRACTION = 0.75;
        // 100vh to hold the pin + the curtain's partial rise distance
        heroStickyWrap.style.height = (VH + RISE_FRACTION * VH) + 'px';

        ScrollTrigger.create({
            trigger: heroStickyWrap,
            start: 'top top',
            end: `+=${RISE_FRACTION * VH}`,
            scrub: true,
            onUpdate(self) {
                gsap.set(heroTextBlock, { yPercent: -100 * RISE_FRACTION * self.progress });
            }
        });
    }


    /* ──────────────────────────────────────────────────────────
       UTILITY — split element text into per-line masked spans
    ────────────────────────────────────────────────────────── */
    function splitLines(el) {
        // Capture the real laid-out width BEFORE clearing (works for both
        // explicit-width and max-width/shrink-to-fit elements).
        const maxW = el.clientWidth;
        const text = el.textContent.trim();
        const words = text.split(/\s+/);

        // Build lines by measuring the ACTUAL nowrap run incrementally with a
        // hidden probe: add words until the next would exceed maxW, then break.
        // Because the probe uses the same nowrap rendering as the final line,
        // each built line is guaranteed to fit — no rounding mismatch between
        // an inline-block measurement pass and a rebuilt nowrap line (which
        // previously let long lines spill past an overflow:hidden edge).
        el.innerHTML = '';
        const probe = document.createElement('span');
        probe.style.cssText = 'visibility:hidden;white-space:nowrap;position:absolute;left:0;top:0;';
        el.appendChild(probe);

        const lines = [];
        let cur = [];
        words.forEach(w => {
            const test = cur.concat(w);
            probe.textContent = test.join(' ');
            if (cur.length && probe.scrollWidth > maxW) {
                lines.push(cur.join(' '));
                cur = [w];
            } else {
                cur = test;
            }
        });
        if (cur.length) lines.push(cur.join(' '));
        el.removeChild(probe);

        el.innerHTML = '';
        return lines.map(lineText => {
            const mask = document.createElement('span');
            mask.style.cssText = 'display:block;overflow:hidden;';
            const inner = document.createElement('span');
            inner.style.cssText = 'display:block;white-space:nowrap;';
            inner.textContent = lineText;
            mask.appendChild(inner);
            el.appendChild(mask);
            return inner;
        });
    }

    /* ──────────────────────────────────────────────────────────
       FEATURED PROJECTS — stacking panels with dwell time
       Each segment = dwell (60%) + rise (40%).
       Line grows left→right, pushing "Keep scrolling" text.
    ────────────────────────────────────────────────────────── */
    const projSection     = document.querySelector('.projects');
    const projStickyWrap  = document.getElementById('projStickyWrap');
    const projSlides      = gsap.utils.toArray('.proj-slide');
    const ksLine          = document.getElementById('ksLine');
    const ksText          = document.querySelector('.ks-text');
    const servicesSection = document.querySelector('.services');
    const svcStickyWrap   = document.getElementById('svcStickyWrap');

    if (projSection && projStickyWrap && projSlides.length) {
        const N           = projSlides.length; // 5
        const DWELL       = 0.6;
        const VH          = window.innerHeight;
        const SLIDE_TOTAL = (N - 1) * 2.5 * VH;  // 10 * VH
        const LAST_DWELL  = 0.9 * VH;
        const EXIT_SCROLL = VH;

        projStickyWrap.style.height = (VH + SLIDE_TOTAL + LAST_DWELL + EXIT_SCROLL) + 'px';

        // Services wrapper: VH to stick + 1.25×VH dwell + VH for process curtain rise
        if (svcStickyWrap) {
            svcStickyWrap.style.height = (3.25 * VH) + 'px';
        }

        // Services starts slightly scaled down; pops to 1 as projects exits
        if (servicesSection) gsap.set(servicesSection, { scale: 0.95 });

        projSlides.forEach((slide, i) => {
            gsap.set(slide, { zIndex: i + 1, y: i === 0 ? '0%' : '100%' });
        });


        const projDescs     = gsap.utils.toArray('.proj-top-left');
        const projCounters  = gsap.utils.toArray('.proj-counter');
        // Split each desc paragraph into lines; store per-slide line inners
        const descLineInners = projDescs.map(desc => {
            const p = desc.querySelector('.proj-desc');
            return p ? splitLines(p) : [];
        });
        // Start descs hidden (lines below mask clip); counters hidden
        projDescs.forEach(desc => gsap.set(desc, { opacity: 0 }));
        descLineInners.forEach(lines => gsap.set(lines, { y: '110%' }));
        projCounters.forEach(el => gsap.set(el, { opacity: 0, y: 30, filter: 'blur(8px)' }));

        // State machine for crisp entry/exit timeline animations (not scrub-driven)
        const descStates = projDescs.map(() => 'idle'); // 'idle' | 'visible'
        const descTLs    = projDescs.map(() => null);

        function playEntry(i) {
            if (descStates[i] === 'visible') return;
            descStates[i] = 'visible';
            if (descTLs[i]) descTLs[i].kill();
            const lines   = descLineInners[i];
            const counter = projCounters[i];
            const tl = gsap.timeline();
            tl.set(projDescs[i], { opacity: 1 });
            tl.fromTo(lines,
                { y: '110%' },
                { y: '0%', duration: 0.55, stagger: 0.1, ease: 'power3.out' }
            );
            if (counter) tl.fromTo(counter,
                { opacity: 0, y: 30, filter: 'blur(8px)' },
                { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.4, ease: 'power3.out' },
                '<+0.1'
            );
            descTLs[i] = tl;
        }

        function playExit(i) {
            if (descStates[i] === 'idle') return;
            descStates[i] = 'idle';
            if (descTLs[i]) descTLs[i].kill();
            const lines   = descLineInners[i];
            const counter = projCounters[i];
            const tl = gsap.timeline();
            tl.to(lines,
                { y: '110%', duration: 0.4, stagger: { each: 0.08, from: 'end' }, ease: 'power2.in' }
            );
            tl.to(projDescs[i], { opacity: 0, duration: 0.25 }, '<');
            if (counter) tl.to(counter,
                { opacity: 0, y: 20, filter: 'blur(8px)', duration: 0.3, ease: 'power2.in' },
                '<'
            );
            descTLs[i] = tl;
        }

        const maxLineWidth = () => {
            const textW = ksText ? ksText.offsetWidth : 120;
            return window.innerWidth - 40 - 16 - textW - 40;
        };

        // Slide stacking animation — no GSAP pin, projects is sticky inside wrapper
        ScrollTrigger.create({
            trigger: projStickyWrap,
            start: 'top 25%',
            end: `+=${SLIDE_TOTAL + LAST_DWELL}`,
            scrub: 0.6,
            onUpdate(self) {
                const raw       = self.progress * (SLIDE_TOTAL + LAST_DWELL);
                const p         = Math.min(raw / SLIDE_TOTAL, 1);
                const segSize   = 1 / (N - 1);
                const riseWidth = (1 - DWELL) * segSize;

                projSlides.forEach((slide, i) => {
                    if (i === 0) return;
                    const segStart  = (i - 1) * segSize;
                    const riseStart = segStart + DWELL * segSize;
                    const riseEnd   = segStart + segSize;
                    let y;
                    if (p <= riseStart)    y = 100;
                    else if (p >= riseEnd) y = 0;
                    else y = 100 * (1 - (p - riseStart) / (riseEnd - riseStart));
                    gsap.set(slide, { y: y + '%' });
                });

                if (ksLine) ksLine.style.width = Math.round(p * maxLineWidth()) + 'px';
            }
        });

        // Dedicated ScrollTrigger per slide — fires crisp timelines independent of scrub
        (() => {
            const segSize   = 1 / (N - 1);
            const riseWidth = (1 - DWELL) * segSize;

            projDescs.forEach((desc, i) => {
                let startOffset, endOffset;

                if (i === 0) {
                    // Slide 0: enters when section enters view (top 25% as user set), exits when slide 1 hits 75% screen
                    startOffset = null; // handled via 'top 25%' string below
                    endOffset   = (DWELL * segSize + 0.25 * riseWidth) * SLIDE_TOTAL;
                } else {
                    const riseStart_i = (i - 1) * segSize + DWELL * segSize;
                    startOffset = (riseStart_i + 0.25 * riseWidth) * SLIDE_TOTAL;
                    endOffset   = i < N - 1
                        ? (i * segSize + DWELL * segSize + 0.25 * riseWidth) * SLIDE_TOTAL
                        : SLIDE_TOTAL + LAST_DWELL;
                }

                ScrollTrigger.create({
                    trigger:     projStickyWrap,
                    start:       i === 0 ? 'top 25%'                    : `top+=${startOffset} top`,
                    end:         i === 0 ? `top+=${endOffset} top`      : `top+=${endOffset} top`,
                    onEnter:     () => playEntry(i),
                    onLeave:     () => playExit(i),
                    onEnterBack: () => playEntry(i),
                    onLeaveBack: () => playExit(i)
                });
            });
        })();

        // Projects exit: scale 1→0 from top-left over the EXIT_SCROLL portion of the wrapper.
        ScrollTrigger.create({
            trigger: projStickyWrap,
            start: `top+=${SLIDE_TOTAL + LAST_DWELL} top`,
            end:   `top+=${SLIDE_TOTAL + LAST_DWELL + EXIT_SCROLL} top`,
            scrub: 0.6,
            onUpdate(self) {
                gsap.set(projSection, { scale: 1 - self.progress, transformOrigin: 'top left' });
                if (servicesSection) gsap.set(servicesSection, { scale: 0.95 + 0.05 * self.progress });
            },
            onLeave() {
                gsap.set(projSection, { scale: 0, transformOrigin: 'top left' });
                if (servicesSection) gsap.set(servicesSection, { scale: 1 });
            },
            onEnterBack() {
                gsap.set(projSection, { scale: 1, transformOrigin: 'top left' });
                if (servicesSection) gsap.set(servicesSection, { scale: 0.95 });
            }
        });
    }


    /* ──────────────────────────────────────────────────────────
       ABOUT — fade-in on scroll
    ────────────────────────────────────────────────────────── */
    gsap.from('.about-heading', {
        y: 30, opacity: 0, duration: 1, ease: 'power2.out',
        scrollTrigger: { trigger: '.about', start: 'top 75%' }
    });
    gsap.from('.about-body-left p, .about-stats, .about-cta-card', {
        y: 20, opacity: 0, duration: 0.8, ease: 'power2.out', stagger: 0.1,
        scrollTrigger: { trigger: '.about-body-row', start: 'top 80%' }
    });


    /* ──────────────────────────────────────────────────────────
       PROCESS — pin + image crossfade + content updates
    ────────────────────────────────────────────────────────── */
    const processSection = document.querySelector('.process');
    const procCubeScene  = document.getElementById('procCubeScene');
    const procCube       = document.getElementById('procCube');
    const procStepNum    = document.getElementById('procStepNum');
    const procTitle      = document.getElementById('procTitle');
    const procDesc       = document.getElementById('procDesc');
    const procKsLine     = document.getElementById('procKsLine');

    const steps = [
        {
            num:  'STEP - 01',
            title:'SUBMIT YOUR BID REQUEST',
            desc: 'Complete our Bid Request Form with your property\'s square footage, preferred colors, and ideal timeline. The more detail you share, the more accurate your quote will be.'
        },
        {
            num:  'STEP - 02',
            title:'WE REACH OUT TO YOU',
            desc: 'Within 48 business hours, a member of our team will contact you to confirm details, ask any clarifying questions, and schedule your on-site evaluation.'
        },
        {
            num:  'STEP - 03',
            title:'ON-SITE EVALUATION',
            desc: 'We come to you — measuring surfaces, assessing conditions, reviewing your color ideas in context, and preparing a detailed written quote with no surprises.'
        },
        {
            num:  'STEP - 04',
            title:'WE PAINT, YOU ENJOY',
            desc: 'Our crew arrives on time, protects your property, and executes the project with precision. Final walkthrough ensures you\'re 100% satisfied before we consider the job done.'
        }
    ];

    if (processSection && procCubeScene && procCube) {
        const STEP_COUNT = steps.length;
        const PVH        = window.innerHeight;
        const procMaxKs  = () => window.innerWidth - 48 - 16 - (document.querySelector('.proc-keep-scrolling .ks-text') ? document.querySelector('.proc-keep-scrolling .ks-text').offsetWidth : 120) - 48;

        // Cube starts off-screen left. Both its slide-in position AND its spin
        // are pure functions of scroll progress — no time-based tweens, so it
        // never "snaps" and always feels tied to the scrollbar.
        // Positive→0, decreasing — same rotation direction the pin phase continues
        // in (0→-270 below), so the spin never visually reverses at the handoff.
        const ENTRY_SPINS = 450; // 1.25 free spins while sliding in (slightly slower than before)
        gsap.set(procCubeScene, { x: '-120vw', opacity: 0 });
        gsap.set(procCube, { rotateY: ENTRY_SPINS });

        // Entry: scrub cube from off-screen left → center as section rises into view.
        // Starting at 'top 90%' (was 80%) spreads the same visual travel over a
        // longer scroll distance, slowing both the slide and the spin slightly —
        // closer to (though still faster than) the per-step rotation speed below.
        ScrollTrigger.create({
            trigger: processSection,
            start: 'top 90%',
            end: 'top top',
            scrub: 1.2,
            onUpdate(self) {
                gsap.set(procCubeScene, {
                    x:       gsap.utils.interpolate('-120vw', '0vw', self.progress),
                    opacity: gsap.utils.interpolate(0, 1, self.progress)
                });
                gsap.set(procCube, { rotateY: gsap.utils.interpolate(ENTRY_SPINS, 0, self.progress) });
            }
        });

        // Per-step text (cube rotation itself is driven entirely by the pin's
        // own scroll progress below — never by a fixed-duration tween)
        let procTitleLines = [];
        let procDescLines  = [];
        let procActiveTL   = null;

        function showProcStep(i) {
            const step = steps[i];
            if (procActiveTL) procActiveTL.kill();

            procTitle.textContent = step.title;
            procDesc.textContent  = step.desc;
            if (procStepNum) procStepNum.textContent = step.num;

            procTitleLines = splitLines(procTitle);
            procDescLines  = splitLines(procDesc);
            gsap.set(procTitleLines, { y: '110%' });
            gsap.set(procDescLines,  { y: '110%' });
            gsap.set(procStepNum,    { opacity: 0, y: 10 });

            procActiveTL = gsap.timeline()
                .to(procTitleLines, { y: '0%', duration: 0.55, stagger: 0.1,  ease: 'power3.out' })
                .to(procDescLines,  { y: '0%', duration: 0.45, stagger: 0.08, ease: 'power3.out' }, '<+0.1')
                .to(procStepNum,    { opacity: 1, y: 0, duration: 0.4,        ease: 'power3.out' }, '<');
        }

        function hideProcStep() {
            if (procActiveTL) procActiveTL.kill();
            gsap.set(procTitleLines, { y: '110%' });
            gsap.set(procDescLines,  { y: '110%' });
            gsap.set(procStepNum,    { opacity: 0 });
        }

        // Initialise step 0 content (hidden until section enters)
        procTitle.textContent = steps[0].title;
        procDesc.textContent  = steps[0].desc;
        if (procStepNum) procStepNum.textContent = steps[0].num;
        procTitleLines = splitLines(procTitle);
        procDescLines  = splitLines(procDesc);
        gsap.set(procTitleLines, { y: '110%' });
        gsap.set(procDescLines,  { y: '110%' });
        gsap.set(procStepNum,    { opacity: 0 });

        // Pin + ks-line progress + cube rotation + step switching — all driven
        // from this single trigger's own progress, continuously, so the cube
        // is always mid-turn somewhere and never holds still then "flips."
        // (Separate ScrollTriggers using the pinned element itself as their
        // trigger get their "top+=X" offsets corrupted by GSAP's pin-spacer
        // math, so this all has to live in one onUpdate.)
        // One continuous, single-direction spin across the whole pinned range —
        // no easing or dwell on any individual face. It only ever holds still
        // at the literal start (first image) and end (last image), where
        // scroll progress itself is pinned at 0 or 1; in between it free-spins.
        //
        // The pin runs past the last step by a 0.5-viewport buffer (a quiet
        // beat after step 4 completes) plus one dwell viewport: during that
        // dwell the testimonials panel (see below) slides in from the right
        // over this still-pinned section, and the cube keeps turning another
        // 90° so it's visibly spinning as it disappears behind the panel.
        // The reviews pull-in is tied to the LAST viewport of this pin, so
        // growing the pin by the buffer automatically delays it.
        const P_END_BUF  = 0.5;                                          // viewports of quiet after step 4
        const STEP_TURN  = (STEP_COUNT - 1) * -90;                       // front→right→back→left
        const PIN_LEN    = (STEP_COUNT + P_END_BUF + 1) * PVH;           // steps + buffer + dwell
        const STEP_FRAC  = STEP_COUNT / (STEP_COUNT + P_END_BUF + 1);    // steps end at this progress
        let currentStep  = -1;

        ScrollTrigger.create({
            trigger: processSection,
            start: 'top top',
            end: `+=${PIN_LEN}`,
            pin: true,
            pinSpacing: true,
            scrub: 0.8,
            onEnter() {
                currentStep = 0;
                showProcStep(0);
            },
            onLeaveBack() {
                currentStep = -1;
                hideProcStep();
            },
            onUpdate(self) {
                const stepPhase  = Math.min(self.progress / STEP_FRAC, 1);
                const dwellPhase = Math.max(0, (self.progress - STEP_FRAC) / (1 - STEP_FRAC));

                if (procKsLine) procKsLine.style.width = Math.round(stepPhase * procMaxKs()) + 'px';
                // Faces stay aligned to steps during the step phase, then the
                // cube keeps rotating the same direction through the dwell.
                gsap.set(procCube, { rotateY: STEP_TURN * stepPhase - 90 * dwellPhase });

                // Switch step text at the midpoint between each pair of faces
                const stepIdx = Math.min(STEP_COUNT - 1, Math.round(stepPhase * (STEP_COUNT - 1)));
                if (stepIdx !== currentStep) {
                    currentStep = stepIdx;
                    showProcStep(stepIdx);
                }
            }
        });
    }


    // Process curtain: .proc-entry-wrap has margin-top: -100vh and z-index: 8,
    // so process naturally rises over pinned services without any ScrollTrigger.


    /* ──────────────────────────────────────────────────────────
       TESTIMONIALS — scroll-driven horizontal panel
       .t-outer overlaps the process pin's dwell viewport (margin-top
       -200vh in CSS) so the panel is pulled in from the right OVER the
       still-pinned process section. Once fully in, the section stays
       sticky while the review list translates up (scroll-through), then
       dwells one extra viewport while the CTA panel pulls in over it.
    ────────────────────────────────────────────────────────── */
    const tOuter       = document.getElementById('tOuter');
    const testimonials = document.querySelector('.testimonials');
    const tRight       = document.querySelector('.t-right');
    const tList        = document.querySelector('.t-list');

    if (tOuter && testimonials && tRight && tList) {
        const TVH        = window.innerHeight;
        const T_BUF      = 0.75 * TVH; // breathing room once fully in view, before the list starts moving
        const T_END_BUF  = 0.5 * TVH;  // quiet beat after the list finishes, before the CTA pulls in
        const listScroll = Math.max(0, tRight.scrollHeight - tRight.clientHeight);
        // slide + buffer + list + end-buffer + CTA dwell — the CTA pull-in is
        // tied to the LAST viewport of this wrap, so the end-buffer delays it.
        const T_BUDGET   = TVH + T_BUF + listScroll + T_END_BUF + TVH;

        // Review bodies start hidden (see CSS) and rise in all at once,
        // late in the buffer — just before the list becomes scrollable.
        const tBodies      = gsap.utils.toArray('.t-body');
        const REVEAL_AT    = TVH + 0.55 * T_BUF;
        let   tRevealShown = false;
        let   tRevealTL    = null;

        function setTReveal(show) {
            if (show === tRevealShown) return;
            tRevealShown = show;
            if (tRevealTL) tRevealTL.kill();
            tRevealTL = gsap.timeline();
            if (show) {
                tRevealTL.to(tBodies, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' });
            } else {
                tRevealTL.to(tBodies, { opacity: 0, y: 40, duration: 0.35, ease: 'power2.in' });
            }
        }

        // 100vh sticky base + scroll budget
        tOuter.style.height = (TVH + T_BUDGET) + 'px';
        gsap.set(testimonials, { x: '100vw' });
        gsap.set(tBodies, { opacity: 0, y: 40 });

        ScrollTrigger.create({
            trigger: tOuter,
            start: 'top top',
            end: `+=${T_BUDGET - TVH}`,
            scrub: 0.6,
            onUpdate(self) {
                const raw   = self.progress * (T_BUDGET - TVH);
                const slide = Math.min(raw / TVH, 1);
                gsap.set(testimonials, { x: ((1 - slide) * 100) + 'vw' });

                setTReveal(raw >= REVEAL_AT);

                const y = Math.min(Math.max(raw - TVH - T_BUF, 0), listScroll);
                gsap.set(tList, { y: -y });
            }
        });
    }


    /* ──────────────────────────────────────────────────────────
       CTA — scroll-driven horizontal panel + dark-green wipe
       .cta-outer overlaps the testimonials dwell viewport (margin-top
       -200vh in CSS) so the CTA is pulled in from the right over the
       pinned reviews, background still black. Only once it's 100% in
       view does the dark-green overlay wipe in from the left; the
       "Request a quote" link flips to white the moment the wipe's
       leading edge passes it.
    ────────────────────────────────────────────────────────── */
    const ctaOuter   = document.getElementById('ctaOuter');
    const ctaSection = document.querySelector('.cta-section');
    const ctaOverlay = document.getElementById('ctaOverlay');
    const ctaLink    = document.querySelector('.cta-link');

    if (ctaOuter && ctaSection && ctaOverlay) {
        const CVH      = window.innerHeight;
        const C_BUF    = 0.75 * CVH; // breathing room once fully in view, before the green wipe starts
        const C_BUDGET = CVH + C_BUF + CVH; // slide + buffer + wipe

        // 100vh sticky base + scroll budget
        ctaOuter.style.height = (CVH + C_BUDGET) + 'px';
        gsap.set(ctaSection, { x: '100vw' });
        gsap.set(ctaOverlay, { scaleX: 0 });

        ScrollTrigger.create({
            trigger: ctaOuter,
            start: 'top top',
            end: `+=${C_BUDGET}`,
            scrub: 0.6,
            onUpdate(self) {
                const raw   = self.progress * C_BUDGET;
                const slide = Math.min(raw / CVH, 1);
                gsap.set(ctaSection, { x: ((1 - slide) * 100) + 'vw' });

                const wipe = Math.min(Math.max((raw - CVH - C_BUF) / CVH, 0), 1);
                gsap.set(ctaOverlay, { scaleX: wipe });

                if (ctaLink) {
                    const covered = wipe * window.innerWidth > ctaLink.getBoundingClientRect().left;
                    ctaLink.classList.toggle('cta-link--white', covered);
                }
            }
        });
    }


    /* ──────────────────────────────────────────────────────────
       FOOTER — scale from 80% to 100% width on scroll
    ────────────────────────────────────────────────────────── */
    const footerWrap = document.getElementById('footerScaleWrap');

    if (footerWrap) {
        ScrollTrigger.create({
            trigger: footerWrap,
            start: 'top 85%',
            end: 'top 30%',
            scrub: 1,
            onUpdate(self) {
                const pct = gsap.utils.interpolate(10, 0, self.progress);
                footerWrap.style.padding = `0 ${pct}%`;
            }
        });
    }


    /* ──────────────────────────────────────────────────────────
       QUOTE FORM — submit feedback
    ────────────────────────────────────────────────────────── */
    initForm();

    function initForm() {
        const quoteForm = document.getElementById('quoteForm');
        if (!quoteForm) return;
        quoteForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const btn = quoteForm.querySelector('.f-submit');
            if (btn) {
                btn.textContent = "Request Sent — We'll Be in Touch!";
                btn.style.background = 'var(--black)';
                btn.style.color = 'var(--lace)';
                btn.disabled = true;
            }
        });
    }

})();
