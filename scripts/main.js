/* =========================================================
   NXT MEDIA — Front-end interactions
   Depends on anime.js (loaded from CDN before this file)
   ========================================================= */

(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Wait for DOM + anime.js
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(init);

  function init() {
    setYear();
    setupHeaderScroll();
    setupMobileMenu();
    setupHeroIntro();
    setupScrollReveal();
    setupMagneticButtons();
    setupCardSpotlight();
    setupCounters();
    setupLeadForms();
    setupBookModal();
  }

  /* ---------- Lead forms (inline + modal) ---------- */
  function setupLeadForms() {
    const forms = document.querySelectorAll('.lead-form');
    forms.forEach(wireForm);
  }

  function wireForm(form) {
    const fields = form.querySelectorAll('[data-field]');

    const validateField = (wrap) => {
      const input = wrap.querySelector('input');
      const ok = input.checkValidity() && input.value.trim().length > 0;
      wrap.classList.toggle('is-error', !ok);
      return ok;
    };

    fields.forEach((wrap) => {
      const input = wrap.querySelector('input');
      input.addEventListener('input', () => {
        if (wrap.classList.contains('is-error')) validateField(wrap);
      });
      input.addEventListener('blur', () => {
        if (input.value.trim().length > 0) validateField(wrap);
      });
    });

    form.addEventListener('submit', (e) => {
      let allValid = true;
      fields.forEach((wrap) => { if (!validateField(wrap)) allValid = false; });
      if (!allValid) {
        e.preventDefault();
        const firstError = form.querySelector('.field.is-error input');
        if (firstError) firstError.focus();
        return;
      }

      const action = form.getAttribute('action') || '';
      // Formspree placeholder fallback: trigger mailto + open Calendly so leads aren't lost.
      if (action.includes('REPLACE_WITH_YOUR_FORM_ID')) {
        e.preventDefault();
        const data = new FormData(form);
        const planLabel = {
          growth: 'Growth (Ads only)',
          fullstack: 'Full Stack (Ads + Website)',
          web: 'Web (Website only)',
          unsure: 'Not sure yet',
        }[data.get('plan')] || 'Not specified';
        const subject = encodeURIComponent('New strategy-call request from NXT Media site');
        const body = encodeURIComponent(
          'Name: '   + (data.get('name')   || '') + '\n' +
          'Phone: '  + (data.get('phone')  || '') + '\n' +
          'Email: '  + (data.get('email')  || '') + '\n' +
          'Plan:  '  + planLabel + '\n' +
          'Source: ' + (data.get('source') || form.id || 'unknown')
        );
        window.location.href = 'mailto:Fenixleland@icloud.com?subject=' + subject + '&body=' + body;
        setTimeout(() => {
          window.open('https://calendly.com/business-nxt-media/new-meeting', '_blank', 'noopener');
        }, 600);
        return;
      }

      const success = form.querySelector('.form-success');
      if (success) success.classList.add('is-visible');
    });
  }

  /* ---------- Booking modal ---------- */
  function setupBookModal() {
    const modal = document.getElementById('book-modal');
    if (!modal) return;

    const dialog = modal.querySelector('.modal-dialog');
    const form = modal.querySelector('#modal-form');
    const planSelect = modal.querySelector('#m-plan');
    const sourceField = modal.querySelector('[data-source]');
    let lastFocused = null;

    modal.removeAttribute('hidden');

    const openModal = (opts = {}) => {
      lastFocused = document.activeElement;
      modal.classList.add('is-open');
      document.body.classList.add('is-locked');

      // Pre-select plan if the trigger had data-plan
      if (planSelect) {
        planSelect.value = opts.plan || '';
      }
      // Tag the source so you know which page/section the lead came from
      if (sourceField) {
        sourceField.value = opts.source || (location.pathname.split('/').pop() || 'home');
      }

      // Focus first input
      setTimeout(() => {
        const firstInput = form.querySelector('input:not([type=hidden]), select');
        if (firstInput) firstInput.focus();
      }, 60);
    };

    const closeModal = () => {
      modal.classList.remove('is-open');
      document.body.classList.remove('is-locked');
      if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
    };

    // Intercept any Calendly link except those marked data-book-skip
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href*="calendly.com"]');
      if (!link) return;
      if (link.hasAttribute('data-book-skip')) return; // explicit bypass
      e.preventDefault();
      const plan = link.getAttribute('data-plan') || '';
      const source = link.textContent.trim().slice(0, 60) || 'link';
      openModal({ plan, source: location.pathname.split('/').pop() + ' · ' + source });
    });

    // Close handlers
    modal.querySelectorAll('[data-modal-close]').forEach((el) => {
      el.addEventListener('click', closeModal);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
    });

    // Trap focus inside the dialog while open
    modal.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab' || !modal.classList.contains('is-open')) return;
      const focusable = dialog.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]):not([type=hidden]), select:not([disabled]), textarea:not([disabled])'
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last  = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }

  /* ---------- Mobile menu (hamburger) ---------- */
  function setupMobileMenu() {
    const toggle = document.querySelector('.menu-toggle');
    const menu = document.getElementById('mobile-nav');
    if (!toggle || !menu) return;

    const close = () => {
      toggle.setAttribute('aria-expanded', 'false');
      menu.classList.remove('is-open');
      document.body.classList.remove('is-locked');
    };
    const open = () => {
      toggle.setAttribute('aria-expanded', 'true');
      menu.classList.add('is-open');
      document.body.classList.add('is-locked');
    };

    toggle.addEventListener('click', () => {
      const isOpen = toggle.getAttribute('aria-expanded') === 'true';
      isOpen ? close() : open();
    });

    menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', close));

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close();
    });

    const mq = window.matchMedia('(min-width: 881px)');
    mq.addEventListener('change', (e) => { if (e.matches) close(); });
  }

  /* ---------- Footer year ---------- */
  function setYear() {
    const el = document.getElementById('year');
    if (el) el.textContent = String(new Date().getFullYear());
  }

  /* ---------- Sticky header background on scroll ---------- */
  function setupHeaderScroll() {
    const header = document.getElementById('site-header');
    if (!header) return;

    const update = () => {
      if (window.scrollY > 12) header.classList.add('is-scrolled');
      else header.classList.remove('is-scrolled');
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
  }

  /* ---------- Hero text intro (anime.js) ----------
     Splits the headline into spans and animates them up with a stagger.
  */
  function setupHeroIntro() {
    const title = document.querySelector('.hero-title');
    if (!title || prefersReducedMotion || typeof anime === 'undefined') return;

    // Wrap each line's word in spans to slide up
    const lines = title.querySelectorAll('.line .word-wrap');
    lines.forEach((line) => {
      line.style.transform = 'translateY(110%)';
      line.style.display = 'inline-block';
      line.style.willChange = 'transform';
    });

    // Hero supporting elements (eyebrow, lead, ctas, meta)
    const supports = document.querySelectorAll('.hero .reveal');
    supports.forEach((el) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(16px)';
      el.style.willChange = 'opacity, transform';
    });

    const tl = anime.timeline({
      easing: 'cubicBezier(.22,1,.36,1)',
    });

    tl.add({
      targets: lines,
      translateY: ['110%', '0%'],
      duration: 1100,
      delay: anime.stagger(120, { start: 100 }),
    });

    tl.add(
      {
        targets: supports,
        translateY: [16, 0],
        opacity: [0, 1],
        duration: 700,
        delay: anime.stagger(80),
      },
      '-=700'
    );
  }

  /* ---------- Scroll reveal for .reveal elements ---------- */
  function setupScrollReveal() {
    const targets = document.querySelectorAll('.reveal');
    if (!targets.length) return;

    // Skip elements inside the hero — they're handled by the intro timeline.
    const observed = Array.from(targets).filter((el) => !el.closest('.hero'));
    if (!observed.length) return;

    if (!('IntersectionObserver' in window) || prefersReducedMotion) {
      observed.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.08 }
    );

    observed.forEach((el) => io.observe(el));
  }

  /* ---------- Magnetic primary buttons ---------- */
  function setupMagneticButtons() {
    if (prefersReducedMotion || typeof anime === 'undefined') return;

    const buttons = document.querySelectorAll('[data-magnetic]');
    const strength = 0.25;

    buttons.forEach((btn) => {
      let raf = null;

      const move = (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          anime({
            targets: btn,
            translateX: x * strength,
            translateY: y * strength,
            duration: 400,
            easing: 'cubicBezier(.22,1,.36,1)',
          });
        });
      };

      const reset = () => {
        if (raf) cancelAnimationFrame(raf);
        anime({
          targets: btn,
          translateX: 0,
          translateY: 0,
          duration: 600,
          easing: 'cubicBezier(.34,1.56,.64,1)',
        });
      };

      btn.addEventListener('mousemove', move);
      btn.addEventListener('mouseleave', reset);
    });
  }

  /* ---------- Card cursor spotlight ---------- */
  function setupCardSpotlight() {
    const cards = document.querySelectorAll('.card');
    cards.forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        card.style.setProperty('--mx', x + '%');
        card.style.setProperty('--my', y + '%');
      });
    });
  }

  /* ---------- Animated number counters ---------- */
  function setupCounters() {
    const counters = document.querySelectorAll('[data-count]');
    if (!counters.length) return;

    if (prefersReducedMotion || typeof anime === 'undefined') {
      counters.forEach((el) => (el.textContent = el.dataset.count));
      return;
    }

    const animate = (el) => {
      const target = parseInt(el.dataset.count, 10);
      if (isNaN(target)) return;
      const obj = { v: 0 };
      anime({
        targets: obj,
        v: target,
        duration: 1600,
        easing: 'cubicBezier(.22,1,.36,1)',
        round: 1,
        update: () => {
          el.textContent = obj.v;
        },
      });
    };

    if (!('IntersectionObserver' in window)) {
      counters.forEach(animate);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animate(entry.target);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    counters.forEach((el) => io.observe(el));
  }
})();
