/* ============================================================
   TownSuite.com 2026 — V3 module connection map
   Click/tap a module to trace how it connects: the module
   highlights, its linked modules light up, others dim, and
   animated wires flow between them. Positions are read live,
   so it works at every resolution and reflow.
   Loaded ONLY by "index.html".
   ============================================================ */
(function () {
  var scroll = document.querySelector(".x-modscroll");
  if (!scroll) return;
  var svg = scroll.querySelector(".x-modwire");
  var caption = document.querySelector(".x-modcap");
  var capTxt = caption ? caption.querySelector(".x-modcap__txt") : null;
  if (!svg) return;

  var SVGNS = "http://www.w3.org/2000/svg";
  var mods = Array.prototype.slice.call(scroll.querySelectorAll(".ts-mod[data-key]"));
  var byKey = {};
  mods.forEach(function (m) { byKey[m.dataset.key] = m; });

  /* Build a SYMMETRIC adjacency map: if A lists B, B is also linked to A.
     This keeps a trace consistent no matter which module you click. */
  var adj = {};
  mods.forEach(function (m) { adj[m.dataset.key] = {}; });
  mods.forEach(function (m) {
    (m.dataset.links || "").split(",").map(function (s) { return s.trim(); }).filter(Boolean)
      .forEach(function (t) {
        if (!adj[t]) return;            // ignore links to unknown keys
        adj[m.dataset.key][t] = 1;
        adj[t][m.dataset.key] = 1;      // mirror
      });
  });

  var active = null;
  var defaultMsg = capTxt ? capTxt.innerHTML : "";

  function links(el) {
    return Object.keys(adj[el.dataset.key] || {});
  }
  function localRect(el) {
    var c = scroll.getBoundingClientRect(), r = el.getBoundingClientRect();
    return {
      w: r.width, h: r.height,
      cx: r.left - c.left + r.width / 2,
      cy: r.top - c.top + r.height / 2
    };
  }
  /* boundary point of a card, from its centre toward (px,py) */
  function anchor(rc, px, py) {
    var dx = px - rc.cx, dy = py - rc.cy;
    if (dx === 0 && dy === 0) return { x: rc.cx, y: rc.cy };
    var tx = dx !== 0 ? (rc.w / 2) / Math.abs(dx) : Infinity;
    var ty = dy !== 0 ? (rc.h / 2) / Math.abs(dy) : Infinity;
    var t = Math.min(tx, ty);
    return { x: rc.cx + dx * t, y: rc.cy + dy * t };
  }
  function clearWires() { while (svg.firstChild) svg.removeChild(svg.firstChild); }

  /* On phones the spatial wire map is replaced by a compact tile grid with
     tappable connection chips, so we skip the SVG wires entirely there. */
  function isMobile() { return window.matchMedia("(max-width: 560px)").matches; }
  function clearChips() {
    var old = scroll.querySelectorAll(".ts-mod__links");
    Array.prototype.forEach.call(old, function (n) { n.parentNode.removeChild(n); });
  }
  function buildChips(src) {
    clearChips();
    if (!src || !isMobile()) return;
    var ks = links(src);
    if (!ks.length) return;
    var wrap = document.createElement("div");
    wrap.className = "ts-mod__links";
    var lbl = document.createElement("span");
    lbl.className = "ts-modlbl";
    lbl.textContent = "Connects to";
    wrap.appendChild(lbl);
    ks.forEach(function (k) {
      var t = byKey[k]; if (!t) return;
      var chip = document.createElement("button");
      chip.type = "button";
      chip.className = "ts-modchip";
      chip.textContent = t.dataset.label;
      chip.addEventListener("click", function (e) { e.stopPropagation(); select(k); });
      wrap.appendChild(chip);
    });
    src.appendChild(wrap);
  }

  function draw() {
    clearWires();
    if (!active || !byKey[active]) return;
    if (isMobile()) return;
    var w = scroll.clientWidth, h = scroll.clientHeight;
    svg.setAttribute("width", w);
    svg.setAttribute("height", h);
    svg.setAttribute("viewBox", "0 0 " + w + " " + h);
    var src = byKey[active], srcR = localRect(src);
    links(src).forEach(function (k) {
      var t = byKey[k]; if (!t) return;
      var tR = localRect(t);
      var a = anchor(srcR, tR.cx, tR.cy);
      var b = anchor(tR, srcR.cx, srcR.cy);
      var mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      var dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
      var bend = Math.min(48, len * 0.16);
      var cx = mx + (-dy / len) * bend, cy = my + (dx / len) * bend;
      var path = document.createElementNS(SVGNS, "path");
      path.setAttribute("d", "M" + a.x + " " + a.y + " Q" + cx + " " + cy + " " + b.x + " " + b.y);
      svg.appendChild(path);
      var dot = document.createElementNS(SVGNS, "rect");
      var sz = 7.4;
      dot.setAttribute("width", sz);
      dot.setAttribute("height", sz);
      dot.setAttribute("x", b.x - sz / 2);
      dot.setAttribute("y", b.y - sz / 2);
      dot.setAttribute("rx", "1.3");
      dot.setAttribute("transform", "rotate(45 " + b.x + " " + b.y + ")");
      svg.appendChild(dot);
      requestAnimationFrame(function () { path.classList.add("is-vis"); dot.classList.add("is-vis"); });
    });
  }

  function setCaption() {
    if (!capTxt) return;
    if (!active || !byKey[active]) { capTxt.innerHTML = defaultMsg; return; }
    var src = byKey[active];
    var names = links(src).map(function (k) { return byKey[k] ? byKey[k].dataset.label : k; });
    var list = names.length > 1
      ? names.slice(0, -1).join(", ") + " and " + names[names.length - 1]
      : (names[0] || "");
    capTxt.innerHTML = "<b>" + src.dataset.label + "</b> connects to " + list + ".";
  }

  function select(key) {
    if (active === key) { clearSel(); return; }
    active = key;
    scroll.classList.add("is-tracing");
    var src = byKey[key], lk = links(src);
    mods.forEach(function (m) {
      m.classList.remove("is-on", "is-link");
      m.setAttribute("aria-pressed", "false");
    });
    src.classList.add("is-on");
    src.setAttribute("aria-pressed", "true");
    lk.forEach(function (k) { if (byKey[k]) byKey[k].classList.add("is-link"); });
    setCaption();
    draw();
    buildChips(src);
  }
  function clearSel() {
    active = null;
    scroll.classList.remove("is-tracing");
    mods.forEach(function (m) {
      m.classList.remove("is-on", "is-link");
      m.setAttribute("aria-pressed", "false");
    });
    clearWires();
    clearChips();
    setCaption();
  }

  mods.forEach(function (m) {
    m.addEventListener("click", function () { select(m.dataset.key); });
    m.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(m.dataset.key); }
    });
  });

  /* Escape clears an active trace */
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && active) clearSel();
  });

  var rt;
  function onResize() { clearTimeout(rt); rt = setTimeout(function () { if (!active) return; draw(); if (isMobile()) buildChips(byKey[active]); else clearChips(); }, 120); }
  window.addEventListener("resize", onResize);
  window.addEventListener("load", function () { if (active) draw(); });
})();
