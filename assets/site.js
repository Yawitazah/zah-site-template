/* Shared behaviour for both designs. No framework, no build step.
   Reveal animates unconditionally (house rule: no reduced-motion branch),
   with the visibility/load/timer failsafes so a page can never stay blank. */
(function () {
  'use strict';

  /* Year */
  document.querySelectorAll('.yr').forEach(function (el) { el.textContent = String(new Date().getFullYear()); });

  /* Mobile nav */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.site-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') { nav.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); }
    });
  }

  /* Reveal on scroll, with failsafes */
  var items = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  function showAll() { items.forEach(function (el) { el.classList.add('in'); }); }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
  } else { showAll(); }
  window.addEventListener('load', function () { setTimeout(function () {
    items.forEach(function (el) { var r = el.getBoundingClientRect(); if (r.top < window.innerHeight) el.classList.add('in'); });
  }, 300); });
  setTimeout(showAll, 4000);
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') setTimeout(showAll, 1200); });

  /* Manifest ticks light up one by one */
  var ticks = document.querySelectorAll('.manifest-list li');
  ticks.forEach(function (li, i) { setTimeout(function () { li.classList.add('on'); }, 900 + i * 260); });

  /* Contact form: the ZAH CRM seam bounces back with ?sent=1 */
  if (/[?&]sent=1/.test(window.location.search)) {
    var sent = document.querySelector('.form .sent');
    if (sent) { sent.hidden = false; sent.scrollIntoView({ block: 'center' }); }
    var f = document.querySelector('.form');
    if (f) f.querySelectorAll('input:not([type=hidden]), textarea').forEach(function (i) { i.value = ''; });
  }

  /* Settings the client changes through her AI (phone, email, bookingUrl)
     arrive rendered by Site MCP; data-setting hooks keep the header CTA in
     step when only the text was edited. Nothing to do at runtime. */
})();
