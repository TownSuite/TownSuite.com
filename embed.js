/*
 * TownSuite Intelligence — embeddable public chat widget (#13991).
 *
 * One script tag drops the marketing redesign's "Sovereign AI Chat Dock" onto any page
 * and wires it to the real public chat API. The markup, CSS (tokens + rules), icons and
 * behaviour are lifted verbatim from the redesign (styles.css / site.js) so it looks and
 * behaves exactly like the mockup — the only change is that answers come from the real
 * LLM + KB instead of canned text. Rendered into a shadow root so the host page's CSS/JS
 * can't interfere and vice-versa.
 *
 *   <script src="https://<public-instance>/embed.js" data-api="https://<public-instance>" data-lang="en" defer></script>
 *
 * Host-page CTAs open the dock via window.tsOpenChat() / .tsToggleChat() / .tsCloseChat(),
 * or declaratively with any element carrying [data-ts-chat-open]. The fab lives in a shadow
 * root, so document.querySelector(".ts-chatfab") from the page will NOT find it.
 *
 * Theme: the widget follows the host page. If the page sets <html data-theme="light|dark">
 * (the marketing site's ts-themer does), the widget mirrors it; otherwise it follows the
 * OS prefers-color-scheme and tracks live changes. Font: 'Dax' (loaded from the instance),
 * falling back to the local system stack. No remote font fetch.
 *
 * v1 uses the synchronous send (/messages/sync); SignalR token-streaming is a planned
 * enhancement.
 */
(function () {
    "use strict";

    // ---- config -------------------------------------------------------------
    var script = document.currentScript;
    function originOf(url) { try { return new URL(url).origin; } catch (e) { return ""; } }
    var API = ((script && script.getAttribute("data-api")) || originOf(script && script.src) || "").replace(/\/+$/, "");
    var LANG = ((script && script.getAttribute("data-lang")) ||
        document.documentElement.getAttribute("lang") || "en").toLowerCase().slice(0, 2);
    if (LANG !== "fr") LANG = "en";
    var MODEL = (script && script.getAttribute("data-model")) || "";   // optional: pin a model id
    if (!API) { console.error("[TownSuite embed] No API origin — set data-api on the script tag."); return; }

    // ---- localized chrome (English mirrors the mockup verbatim) -------------
    var T = {
        en: {
            fab: "Ask TownSuite", title: "TownSuite Intelligence", sub: "AI assistant",
            ctx: "Helping with TownSuite.com Inquiries",
            greeting: "Hi — I’m TownSuite Intelligence, running on operationally sovereign Canadian infrastructure. Ask me anything about the platform.",
            chips: [["merp", "What is mERP®?"], ["sovereignty", "Why sovereignty?"], ["cost", "What does it cost?"], ["demo", "Book a demo"]],
            followup: "Ask a question…",
            foot: "Powered by TownSuite Intelligence — runs on Canadian infrastructure. Your AI and prompt data stay securely in Canada along with your mERP® data unless you explicitly opt in to connect your own external model.",
            disclaimer: "TownSuite Intelligence can make mistakes. Verify important figures.",
            close: "Close chat", send: "Send", resize: "Drag to resize", clearChat: "Clear chat",
            cleared: "Chat cleared. How can I help you with TownSuite?",
            error: "Sorry — something went wrong. Please try again.",
            limit: "You’ve reached the limit for this session. To keep exploring TownSuite, please book a demo.",
            demoReply: "I’ve opened our demo booking form for you — fill it in and our team will be in touch. Anything else I can help with?"
        },
        fr: {
            fab: "Demandez à TownSuite", title: "TownSuite Intelligence", sub: "Assistant IA",
            ctx: "Assistance — demandes TownSuite.com",
            greeting: "Bonjour — je suis TownSuite Intelligence, hébergée sur une infrastructure canadienne opérationnellement souveraine. Posez-moi vos questions sur la plateforme.",
            chips: [["merp", "Qu’est-ce que le mERP®?"], ["sovereignty", "Pourquoi la souveraineté?"], ["cost", "Combien ça coûte?"], ["demo", "Réserver une démo"]],
            followup: "Posez une question…",
            foot: "Propulsé par TownSuite Intelligence — fonctionne sur une infrastructure canadienne. Vos données et requêtes IA restent au Canada avec vos données mERP®, sauf si vous choisissez de connecter votre propre modèle externe.",
            disclaimer: "TownSuite Intelligence peut faire des erreurs. Vérifiez les informations importantes.",
            close: "Fermer", send: "Envoyer", resize: "Glisser pour redimensionner", clearChat: "Effacer",
            cleared: "Conversation effacée. Comment puis-je vous aider avec TownSuite\u202F?",
            error: "Désolé — une erreur s’est produite. Veuillez réessayer.",
            limit: "Vous avez atteint la limite de cette session. Pour continuer, réservez une démo.",
            demoReply: "J’ai ouvert notre formulaire de demande de démo — remplissez-le et notre équipe vous contactera. Puis-je vous aider avec autre chose?"
        }
    }[LANG];

    // ---- exact icons from the redesign (i-ai = spark + mini maple, i-maple) --
    function aiSvg(cls) {
        return '<svg' + (cls ? ' class="' + cls + '"' : '') + ' viewBox="0 0 24 24" aria-hidden="true">' +
            '<path fill="currentColor" d="M10.6 1.4l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"></path>' +
            '<path fill="currentColor" transform="translate(13.7,12.9) scale(0.355)" d="M12 0.5L14 4L16 3L15 8L15.5 9.5L18 7L19 8.5L22 8L21 11L22.5 12L17 16.5L17.5 18.5L12.5 17.6L12.5 23L11.5 23L11.5 17.6L6.5 18.5L7 16.5L1.5 12L3 11L2 8L5 8.5L6 7L8.5 9.5L9 8L8 3L10 4Z"></path>' +
            '</svg>';
    }
    var MAPLE = '<svg class="ts-maple" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 0.5L14 4L16 3L15 8L15.5 9.5L18 7L19 8.5L22 8L21 11L22.5 12L17 16.5L17.5 18.5L12.5 17.6L12.5 23L11.5 23L11.5 17.6L6.5 18.5L7 16.5L1.5 12L3 11L2 8L5 8.5L6 7L8.5 9.5L9 8L8 3L10 4Z"></path></svg>';
    var GRIP = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M2 6 L6 2"></path><path d="M2 10 L10 2"></path><path d="M2 14 L14 2"></path></svg>';

    // ---- exact tokens + widget CSS (lifted from styles.css; dark via :host) --
    var STYLE =
        ":host{all:initial;" +
        "--ts-blue:#00578E;--ts-blue-deep:#003C63;--ts-blue-mid:#6B95BE;--ts-blue-soft:#D8E0ED;" +
        "--ts-orange:#E48D1A;--ts-green:#2DA343;--ts-red:#E03A3E;" +
        "--bg:#FAFBFD;--bg2:#EFF3F8;--surface:#FFFFFF;--surface2:#F3F6FA;" +
        "--ink:#13212D;--ink2:#4C5D6C;--ink3:#7C8B98;--line:#DCE4EC;--line2:#C9D5E0;" +
        "--accent:#00578E;--accent-strong:#004A79;--accent-ink:#FFFFFF;--accent-soft:#D8E0ED;--accent-tint:#E9EFF6;--halo:rgba(0,87,142,.10);" +
        "--shadow-1:0 1px 2px rgba(7,25,40,.06),0 4px 14px rgba(7,25,40,.06);" +
        "--shadow-2:0 2px 6px rgba(7,25,40,.08),0 18px 44px rgba(7,25,40,.12);" +
        "--shadow-3:0 8px 24px rgba(7,25,40,.14),0 32px 80px rgba(7,25,40,.18);" +
        "color-scheme:light;}" +
        ":host([data-theme=\"dark\"]){" +
        "--bg:#071420;--bg2:#0A1B2A;--surface:#0D2032;--surface2:#122A3F;" +
        "--ink:#E9F0F6;--ink2:#A8BBCA;--ink3:#71879A;--line:#1C3850;--line2:#27465F;" +
        "--accent:#43A1E7;--accent-strong:#73BFFC;--accent-ink:#06131D;--accent-soft:#0F3A58;--accent-tint:#0C2C45;--halo:rgba(67,161,231,.16);" +
        "--shadow-1:0 1px 2px rgba(0,0,0,.3),0 4px 14px rgba(0,0,0,.3);" +
        "--shadow-2:0 2px 6px rgba(0,0,0,.35),0 18px 44px rgba(0,0,0,.42);" +
        "--shadow-3:0 8px 24px rgba(0,0,0,.45),0 32px 80px rgba(0,0,0,.5);" +
        "color-scheme:dark;}" +
        "*{box-sizing:border-box;font-family:'Dax',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;}" +
        ".ts-maple{display:inline-block;flex:none;fill:var(--ts-red);}" +
        ".ts-bubble{max-width:88%;border-radius:16px;padding:13px 17px;font-size:15px;line-height:1.5;box-shadow:var(--shadow-1);}" +
        ".ts-bubble--user{align-self:flex-end;background:var(--ts-blue);color:#fff;border-bottom-right-radius:5px;}" +
        ":host([data-theme=\"dark\"]) .ts-bubble--user{background:var(--accent);color:var(--accent-ink);}" +
        ".ts-bubble--bot{align-self:flex-start;background:var(--surface);border:1px solid var(--line);border-bottom-left-radius:5px;color:var(--ink);}" +
        ".ts-bubble--bot b,.ts-bubble--bot strong{color:var(--accent);}" +
        ".ts-bubble--bot a{color:var(--accent);}" +
        ".ts-bubble p{margin:0 0 8px;}.ts-bubble p:last-child{margin:0;}" +
        ".ts-chatfab{position:fixed;right:24px;bottom:24px;z-index:2147483000;display:flex;align-items:center;gap:11px;min-height:56px;padding:0 22px 0 16px;border-radius:100px;border:none;cursor:pointer;background:var(--ts-blue);color:#fff;font-weight:800;font-size:15.5px;box-shadow:0 14px 36px var(--halo),var(--shadow-2);transition:transform .2s,box-shadow .2s;}" +
        ":host([data-theme=\"dark\"]) .ts-chatfab{background:var(--accent);color:var(--accent-ink);}" +
        ".ts-chatfab:hover{transform:translateY(-3px);}" +
        ".ts-chatfab .spark{width:22px;height:22px;}" +
        ".ts-chat{position:fixed;right:24px;bottom:24px;z-index:2147483000;width:min(420px,calc(100vw - 32px));border-radius:22px;background:var(--surface);border:1.5px solid var(--line);box-shadow:var(--shadow-3);overflow:hidden;display:none;flex-direction:column;height:min(640px,calc(100svh - 48px));max-height:calc(100svh - 48px);}" +
        ".ts-chat.is-open{display:flex;}" +
        ".ts-chat__resize{position:absolute;top:0;left:0;width:26px;height:26px;z-index:3;cursor:nwse-resize;display:flex;align-items:flex-start;justify-content:flex-start;padding:6px;color:rgba(255,255,255,.55);}" +
        ".ts-chat__resize svg{width:13px;height:13px;}" +
        ":host([data-theme=\"dark\"]) .ts-chat__resize{color:color-mix(in srgb,var(--accent-ink) 55%,transparent);}" +
        ".ts-chat__head{display:flex;align-items:center;gap:12px;padding:16px 18px;background:var(--ts-blue);color:#fff;}" +
        ":host([data-theme=\"dark\"]) .ts-chat__head{background:var(--accent);color:var(--accent-ink);}" +
        ".ts-chat__badge{flex:none;width:40px;height:40px;border-radius:11px;background:rgba(255,255,255,.16);display:flex;align-items:center;justify-content:center;}" +
        ".ts-chat__badge svg{width:22px;height:22px;}" +
        ".ts-chat__head b{font-size:16px;display:block;line-height:1.15;}" +
        ".ts-chat__head small{font-size:12px;opacity:.85;display:block;}" +
        ".ts-chat__clear{margin-left:auto;background:rgba(255,255,255,.16);border:none;color:inherit;height:34px;padding:0 13px;border-radius:10px;cursor:pointer;font-size:12.5px;font-weight:700;white-space:nowrap;}" +
        ".ts-chat__clear:hover{background:rgba(255,255,255,.26);}" +
        ".ts-chat__x{background:rgba(255,255,255,.16);border:none;color:inherit;width:34px;height:34px;border-radius:10px;cursor:pointer;font-size:16px;font-weight:800;}" +
        ".ts-chat__ctx{display:flex;align-items:center;gap:8px;padding:9px 18px;font-size:12.5px;font-weight:600;color:var(--ink2);background:var(--surface2);border-bottom:1px solid var(--line);}" +
        ".ts-chat__statusdot{width:8px;height:8px;border-radius:50%;background:#37D67A;box-shadow:0 0 0 3px rgba(55,214,122,.28);flex:none;}" +
        ".ts-chat__log{padding:18px;display:flex;flex-direction:column;gap:12px;overflow-y:auto;flex:1;min-height:200px;}" +
        ".ts-chat__chips{display:flex;flex-wrap:wrap;gap:9px;padding:0 18px 14px;}" +
        ".ts-chat__chips button{border:1.5px solid var(--line2);background:var(--surface);color:var(--accent);font-weight:700;font-size:13.5px;border-radius:100px;min-height:40px;padding:0 16px;cursor:pointer;transition:border-color .15s,background .15s;}" +
        ".ts-chat__chips button:hover{border-color:var(--accent);background:var(--accent-tint);}" +
        ".ts-chat__foot{padding:11px 18px;border-top:1px solid var(--line);display:flex;align-items:center;gap:8px;font-size:11.8px;color:var(--ink3);}" +
        ".ts-chat__foot .ts-maple{width:12px;height:12px;}" +
        ".ts-typing{display:inline-flex;gap:6px;align-items:center;padding:14px 17px;}.ts-typing i{width:8px;height:8px;border-radius:1.5px;display:block;transform:translateY(0) rotate(45deg);animation:tsblink 1.1s infinite;}" +
        ".ts-typing i:nth-child(1){background:var(--ts-orange);}.ts-typing i:nth-child(2){background:var(--ts-green);animation-delay:.18s;}.ts-typing i:nth-child(3){background:var(--ts-red);animation-delay:.36s;}" +
        "@keyframes tsblink{0%,70%,100%{opacity:.25;transform:translateY(0) rotate(45deg);}35%{opacity:1;transform:translateY(-3px) rotate(45deg);}}" +
        ".ts-chat__composer{display:flex;align-items:center;gap:8px;padding:10px 12px;border-top:1px solid var(--line);opacity:0;transform:translateY(6px);transition:opacity .3s ease,transform .3s ease;}" +
        ".ts-chat__composer.is-on{opacity:1;transform:translateY(0);}" +
        ".ts-chat__composer input{flex:1;min-width:0;min-height:42px;padding:0 16px;font-family:inherit;font-size:14.5px;color:var(--ink);background:var(--surface2);border:1.5px solid var(--line2);border-radius:100px;outline:none;transition:border-color .18s;}" +
        ".ts-chat__composer input::placeholder{color:var(--ink3);}" +
        ".ts-chat__composer input:focus{border-color:var(--accent);}" +
        ".ts-chat__composer button{flex:none;width:42px;min-height:42px;border:none;border-radius:50%;background:var(--accent);color:var(--accent-ink);font-size:18px;font-weight:700;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .18s,transform .18s;}" +
        ".ts-chat__composer button:hover{background:var(--accent-strong);transform:translateX(2px);}" +
        ".ts-chat__composer button:disabled{opacity:.5;cursor:default;transform:none;}" +
        ".ts-chat__disclaimer{padding:0 16px 10px;font-size:11.5px;color:var(--ink3);text-align:center;}" +
        ".ts-chat.has-composer .ts-chat__foot{display:none;}" +
        "@media (max-width:1100px){.ts-chatfab{bottom:88px;}}" +
        "@media (max-width:600px){.ts-chat{right:0;bottom:0;left:0;top:0;width:100%;height:100dvh;max-height:100dvh;border-radius:0;border:none;}.ts-chat__resize{display:none;}.ts-chat__composer input{font-size:16px;min-height:46px;}" +
        // when the keyboard shrinks the panel, let the transcript give up space so the
        // composer never gets pushed past the panel's clipped bottom edge.
        ".ts-chat__log{min-height:0;}" +
        // viewport-fit=cover lets the blue header paint up into the status-bar safe area;
        // pad the header content down so the title/badge clear the clock & battery, and lift
        // the composer above the home-indicator.
        ".ts-chat__head{padding-top:calc(16px + env(safe-area-inset-top));}" +
        ".ts-chat__composer{padding-bottom:calc(12px + env(safe-area-inset-bottom));}" +
        ".ts-chatfab{padding:0;width:56px;justify-content:center;}" +
        ".ts-chatfab .lbl{display:none;}}";

    // ---- Dax @font-face (document-level: shadow roots resolve fonts at the doc) ----
    // Only inject when the host page does NOT already declare Dax. townsuite.com pages
    // self-host it (styles.css @font-face), and injecting a second 'Dax' rule pointed at
    // the chat instance made every page fire (failing) font requests at the API origin.
    // The instance-hosted copy is only needed when the widget is embedded on a page
    // without its own Dax.
    var hasDax = false;
    try { document.fonts.forEach(function (f) { if (/^["']?Dax["']?$/.test(f.family)) hasDax = true; }); } catch (e) {}
    if (!hasDax && !document.getElementById("ts-dax-face")) {
        var face = document.createElement("style");
        face.id = "ts-dax-face";
        face.textContent =
            "@font-face{font-family:'Dax';" +
            // woff2 first so modern browsers fetch the 12KB file instead of the 26KB ttf; ttf/otf stay as fallbacks.
            "src:url('" + API + "/fonts/dax-regular.woff2') format('woff2'),url('" + API + "/fonts/dax-regular.ttf') format('truetype'),url('" + API + "/fonts/dax-regular.otf') format('opentype');" +
            "font-weight:400 900;font-style:normal;font-display:swap;}";
        document.head.appendChild(face);
    }

    // ---- build the widget in a shadow root ----------------------------------
    var hostEl = document.createElement("div");
    document.body.appendChild(hostEl);
    var root = hostEl.attachShadow({ mode: "open" });
    var styleEl = document.createElement("style");
    styleEl.textContent = STYLE;
    root.appendChild(styleEl);

    var wrap = document.createElement("div");
    wrap.innerHTML =
        '<button class="ts-chatfab" type="button" aria-label="' + escapeHtml(T.fab) + '" aria-haspopup="dialog" aria-expanded="false">' + aiSvg("spark") + '<span class="lbl">' + escapeHtml(T.fab) + '</span></button>' +
        '<div class="ts-chat" id="ts-chat-panel" role="dialog" aria-modal="true" aria-labelledby="ts-chat-title">' +
        '<div class="ts-chat__resize" aria-hidden="true" title="' + escapeHtml(T.resize) + '">' + GRIP + '</div>' +
        '<div class="ts-chat__head"><span class="ts-chat__badge">' + aiSvg("") + '</span>' +
        '<div><b id="ts-chat-title">' + escapeHtml(T.title) + '</b><small>' + escapeHtml(T.sub) + '</small></div>' +
        '<button class="ts-chat__clear" type="button" aria-label="' + escapeHtml(T.clearChat) + '" title="' + escapeHtml(T.clearChat) + '">' + escapeHtml(T.clearChat) + '</button>' +
        '<button class="ts-chat__x" type="button" aria-label="' + escapeHtml(T.close) + '">✕</button>' +
        '</div>' +
        '<div class="ts-chat__ctx"><span class="ts-chat__statusdot"></span> ' + escapeHtml(T.ctx) + '</div>' +
        '<div class="ts-chat__log" role="log" aria-live="polite" aria-relevant="additions"><div class="ts-bubble ts-bubble--bot">' + escapeHtml(T.greeting) + '</div></div>' +
        '<div class="ts-chat__chips">' +
        T.chips.map(function (c) { return '<button type="button" data-q="' + c[0] + '">' + escapeHtml(c[1]) + '</button>'; }).join("") +
        '</div>' +
        '<div class="ts-chat__foot">' + MAPLE + ' <span>' + escapeHtml(T.foot) + '</span></div>' +
        '</div>';
    root.appendChild(wrap);

    var fab = root.querySelector(".ts-chatfab");
    var panel = root.querySelector(".ts-chat");
    var log = root.querySelector(".ts-chat__log");
    var busy = false, composer = null;

    // ---- theme: follow the host page (<html data-theme>) or the OS -----------
    var mq = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
    function effectiveTheme() {
        var explicit = document.documentElement.getAttribute("data-theme");
        if (explicit === "dark" || explicit === "light") return explicit;
        return (mq && mq.matches) ? "dark" : "light";
    }
    function applyTheme() { hostEl.setAttribute("data-theme", effectiveTheme()); if (typeof tintBarPersist === "function" && panel.classList.contains("is-open")) tintBarPersist(); }
    applyTheme();
    if (mq) {
        var onMq = function () { applyTheme(); };
        if (mq.addEventListener) mq.addEventListener("change", onMq);
        else if (mq.addListener) mq.addListener(onMq);
    }
    if (window.MutationObserver) {
        new MutationObserver(applyTheme).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    }

    // ---- iOS Safari address-bar tint -----------------------------------------
    // When the chat is open full-screen on mobile, the page’s near-white theme-color
    // leaves a pale strip above the navy chat header. While the chat is open we override
    // the address-bar tint to match the header; on close we restore the page’s own metas.
    // The colour is read from the rendered header, so it is correct in BOTH light and dark.
    var fsQ = window.matchMedia ? window.matchMedia("(max-width:600px)") : null;
    function chatHeadColor() {
        var head = root.querySelector(".ts-chat__head");
        if (head) { try { var bg = getComputedStyle(head).backgroundColor; if (/^rgb/i.test(bg)) return bg; } catch (e) {} }
        return effectiveTheme() === "dark" ? "#2E97D4" : "#00578E";
    }
    // iOS Safari tints the strip behind the status bar by TWO different mechanisms, split
    // by version — so we drive BOTH and let whichever one the device honours take effect:
    //
    //  • iOS 15–18.6 (Safari 15–18): reads <meta name="theme-color">. It only REPAINTS the
    //    strip when the meta's VALUE actually changes (a scroll nudge does nothing reliably),
    //    so to force a repaint we flip the colour to a visually identical nudge (alpha .996)
    //    on the next frame and back — WebKit diffs the value and re-renders.
    //  • iOS 26+ (Safari 26 "Liquid Glass"): IGNORES theme-color. It derives the colour from
    //    the background-color of fixed/sticky elements near the viewport edge, falling back
    //    to <body>. So while open we paint <body>/<html> navy AND pin a real (light-DOM)
    //    fixed strip of navy at the very top edge for Safari 26 to sample. (Note: iOS 26.0/.1
    //    have a WebKit bug where this still mis-samples for full-screen fixed overlays —
    //    tracked in WebKit and expected to improve in a later 26.x.)
    var pageTcMetas = [].slice.call(document.querySelectorAll('meta[name="theme-color"]'));
    var tcOrig = pageTcMetas.map(function (m) { return { content: m.getAttribute("content"), media: m.getAttribute("media") }; });
    var bgOrig = null;
    var sbTint = null;   // light-DOM fixed strip Safari 26 can sample
    var topBars = [];    // the page's own fixed top bar(s) — iOS 26 samples these first
    // iOS 26 re-derives the toolbar colour from page CSS on SCROLL — so after we set the
    // navy sources, a tiny real scroll delta (move 1px, settle, move back) prompts Safari
    // to re-sample and pick up the navy. Harmless on older iOS.
    // Note: while the full-screen dock is open the page is scroll-locked (<body> is
    // position:fixed), so this open-time poke is a no-op there — the tint still resolves
    // from the static fixed sources. Don't move the lock after the tint to "fix" it: the
    // lock is deliberately applied first to stop iOS shoving the panel off-screen.
    function pokeScroll() {
        try { var y = window.pageYOffset || 0; window.scrollTo(0, y + 1); setTimeout(function () { window.scrollTo(0, y); }, 90); } catch (e) {}
    }
    function nudgeColor(c) {            // visually identical, byte-different → forces repaint
        var m = /^rgba?\(([^)]+)\)/i.exec(c);
        if (m) { var n = m[1].split(",").slice(0, 3).map(function (x) { return x.trim(); }); return "rgba(" + n.join(", ") + ", 0.996)"; }
        return c;
    }
    function setMetas(val) { pageTcMetas.forEach(function (mm) { mm.removeAttribute("media"); mm.setAttribute("content", val); }); }
    function tintBar() {
        if (window.__tsPageTint) return;              // page-side statusbar-tint.js owns this
        if (!fsQ || !fsQ.matches) return;            // only when the chat fills the screen
        var c = chatHeadColor();
        // (a) theme-color path for iOS <=18.6 — set, then nudge value to force a repaint.
        setMetas(c);
        requestAnimationFrame(function () { setMetas(nudgeColor(c)); requestAnimationFrame(function () { setMetas(c); }); });
        // (b) CSS-derived path for iOS 26 — body bg + a fixed navy strip at the top edge.
        if (bgOrig === null) bgOrig = { html: document.documentElement.style.backgroundColor, body: document.body ? document.body.style.backgroundColor : "" };
        document.documentElement.style.backgroundColor = c;
        if (document.body) document.body.style.backgroundColor = c;
        if (!sbTint && document.body) {
            sbTint = document.createElement("div");
            sbTint.setAttribute("aria-hidden", "true");
            sbTint.style.cssText = "position:fixed;top:0;left:0;right:0;height:calc(env(safe-area-inset-top, 0px) + 1px);z-index:2147482999;pointer-events:none;";
            document.body.appendChild(sbTint);
        }
        if (sbTint) { sbTint.style.background = c; sbTint.style.display = "block"; }
        // (c) iOS 26 prefers the page's OWN fixed/sticky top bar over our strip when deciding
        // the toolbar colour — so paint any fixed top bar navy too. It sits behind the
        // full-screen chat, so this is invisible; it only steers Safari's colour sampling.
        if (!topBars.length) {
            topBars = [].slice.call(document.querySelectorAll(".ts-nav, .x-topbar")).map(function (el) {
                return { el: el, bg: el.style.background, bf: el.style.webkitBackdropFilter, bf2: el.style.backdropFilter };
            });
        }
        topBars.forEach(function (t) { t.el.style.background = c; t.el.style.webkitBackdropFilter = "none"; t.el.style.backdropFilter = "none"; });
        pokeScroll();
    }
    // The soft keyboard + focus() shift the visual viewport on iOS and can reset the strip
    // to the page colour mid-open-animation, so re-assert the tint a few times after open.
    function tintBarPersist() {
        tintBar();
        [140, 380, 750].forEach(function (d) { setTimeout(function () { if (panel.classList.contains("is-open")) tintBar(); }, d); });
    }
    function untintBar() {
        if (window.__tsPageTint) return;              // page-side statusbar-tint.js owns this
        pageTcMetas.forEach(function (mm, i) {
            var o = tcOrig[i];
            if (o.content == null) mm.removeAttribute("content"); else mm.setAttribute("content", o.content);
            if (o.media == null) mm.removeAttribute("media"); else mm.setAttribute("media", o.media);
        });
        if (bgOrig !== null) {
            document.documentElement.style.backgroundColor = bgOrig.html;
            if (document.body) document.body.style.backgroundColor = bgOrig.body;
            bgOrig = null;
        }
        if (sbTint) sbTint.style.display = "none";
        topBars.forEach(function (t) { t.el.style.background = t.bg; t.el.style.webkitBackdropFilter = t.bf; t.el.style.backdropFilter = t.bf2; });
        topBars = [];
        // nudge the restored metas so iOS <=18.6 repaints back to the page colour
        requestAnimationFrame(function () {
            pageTcMetas.forEach(function (mm, i) { if (tcOrig[i].content != null) mm.setAttribute("content", nudgeColor(tcOrig[i].content)); });
            requestAnimationFrame(function () { pageTcMetas.forEach(function (mm, i) { if (tcOrig[i].content != null) mm.setAttribute("content", tcOrig[i].content); }); });
        });
        pokeScroll();
    }
    if (fsQ) {
        var onFsQ = function () { (panel.classList.contains("is-open") ? tintBar : untintBar)(); };
        if (fsQ.addEventListener) fsQ.addEventListener("change", onFsQ);
        else if (fsQ.addListener) fsQ.addListener(onFsQ);
    }

    // ---- keyboard-safe full-screen sizing (iOS) ------------------------------
    // Full-screen on mobile the panel is position:fixed at height:100dvh — but dvh
    // does NOT shrink for the on-screen keyboard. When the composer input takes focus,
    // iOS opens the keyboard, shrinks the *visual* viewport and scrolls the fixed panel
    // upward so the input clears the keyboard; that drags the panel's bottom edge above
    // the keyboard and the host page shows through the gap. So while the dock is open on
    // a phone we pin it to the visual viewport (height + top/left offset) via the
    // VisualViewport API, so it always covers exactly the visible area — nothing of the
    // page can peek through. Desktop and the closed state are untouched.
    var vvp = window.visualViewport || null;
    function syncPanelViewport() {
        if (!vvp || !fsQ || !fsQ.matches || !panel.classList.contains("is-open")) return;
        panel.style.height = vvp.height + "px";
        panel.style.transform = "translate(" + vvp.offsetLeft + "px," + vvp.offsetTop + "px)";
    }
    function clearPanelViewport() {
        panel.style.transform = "";
        if (fsQ && fsQ.matches) panel.style.height = "";   // hand height back to the 100dvh rule
    }
    if (vvp) {
        var onVvp = function () { syncPanelViewport(); };
        vvp.addEventListener("resize", onVvp);
        vvp.addEventListener("scroll", onVvp);
    }

    // ---- accessibility: focus management, focus trap, inert background -------
    var lastFocused = null;          // element to restore focus to on close
    var inertEls = [];               // host-page siblings we marked inert while open
    var inertQ = window.matchMedia ? window.matchMedia("(max-width:600px)") : null;

    // Collect the panel's focusable, visible elements (in shadow DOM).
    function focusables() {
        var list = panel.querySelectorAll(
            'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])');
        var out = [];
        Array.prototype.forEach.call(list, function (el) {
            if (el.disabled) return;
            if (el.getAttribute && el.getAttribute("aria-hidden") === "true") return;
            // skip elements hidden via display:none / size 0 (e.g. composer before mount)
            if (el.offsetParent === null && el !== document.activeElement) {
                var cs;
                try { cs = getComputedStyle(el); } catch (e) { cs = null; }
                if (cs && cs.display === "none") return;
            }
            out.push(el);
        });
        return out;
    }

    // While full-screen on mobile, mark host-page content inert so Tab can't escape
    // behind the overlay. The widget's own host element is left reachable.
    function setBackgroundInert(on) {
        if (inertQ && !inertQ.matches) return;   // only scope to small / full-screen screens
        try {
            if (on) {
                inertEls = [];
                Array.prototype.forEach.call(document.body.children, function (el) {
                    if (el === hostEl) return;
                    inertEls.push(el);
                    try { el.inert = true; } catch (e2) {}
                    el.setAttribute("aria-hidden", "true");
                });
            } else {
                inertEls.forEach(function (el) {
                    try { el.inert = false; } catch (e2) {}
                    el.removeAttribute("aria-hidden");
                });
                inertEls = [];
            }
        } catch (e) {}
    }

    // Full-screen on mobile, `inert` stops Tab/clicks reaching the page but the document
    // itself still scrolls behind the overlay — so the host page shows through and can be
    // dragged around under the chat, and that scrolling is what lets iOS Safari shove the
    // fixed panel off the visible area when the keyboard opens (page peeks out below the
    // composer). Freeze the page: pin <body> at its current scroll offset while open, then
    // restore it on close. With the page locked, the panel stays put and nothing behind
    // it moves. Scoped to full-screen widths; desktop keeps normal page scrolling.
    var scrollLockY = 0, scrollLocked = false, lockPrev = null;
    function setBodyScrollLock(on) {
        var b = document.body, d = document.documentElement;
        if (!b) return;
        try {
            if (on) {
                if (inertQ && !inertQ.matches) return;   // only lock at full-screen / mobile widths
                if (scrollLocked) return;
                scrollLockY = window.pageYOffset || d.scrollTop || 0;
                lockPrev = { position: b.style.position, top: b.style.top, left: b.style.left,
                             right: b.style.right, width: b.style.width, overflow: b.style.overflow,
                             dOverflow: d.style.overflow };
                b.style.position = "fixed";
                b.style.top = (-scrollLockY) + "px";
                b.style.left = "0";
                b.style.right = "0";
                b.style.width = "100%";
                b.style.overflow = "hidden";
                d.style.overflow = "hidden";
                scrollLocked = true;
            } else {
                if (!scrollLocked) return;
                b.style.position = lockPrev ? lockPrev.position : "";
                b.style.top = lockPrev ? lockPrev.top : "";
                b.style.left = lockPrev ? lockPrev.left : "";
                b.style.right = lockPrev ? lockPrev.right : "";
                b.style.width = lockPrev ? lockPrev.width : "";
                b.style.overflow = lockPrev ? lockPrev.overflow : "";
                d.style.overflow = lockPrev ? lockPrev.dOverflow : "";
                scrollLocked = false;
                // Force a reflow so the document regains its full scroll height (it collapsed
                // while <body> was fixed) BEFORE we restore Y — otherwise the restore clamps to
                // 0 and the page jumps to the top on close. The page sets scroll-behavior:smooth,
                // which would animate (and, if interrupted, strand the page at the top), so pin
                // scroll-behavior to auto for the one instant jump, then restore it.
                void b.offsetHeight;
                var prevSB = d.style.scrollBehavior;
                d.style.scrollBehavior = "auto";
                window.scrollTo(0, scrollLockY);
                if ((window.pageYOffset || 0) !== scrollLockY) { (document.scrollingElement || d).scrollTop = scrollLockY; }
                d.style.scrollBehavior = prevSB;
            }
        } catch (e) {}
    }

    function openPanel() {
        try { lastFocused = (document.activeElement && document.activeElement !== document.body) ? document.activeElement : fab; } catch (e) { lastFocused = fab; }
        panel.classList.add("is-open");
        fab.style.display = "none";
        fab.setAttribute("aria-expanded", "true");
        ssSet("ts-chat-open", "1");
        setBackgroundInert(true);
        setBodyScrollLock(true);
        // Mount the text input as soon as the panel opens so it's ALWAYS present —
        // the 4 chips stay above as shortcuts, but visitors (and AI agents driving
        // the page, which look for a text field) can type a free-form question right
        // away instead of being forced to click a chip first.
        mountComposer();
        // Focus a chip rather than the input on open, so we don't pop the mobile
        // keyboard uninvited; the input is one tab/tap away.
        var first = root.querySelector(".ts-chat__chips button") || (composer && composer.querySelector("input")) || panel.querySelector(".ts-chat__x");
        if (first) first.focus();
        tintBarPersist();
        syncPanelViewport();
    }
    function closePanel() {
        panel.classList.remove("is-open");
        fab.style.display = "";
        fab.setAttribute("aria-expanded", "false");
        ssSet("ts-chat-open", "0");
        setBackgroundInert(false);
        setBodyScrollLock(false);
        var restore = (lastFocused && lastFocused.focus) ? lastFocused : fab;
        lastFocused = null;
        try { restore.focus(); } catch (e) { try { fab.focus(); } catch (e2) {} }
        untintBar();
        clearPanelViewport();
    }
    fab.addEventListener("click", openPanel);
    panel.querySelector(".ts-chat__x").addEventListener("click", closePanel);
    // Clear chat: drop the server conversation so the NEXT message starts a fresh
    // prompt with NO prior history; also wipe the saved transcript/conversation id.
    function clearChat() {
        conversationId = null;
        history = [];
        try { if (SS) { SS.removeItem("ts-chat-convo"); SS.removeItem("ts-chat-log"); } } catch (e) { }
        busy = false;
        log.innerHTML = "";
        var b = document.createElement("div");
        b.className = "ts-bubble ts-bubble--bot";
        b.textContent = T.cleared;
        log.appendChild(b);
        if (composer) { composer.remove(); composer = null; }
        var disc = panel.querySelector(".ts-chat__disclaimer"); if (disc) disc.remove();
        panel.classList.remove("has-composer");
        var chipsRow = panel.querySelector(".ts-chat__chips"); if (chipsRow) chipsRow.style.display = "";
        log.scrollTop = 0;
    }
    window.tsClearChat = clearChat;
    var clearBtn = panel.querySelector(".ts-chat__clear"); if (clearBtn) clearBtn.addEventListener("click", clearChat);
    panel.addEventListener("keydown", function (e) {
        if (e.key === "Escape") { e.preventDefault(); closePanel(); return; }
        if (e.key !== "Tab") return;
        // Focus trap: keep Tab / Shift+Tab cycling within the panel.
        var f = focusables();
        if (!f.length) { e.preventDefault(); return; }
        var firstEl = f[0], lastEl = f[f.length - 1];
        var active = root.activeElement || document.activeElement;
        if (e.shiftKey) {
            if (active === firstEl || f.indexOf(active) === -1) { e.preventDefault(); lastEl.focus(); }
        } else {
            if (active === lastEl || f.indexOf(active) === -1) { e.preventDefault(); firstEl.focus(); }
        }
    });

    // Public API for host-page CTAs. The fab lives in a shadow root, so the page
    // can't reach it with document.querySelector — call these instead.
    window.tsOpenChat = openPanel;
    window.tsCloseChat = closePanel;
    window.tsToggleChat = function () { (panel.classList.contains("is-open") ? closePanel : openPanel)(); };
    document.addEventListener("click", function (e) {
        var t = e.target.closest && e.target.closest("[data-ts-chat-open]");
        if (t) { e.preventDefault(); openPanel(); }
    });

    // ---- drag-to-resize from the top-left grip (panel anchored bottom-right) -
    (function () {
        var grip = root.querySelector(".ts-chat__resize");
        if (!grip) return;
        var MINW = 320, MINH = 360;
        function maxW() { return Math.min(720, window.innerWidth - 32); }
        function maxH() { return window.innerHeight - 48; }
        var mobileQ = window.matchMedia ? window.matchMedia("(max-width:600px)") : null;
        function clearMobileInline() {
            if (mobileQ && mobileQ.matches) { panel.style.width = ""; panel.style.height = ""; }
        }
        try {
            var w = parseFloat(localStorage.getItem("ts-chat-w")), h = parseFloat(localStorage.getItem("ts-chat-h"));
            if (w) panel.style.width = Math.min(Math.max(w, MINW), maxW()) + "px";
            if (h) panel.style.height = Math.min(Math.max(h, MINH), maxH()) + "px";
        } catch (e) { }
        clearMobileInline();
        if (mobileQ) {
            if (mobileQ.addEventListener) mobileQ.addEventListener("change", clearMobileInline);
            else if (mobileQ.addListener) mobileQ.addListener(clearMobileInline);
        }
        var dragging = false, sx = 0, sy = 0, w0 = 0, h0 = 0;
        grip.addEventListener("pointerdown", function (e) {
            dragging = true; sx = e.clientX; sy = e.clientY;
            var r = panel.getBoundingClientRect(); w0 = r.width; h0 = r.height;
            grip.setPointerCapture(e.pointerId); e.preventDefault();
        });
        grip.addEventListener("pointermove", function (e) {
            if (!dragging) return;
            panel.style.width = Math.min(Math.max(w0 + (sx - e.clientX), MINW), maxW()) + "px";
            panel.style.height = Math.min(Math.max(h0 + (sy - e.clientY), MINH), maxH()) + "px";
        });
        function endDrag() {
            if (!dragging) return;
            dragging = false;
            try {
                localStorage.setItem("ts-chat-w", String(Math.round(parseFloat(panel.style.width) || 0)));
                localStorage.setItem("ts-chat-h", String(Math.round(parseFloat(panel.style.height) || 0)));
            } catch (e) { }
        }
        grip.addEventListener("pointerup", endDrag);
        grip.addEventListener("pointercancel", endDrag);
    })();

    // Chips send their question to the real assistant; the composer mounts after
    // the first answer (mirrors the redesign).
    panel.querySelectorAll(".ts-chat__chips button").forEach(function (chip) {
        chip.addEventListener("click", function () {
            if (chip.getAttribute("data-q") === "demo") openDemo(chip.textContent);
            else ask(chip.textContent);
        });
    });

    // "Book a demo" is an explicit action, not a question: open the form directly and reply
    // locally. Routing it through the model only produced a contradictory "visit the website"
    // answer, and the model can't open the form anyway.
    // Condense the conversation so far into a short summary the sales team can read,
    // and hand it to the demo form so it lands in the request body.
    function buildChatSummary() {
        var qs = history.filter(function (m) { return m.k === "user"; })
                        .map(function (m) { return "\u2022 " + m.t; });
        if (!qs.length) return "";
        return "Sent from TownSuite Intelligence \u2014 what I asked about in chat:" + "\n" + qs.join("\n");
    }
    var PRODUCT_MAP = [
        ["Finance management", /financ|property tax|\btax(es|ation)?\b|budget|accounts? (payable|receivable)|general ledger|\bgl\b|invoic/i],
        ["Work and Human management", /work order|\bhr\b|human resource|payroll|\bemployee|workforce|work management/i],
        ["Asset management", /\basset|equipment|fleet|fixed asset|infrastructure management/i],
        ["Land management", /\bland\b|permit|zoning|\bplanning\b|parcel|land use/i],
        ["Recreation management", /recreation|arena|\brink\b|facilit(y|ies)|league|swimming|\bcamps?\b|program registration/i],
        ["eBilling and Payments", /ebill|e-bill|epayment|e-payment|online payment|pay(ing)? (online|bills|your bill)|\bpos\b|point of sale/i],
        ["A full TownSuite mERP system", /\bmerp\b|whole platform|entire platform|everything|full (platform|suite|system)|complete platform|all (the )?modules|entire suite/i]
    ];
    function buildChatProducts() {
        var text = history.filter(function (m) { return m.k === "user"; }).map(function (m) { return m.t; }).join(" \n ");
        if (!text) return [];
        var out = [];
        PRODUCT_MAP.forEach(function (p) { if (p[1].test(text)) out.push(p[0]); });
        return out;
    }
    function openDemo(label) {
        if (busy) return;
        var summary = buildChatSummary();   // build BEFORE adding the "Book a demo" line
        var products = buildChatProducts();
        addBubble("user", label || "Book a demo", false);
        if (window.tsOpenDemo) { try { window.tsOpenDemo("Book a Demo", summary, products); } catch (e) { } }
        addBubble("bot", T.demoReply, true);
        mountComposer();
        if (composer) composer.querySelector("input").focus();
        // The demo form is a full-screen modal — close the chat so it doesn’t sit behind it (esp. on mobile).
        closePanel();
    }

    function mountComposer() {
        if (composer) return;
        composer = document.createElement("form");
        composer.className = "ts-chat__composer";
        composer.innerHTML =
            '<input type="text" placeholder="' + escapeHtml(T.followup) + '" aria-label="' + escapeHtml(T.followup) + '" maxlength="280" autocomplete="off" />' +
            '<button type="submit" aria-label="' + escapeHtml(T.send) + '">→</button>';
        panel.insertBefore(composer, panel.querySelector(".ts-chat__foot"));
        var disclaimer = document.createElement("div");
        disclaimer.className = "ts-chat__disclaimer";
        disclaimer.textContent = T.disclaimer;
        panel.insertBefore(disclaimer, panel.querySelector(".ts-chat__foot"));
        panel.classList.add("has-composer");
        requestAnimationFrame(function () { composer.classList.add("is-on"); });
        var input = composer.querySelector("input");
        composer.addEventListener("submit", function (e) {
            e.preventDefault();
            var q = input.value.trim();
            if (!q) return;
            input.value = "";
            ask(q);
        });
        input.focus();
    }

    // ---- chat state + real API ----------------------------------------------
    // Persist the anonymous session, conversation id and transcript in sessionStorage
    // so the chat CONTINUES as the visitor moves page to page (and on reload) within
    // the same tab — same conversationId means the assistant keeps full context.
    var SS = (function () { try { return window.sessionStorage; } catch (e) { return null; } })();
    function ssGet(k) { try { return SS ? SS.getItem(k) : null; } catch (e) { return null; } }
    function ssSet(k, v) { try { if (SS) SS.setItem(k, v); } catch (e) { } }
    var token = ssGet("ts-chat-token") || null;
    var conversationId = ssGet("ts-chat-convo") || null;
    var history = [];
    (function () { try { history = JSON.parse(ssGet("ts-chat-log") || "[]") || []; } catch (e) { history = []; } })();
    function saveHistory() { ssSet("ts-chat-log", JSON.stringify(history)); }

    async function ask(text) {
        text = (text || "").trim();
        if (!text || busy) return;
        busy = true;
        addBubble("user", text, false);
        var typing = showTyping();
        try {
            var reply = await sendToApi(text);
            typing.remove();
            addBubble("bot", reply, true);
        } catch (err) {
            console.error("[TownSuite embed]", err);
            typing.remove();
            addBubble("bot", err && err.limited ? T.limit : T.error, false);
        } finally {
            busy = false;
            mountComposer();
            if (composer) composer.querySelector("input").focus();
        }
    }

    function clearAuth() {
        token = null;
        conversationId = null;
        try { if (SS) { SS.removeItem("ts-chat-token"); SS.removeItem("ts-chat-convo"); } } catch (e) { }
    }
    function isStale(status) { return status === 401 || status === 403 || status === 404; }

    async function ensureToken() {
        if (token) return;
        var s = await fetch(API + "/public/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
        if (!s.ok) { var es = new Error("mint " + s.status); es.status = s.status; throw es; }
        token = (await s.json()).accessToken;
        if (!token) throw new Error("mint: no access token in response");
        ssSet("ts-chat-token", token);
    }

    async function ensureConversation(auth) {
        if (conversationId) return;
        var mr = await fetch(API + "/api/models", { headers: auth });
        if (!mr.ok) { var em = new Error("models " + mr.status); em.status = mr.status; throw em; }
        var models = await mr.json();
        // data-model pins a specific model id; otherwise use the first (public mode serves one).
        var llmModelId = MODEL ? Number(MODEL) : (models && models.length ? models[0].id : null);
        if (!llmModelId) throw new Error("no model");
        var cr = await fetch(API + "/api/conversations", {
            method: "POST", headers: Object.assign({ "Content-Type": "application/json" }, auth),
            body: JSON.stringify({ llmModelId: llmModelId })
        });
        if (!cr.ok) { var ec = new Error("conversation " + cr.status); ec.status = cr.status; throw ec; }
        conversationId = (await cr.json()).conversationId;
        ssSet("ts-chat-convo", conversationId);
    }

    async function sendOnce(text) {
        await ensureToken();
        var auth = { "Authorization": "Bearer " + token };
        await ensureConversation(auth);
        var r = await fetch(API + "/api/conversations/" + conversationId + "/messages/sync", {
            method: "POST", headers: Object.assign({ "Content-Type": "application/json" }, auth),
            body: JSON.stringify({ content: text })
        });
        if (r.status === 429) { var e = new Error("rate limited"); e.limited = true; throw e; }
        if (!r.ok) { var ex = new Error("send " + r.status); ex.status = r.status; throw ex; }
        var data = await r.json();
        var msgs = (data && data.messages) || [];
        return msgs.length ? (msgs[msgs.length - 1].content || "") : "";
    }

    async function sendToApi(text) {
        try {
            return await sendOnce(text);
        } catch (err) {
            // Don’t retry a rate limit — that’s a real "no", not an expired session.
            if (err && !err.limited && isStale(err.status)) {
                clearAuth();
                return await sendOnce(text);   // fresh session + fresh conversation, one retry
            }
            throw err;
        }
    }

    // ---- rendering ----------------------------------------------------------
    function addBubble(kind, text, asMarkdown, skipSave) {
        var b = document.createElement("div");
        b.className = "ts-bubble ts-bubble--" + kind;
        if (asMarkdown) b.innerHTML = renderMarkdown(text || T.error);
        else b.textContent = text;
        log.appendChild(b);
        log.scrollTop = log.scrollHeight;
        if (!skipSave) { history.push({ k: kind, t: text, m: !!asMarkdown }); saveHistory(); }
        return b;
    }
    function showTyping() {
        var t = document.createElement("div");
        t.className = "ts-bubble ts-bubble--bot ts-typing";
        t.innerHTML = "<i></i><i></i><i></i>";
        log.appendChild(t);
        log.scrollTop = log.scrollHeight;
        return t;
    }

    function escapeHtml(s) {
        return String(s).replace(/[&<>"']/g, function (c) {
            return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
        });
    }
    // Minimal, SAFE markdown for a public chat bubble. The public bot must never surface links
    // (visitors have no docs account), so markdown links collapse to their text and bare URLs are
    // dropped. Headings/bullets are normalised so stray markdown never renders raw.
    function renderMarkdown(md) {
        var html = escapeHtml(md);
        html = html.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");                    // [text](any target) -> text, any scheme
        html = html.replace(/\b(?:https?:\/\/|www\.)[^\s<]+/gi, "");            // drop bare URLs incl. schemeless www.
        html = html.replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>");                   // **bold**
        html = html.replace(/^\s{0,3}#{1,6}\s+(.+)$/gm, "<b>$1</b>");           // # heading -> bold line
        html = html.replace(/^\s*[-*]\s+(.+)$/gm, "• $1");                      // - bullet -> • line
        return html.split(/\n{2,}/).map(function (p) { return "<p>" + p.replace(/\n/g, "<br>") + "</p>"; }).join("");
    }

    // ---- restore an in-progress session (cross-page / reload continuity) -----
    // Replay the saved transcript and re-open the dock if it was open, so moving
    // between pages feels like one continuous conversation.
    (function restoreSession() {
        if (history.length) {
            history.forEach(function (m) { addBubble(m.k, m.t, m.m, true); });
            mountComposer();
        }
        if (ssGet("ts-chat-open") === "1") {
            panel.classList.add("is-open");
            fab.style.display = "none";
            fab.setAttribute("aria-expanded", "true");
            setBackgroundInert(true);
            setBodyScrollLock(true);
            tintBar();
            syncPanelViewport();
        }
        // Replay happens while the dock is hidden, so scrollTop never sticks. And the log keeps
        // growing AFTER the first frame as the Dax webfont loads and bubbles reflow taller — and on
        // heavy pages (index) that settling lands well past any fixed timeout. A single scroll lands
        // while the log is still short, leaving it pinned to the TOP. So instead of guessing when
        // layout is done, we KEEP the log pinned to the bottom for a short window — re-pinning on
        // every size change — and release the moment the visitor scrolls themselves.
        if (history.length) {
            var pinBottom = function () { log.scrollTop = log.scrollHeight; };
            var pinning = true;
            var ro = null;
            var release = function () {
                if (!pinning) return;
                pinning = false;
                if (ro) { try { ro.disconnect(); } catch (e) {} ro = null; }
            };
            pinBottom();
            requestAnimationFrame(function () { requestAnimationFrame(function () { if (pinning) pinBottom(); }); });
            if (document.fonts && document.fonts.ready) { document.fonts.ready.then(function () { if (pinning) pinBottom(); }).catch(function () {}); }
            // Re-pin whenever a bubble’s height changes (font swap, image, late reflow).
            if (window.ResizeObserver) {
                ro = new ResizeObserver(function () { if (pinning) pinBottom(); });
                Array.prototype.forEach.call(log.children, function (c) { try { ro.observe(c); } catch (e) {} });
            }
            // Hand control back the instant the visitor scrolls/touches the transcript.
            ["wheel", "touchstart", "keydown", "mousedown"].forEach(function (ev) {
                log.addEventListener(ev, release, { once: true, passive: true });
            });
            // Hard stop so we never fight the user forever.
            setTimeout(release, 1800);
        }
    })();
})();