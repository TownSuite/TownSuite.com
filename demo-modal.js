/* TownSuite 2026 — standalone book-a-demo modal.
 *
 * Hosts the live 311 request widget in an isolated iframe (311-embed.html) and
 * exposes window.tsOpenDemo(card, details, products) so the chat widget (embed.js)
 * and any in-page "Book a demo" CTA can open it.
 *
 * This is the SAME modal that site.js wires on the full index page. It lives in
 * its own file so the lean policy/utility pages (cookies, privacy, 404, 500,
 * jobs, about, enhance) — which don't load the heavy site.js — still get an
 * identical demo flow from the chat. Guarded so it never double-binds when a page
 * already provides tsOpenDemo (index via site.js, big-picture via its inline modal).
 */
(function () {
  "use strict";
  if (window.tsOpenDemo) return;            // a page-specific modal already owns it
  var doc = document;

  function bindDemoModal() {
    if (window.tsOpenDemo) return;
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

  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", bindDemoModal);
  else bindDemoModal();
})();
