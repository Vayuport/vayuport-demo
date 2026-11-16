// =========================================================
// VAYUPORT — UI layer (splash, navigation, service explorer,
// scroll effects). Form submission logic lives untouched in
// assets/js/main.js; this file must load BEFORE main.js.
// Everything here is defensive: any failure leaves a usable page.
// =========================================================
(function () {
  'use strict';

  var root = document.documentElement;
  root.classList.add('site-ok'); // tells the inline failsafe that this file loaded

  var reduceMotion = false;
  try { reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  function safe(fn) { try { fn(); } catch (err) { if (window.console) console.warn('[vayuport]', err); } }
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function ready() { root.classList.add('is-ready'); }

  /* -------------------------------------------------------
     2. Splash — logo assembles, then morphs into the nav logo
  ------------------------------------------------------- */
  safe(function () {
    var splash = document.getElementById('splash');
    if (!splash || root.classList.contains('no-splash') || !root.classList.contains('js')) {
      if (splash && splash.parentNode) splash.parentNode.removeChild(splash);
      ready();
      return;
    }
    var left = false;
    var logo = $('.splash-logo', splash);

    function finish() {
      root.classList.remove('splash-active');
      splash.style.transition = 'opacity .35s ease';
      splash.style.opacity = '0';
      setTimeout(function () { if (splash.parentNode) splash.parentNode.removeChild(splash); }, 400);
    }

    function leave(fast) {
      if (left) return;
      left = true;
      ready();
      splash.classList.add('is-leaving');
      var navImg = $('.nav-brand img');
      var moved = false;
      try {
        var lr = logo.getBoundingClientRect();
        var nr = navImg ? navImg.getBoundingClientRect() : null;
        if (!fast && nr && nr.height > 0 && nr.top >= 0 && lr.height > 0) {
          // logo-mark.png is the crop of logo-full.png at x:53 y:4, 335×192 (of 443×285)
          var markH = lr.height * 192 / 285;
          var s = nr.height / markH;
          var tx = nr.left - (lr.left + s * lr.width * 53 / 443);
          var ty = nr.top - (lr.top + s * lr.height * 4 / 285);
          logo.style.transition = 'transform .95s cubic-bezier(.65,0,.35,1)';
          logo.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + s + ')';
          moved = true;
        }
      } catch (e) {}
      setTimeout(finish, moved ? 900 : 120);
    }

    var delay = Math.max(700, 2700 - (window.performance && performance.now ? performance.now() : 0));
    var timer = setTimeout(function () { leave(false); }, delay);

    function skip() { clearTimeout(timer); leave(true); }
    splash.addEventListener('click', skip);
    document.addEventListener('keydown', function onKey(e) {
      if (left) { document.removeEventListener('keydown', onKey); return; }
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') skip();
    });
  });

  /* -------------------------------------------------------
     3. Navigation — mega menu (desktop) + submenu (mobile)
  ------------------------------------------------------- */
  safe(function () {
    var nav = $('.site-nav');
    var trigger = $('[data-mega-trigger]');
    var mega = document.getElementById('mega-solutions');
    var mobileSub = document.getElementById('mobile-solutions');
    var navLinks = document.getElementById('nav-links');
    var toggle = $('.nav-toggle');
    if (!nav) return;
    var desktopMQ = window.matchMedia('(min-width: 1080px)');
    var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    var closeTimer;

    function isDesktop() { return desktopMQ.matches; }

    function openMega() {
      if (!mega) return;
      clearTimeout(closeTimer);
      mega.classList.add('is-open');
      nav.classList.add('mega-open');
      trigger.setAttribute('aria-expanded', 'true');
    }
    function closeMega(focusTrigger) {
      if (!mega) return;
      mega.classList.remove('is-open');
      nav.classList.remove('mega-open');
      if (isDesktop()) trigger.setAttribute('aria-expanded', 'false');
      if (focusTrigger) trigger.focus();
    }
    function toggleSub(force) {
      if (!mobileSub) return;
      var open = typeof force === 'boolean' ? force : !mobileSub.classList.contains('is-open');
      mobileSub.classList.toggle('is-open', open);
      trigger.setAttribute('aria-expanded', String(open));
    }
    function syncMode() {
      if (!trigger) return;
      closeMega(false);
      toggleSub(false);
      trigger.setAttribute('aria-controls', isDesktop() ? 'mega-solutions' : 'mobile-solutions');
      if (isDesktop() && navLinks && navLinks.classList.contains('is-open')) {
        navLinks.classList.remove('is-open');
        document.body.classList.remove('nav-open');
        if (toggle) toggle.setAttribute('aria-expanded', 'false');
      }
    }

    if (trigger) {
      syncMode();
      if (desktopMQ.addEventListener) desktopMQ.addEventListener('change', syncMode);
      else if (desktopMQ.addListener) desktopMQ.addListener(syncMode);

      trigger.addEventListener('click', function (e) {
        e.preventDefault();
        if (isDesktop()) {
          if (mega.classList.contains('is-open')) closeMega(false); else openMega();
        } else {
          toggleSub();
        }
      });
      trigger.addEventListener('keydown', function (e) {
        if (!isDesktop()) return;
        var open = mega.classList.contains('is-open');
        if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey && open)) {
          e.preventDefault(); openMega();
          var first = mega.querySelector('a'); if (first) first.focus();
        }
      });
      // Tab order: trigger → mega links → next nav item (mega sits later in the DOM)
      if (mega) {
        mega.addEventListener('keydown', function (e) {
          if (e.key !== 'Tab' || !isDesktop()) return;
          var links = Array.prototype.slice.call(mega.querySelectorAll('a'));
          var i = links.indexOf(document.activeElement);
          if (e.shiftKey && i === 0) {
            e.preventDefault(); trigger.focus();
          } else if (!e.shiftKey && i === links.length - 1) {
            e.preventDefault(); closeMega(false);
            var li = trigger.closest('li');
            var next = li && li.nextElementSibling ? li.nextElementSibling.querySelector('a, button') : document.querySelector('.nav-cta');
            if (next) next.focus();
          }
        });
      }

      var hoverZone = [trigger.parentNode, mega];
      hoverZone.forEach(function (el) {
        if (!el) return;
        el.addEventListener('mouseenter', function () { if (isDesktop() && finePointer.matches) openMega(); });
        el.addEventListener('mouseleave', function () {
          if (!isDesktop() || !finePointer.matches) return;
          closeTimer = setTimeout(function () { closeMega(false); }, 200);
        });
      });

      if (mega) {
        mega.addEventListener('focusout', function (e) {
          if (!mega.contains(e.relatedTarget) && e.relatedTarget !== trigger) closeMega(false);
        });
        mega.querySelectorAll('a').forEach(function (a) {
          a.addEventListener('click', function () { closeMega(false); });
        });
      }
      document.addEventListener('click', function (e) {
        if (mega && mega.classList.contains('is-open') && !mega.contains(e.target) && !trigger.contains(e.target)) closeMega(false);
      });
    }

    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      if (mega && mega.classList.contains('is-open')) { closeMega(true); return; }
      if (navLinks && navLinks.classList.contains('is-open') && toggle) { toggle.click(); toggle.focus(); }
    });

    // mobile: move focus into the menu when it opens
    if (toggle && navLinks) {
      toggle.addEventListener('click', function () {
        setTimeout(function () {
          if (navLinks.classList.contains('is-open')) {
            var first = navLinks.querySelector('a, button'); if (first) first.focus({ preventScroll: true });
          }
        }, 60);
      });
    }
  });

  /* -------------------------------------------------------
     4. Scroll: progress line + gentle hero parallax
  ------------------------------------------------------- */
  safe(function () {
    var nav = $('.site-nav');
    var progress = $('.scroll-progress');
    var heroLayer = $('.hero-media .parallax');
    var ticking = false;
    function update() {
      ticking = false;
      var y = window.pageYOffset || document.documentElement.scrollTop;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      if (progress) progress.style.setProperty('--progress', max > 0 ? Math.min(1, y / max).toFixed(4) : 0);
      if (nav) nav.classList.toggle('is-scrolled', y > 12);
      if (heroLayer && !reduceMotion && y < window.innerHeight * 1.2) {
        heroLayer.style.setProperty('--hero-shift', (y * 0.22).toFixed(1) + 'px');
        heroLayer.style.setProperty('--hero-scale', (1.04 + y / window.innerHeight * 0.06).toFixed(4));
      }
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    update();
  });

  /* -------------------------------------------------------
     5. Reveal (complements main.js; also covers .reveal-media)
  ------------------------------------------------------- */
  safe(function () {
    var els = $$('.reveal, .reveal-media');
    if (!els.length) return;
    if (!('IntersectionObserver' in window) || reduceMotion) {
      els.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); io.unobserve(entry.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    els.forEach(function (el) { io.observe(el); });
    // never leave content hidden (e.g. very tall elements, print, odd viewports)
    setTimeout(function () {
      els.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('is-visible');
      });
    }, 1200);
  });

  /* -------------------------------------------------------
     6. Image fallbacks
  ------------------------------------------------------- */
  function markFrame(img) {
    var frame = img.closest('.svc-frame, .media-frame, .sol-card-media');
    if (!frame || frame.closest('.svc-preview')) return;
    if (img.complete && img.naturalWidth > 0) frame.classList.add('is-loaded');
    else if (img.complete && img.getAttribute('src')) frame.classList.add('is-error');
  }
  safe(function () {
    document.addEventListener('load', function (e) {
      if (e.target && e.target.tagName === 'IMG') markFrame(e.target);
    }, true);
    document.addEventListener('error', function (e) {
      var t = e.target;
      if (t && t.tagName === 'IMG') {
        var frame = t.closest('.svc-frame, .media-frame, .sol-card-media');
        if (frame) { frame.classList.remove('is-loaded'); frame.classList.add('is-error'); }
      }
    }, true);
    $$('.svc-frame img, .media-frame img, .sol-card-media img').forEach(function (img) {
      if (img.complete) markFrame(img);
    });
  });

  /* -------------------------------------------------------
     7. Service explorer — hover preview (desktop),
        tap-to-expand accordion (touch / tablet / mobile)
  ------------------------------------------------------- */
  safe(function () {
    var ex = $('[data-explorer]');
    if (!ex) return;
    var items = $$('.svc-item', ex);
    var preview = $('.svc-preview', ex);
    var pFrame = preview ? $('.svc-frame', preview) : null;
    var pImg = pFrame ? $('img', pFrame) : null;
    var hoverMQ = window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 1024px)');
    var token = 0, hoverTimer, active = null;

    function isHoverMode() { return hoverMQ.matches; }

    function setPreview(item) {
      if (!preview || !item || item === active) return;
      if (active) active.classList.remove('is-active');
      active = item;
      item.classList.add('is-active');
      var d = item.dataset;
      var my = ++token;

      preview.classList.add('is-switching');
      pFrame.classList.remove('is-loaded', 'is-error');
      var started = Date.now();

      var loader = new Image();
      loader.decoding = 'async';
      loader.sizes = '(min-width:1024px) 50vw, 100vw';
      loader.srcset = d.srcset;
      loader.src = d.src;

      function show(ok) {
        if (my !== token) return;
        var wait = Math.max(0, 260 - (Date.now() - started)); // let the skeleton register
        setTimeout(function () {
          if (my !== token) return;
          if (ok) {
            pImg.sizes = loader.sizes;
            pImg.srcset = d.srcset;
            pImg.src = d.src;
            pImg.alt = d.alt || '';
            requestAnimationFrame(function () { if (my === token) pFrame.classList.add('is-loaded'); });
          } else {
            pFrame.classList.add('is-error');
          }
        }, wait);
      }
      loader.onload = function () { show(true); };
      loader.onerror = function () { show(false); };

      setTimeout(function () {
        if (my !== token) return;
        $('.svc-preview-num', preview).textContent = d.num;
        $('.svc-preview-cat', preview).textContent = d.cat;
        $('.svc-preview-title', preview).textContent = d.title;
        $('.svc-preview-desc', preview).textContent = d.desc;
        var link = $('.svc-preview-link', preview);
        link.setAttribute('href', d.href);
        link.setAttribute('aria-label', 'View details: ' + d.title);
        preview.classList.remove('is-switching');
      }, 160);
    }

    function setOpen(item, open) {
      item.classList.toggle('is-open', open);
      var btn = $('.svc-trigger', item);
      btn.setAttribute('aria-expanded', String(open));
      if (open) {
        var img = $('.svc-panel img', item);
        if (img && img.loading === 'lazy') img.loading = 'eager';
      }
    }

    function applyMode() {
      items.forEach(function (it) {
        var btn = $('.svc-trigger', it);
        if (isHoverMode()) {
          it.classList.remove('is-open');
          btn.removeAttribute('aria-expanded');
          btn.removeAttribute('aria-controls');
        } else {
          it.classList.remove('is-active');
          btn.setAttribute('aria-controls', $('.svc-panel', it).id);
          setOpen(it, false);
        }
      });
      active = null;
      if (isHoverMode()) setPreview(items[0]);
    }

    items.forEach(function (it) {
      var btn = $('.svc-trigger', it);
      btn.addEventListener('mouseenter', function () {
        if (!isHoverMode()) return;
        clearTimeout(hoverTimer);
        hoverTimer = setTimeout(function () { setPreview(it); }, 70);
      });
      btn.addEventListener('focus', function () { if (isHoverMode()) setPreview(it); });
      btn.addEventListener('click', function () {
        if (isHoverMode()) {
          window.location.href = it.dataset.href;
        } else {
          var willOpen = !it.classList.contains('is-open');
          items.forEach(function (o) { if (o !== it) setOpen(o, false); });
          setOpen(it, willOpen);
          if (willOpen) {
            setTimeout(function () {
              var r = it.getBoundingClientRect();
              var navH = ($('.site-nav') || {}).offsetHeight || 0;
              if (r.top < navH + 8) window.scrollBy({ top: r.top - navH - 12, behavior: reduceMotion ? 'auto' : 'smooth' });
            }, 460);
          }
        }
      });
    });

    applyMode();
    if (hoverMQ.addEventListener) hoverMQ.addEventListener('change', applyMode);
    else if (hoverMQ.addListener) hoverMQ.addListener(applyMode);

    // warm the cache for the remaining previews once the page is idle (desktop only)
    var idle = window.requestIdleCallback || function (cb) { return setTimeout(cb, 1500); };
    idle(function () {
      if (!isHoverMode()) return;
      items.slice(1, 5).forEach(function (it) {
        var i = new Image(); i.sizes = '50vw'; i.srcset = it.dataset.srcset; i.src = it.dataset.src;
      });
    });
  });

  /* -------------------------------------------------------
     8. Category sub-navigation highlight
  ------------------------------------------------------- */
  safe(function () {
    var links = $$('.subnav a[href^="#"]');
    if (!links.length || !('IntersectionObserver' in window)) return;
    var map = {};
    links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) { a.removeAttribute('aria-current'); });
        var a = map[en.target.id];
        if (a) {
          a.setAttribute('aria-current', 'true');
          var list = a.parentNode.parentNode;
          if (list && list.scrollWidth > list.clientWidth) {
            var delta = a.getBoundingClientRect().left - list.getBoundingClientRect().left;
            list.scrollTo({ left: Math.max(0, list.scrollLeft + delta - 16), behavior: reduceMotion ? 'auto' : 'smooth' });
          }
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(map).forEach(function (id) { var el = document.getElementById(id); if (el) io.observe(el); });
  });

  /* -------------------------------------------------------
     9. Business enquiry form — extra fields
     main.js (unchanged) sends name/email/phone/message.
     The extra fields are validated here and folded into the
     message for the duration of main.js's synchronous submit
     step, then the visitor's own text is restored.
  ------------------------------------------------------- */
  safe(function () {
    var form = document.getElementById('early-access-form');
    if (!form || !form.hasAttribute('data-enquiry-form')) return;
    var cat = form.querySelector('#enquiry-type');
    var org = form.querySelector('#organisation');
    var loc = form.querySelector('#project-location');
    var msg = form.querySelector('#message');
    var status = form.querySelector('.form-status');
    var original = null;

    // Pre-select a category from ?enquiry=… (e.g. "Partner With Us")
    try {
      var want = new URLSearchParams(window.location.search).get('enquiry');
      if (want && cat && cat.querySelector('option[value="' + want.replace(/[^a-z-]/g, '') + '"]')) cat.value = want;
    } catch (e) {}

    function catValid() {
      var ok = !!(cat && cat.value);
      var wrap = cat && cat.closest('.field');
      if (wrap) wrap.classList.toggle('has-error', !ok);
      return ok;
    }
    if (cat) cat.addEventListener('change', catValid);

    function clean(v, max) { return String(v || '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, max); }

    document.addEventListener('submit', function (e) {
      if (e.target !== form) return;
      if (!catValid()) {
        e.preventDefault();
        e.stopImmediatePropagation(); // main.js does not send this submission
        ['#name', '#email', '#phone', '#message'].forEach(function (s) {
          var el = form.querySelector(s); if (el) el.dispatchEvent(new Event('blur'));
        });
        ['#consent', '#terms'].forEach(function (s) {
          var el = form.querySelector(s); if (el) el.dispatchEvent(new Event('change'));
        });
        if (status) { status.classList.remove('is-ok'); status.textContent = 'Please complete the highlighted fields above.'; }
        cat.focus();
        return;
      }
      if (msg && msg.value.trim().length >= 5) {
        original = msg.value;
        var opt = cat.options[cat.selectedIndex];
        var lines = [
          'Enquiry category: ' + clean(opt ? opt.text : cat.value, 80),
          'Organisation: ' + (clean(org && org.value, 160) || '—'),
          'Project location: ' + (clean(loc && loc.value, 160) || '—'),
          '',
          'Message:',
          ''
        ];
        msg.value = lines.join('\n') + original;
      }
    }, true);

    document.addEventListener('submit', function (e) {
      if (e.target === form && original !== null) { msg.value = original; original = null; }
    }, false);
  });

  /* -------------------------------------------------------
     10. Careers: allow the context menu inside form fields
     (so the resume link can be pasted with right-click)
  ------------------------------------------------------- */
  safe(function () {
    document.addEventListener('contextmenu', function (e) {
      if (e.target && e.target.closest && e.target.closest('input, textarea, select')) {
        e.stopImmediatePropagation();
      }
    }, true);
  });

  /* -------------------------------------------------------
     11. Footer year
  ------------------------------------------------------- */
  safe(function () {
    $$('[data-year]').forEach(function (el) { el.textContent = String(new Date().getFullYear()); });
  });
})();
