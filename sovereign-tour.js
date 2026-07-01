/* ============================================================
   TownSuite.com 2026 — V3 sovereign switch auto-tour
   When the sovereignty section first scrolls into view, it walks
   once through the four scenarios (exposed → layered → world →
   sealed) so visitors see the switch is interactive — then rests
   on the sovereign answer. Any click by the user cancels the tour
   and hands them control. Respects reduced-motion + motion toggle.
   Loaded ONLY by "index.html".
   ============================================================ */
(function () {
  var box = document.querySelector(".ts-juris");
  if (!box) return;

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return;
  if (document.body.getAttribute("data-motion") === "off") return;

  var order = ["exposed", "layered", "world", "sealed"];
  var btnFor = {};
  box.querySelectorAll(".ts-juris__switch button").forEach(function (b) {
    btnFor[b.getAttribute("data-mode")] = b;
  });

  var userTook = false, toured = false, timer = null;
  /* any real user click on the switch cancels the auto-tour for good */
  box.querySelectorAll(".ts-juris__switch button").forEach(function (b) {
    b.addEventListener("pointerdown", function () { userTook = true; clearTimeout(timer); });
  });

  function runTour() {
    if (userTook || toured) return;
    toured = true;
    var i = 0;
    (function step() {
      if (userTook) return;
      var b = btnFor[order[i]];
      if (b) b.click();
      i++;
      if (i < order.length) timer = setTimeout(step, 7000);
    })();
  }

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting && !toured && !userTook) {
          setTimeout(runTour, 650);
          io.disconnect();
        }
      });
    }, { threshold: 0.45 });
    io.observe(box);
  }
})();
