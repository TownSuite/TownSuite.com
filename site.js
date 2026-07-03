/* TownSuite 2026 — shared site behavior (theme, journey, depth, modules, chat) */
(function () {
  "use strict";
  var doc = document, root = doc.documentElement;

  /* ---------------- theme (light / dark / auto = follow OS) ---------------- */
  var mq = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  function getTheme() {
    try { return localStorage.getItem("ts-theme") || "auto"; } catch (e) { return "auto"; }
  }
  function resolveTheme(t) {
    if (t === "auto") return (mq && mq.matches) ? "dark" : "light";
    return t === "dark" ? "dark" : "light";
  }
  function setTheme(t) {
    root.setAttribute("data-theme", resolveTheme(t));
    try { localStorage.setItem("ts-theme", t); } catch (e) {}
    try{doc.querySelectorAll(".ts-themer").forEach(function(b){b.setAttribute("aria-pressed", String(resolveTheme(t)==="dark"));});}catch(e){}
  }
  setTheme(getTheme());
  /* live-follow the OS when preference is auto */
  if (mq) {
    var onMq = function () { if (getTheme() === "auto") root.setAttribute("data-theme", resolveTheme("auto")); };
    if (mq.addEventListener) mq.addEventListener("change", onMq);
    else if (mq.addListener) mq.addListener(onMq);
  }
  window.tsSetTheme = setTheme;
  window.tsGetTheme = getTheme;

  function bindThemers() {
    doc.querySelectorAll(".ts-themer").forEach(function (btn) {
      btn.addEventListener("click", function () {
        /* explicit toggle picks the opposite of what's currently shown */
        setTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark");
      });
    });
  }

  /* ---------------- motion / depth flags (tweakable) ---------------- */
  window.tsSetFlag = function (name, on) {
    doc.body.setAttribute("data-" + name, on ? "on" : "off");
  };

  /* ---------------- smooth anchor scroll (no scrollIntoView) ---------------- */
  function scrollToEl(el) {
    if (!el) return;
    var y = el.getBoundingClientRect().top + window.pageYOffset - 84;
    window.scrollTo({ top: y, behavior: "smooth" });
  }
  function bindAnchors() {
    doc.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener("click", function (ev) {
        var id = a.getAttribute("href").slice(1);
        var el = doc.getElementById(id);
        if (el) { ev.preventDefault(); scrollToEl(el); closeMenu(); }
      });
    });
  }

  /* ---------------- top nav scrolled state ---------------- */
  function bindNavScroll() {
    var nav = doc.querySelector(".ts-nav");
    if (!nav) return;
    var onScroll = function () { nav.classList.toggle("is-scrolled", window.scrollY > 12); };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------------- mobile menu ---------------- */
  function closeMenu() {
    var m = doc.querySelector(".ts-mmenu");
    if (m) m.classList.remove("is-open");
  }
  function bindMenu() {
    var burger = doc.querySelector(".ts-burger");
    var menu = doc.querySelector(".ts-mmenu");
    if (!burger || !menu) return;
    burger.addEventListener("click", function () { menu.classList.add("is-open"); });
    menu.querySelectorAll("[data-close]").forEach(function (b) {
      b.addEventListener("click", closeMenu);
    });
  }

  /* ---------------- reveal on scroll ---------------- */
  function bindReveals() {
    var els = doc.querySelectorAll(".ts-reveal");
    if (!("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        // If the element has already scrolled above the viewport by the time this
        // callback fires (fast scroll), snap it to its final state with no entrance
        // animation — so content you've already scrolled past never animates in.
        if (en.boundingClientRect.bottom <= 0) {
          var prev = el.style.transition;
          el.style.transition = "none";
          el.classList.add("is-in");
          void el.offsetHeight; // force reflow so the transition-less state applies
          el.style.transition = prev;
        } else {
          el.classList.add("is-in");
        }
        io.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------------- journey rail (variant 1) ---------------- */
  function bindRail() {
    var rail = doc.querySelector(".ts-rail");
    if (!rail) return;
    var stops = Array.prototype.slice.call(rail.querySelectorAll(".ts-rail__stop"));
    var fill = rail.querySelector(".ts-rail__fill");
    var pctEl = rail.querySelector(".ts-rail__pct b");
    var pctLbl = rail.querySelector(".ts-rail__pct .w");
    var sections = stops.map(function (s) { return doc.getElementById(s.getAttribute("data-target")); });

    stops.forEach(function (s, i) {
      s.addEventListener("click", function () { scrollToEl(sections[i]); });
    });

    function update() {
      var max = doc.documentElement.scrollHeight - window.innerHeight;
      var atEnd = max <= 0 || window.scrollY >= max - 2;
      var p = max > 0 ? Math.min(1, window.scrollY / max) : 1;
      if (atEnd) p = 1;
      if (fill) fill.style.height = (p * 100) + "%";
      if (pctEl) pctEl.textContent = Math.round(p * 100) + "%";
      var mid = window.scrollY + window.innerHeight * 0.45;
      var hereIdx = 0;
      sections.forEach(function (sec, i) {
        if (sec && (sec.getBoundingClientRect().top + window.pageYOffset) <= mid) hereIdx = i;
      });
      if (atEnd) hereIdx = sections.length - 1;
      stops.forEach(function (s, i) {
        s.classList.toggle("is-done", i < hereIdx || p >= 1);
        s.classList.toggle("is-here", i === hereIdx && p < 1);
      });
      var complete = p >= 1;
      rail.classList.toggle("is-complete", complete);
      if (pctLbl) pctLbl.textContent = complete ? "Tour complete" : "Explored";
    }
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  /* ---------------- chapter rail (variant 2) ---------------- */
  function bindChapters() {
    var chs = Array.prototype.slice.call(doc.querySelectorAll("[data-chapter]"));
    if (!chs.length) return;
    var links = Array.prototype.slice.call(doc.querySelectorAll(".x-rail__ch, .x-dock a"));
    var fill = doc.querySelector(".x-rail__prog .fil");
    var pct = doc.querySelector(".x-rail__prog .lbl b");
    var prog = doc.querySelector(".x-rail__prog");

    function update() {
      var max = doc.documentElement.scrollHeight - window.innerHeight;
      var atEnd = max <= 0 || window.scrollY >= max - 2;
      var p = max > 0 ? Math.min(1, window.scrollY / max) : 1;
      if (atEnd) p = 1;
      if (fill) fill.style.width = (p * 100) + "%";
      if (pct) pct.textContent = p >= 1 ? "Done" : Math.round(p * 100) + "%";
      if (prog) prog.classList.toggle("is-complete", p >= 1);
      var mid = window.scrollY + window.innerHeight * 0.4;
      var current = chs[0] && chs[0].id;
      chs.forEach(function (sec) {
        if ((sec.getBoundingClientRect().top + window.pageYOffset) <= mid) current = sec.id;
      });
      if (atEnd && chs.length) current = chs[chs.length - 1].id;
      var passed = true;
      links.forEach(function (a) {
        var t = (a.getAttribute("href") || "").slice(1);
        var active = t === current;
        a.classList.toggle("is-active", active);
        if (a.classList.contains("x-rail__ch")) {
          if (active) passed = false;
          a.classList.toggle("is-done", passed && !active);
        }
      });
      /* journey complete (100%) — also check off the final chapter (e.g. Book a demo) */
      if (p >= 1) {
        var railChs = doc.querySelectorAll(".x-rail__ch");
        if (railChs.length) railChs[railChs.length - 1].classList.add("is-done");
      }
    }
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  /* ---------------- hero depth parallax ---------------- */
  function bindDepth() {
    var field = doc.querySelector(".ts-depth");
    if (!field) return;
    var raf = null;
    doc.addEventListener("pointermove", function (ev) {
      if (doc.body.getAttribute("data-depth") !== "on") return;
      if (raf) return;
      raf = requestAnimationFrame(function () {
        raf = null;
        var nx = (ev.clientX / window.innerWidth - 0.5) * 2;
        var ny = (ev.clientY / window.innerHeight - 0.5) * 2;
        field.style.setProperty("--px", (nx * -14) + "px");
        field.style.setProperty("--py", (ny * -10) + "px");
      });
    });
  }

  /* ---------------- card tilt ---------------- */
  function bindTilt() {
    doc.querySelectorAll(".ts-tilt").forEach(function (el) {
      el.addEventListener("pointermove", function (ev) {
        if (doc.body.getAttribute("data-depth") !== "on") return;
        var r = el.getBoundingClientRect();
        var nx = (ev.clientX - r.left) / r.width - 0.5;
        var ny = (ev.clientY - r.top) / r.height - 0.5;
        el.style.setProperty("--ry", (nx * 7) + "deg");
        el.style.setProperty("--rx", (ny * -7) + "deg");
      });
      el.addEventListener("pointerleave", function () {
        el.style.setProperty("--ry", "0deg");
        el.style.setProperty("--rx", "0deg");
      });
    });
    /* v2 hero stack */
    var stack = doc.querySelector(".x-hero__stack");
    if (stack) {
      doc.addEventListener("pointermove", function (ev) {
        if (doc.body.getAttribute("data-depth") !== "on") return;
        var nx = (ev.clientX / window.innerWidth - 0.5) * 2;
        var ny = (ev.clientY / window.innerHeight - 0.5) * 2;
        stack.querySelectorAll(".x-layer").forEach(function (l) {
          l.style.setProperty("--ry2", (nx * 4) + "deg");
          l.style.setProperty("--rx2", (ny * -3) + "deg");
        });
      });
    }
  }

  /* ---------------- connected trio group tilt (v2) ---------------- */
  function bindTrio() {
    var trio = doc.querySelector(".x-trio__cards");
    if (!trio) return;
    trio.addEventListener("pointermove", function (ev) {
      if (doc.body.getAttribute("data-depth") !== "on") return;
      var r = trio.getBoundingClientRect();
      var nx = (ev.clientX - r.left) / r.width - 0.5;
      var ny = (ev.clientY - r.top) / r.height - 0.5;
      trio.style.setProperty("--try", (nx * 5) + "deg");
      trio.style.setProperty("--trx", (ny * -4) + "deg");
    });
    trio.addEventListener("pointerleave", function () {
      trio.style.setProperty("--try", "0deg");
      trio.style.setProperty("--trx", "0deg");
    });
  }

  /* ---------------- module wire map ---------------- */
  function bindModMap() {
    var map = doc.querySelector(".ts-modmap");
    if (!map) return;
    var svg = map.querySelector("svg.wires");
    var core = map.querySelector(".ts-mod--core");
    var mods = Array.prototype.slice.call(map.querySelectorAll(".ts-mod:not(.ts-mod--core)"));
    if (!svg || !core) return;

    function center(el) {
      var m = map.getBoundingClientRect(), r = el.getBoundingClientRect();
      return { x: r.left - m.left + r.width / 2, y: r.top - m.top + r.height / 2 };
    }
    function draw() {
      svg.setAttribute("width", map.offsetWidth);
      svg.setAttribute("height", map.offsetHeight);
      svg.innerHTML = "";
      var c = center(core);
      mods.forEach(function (mod, i) {
        var p = center(mod);
        var path = doc.createElementNS("http://www.w3.org/2000/svg", "path");
        var mx = (p.x + c.x) / 2;
        path.setAttribute("d", "M" + p.x + "," + p.y + " C" + mx + "," + p.y + " " + mx + "," + c.y + " " + c.x + "," + c.y);
        path.setAttribute("data-i", i);
        svg.appendChild(path);
      });
    }
    function wire(i, on) {
      var p = svg.querySelector('path[data-i="' + i + '"]');
      if (p) p.classList.toggle("is-live", on);
      core.classList.toggle("is-hot", on);
    }
    mods.forEach(function (mod, i) {
      mod.addEventListener("pointerenter", function () { wire(i, true); });
      mod.addEventListener("pointerleave", function () { wire(i, false); });
      mod.addEventListener("focus", function () { wire(i, true); }, true);
      mod.addEventListener("blur", function () { wire(i, false); }, true);
    });
    window.addEventListener("resize", draw);
    /* redraw after fonts/layout settle */
    setTimeout(draw, 60);
    setTimeout(draw, 600);
  }

  /* ---------------- jurisdiction switch ---------------- */
  function bindJuris() {
    var box = doc.querySelector(".ts-juris");
    if (!box) return;
    var btns = box.querySelectorAll(".ts-juris__switch button");
    function setMode(mode) {
      box.classList.toggle("ts-juris--exposed", mode === "exposed");
      box.classList.toggle("ts-juris--layered", mode === "layered");
      box.classList.toggle("ts-juris--sealed", mode === "sealed");
      box.classList.toggle("ts-juris--world", mode === "world");
      btns.forEach(function (b) {
        var on = b.getAttribute("data-mode") === mode;
        b.classList.toggle("is-on", on);
        b.setAttribute("aria-pressed", on ? "true" : "false");
      });
      box.querySelectorAll("[data-when]").forEach(function (el) {
        el.style.display = el.getAttribute("data-when") === mode ? "" : "none";
      });
    }
    btns.forEach(function (b) {
      b.addEventListener("click", function () { setMode(b.getAttribute("data-mode")); });
    });
    setMode("exposed");

    /* Each scenario has a different amount of content, so switching modes changes
       the stage's height — which shifts everything below it down (and reads as the
       page "scrolling" during the auto-tour). Reserve the tallest scenario's height
       up front so mode changes never reflow the page. Recomputed on resize/font-load
       since the wrap (and therefore the tallest state) depends on width. */
    var stage = box.querySelector(".ts-juris__stage");
    function lockStageHeight() {
      if (!stage) return;
      // Stacked layout (≤920px, one column): each scenario sizes to its own content.
      // Reserving the tallest mode's height here would leave big dead space under the
      // shorter scenarios (exposed / layered). Only the side-by-side layout needs a
      // reserved height so the page doesn't reflow while the auto-tour steps through.
      if (window.matchMedia && window.matchMedia("(max-width:920px)").matches) {
        stage.style.minHeight = "";
        return;
      }
      var active = ["exposed", "layered", "sealed", "world"].filter(function (m) {
        return box.classList.contains("ts-juris--" + m);
      })[0] || "exposed";
      stage.style.minHeight = "";
      var max = 0;
      ["exposed", "layered", "world", "sealed"].forEach(function (m) {
        setMode(m);
        if (stage.offsetHeight > max) max = stage.offsetHeight;
      });
      setMode(active);
      stage.style.minHeight = max + "px";
    }
    lockStageHeight();
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(lockStageHeight);
    window.addEventListener("load", lockStageHeight);
    // iOS Safari fires `resize` on scroll (the address bar collapsing/expanding) and when
    // the keyboard opens — none of which change the layout width. Re-running the measure
    // pass on those events collapses and restores the reserved height and reads as a
    // flicker, so only recompute when the viewport WIDTH actually changes.
    var rt, lastW = window.innerWidth;
    window.addEventListener("resize", function () {
      if (window.innerWidth === lastW) return;
      lastW = window.innerWidth;
      clearTimeout(rt);
      rt = setTimeout(lockStageHeight, 200);
    }, { passive: true });
  }

  /* ---------------- scrollytelling steps (v2 + v3) ---------------- */
  function bindStory() {
    var steps = Array.prototype.slice.call(doc.querySelectorAll(".x-step"));
    if (!steps.length) return;
    var visuals = Array.prototype.slice.call(doc.querySelectorAll(".x-vislayer"));
    var current = -1;

    function focusStep(idx) {
      if (idx === current) return;
      current = idx;
      steps.forEach(function (s, i) { s.classList.toggle("is-focus", i === idx); });
      visuals.forEach(function (v, i) { v.classList.toggle("is-lit", i === idx); });
    }

    /* deterministic: focus the step whose centre is closest to the reading line */
    function update() {
      var mid = window.innerHeight * 0.45;
      var best = 0, bestD = Infinity;
      steps.forEach(function (s, i) {
        var r = s.getBoundingClientRect();
        var d = Math.abs(r.top + r.height / 2 - mid);
        if (d < bestD) { bestD = d; best = i; }
      });
      focusStep(best);
    }
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();

    /* click / keyboard: jump to a step from either column */
    function goStep(i) {
      var s = steps[i];
      var r = s.getBoundingClientRect();
      var y = r.top + window.pageYOffset - window.innerHeight * 0.45 + r.height / 2;
      window.scrollTo({ top: y, behavior: "smooth" });
      focusStep(i);
    }
    steps.forEach(function (s, i) {
      s.setAttribute("tabindex", "0");
      s.addEventListener("click", function () { goStep(i); });
      s.addEventListener("keydown", function (ev) {
        if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); goStep(i); }
      });
    });
    visuals.forEach(function (v, i) {
      if (i >= steps.length) return;
      v.style.cursor = "pointer";
      v.addEventListener("click", function () { goStep(i); });
    });
  }

  /* ---------------- horizontal module scroller (v2) ---------------- */
  function bindModScroll() {
    var sc = doc.querySelector(".x-modscroll");
    if (!sc) return;
    doc.querySelectorAll(".x-modnav button").forEach(function (b) {
      b.addEventListener("click", function () {
        var dir = b.getAttribute("data-dir") === "next" ? 1 : -1;
        sc.scrollBy({ left: dir * 300, behavior: "smooth" });
      });
    });
  }

  /* ---------------- book-a-demo modal — hosts the live 311 widget in an isolated iframe ---------------- */
  function bindDemoModal() {
    var modal = null, frame = null, closeTimer = null, pendingCard = null, pendingDetails = null, pendingProducts = null, lastFocus = null;

    function build() {
      if (modal) return;
      modal = doc.createElement("div");
      modal.className = "ts-dmodal";
      modal.innerHTML =
        '<div class="ts-dmodal__scrim"></div>' +
        '<div class="ts-dmodal__panel" role="dialog" aria-modal="true" aria-label="Connect with us" data-screen-label="Connect with us modal">' +
          '<div class="ts-dmodal__head">' +
            '<div class="ts-dmodal__hgroup"><b>Connect with us</b><small>How can we help?</small></div>' +
            '<button class="ts-dmodal__x" type="button" aria-label="Close">\u2715</button>' +
          '</div>' +
          '<div class="ts-dmodal__body ts-dmodal__body--embed">' +
            '<div class="ts-dmodal__loading"><i></i><i></i><i></i></div>' +
            '<iframe class="ts-dmodal__frame" title="TownSuite request form"></iframe>' +
          '</div>' +
        '</div>';
      doc.body.appendChild(modal);
      frame = modal.querySelector(".ts-dmodal__frame");
      /* deep-link: once the widget renders its cards, jump to the requested one */
      frame.addEventListener("load", function () {
        if (frame.getAttribute("src") === "about:blank") return;
        /* hand the chat summary to the embed; it injects it into the request body once
           the visitor picks a category and the description field appears. */
        if (pendingDetails || (pendingProducts && pendingProducts.length)) {
          try { frame.contentWindow.postMessage({ ts311Details: pendingDetails, ts311Products: pendingProducts }, window.location.origin); } catch (e) { }
        }
        if (!pendingCard) return;
        var want = pendingCard.toLowerCase(), tries = 0;
        pendingCard = null;
        (function poll() {
          var hit = null;
          try {
            var names = frame.contentDocument.querySelectorAll(".p311requestname");
            for (var i = 0; i < names.length; i++) {
              if (names[i].textContent.trim().toLowerCase() === want) { hit = names[i].closest(".item311"); break; }
            }
          } catch (e) { return; }
          if (hit) { hit.click(); }
          else if (++tries < 20) { setTimeout(poll, 300); }
        })();
      });
      modal.querySelector(".ts-dmodal__scrim").addEventListener("click", closeModal);
      modal.querySelector(".ts-dmodal__x").addEventListener("click", closeModal);
      doc.addEventListener("keydown", function (e) { if (e.key === "Escape" && modal.classList.contains("is-open")) closeModal(); });
      /* focus trap: if focus escapes to the (inert) background while open, pull it back */
      doc.addEventListener("focusin", function (e) { if (modal.classList.contains("is-open") && !modal.contains(e.target)) { var x = modal.querySelector(".ts-dmodal__x"); if (x) x.focus(); } });

      /* the embed page reports its content height so the frame fits (modal body scrolls past max) */
      window.addEventListener("message", function (e) {
        if (e.origin !== window.location.origin) return;   // only trust our own 311 iframe
        if (e.data && e.data.ts311Close) { closeModal(); return; }
        if (e.data && e.data.ts311Height && frame) {
          var h = Math.max(280, e.data.ts311Height);
          if (Math.abs(h - (parseInt(frame.style.height, 10) || 0)) > 4) {
            frame.style.height = h + "px";
          }
          modal.classList.add("is-loaded");
        }
      });
    }

    function currentTheme() {
      return doc.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
    }

    /* make everything except the modal inert while it is open (focus + SR isolation) */
    function setInert(on) {
      var k = doc.body.children, i, el;
      for (i = 0; i < k.length; i++) {
        el = k[i]; if (el === modal) continue;
        if (on) { el.setAttribute("aria-hidden", "true"); try { el.inert = true; } catch (e) {} }
        else { el.removeAttribute("aria-hidden"); try { el.inert = false; } catch (e) {} }
      }
    }
    function openModal(card, details, products) {
      build();
      lastFocus = doc.activeElement;
      pendingCard = typeof card === "string" && card ? card : null;
      pendingDetails = (typeof details === "string" && details.trim()) ? details : null;
      pendingProducts = Array.isArray(products) ? products : null;
      /* cancel any in-flight teardown so it can't blank the frame we're loading */
      if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
      /* fresh load every open — reusing a half-finished widget session breaks its
         lazy deps (Kendo) and leaves it mid-form. A reload always starts clean. */
      modal.classList.remove("is-loaded");
      frame.style.height = "";
      frame.setAttribute("src", "311-embed.html?theme=" + currentTheme() + "&r=" + Date.now());
      doc.body.style.overflow = "hidden";
      requestAnimationFrame(function () {
        modal.classList.add("is-open");
        setInert(true);
        var x = modal.querySelector(".ts-dmodal__x"); if (x) x.focus();
      });
    }
    function closeModal() {
      modal.classList.remove("is-open");
      doc.body.style.overflow = "";
      setInert(false);
      if (lastFocus && lastFocus.focus) { try { lastFocus.focus(); } catch (e) {} }
      /* after the fade, drop the widget session so nothing keeps running.
         touches only the iframe src — never visibility — so even a stray
         timer can't leave the modal stuck hidden. */
      closeTimer = setTimeout(function () {
        closeTimer = null;
        frame.setAttribute("src", "about:blank");
      }, 300);
    }

    /* triggers: any in-page "Book a demo" CTA opens the modal. Matches
       [data-demo-open], demo-labelled links pointing at #start / #contact / #,
       and Demo-subject mailto links — the mailto href is left intact so it still
       works as a no-JS fallback. Delegated from the document so CTAs added after
       load (and clicks on child <span> arrows) are all captured. */
    function tsIsDemoTrigger(a) {
      if (!a) return false;
      if (a.hasAttribute("data-demo-open")) return true;
      var t = (a.textContent || "").toLowerCase();
      if (!/\bdemo\b/.test(t)) return false;
      var href = a.getAttribute("href") || "";
      if (href === "#start" || href === "#contact" || href === "#") return true;
      if (/^mailto:[^?]*marketing@townsuite\.com/i.test(href) && /demo/i.test(href)) return true;
      return false;
    }
    doc.addEventListener("click", function (e) {
      var a = e.target && e.target.closest ? e.target.closest("a[href], [data-demo-open]") : null;
      if (!tsIsDemoTrigger(a)) return;
      e.preventDefault();
      var card = a.getAttribute ? a.getAttribute("data-demo-open") : null;
      openModal(card || undefined);
    });

    /* let the chat (and anything else) open the modal at a specific card */
    window.tsOpenDemo = openModal;
  }

  /* ---------------- "Try TownSuite Intelligence" — open the live chat ----------------
     Replaces an inline onclick="window.tsOpenChat()" so there's no inline-handler
     dependency. Guards against embed.js failing to load by falling back to #start. */
  function bindOpenChat() {
    doc.addEventListener("click", function (e) {
      var el = e.target && e.target.closest ? e.target.closest("[data-ts-openchat]") : null;
      if (!el) return;
      e.preventDefault();
      if (typeof window.tsOpenChat === "function") { window.tsOpenChat(); }
      else { location.hash = "#start"; }
    });
  }

  /* ---------------- pause looping animations while off-screen ----------------
     Sections tagged [data-pause-offscreen] get a .ts-anim-off class whenever they
     are fully scrolled out of view, so their infinite CSS animations (e.g. the
     Chapter 02 jurisdiction flow lines + pulsing dots) stop instead of running
     unseen and distracting lower down the page. Re-enables on scroll-back. */
  function bindAnimGuard() {
    var els = doc.querySelectorAll("[data-pause-offscreen]");
    if (!els.length || !("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        en.target.classList.toggle("ts-anim-off", !en.isIntersecting);
      });
    }, { threshold: 0, rootMargin: "-25% 0px -8% 0px" });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------------- boot ---------------- */
  doc.addEventListener("DOMContentLoaded", function () {
    bindThemers();
    bindAnchors();
    bindNavScroll();
    bindMenu();
    bindReveals();
    bindRail();
    bindChapters();
    bindDepth();
    bindTilt();
    bindModMap();
    bindTrio();
    bindJuris();
    bindStory();
    bindModScroll();
    bindDemoModal();
    bindOpenChat();
    bindAnimGuard();
  });
})();
