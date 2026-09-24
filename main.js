(function () {
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  var root = document.documentElement;

  /* ---------- Scroll reveal (first, so content can never stay hidden) ---------- */
  var reveals = $$('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('is-in'); io.unobserve(entry.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }
  window.__bbReady = true;

  /* ---------- Sticky nav state + mobile quick bar ---------- */
  var nav = $('[data-nav]');
  var quickbar = $('[data-quickbar]');
  var hero = $('.hero');
  var onScroll = function () {
    var y = window.scrollY;
    if (nav) nav.classList.toggle('is-scrolled', y > 8);
    if (quickbar && hero) quickbar.classList.toggle('is-visible', y > hero.offsetHeight * 0.6);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile drawer ---------- */
  var burger = $('[data-burger]');
  var drawer = $('[data-drawer]');
  if (burger && drawer) {
    var outside = $$('main, footer, [data-quickbar], .skip-link');
    var raf = 0, hideTimer = 0;
    var isOpen = function () { return burger.getAttribute('aria-expanded') === 'true'; };
    var setDrawer = function (open) {
      burger.setAttribute('aria-expanded', String(open));
      $('.sr-only', burger).textContent = open ? 'Close navigation' : 'Open navigation';
      document.body.classList.toggle('drawer-open', open);
      document.body.style.overflow = open ? 'hidden' : '';
      // keep keyboard and screen-reader focus inside the drawer + header while it's open
      outside.forEach(function (el) { el.inert = open; });
      cancelAnimationFrame(raf);
      clearTimeout(hideTimer);
      if (open) {
        drawer.hidden = false;
        raf = requestAnimationFrame(function () {
          drawer.classList.add('is-open');
          var first = $('a', drawer);
          if (first) first.focus({ preventScroll: true });
        });
      } else {
        drawer.classList.remove('is-open');
        hideTimer = setTimeout(function () { drawer.hidden = true; }, 350);
      }
    };
    burger.addEventListener('click', function () { setDrawer(!isOpen()); });
    $$('a', drawer).forEach(function (a) { a.addEventListener('click', function () { setDrawer(false); }); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen()) { setDrawer(false); burger.focus(); }
    });
    var mq = window.matchMedia('(max-width: 960px)');
    var onMQ = function (e) { if (!e.matches && isOpen()) setDrawer(false); };
    if (mq.addEventListener) mq.addEventListener('change', onMQ); else if (mq.addListener) mq.addListener(onMQ);
  }

  /* ---------- Pause / play decorative motion (WCAG 2.2.2) ---------- */
  var motionBtn = $('[data-motion]');
  if (motionBtn) {
    var setPaused = function (paused) {
      root.classList.toggle('motion-paused', paused);
      motionBtn.setAttribute('aria-pressed', String(paused));
    };
    try { if (localStorage.getItem('bb-motion-paused') === '1') setPaused(true); } catch (e) {}
    motionBtn.addEventListener('click', function () {
      var paused = !root.classList.contains('motion-paused');
      setPaused(paused);
      try { localStorage.setItem('bb-motion-paused', paused ? '1' : '0'); } catch (e) {}
    });
  }

  /* ---------- Live open / closed status (New York time) ---------- */
  // Hours: every day 12:00–22:00. Happy hour Mon–Fri 12–17. Brunch Sat & Sun 12–15:30.
  var OPEN = 12 * 60, CLOSE = 22 * 60, HH_END = 17 * 60, BRUNCH_END = 15 * 60 + 30;
  var DAYS = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

  var nyNow = function () {
    var parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York', weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23'
    }).formatToParts(new Date());
    var get = function (t) { return (parts.filter(function (p) { return p.type === t; })[0] || {}).value; };
    return { day: DAYS[get('weekday')], mins: (+get('hour') % 24) * 60 + +get('minute') };
  };

  var updateStatus = function () {
    var now;
    try { now = nyNow(); } catch (e) { return; }
    var day = now.day, mins = now.mins;
    var open = mins >= OPEN && mins < CLOSE;
    var weekday = day >= 1 && day <= 5;
    var text;
    if (open) {
      text = 'Open now · until 10 PM';
      if (weekday && mins < HH_END) text = 'Open now · Happy hour until 5';
      else if (!weekday && mins < BRUNCH_END) text = 'Open now · Brunch until 3:30';
    } else {
      text = mins < OPEN ? 'Closed · Opens today at noon' : 'Closed · Opens tomorrow at noon';
    }
    $$('[data-status]').forEach(function (el) {
      el.classList.toggle('is-open', open);
      el.classList.toggle('is-closed', !open);
      $('[data-status-text]', el).textContent = text;
    });
    $$('.hours-table tr').forEach(function (tr) { tr.classList.toggle('is-today', +tr.dataset.day === day); });
  };
  updateStatus();
  // re-check just after each minute boundary (NY offsets are whole hours, so UTC minutes line up)
  (function tick() {
    setTimeout(function () { updateStatus(); tick(); }, 60000 - (Date.now() % 60000) + 250);
  })();
  document.addEventListener('visibilitychange', function () { if (!document.hidden) updateStatus(); });
  window.addEventListener('pageshow', updateStatus);

  /* ---------- Footer year ---------- */
  var year = $('[data-year]');
  if (year) year.textContent = new Date().getFullYear();
})();
