/* ============================================================
   TownSuite.com 2026 — V3 onboarding walkthrough
   Auto-plays the onboarding phases in sequence (Assess → Build →
   Test & sign-off loop → Go-live → Post) so a visitor's eye is
   walked through the whole cycle. Plays only while the section is
   on screen; respects reduced-motion and the site motion toggle.
   Loaded ONLY by "index.html".
   ============================================================ */
(function () {
  var row = document.querySelector(".x-phases");
  if (!row) return;

  var phases = Array.prototype.slice.call(row.children).filter(function (n) { return n.classList.contains("x-phase"); });
  var conns  = Array.prototype.slice.call(row.children).filter(function (n) { return n.classList.contains("x-conn"); });
  var gate   = row.querySelector(".x-gate");
  if (phases.length < 4 || !gate) return;

  var assess = phases[0], build = phases[1], golive = phases[2], post = phases[3];
  var c1 = conns[0] || null;   // Assess → Build
  var c2 = conns[1] || null;   // Go-live → Post

  /* --- Mobile "player" support. Tag each card with a focus key and expose the
     current focus on the row via data-focus, so the mobile stage (CSS) can show
     ONE card at a time instead of a tall scrolling stack. Also build a compact
     progress rail. All of this is mobile-only in CSS; desktop/tablet ignore it.
     data-focus is set only while the walkthrough is actually playing, so the
     reduced-motion / no-JS fallback keeps the plain stacked cards. --- */
  assess.dataset.fkey = "assess";
  build.dataset.fkey = "build";
  golive.dataset.fkey = "golive";
  post.dataset.fkey = "post";
  gate.dataset.fkey = "gate";

  var railDots = {};
  (function buildRail() {
    var rail = document.createElement("div");
    rail.className = "x-phasenav";
    rail.setAttribute("aria-hidden", "true");
    [["assess", "01"], ["build", "02"], ["gate", "\u21BB"], ["golive", "03"], ["post", "04"]].forEach(function (s) {
      var seg = document.createElement("span");
      seg.className = "x-phasenav__seg" + (s[0] === "gate" ? " x-phasenav__seg--loop" : "");
      seg.textContent = s[1];
      rail.appendChild(seg);
      railDots[s[0]] = seg;
    });
    row.parentNode.insertBefore(rail, row.nextSibling);
  })();

  function updateFocus() {
    var f = gate.classList.contains("is-active") ? "gate"
          : post.classList.contains("is-active") ? "post"
          : golive.classList.contains("is-active") ? "golive"
          : build.classList.contains("is-active") ? "build"
          : assess.classList.contains("is-active") ? "assess" : null;
    if (!f) return;                       // breath step: hold the last card on screen
    row.setAttribute("data-focus", f);
    Object.keys(railDots).forEach(function (k) { railDots[k].classList.toggle("is-on", k === f); });
  }

  function clearAll() {
    phases.forEach(function (p) { p.classList.remove("is-active"); });
    conns.forEach(function (c) { c.classList.remove("is-active"); });
    gate.classList.remove("is-active", "is-loop", "is-fwd");
  }

  /* the walkthrough timeline — each step lights its targets for `d` ms */
  var steps = [
    { on: function () { clearAll(); assess.classList.add("is-active"); }, d: 3000 },
    { on: function () { clearAll(); if (c1) c1.classList.add("is-active"); assess.classList.add("is-active"); }, d: 700 },
    { on: function () { clearAll(); build.classList.add("is-active"); }, d: 3000 },
    /* Build ⇄ Test & sign-off loop: TWO visible build cycles, then approval */
    { on: function () { clearAll(); gate.classList.add("is-active", "is-loop"); }, d: 1500 },
    { on: function () { clearAll(); build.classList.add("is-active"); gate.classList.add("is-active", "is-loop"); }, d: 1500 },   /* rebuild #1 */
    { on: function () { clearAll(); gate.classList.add("is-active", "is-loop"); }, d: 1500 },
    { on: function () { clearAll(); build.classList.add("is-active"); gate.classList.add("is-active", "is-loop"); }, d: 1500 },   /* rebuild #2 */
    { on: function () { clearAll(); gate.classList.add("is-active", "is-loop"); }, d: 1500 },
    /* approved → flow forward to Go-live */
    { on: function () { clearAll(); gate.classList.add("is-active", "is-fwd"); }, d: 2200 },
    { on: function () { clearAll(); golive.classList.add("is-active"); }, d: 3000 },
    { on: function () { clearAll(); if (c2) c2.classList.add("is-active"); golive.classList.add("is-active"); }, d: 700 },
    { on: function () { clearAll(); post.classList.add("is-active"); }, d: 3200 },
    { on: function () { clearAll(); }, d: 1200 }   /* breath before the loop restarts */
  ];

  var i = 0, timer = null, playing = false;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function motionOff() { return document.body.getAttribute("data-motion") === "off"; }

  function tick() {
    var s = steps[i];
    s.on();
    updateFocus();
    timer = setTimeout(function () { i = (i + 1) % steps.length; tick(); }, s.d);
  }
  function start() {
    if (playing || reduce || motionOff()) return;
    playing = true;
    row.classList.add("is-playing");
    row.setAttribute("data-focus", "assess");
    i = 0; tick();
  }
  function stop() {
    if (!playing) return;
    playing = false;
    clearTimeout(timer);
    row.classList.remove("is-playing");
    /* keep data-focus so the mobile stage stays compact even when the section is
       scrolled out of view — removing it would revert to the tall stacked layout
       and shift the document height (the "wonky" jump crossing the 5→6 boundary). */
    clearAll();
  }

  if (reduce) return;   /* leave everything static for reduced-motion users */

  /* lock the mobile single-card stage in immediately (motion on), so its height is
     stable from first paint and never toggles against the tall stacked fallback. */
  if (!motionOff()) row.setAttribute("data-focus", "assess");

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) start(); else stop(); });
    }, { threshold: 0.4 });
    io.observe(row);
  } else {
    start();
  }

  /* pause when the tab is hidden so it resumes cleanly */
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stop();
  });
})();
