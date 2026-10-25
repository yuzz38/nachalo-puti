/* Начало пути — интерактив лендинга. © 2026, Полунин Лев */
(function () {
  'use strict';

  var doc = document.documentElement;
  doc.classList.add('js');

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- год в подвале ---------- */
  var year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- header + бургер ---------- */
  var header = $('#header');
  var burger = $('#burger');
  var nav = $('#nav');
  var fab = $('.fab');

  function setMenu(open) {
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    nav.classList.toggle('is-open', open);
    header.classList.toggle('menu-open', open);
    document.body.classList.toggle('is-locked', open);
  }
  if (burger && nav) {
    burger.addEventListener('click', function () {
      setMenu(burger.getAttribute('aria-expanded') !== 'true');
    });
    $$('a', nav).forEach(function (a) {
      a.addEventListener('click', function () { setMenu(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) { setMenu(false); burger.focus(); }
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 960 && nav.classList.contains('is-open')) setMenu(false);
    });
  }

  /* ---------- скролл: шапка, высотомер, маршрут, FAB ---------- */
  var altFill = $('.altimeter__fill');
  var altBalloon = $('.altimeter__balloon');
  var routeLine = $('#routeLine');
  var routeSection = $('#route');
  var routeLen = 0;

  if (routeLine && routeLine.getTotalLength) {
    try {
      routeLen = routeLine.getTotalLength();
      routeLine.style.strokeDasharray = routeLen;
      routeLine.style.strokeDashoffset = reduceMotion ? 0 : routeLen;
    } catch (e) { routeLen = 0; }
  }

  var ticking = false;
  function onScroll() {
    var y = window.pageYOffset || doc.scrollTop;
    var max = Math.max(1, doc.scrollHeight - window.innerHeight);
    var p = Math.min(1, Math.max(0, y / max));

    if (header) header.classList.toggle('is-solid', y > 20);
    if (fab) fab.classList.toggle('is-on', y > window.innerHeight * 0.6);

    if (altFill) altFill.style.height = (p * 100) + '%';
    if (altBalloon) altBalloon.style.bottom = (p * 100) + '%';

    if (routeLen && routeSection && !reduceMotion) {
      var r = routeSection.getBoundingClientRect();
      var vh = window.innerHeight;
      var k = (vh * 0.85 - r.top) / (r.height * 0.75);
      k = Math.min(1, Math.max(0, k));
      routeLine.style.strokeDashoffset = routeLen * (1 - k);
    }
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; window.requestAnimationFrame(onScroll); }
  }, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* ---------- активный пункт высотомера ---------- */
  var altLinks = $$('.altimeter__list a');
  if ('IntersectionObserver' in window && altLinks.length) {
    var map = {};
    altLinks.forEach(function (a) { map[a.getAttribute('data-alt')] = a; });
    var secObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && map[en.target.id]) {
          altLinks.forEach(function (a) { a.classList.remove('is-on'); a.removeAttribute('aria-current'); });
          map[en.target.id].classList.add('is-on');
          map[en.target.id].setAttribute('aria-current', 'true');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(map).forEach(function (id) { var s = document.getElementById(id); if (s) secObs.observe(s); });
  }

  /* ---------- появление блоков ---------- */
  var revealSel = '.route .h2, .route .lead, .stop, .inside .h2, .inside .lead, .card-photo, .perk, .bag .h2, .bag .lead, .checklist, .gift__copy, .gift__card, .season .h2, .season .lead, .tag-card, .delivery .h2, .delivery .lead, .ring, .reviews .h2, .places .h2, .place, .contacts, .map';
  var revealEls = $$(revealSel);
  if ('IntersectionObserver' in window && !reduceMotion) {
    revealEls.forEach(function (el) { el.classList.add('reveal'); });
    var rObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          var el = en.target;
          var sib = el.parentNode ? Array.prototype.indexOf.call(el.parentNode.children, el) : 0;
          el.style.transitionDelay = Math.min(sib, 5) * 70 + 'ms';
          el.classList.add('is-in');
          rObs.unobserve(el);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealEls.forEach(function (el) { rObs.observe(el); });
  }
  // повороты карточек сохраняем через CSS-переменную
  $$('.card-photo').forEach(function (el, i) { el.style.setProperty('--rot', ['-2.5deg', '2deg', '-1.5deg'][i % 3]); });

  /* ---------- сумка в роддом ---------- */
  var boxes = $$('.checklist input[type="checkbox"]');
  var bagCount = $('#bagCount');
  var bagTotal = $('#bagTotal');
  var bagLevel = $('.bag__level');
  var STORE_KEY = 'np-bag-v1';

  function readStore() {
    try { return JSON.parse(window.localStorage.getItem(STORE_KEY) || '[]'); } catch (e) { return []; }
  }
  function writeStore(arr) {
    try { window.localStorage.setItem(STORE_KEY, JSON.stringify(arr)); } catch (e) { /* приватный режим */ }
  }
  function updateBag() {
    var n = 0, saved = [];
    boxes.forEach(function (b, i) {
      if (b.checked) { n++; saved.push(i); }
      var lbl = b.closest ? b.closest('label') : b.parentNode;
      if (lbl) lbl.classList.toggle('is-checked', b.checked);
    });
    if (bagCount) bagCount.textContent = n;
    if (bagLevel) {
      var h = 66 * (boxes.length ? n / boxes.length : 0);
      bagLevel.setAttribute('height', h.toFixed(1));
      bagLevel.setAttribute('y', (104 - h).toFixed(1));
    }
    writeStore(saved);
  }
  if (boxes.length) {
    if (bagTotal) bagTotal.textContent = boxes.length;
    readStore().forEach(function (i) { if (boxes[i]) boxes[i].checked = true; });
    boxes.forEach(function (b) { b.addEventListener('change', updateBag); });
    updateBag();
  }

  /* ---------- подбор подарка ---------- */
  var chips = $$('.chip');
  var budget = $('#budget');
  var budgetOut = $('#budgetOut');
  var giftText = $('#giftText');
  var giftCopy = $('#giftCopy');
  var giftHint = $('#giftHint');
  var occasion = 'на выписку';

  function fmt(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₽'; }
  function updateGift() {
    var v = budget ? parseInt(budget.value, 10) : 5000;
    if (budgetOut) budgetOut.textContent = fmt(v);
    if (budget) {
      var pct = (v - budget.min) / (budget.max - budget.min) * 100;
      budget.style.setProperty('--p', pct + '%');
    }
    if (giftText) giftText.textContent = 'Здравствуйте! Хочу подарок ' + occasion + ', бюджет около ' + fmt(v) + '. Поможете подобрать?';
  }
  chips.forEach(function (c) {
    c.addEventListener('click', function () {
      chips.forEach(function (x) { x.classList.remove('is-on'); x.setAttribute('aria-checked', 'false'); });
      c.classList.add('is-on'); c.setAttribute('aria-checked', 'true');
      occasion = c.getAttribute('data-val');
      updateGift();
    });
  });
  if (budget) budget.addEventListener('input', updateGift);
  updateGift();

  function copyText(t) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(t);
    return new Promise(function (res, rej) {
      var ta = document.createElement('textarea');
      ta.value = t; ta.setAttribute('readonly', '');
      ta.style.position = 'fixed'; ta.style.top = '-1000px'; ta.style.fontSize = '16px';
      document.body.appendChild(ta);
      ta.select(); ta.setSelectionRange(0, t.length);
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      ok ? res() : rej();
    });
  }
  if (giftCopy) {
    giftCopy.addEventListener('click', function () {
      copyText(giftText.textContent).then(function () {
        giftHint.textContent = 'Скопировано — отправьте сообщение магазину или прочитайте по телефону';
      }, function () {
        giftHint.textContent = 'Не удалось скопировать — просто позвоните нам';
      });
      setTimeout(function () { giftHint.textContent = ''; }, 4000);
    });
  }

  /* ---------- слайдер отзывов ---------- */
  var slider = $('#slider');
  var track = $('#track');
  var prev = $('#revPrev');
  var next = $('#revNext');
  var dotsWrap = $('#dots');
  if (slider && track) {
    var slides = $$('.review', track);
    var dots = [];
    slides.forEach(function (s, i) {
      s.setAttribute('role', 'group');
      s.setAttribute('aria-roledescription', 'слайд');
      s.setAttribute('aria-label', (i + 1) + ' из ' + slides.length);
      if (dotsWrap) {
        var d = document.createElement('button');
        d.type = 'button';
        d.setAttribute('role', 'tab');
        d.setAttribute('aria-label', 'Отзыв ' + (i + 1));
        d.addEventListener('click', function () { goTo(i); });
        dotsWrap.appendChild(d);
        dots.push(d);
      }
    });

    function step() {
      if (slides.length < 2) return slider.clientWidth;
      return slides[1].offsetLeft - slides[0].offsetLeft;
    }
    function goTo(i) {
      i = Math.max(0, Math.min(slides.length - 1, i));
      var left = slides[i].offsetLeft - slides[0].offsetLeft;
      if (slider.scrollTo) slider.scrollTo({ left: left, behavior: reduceMotion ? 'auto' : 'smooth' });
      else slider.scrollLeft = left;
    }
    function current() { return Math.round(slider.scrollLeft / Math.max(1, step())); }
    function sync() {
      var i = current();
      var atEnd = slider.scrollLeft + slider.clientWidth >= slider.scrollWidth - 4;
      if (atEnd) i = slides.length - 1;
      dots.forEach(function (d, k) {
        d.classList.toggle('is-on', k === i);
        d.setAttribute('aria-selected', k === i ? 'true' : 'false');
      });
      if (prev) prev.disabled = slider.scrollLeft <= 4;
      if (next) next.disabled = atEnd;
    }
    if (prev) prev.addEventListener('click', function () { goTo(current() - 1); });
    if (next) next.addEventListener('click', function () { goTo(current() + 1); });
    var sT;
    slider.addEventListener('scroll', function () { clearTimeout(sT); sT = setTimeout(sync, 60); }, { passive: true });
    window.addEventListener('resize', sync);
    slider.setAttribute('tabindex', '0');
    slider.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); goTo(current() + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(current() - 1); }
    });

    // перетаскивание мышью на десктопе (на тач-устройствах работает нативный свайп)
    var down = false, startX = 0, startL = 0, moved = false;
    slider.addEventListener('mousedown', function (e) {
      down = true; moved = false; startX = e.pageX; startL = slider.scrollLeft;
      slider.style.scrollSnapType = 'none'; slider.style.cursor = 'grabbing';
    });
    window.addEventListener('mousemove', function (e) {
      if (!down) return;
      var dx = e.pageX - startX;
      if (Math.abs(dx) > 4) moved = true;
      slider.scrollLeft = startL - dx;
    });
    window.addEventListener('mouseup', function () {
      if (!down) return;
      down = false; slider.style.cursor = '';
      var i = current();
      slider.style.scrollSnapType = '';
      goTo(i);
    });
    slider.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); } }, true);
    slider.style.cursor = 'grab';

    sync();
  }

  /* ---------- карта (Яндекс, ленивая загрузка) ---------- */
  var mapBox = $('#map');
  var places = $$('.place');
  var routeLink = $('#routeLink');

  function mapUrl(addr) {
    return 'https://yandex.ru/map-widget/v1/?text=' + encodeURIComponent(addr) + '&z=16&l=map';
  }
  function setMap(addr) {
    if (!mapBox) return;
    var fr = $('iframe', mapBox);
    if (!fr) {
      fr = document.createElement('iframe');
      fr.title = 'Карта: магазин «Начало пути»';
      fr.loading = 'lazy';
      fr.setAttribute('allowfullscreen', '');
      fr.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
      fr.addEventListener('load', function () {
        var ph = $('.map__placeholder', mapBox); if (ph) ph.style.display = 'none';
      });
      mapBox.appendChild(fr);
    }
    fr.src = mapUrl(addr);
  }
  if (mapBox) {
    var first = mapBox.getAttribute('data-src');
    if ('IntersectionObserver' in window) {
      var mObs = new IntersectionObserver(function (en) {
        if (en[0].isIntersecting) { mObs.disconnect(); if (!$('iframe', mapBox)) setMap(mapBox.getAttribute('data-src')); }
      }, { rootMargin: '300px' });
      mObs.observe(mapBox);
    } else { setMap(first); }
  }
  places.forEach(function (p) {
    p.addEventListener('click', function () {
      places.forEach(function (x) { x.classList.remove('is-on'); x.setAttribute('aria-selected', 'false'); });
      p.classList.add('is-on'); p.setAttribute('aria-selected', 'true');
      var addr = p.getAttribute('data-map');
      if (mapBox) mapBox.setAttribute('data-src', addr);
      setMap(addr);
      if (routeLink) routeLink.href = p.getAttribute('data-link');
    });
  });
})();
