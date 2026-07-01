/* ============================================================
   TownSuite mERP — animated logo
   Morphs the legacy "TownSuite" wordmark into the new
   "TownSuite mERP®" lockup: the six brand squares lift off,
   tour an urban/rural survey map, then reassemble as the emblem.
   Drives any inline <svg class="ts-logo-anim"> built from the
   #ts-logo-anim markup. Rests on the final lockup.
   ============================================================ */
(function () {
  // per-square: A = legacy emblem (right) · sc = parcel on the survey map · B = new emblem
  var SQ = [
    { Ax: 782.06, Ay: 182.99, scX: 431, scY: 111, scS: 1.15, scR: 0,  Bx: 220.79, By: 191.54 },
    { Ax: 760.82, Ay: 237.40, scX: 306, scY: 236, scS: 1.15, scR: 0,  Bx: 188.71, By: 273.70 },
    { Ax: 797.56, Ay: 219.19, scX: 306, scY: 111, scS: 1.15, scR: 0,  Bx: 244.20, By: 246.20 },
    { Ax: 832.89, Ay: 249.13, scX: 774, scY: 137, scS: 1.30, scR: 78, Bx: 297.55, By: 291.42 },
    { Ax: 849.56, Ay: 237.01, scX: 894, scY: 236, scS: 1.70, scR: 52, Bx: 322.72, By: 273.11 },
    { Ax: 838.28, Ay: 268.49, scX: 743, scY: 309, scS: 1.90, scR: 70, Bx: 305.69, By: 320.65 }
  ];

  function rest(svg) {
    var set = function (sel, css) { var el = svg.querySelector(sel); if (el) Object.assign(el.style, css); };
    set('.ts-anim-old', { opacity: '0' });
    set('.ts-anim-new', { opacity: '1', letterSpacing: '-1.5px', transform: 'none' });
    set('.ts-anim-survey', { opacity: '0' });
    set('.ts-anim-labels', { opacity: '0' });
    svg.querySelectorAll('.sqx').forEach(function (xEl) {
      var d = SQ[+xEl.dataset.i];
      xEl.style.transform = 'translateX(' + d.Bx + 'px)';
      var yEl = xEl.querySelector('.sqy'); if (yEl) yEl.style.transform = 'translateY(' + d.By + 'px)';
      var r = xEl.querySelector('.sqr'); if (r) r.style.transform = 'rotate(65deg) scale(1.38)';
    });
  }

  function play(svg) {
    if (svg._anims) { svg._anims.forEach(function (a) { a.cancel(); }); }
    var q = function (s) { return svg.querySelector(s); };
    var D = 6800;
    var opt = { duration: D, fill: 'forwards', easing: 'linear' };
    var outX = 'cubic-bezier(.42,0,.22,1)', outY = 'cubic-bezier(.55,.04,.3,1)',
        inX = 'cubic-bezier(.34,0,.16,1)', inY = 'cubic-bezier(.5,.02,.24,1)';
    var a = [];
    var push = function (el, kf) { if (el) a.push(el.animate(kf, opt)); };

    push(q('.ts-anim-old'), [
      { opacity: 1, offset: 0 }, { opacity: 1, offset: 0.22, easing: 'ease-in' },
      { opacity: 0, offset: 0.36 }, { opacity: 0, offset: 1 }
    ]);
    push(q('.ts-anim-new'), [
      { opacity: 0, letterSpacing: '12px', transform: 'translate(16px,0px)', offset: 0 },
      { opacity: 0, letterSpacing: '12px', transform: 'translate(16px,0px)', offset: 0.82 },
      { opacity: 1, letterSpacing: '-1.5px', transform: 'translate(0px,0px)', offset: 0.95, easing: 'cubic-bezier(.2,.8,.2,1)' },
      { opacity: 1, letterSpacing: '-1.5px', transform: 'translate(0px,0px)', offset: 1 }
    ]);
    push(q('.ts-anim-survey'), [
      { opacity: 0, offset: 0 }, { opacity: 0, offset: 0.28 }, { opacity: 1, offset: 0.40 },
      { opacity: 1, offset: 0.60 }, { opacity: 0, offset: 0.70 }, { opacity: 0, offset: 1 }
    ]);
    push(q('.ts-anim-surveyline'), [
      { strokeDashoffset: 1, offset: 0 }, { strokeDashoffset: 1, offset: 0.30 },
      { strokeDashoffset: 0, offset: 0.52, easing: 'cubic-bezier(.4,.1,.2,1)' }, { strokeDashoffset: 0, offset: 1 }
    ]);
    push(q('.ts-anim-labels'), [
      { opacity: 0, offset: 0 }, { opacity: 0, offset: 0.42 }, { opacity: 1, offset: 0.50 },
      { opacity: 1, offset: 0.60 }, { opacity: 0, offset: 0.68 }, { opacity: 0, offset: 1 }
    ]);

    svg.querySelectorAll('.sqx').forEach(function (xEl) {
      var i = +xEl.dataset.i, d = SQ[i], lag = i * 0.014;
      var yEl = xEl.querySelector('.sqy'), r = xEl.querySelector('.sqr');
      push(xEl, [
        { transform: 'translateX(' + d.Ax + 'px)', offset: 0 },
        { transform: 'translateX(' + d.Ax + 'px)', offset: 0.22 + lag, easing: outX },
        { transform: 'translateX(' + d.scX + 'px)', offset: 0.44 + lag },
        { transform: 'translateX(' + d.scX + 'px)', offset: 0.58 + lag, easing: inX },
        { transform: 'translateX(' + d.Bx + 'px)', offset: 0.82 + lag },
        { transform: 'translateX(' + d.Bx + 'px)', offset: 1 }
      ]);
      push(yEl, [
        { transform: 'translateY(' + d.Ay + 'px)', offset: 0 },
        { transform: 'translateY(' + d.Ay + 'px)', offset: 0.22 + lag, easing: outY },
        { transform: 'translateY(' + d.scY + 'px)', offset: 0.44 + lag },
        { transform: 'translateY(' + d.scY + 'px)', offset: 0.58 + lag, easing: inY },
        { transform: 'translateY(' + d.By + 'px)', offset: 0.82 + lag },
        { transform: 'translateY(' + d.By + 'px)', offset: 1 }
      ]);
      push(r, [
        { transform: 'rotate(65deg) scale(0.9138)', offset: 0 },
        { transform: 'rotate(65deg) scale(0.9138)', offset: 0.22 + lag, easing: outX },
        { transform: 'rotate(' + d.scR + 'deg) scale(' + d.scS + ')', offset: 0.44 + lag },
        { transform: 'rotate(' + d.scR + 'deg) scale(' + d.scS + ')', offset: 0.58 + lag, easing: inX },
        { transform: 'rotate(65deg) scale(1.38)', offset: 0.82 + lag },
        { transform: 'rotate(65deg) scale(1.38)', offset: 1 }
      ]);
    });
    // ensure the timeline is actually ticking even if created pre-paint
    a.forEach(function (an) { if (an.startTime == null) { try { an.startTime = document.timeline.currentTime; } catch (e) {} } });
    svg._anims = a;
  }

  function init() {
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.querySelectorAll('.ts-logo-anim').forEach(function (svg) {
      if (reduce) { rest(svg); return; }
      requestAnimationFrame(function () { requestAnimationFrame(function () { play(svg); }); });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
