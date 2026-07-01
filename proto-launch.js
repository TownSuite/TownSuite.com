/* ============================================================
   TownSuite.com 2026 — V3 hero portal launcher
   The hero dashboard shot is a launch point. Hover shows a hint;
   clicking opens the portal full-screen and makes it navigable:
   the left nav + app tiles swap the main panel between the
   Dashboard / Account / eBills / Events views. Pay-now toggles the
   balance. Exit / Esc returns to the site.
   Loaded ONLY by "index.html".
   ============================================================ */
(function () {
  var shot = document.querySelector(".x-layer--dash .ts-dash") || document.querySelector(".ts-dash");
  if (!shot) return;

  shot.classList.add("x-portal-live");
  /* the static markup marks the dash aria-hidden (decorative screenshot); once it
     becomes a real button it must not stay aria-hidden. role="button" makes its
     children presentational, so the mockup interior stays out of the a11y tree. */
  shot.removeAttribute("aria-hidden");
  shot.setAttribute("role", "button");
  shot.setAttribute("tabindex", "0");
  shot.setAttribute("aria-label", "Click for interactive demo");

  var hint = document.createElement("div");
  hint.className = "x-portal-hint";
  hint.innerHTML =
    '<span class="x-portal-hint__pill">' +
    '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><use href="#i-spark"></use></svg>' +
    'Click for interactive demo</span>';
  shot.appendChild(hint);

  var stage = null;
  var EXTRA_TX = [], EXTRA_ACT = [];

  /* ---------- panel views (inserted into .tsapp__main) ---------- */
  function dot() { return '<i class="d"></i>'; }

  function viewDashboard(paid) {
    var bal = paid ? '$0.00' : '$40.00';
    var alertPay = paid
      ? '<div class="tsapp__alert"><span class="tsapp__adot is-info"></span><div class="tsapp__amain"><div class="tsapp__atitle">All accounts paid up</div><div class="tsapp__asub">Nothing outstanding — thank you</div></div><span class="tsapp__link">Receipt</span></div>'
      : '<div class="tsapp__alert" data-go="ebills"><span class="tsapp__adot is-due"></span><div class="tsapp__amain"><div class="tsapp__atitle">$40.00 outstanding</div><div class="tsapp__asub">Miscellaneous charges — due ' + dDate(-9) + '</div></div><span class="tsapp__btn" data-pay>Pay now</span></div>';
    return '' +
      '<div class="tsapp__head"><h3>Your dashboard</h3><span class="tsapp__date">' + todayStr() + '</span></div>' +
      '<div class="tsapp__alerts">' + alertPay +
        '<div class="tsapp__alert"><span class="tsapp__adot is-warn"></span><div class="tsapp__amain"><div class="tsapp__atitle">Password never changed</div><div class="tsapp__asub">Update it to keep your account secure</div></div><span class="tsapp__link" data-go="account">Change</span></div>' +
        '<div class="tsapp__alert" data-go="events"><span class="tsapp__adot is-info"></span><div class="tsapp__amain"><div class="tsapp__atitle">6 events open for registration</div><div class="tsapp__asub">Outdoor Soccer closes this Friday</div></div><span class="tsapp__link">Browse</span></div>' +
      '</div>' +
      '<div class="tsapp__cols">' +
        '<section class="tsapp__card tsapp__apps">' +
          '<div class="tsapp__cardhead"><span class="tsapp__cardtitle">Apps &amp; modules</span><span class="tsapp__filter">Filter apps…</span></div>' +
          '<div class="tsapp__appgrid">' +
            app('eBills', 'View &amp; pay what you owe', paid ? '' : '$40 due', paid ? '' : 'is-due', 'ebills') +
            app('Events', 'Programs &amp; registration', '6 active', '', 'events') +
            app('Service requests', 'Submit &amp; track issues', '1,489', '', 'requests') +
            app('Employee', 'Time off &amp; resources', '', '', 'employee') +
            app('Financial', 'Property tax &amp; accounts', '', '', 'financial') +
            app('Facility', 'Bookings &amp; rentals', '17 active', '', '') +
            app('Planning', 'Permits &amp; applications', '', '', '') +
            app('Membership', 'Passes &amp; renewals', '3 avail', '', '') +
          '</div>' +
          '<div class="tsapp__admin"><div class="tsapp__adminhead">Administration</div><div class="tsapp__adminrow">' +
            '<span class="tsapp__chip">' + dot() + 'Manage events</span><span class="tsapp__chip">' + dot() + 'Manage facilities</span>' +
            '<span class="tsapp__chip">' + dot() + 'Manage employees</span><span class="tsapp__chip">' + dot() + 'System settings</span>' +
          '</div></div>' +
        '</section>' + railHTML() +
      '</div>';
  }
  function app(name, desc, bdg, bdgCls, go) {
    return '<div class="tsapp__app"' + (go ? ' data-go="' + go + '"' : '') + '><span class="tsapp__appic">' + dot() + '</span>' +
      '<div class="tsapp__appmain"><div class="tsapp__appname">' + name + '</div><div class="tsapp__appdesc">' + desc + '</div></div>' +
      (bdg ? '<span class="tsapp__appbdg ' + bdgCls + '">' + bdg + '</span>' : '') + '</div>';
  }
  function railHTML() {
    return '<aside class="tsapp__rail">' +
      '<section class="tsapp__card tsapp__profile" data-go="account"><span class="tsapp__av tsapp__av--lg">AW</span>' +
      '<div style="min-width:0;"><div class="tsapp__pname">Andrew W.</div><div class="tsapp__psub">Citizen · Employee · +5 roles</div></div></section>' +
      '<section class="tsapp__card tsapp__feed"><div class="tsapp__tabs"><span class="tsapp__tab is-active" data-feed="activity">Activity feed</span><span class="tsapp__tab" data-feed="tx">Transactions</span></div>' +
      '<div class="tsapp__feedrows">' + feedRows('activity') + '</div></section></aside>';
  }
  function feedRows(kind) {
    if (kind === 'tx') {
      return EXTRA_TX.map(function (x) { return txrow(x[0], x[1], x[2], x[3]); }).join('') +
        txrow('Property tax installment', dDate(1), '\u2212$312.50', false) +
        txrow('Arena Rink B — booking', dDate(3), '\u2212$45.00', false) +
        txrow('Dog license renewal', dDate(14), '\u2212$25.00', false) +
        txrow('Miscellaneous charges', 'Unpaid — due ' + dDate(-9), '$40.00', true);
    }
    return EXTRA_ACT.map(function (x) { return frow(x[0], x[1]); }).join('') +
      frow('Service request received — <b>Pothole on Maple Ave</b>', '2h') +
      frow('Payment received — <b>Property tax installment</b>', '1d') +
      frow('Booking confirmed — <b>Arena Rink B</b>', '3d') +
      frow('Building permit approved — <b>Deck &amp; fence</b>', '6d');
  }
  function frow(t, age) { return '<div class="tsapp__frow"><span class="tsapp__fdot"></span><span class="tsapp__ftext">' + t + '</span><span class="tsapp__fage">' + age + '</span></div>'; }
  function txrow(t, sub, amt, due) { return '<div class="tsapp__frow"><span class="tsapp__fdot"></span><span class="tsapp__ftext">' + t + '<br><span class="x-pv-txsub">' + sub + '</span></span><span class="x-pv-txamt' + (due ? ' is-due' : '') + '">' + amt + '</span></div>'; }
  /* dynamic dates: today minus N days (negative N = future) */
  function dDate(daysAgo) { var d = new Date(); d.setDate(d.getDate() - daysAgo); try { return d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' }); } catch (e) { return ''; } }
  function dRange(aAgo, bAgo) { var d1 = new Date(); d1.setDate(d1.getDate() - aAgo); var d2 = new Date(); d2.setDate(d2.getDate() - bAgo); var m; try { m = d1.toLocaleDateString('en-CA', { month: 'short' }); } catch (e) { m = ''; } return m + ' ' + d1.getDate() + '\u2013' + d2.getDate(); }

  function viewAccount() {
    function card(t, d, tag) {
      return '<div class="tsapp__app x-pv-acct"><span class="tsapp__appic">' + dot() + '</span>' +
        '<div class="tsapp__appmain"><div class="tsapp__appname">' + t + (tag ? ' <span class="x-pv-tag">' + tag + '</span>' : '') + '</div>' +
        '<div class="tsapp__appdesc">' + d + '</div></div><i class="ts-chev x-pv-chev"></i></div>';
    }
    return '' +
      '<div class="tsapp__head"><h3>Your account</h3><span class="tsapp__date">Control, manage &amp; secure your account</span></div>' +
      '<div class="x-pv-stats">' +
        stat('1', 'Linked accounts') + stat('2', 'Family members') + stat('7', 'Service requests') +
      '</div>' +
      '<div class="tsapp__cols"><section class="tsapp__card tsapp__apps"><div class="tsapp__cardhead"><span class="tsapp__cardtitle">Manage</span></div>' +
        '<div class="tsapp__appgrid">' +
          card('Change password', 'Keep your account secure', 'Never changed') +
          card('Two-factor authentication', 'Add a second layer of sign-in security', '') +
          card('Contact information', 'Modify your details &amp; mailing address', '') +
          card('Preferences', 'Mail settings &amp; other options', '') +
          card('Sub accounts', 'Add family members or businesses', '') +
          card('Link municipality accounts', 'Customers, properties &amp; meters', '') +
        '</div></section>' + railHTML() + '</div>';
  }
  function stat(n, l) { return '<div class="x-pv-stat"><div class="x-pv-statn">' + n + '</div><div class="x-pv-statl">' + l + '</div></div>'; }

  function viewEBills(paid) {
    var bal = paid ? '$0.00' : '$40.00';
    var due = paid ? 'All accounts are paid up' : '1 of 3 accounts has a balance';
    var payBtn = paid
      ? '<span class="tsapp__btn is-done" data-pay>Paid ✓</span>'
      : '<span class="tsapp__btn" data-pay>Pay bills now →</span>';
    function row(t, d, amt, zero, dueDot) {
      return '<div class="x-pv-ebrow"><span class="tsapp__adot ' + (dueDot ? 'is-due' : 'is-info') + '"></span>' +
        '<div class="x-pv-ebmain"><div class="x-pv-ebtitle">' + t + '</div><div class="x-pv-ebdesc">' + d + '</div></div>' +
        '<span class="x-pv-ebamt ' + (zero ? 'is-zero' : '') + '">' + amt + '</span></div>';
    }
    return '' +
      '<div class="tsapp__head"><h3>eBills summary</h3><span class="tsapp__date">View &amp; pay what you owe</span></div>' +
      '<div class="tsapp__cols"><div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:14px;">' +
        '<section class="x-pv-ebhero"><div><div class="x-pv-eblbl">Total amount outstanding</div><div class="x-pv-ebnum">' + bal + '</div><div class="x-pv-ebsub">' + due + '</div></div>' + payBtn + '</section>' +
        '<section class="tsapp__card tsapp__apps"><div class="tsapp__cardhead"><span class="tsapp__cardtitle">Outstanding payments</span><span class="tsapp__filter">By account type</span></div>' +
          '<div class="x-pv-ebrows">' +
            row('Tax bills', 'Total amount owed for property', '$0.00', true, false) +
            row('Miscellaneous charges', 'Charges to your account', paid ? '$0.00' : '$40.00', paid, !paid) +
            row('Utility bills', 'Total amount owed for meters', '$0.00', true, false) +
          '</div></section>' +
      '</div>' + railHTML() + '</div>';
  }

  function viewRequests() {
    function sr(t, tags, date, age, id, closed) {
      return '<div class="x-pv-srrow"><span class="tsapp__appic">' + dot() + '</span>' +
        '<div class="x-pv-srmain"><div class="x-pv-srtitle">' + t + '</div><div class="x-pv-srchips">' +
        '<span class="x-pv-srstatus' + (closed ? ' is-closed' : '') + '">' + (closed ? 'Resolved' : 'Open') + '</span>' +
        tags.map(function (g) { return '<span class="x-pv-srtag">' + g + '</span>'; }).join('') +
        '</div></div><div class="x-pv-srmeta"><div class="x-pv-srdate">' + date + '</div><div class="x-pv-srid">' + age + ' · #' + id + '</div></div></div>';
    }
    return '' +
      '<div class="tsapp__head"><h3>Service requests</h3><span class="tsapp__date">132 open · tracked to resolution</span></div>' +
      '<div class="tsapp__cols"><div style="flex:1;min-width:0;"><section class="tsapp__card tsapp__apps">' +
        '<div class="tsapp__cardhead"><span class="tsapp__cardtitle">Open requests</span><span class="tsapp__filter">is:open · sort:newest</span></div>' +
        '<div class="x-pv-srrows">' +
          sr('Pothole on Maple Ave', ['Roads', 'Public Works'], dDate(2), '2 days old', '6412', false) +
          sr('Street light repair — 4th St', ['Public Works'], dDate(7), '1 week old', '6398', false) +
          sr('Water shut-off request', ['Utilities', 'Water'], dDate(19), '3 weeks old', '6377', false) +
          sr('Development permit application', ['Planning', 'Permits'], dDate(32), '5 weeks old', '6351', false) +
          sr('Cemetery plot inquiry', ['Cemetery'], dDate(44), '6 weeks old', '6334', true) +
        '</div></section></div>' + railHTML() + '</div>';
  }

  function viewEmployee() {
    function bal(n, l) { return '<div class="x-pv-balc"><div class="x-pv-baln">' + n + '</div><div class="x-pv-ball">' + l + '</div></div>'; }
    function emp(t, meta, ok) { return '<div class="x-pv-emprow"><span class="tsapp__fdot"></span>' + t + ' <span style="color:var(--ink3)">· ' + meta + '</span><span class="x-pv-empok">' + ok + '</span></div>'; }
    return '' +
      '<div class="tsapp__head"><h3>Employee portal</h3><span class="tsapp__date">Time off, pay &amp; self-service</span></div>' +
      '<div class="x-pv-bal">' + bal('12.5', 'Annual leave (days)') + bal('5.0', 'Sick days') + bal('2.0', 'Personal days') + '</div>' +
      '<div class="tsapp__cols"><div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:14px;">' +
        '<section class="tsapp__card tsapp__apps"><div class="tsapp__cardhead"><span class="tsapp__cardtitle">Recent requests</span></div>' +
          '<div>' + emp('Annual leave', dRange(-15, -19), 'Approved') + emp('Sick day', dDate(50), 'Approved') + emp('Personal day', dDate(64), 'Approved') + '</div></section>' +
        '<section class="tsapp__card tsapp__apps"><div class="tsapp__cardhead"><span class="tsapp__cardtitle">Quick actions</span></div>' +
          '<div class="tsapp__adminrow"><span class="tsapp__chip">' + dot() + 'Request time off</span><span class="tsapp__chip">' + dot() + 'View pay stubs</span>' +
          '<span class="tsapp__chip">' + dot() + 'Benefits</span><span class="tsapp__chip">' + dot() + 'Certifications</span></div></section>' +
      '</div>' + railHTML() + '</div>';
  }

  var FIN_MODS = [
    ['Accounts Receivable', 'ar', 0], ['Billing', 'billing', 0], ['Accounts Payable', 'ap', 0], ['Banking', 'banking', 0],
    ['General Ledger', 'gl', 0], ['Budgeting', 'budgeting', 1], ['Purchasing', 'purchasing', 0], ['Payroll', 'payroll', 1],
    ['Inventory', 'inventory', 1], ['Tangible Capital Assets', 'assets', 1], ['Work Order Management', 'workorder', 1], ['Planning', 'planning', 1],
    ['Mapping', 'mapping', 1], ['TownSuite Intelligence', 'intelligence', 0], ['Web', 'web', 0], ['Documentation', 'docs', 0],
    ['System Settings', 'settings', 0]
  ];
  var FIN_NEWS = [
    ['mERP 2026.6 is rolling out', 'Release', 0],
    ['Scheduled maintenance — Sunday 2:00 AM', 'Maintenance', 4],
    ['Speed up receipts with Auto-apply', 'Tip', 9]
  ];
  function financialWindow() {
    var cards = FIN_MODS.map(function (m) {
      var link = m[0] === 'Accounts Receivable' ? ' data-ar' : '';
      return '<div class="x-mwin-card' + (m[2] ? ' is-locked' : '') + '"' + (m[2] ? ' data-demo' : link) + '>' +
        (m[2] ? '<span class="x-mwin-lock"><svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="11" width="14" height="9" rx="2"></rect><path d="M8 11V8a4 4 0 0 1 8 0v3"></path></svg></span>' : '') +
        '<img class="x-mwin-ic" src="fin-icons/' + m[1] + '.png" alt="" draggable="false">' +
        '<div class="x-mwin-cardname">' + m[0] + '</div></div>';
    }).join('');
    var news = FIN_NEWS.map(function (n) {
      var d = new Date(); d.setDate(d.getDate() - n[2]);
      var ds; try { ds = d.toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric' }); } catch (e) { ds = ''; }
      return '<div class="x-fin-newsitem"><div class="x-fin-newst">' + n[0] + '</div><div class="x-fin-newsm">' + n[1] + ' · ' + ds + '</div></div>';
    }).join('');
    function railItem(label, svg, badge, attr) {
      return '<button class="x-mwin-railitem"' + (attr || '') + '><span class="x-mwin-railic">' + svg +
        (badge ? '<span class="x-mwin-railbdg">' + badge + '</span>' : '') + '</span>' + label + '</button>';
    }
    var icAssistant = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M3.5 20.5h17M6.5 20v-6.5M11.5 20V5.5M16.5 20v-9.5"></path></svg>';
    var icNews = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><rect x="3.5" y="4.5" width="17" height="15" rx="2"></rect><path d="M7.5 9h5M7.5 12.5h9M7.5 16h9"></path></svg>';
    var icMail = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"></rect><path d="M3.5 7.5L12 13.5l8.5-6"></path></svg>';
    var icPower = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M12 3v8M18.36 7.64a9 9 0 1 1-12.72 0"></path></svg>';
    return '' +
      '<div class="x-mwin">' +
        '<div class="x-mwin-titlebar"><span class="x-mwin-temblem"><svg class="ts-logo" viewBox="151 154 360 200" style="height:18px;width:auto"><rect x="-12" y="-12" width="24" height="24" fill="#D8E0ED" transform="translate(200,200) rotate(65) scale(1.3)"></rect><rect x="-12" y="-12" width="24" height="24" fill="#6B95BE" transform="translate(176,260) rotate(65) scale(1.3)"></rect><rect x="-12" y="-12" width="24" height="24" fill="#00578E" transform="translate(218,235) rotate(65) scale(1.3)"></rect><rect x="-6" y="-6" width="12" height="12" fill="#E48D1A" transform="translate(258,272) rotate(65) scale(1.3)"></rect><rect x="-3.2" y="-3.2" width="6.4" height="6.4" fill="#2DA343" transform="translate(278,258) rotate(65) scale(1.3)"></rect><rect x="-3.3" y="-3.3" width="6.6" height="6.6" fill="#E03A3E" transform="translate(265,293) rotate(65) scale(1.3)"></rect></svg></span>' +
          '<span class="x-mwin-titletext">TownSuite Main Menu — (Production Server: YOW-02\\TownSuite Financials)</span>' +
          '<span class="x-mwin-wc"><span class="wc-min"></span><span class="wc-max"></span><span class="wc-close">✕</span></span></div>' +
        '<div class="x-mwin-menubar"><span>File</span><span>Utilities</span><span>Help</span></div>' +
        '<div class="x-mwin-body">' +
          '<aside class="x-mwin-rail">' +
            railItem('Assistant', icAssistant, '', '') +
            railItem('Newsfeed', icNews, '', '') +
            railItem('Emails', icMail, '3', '') +
            '<span class="x-mwin-railspacer"></span>' +
            railItem('Log Out', icPower, '', ' data-logout') +
          '</aside>' +
          '<main class="x-mwin-main">' +
            '<div class="x-fin-top"><span class="x-fin-brand"><svg class="x-fin-logo" viewBox="151 154 889 181" role="img" aria-label="TownSuite mERP"><rect x="-16.975" y="-16.975" width="33.95" height="33.95" fill="#D8E0ED" transform="translate(220.79,191.54) rotate(65) scale(1.38)"></rect><rect x="-16.975" y="-16.975" width="33.95" height="33.95" fill="#6B95BE" transform="translate(188.71,273.70) rotate(65) scale(1.38)"></rect><rect x="-17" y="-17" width="34" height="34" fill="#00578E" transform="translate(244.20,246.20) rotate(65) scale(1.38)"></rect><rect x="-8.825" y="-8.825" width="17.65" height="17.65" fill="#E48D1A" transform="translate(297.55,291.42) rotate(65) scale(1.38)"></rect><rect x="-4.555" y="-4.555" width="9.11" height="9.11" fill="#2DA343" transform="translate(322.72,273.11) rotate(65) scale(1.38)"></rect><rect x="-4.64" y="-4.64" width="9.28" height="9.28" fill="#E03A3E" transform="translate(305.69,320.65) rotate(65) scale(1.38)"></rect><path fill="currentColor" d="M401.02 212.45L401.02 218.40L387.86 218.40L387.86 278.50L379.03 278.50L379.03 218.40L365.88 218.40L365.88 212.45L401.02 212.45ZM443.39 252.68L443.39 252.68Q443.39 264.68 438.35 272.07Q433.31 279.46 423.23 279.46Q413.15 279.46 408.06 272.07Q402.97 264.68 402.97 252.68L402.97 252.68Q402.97 240.48 408.06 233.14Q413.15 225.80 423.13 225.80L423.13 225.80Q433.31 225.80 438.35 233.09Q443.39 240.39 443.39 252.68ZM434.94 252.68L434.94 252.68Q434.94 231.17 423.23 231.17L423.23 231.17Q411.42 231.17 411.42 252.68L411.42 252.68Q411.42 273.60 423.23 273.60L423.23 273.60Q434.94 273.60 434.94 252.68ZM508.90 226.76L516.58 226.76L501.79 278.50L494.50 278.50L484.03 241.54Q483.17 238.37 482.98 235.49L482.98 235.49L482.88 235.49Q482.59 238.37 481.63 241.54L481.63 241.54L470.98 278.50L463.68 278.50L448.99 226.76L457.63 226.76L466.66 263.91L467.71 270.05L467.90 270.05Q468.19 267.46 469.15 263.91L469.15 263.91L479.62 226.76L486.91 226.76L497.09 263.91Q498.24 270.05 498.24 270.05L498.24 270.05L498.43 270.05Q498.72 266.88 499.49 263.81L499.49 263.81L508.90 226.76ZM562.50 241.16L562.50 278.50L554.05 278.50L554.05 241.35Q554.05 231.27 543.20 231.27L543.20 231.27Q537.64 231.27 533.41 233.09L533.41 233.09L533.41 278.50L524.96 278.50L524.96 229.44Q532.55 225.80 543.88 225.80L543.88 225.80Q553.76 225.80 558.13 230.26Q562.50 234.72 562.50 241.16L562.50 241.16ZM607.27 259.88L607.27 259.88Q607.27 268.52 601.66 273.99Q596.04 279.46 587.30 279.46L587.30 279.46Q577.61 279.46 571.94 275.81L571.94 275.81L574.25 269.67Q579.24 272.74 585.77 272.74L585.77 272.74Q591.43 272.74 594.79 269.38Q598.15 266.02 598.15 260.36L598.15 260.36Q598.15 255.94 595.51 253.06Q592.87 250.18 586.63 247.68L586.63 247.68Q572.62 242.12 572.62 230.02L572.62 230.02Q572.62 222.24 577.75 216.87Q582.89 211.49 591.24 211.49L591.24 211.49Q599.69 211.49 604.78 215.04L604.78 215.04L602.66 220.61Q597.77 217.54 592.20 217.54L592.20 217.54Q587.02 217.54 584.14 220.66Q581.26 223.78 581.26 229.16L581.26 229.16Q581.26 233.86 584.09 236.50Q586.92 239.14 592.30 241.25L592.30 241.25Q607.27 247.11 607.27 259.88ZM654.35 226.76L654.35 275.43Q647.15 279.56 636.11 279.56L636.11 279.56Q617.77 279.56 617.77 262.66L617.77 262.66L617.77 226.76L626.22 226.76L626.22 262.95Q626.22 267.75 628.86 270.68Q631.50 273.60 636.59 273.60L636.59 273.60Q642.35 273.60 645.90 271.49L645.90 271.49L645.90 226.76L654.35 226.76ZM674.74 208.85Q676.18 210.24 676.18 212.16Q676.18 214.08 674.74 215.43Q673.30 216.77 671.28 216.77L671.28 216.77Q669.17 216.77 667.73 215.43Q666.29 214.08 666.29 212.16Q666.29 210.24 667.73 208.85Q669.17 207.46 671.28 207.46L671.28 207.46Q673.30 207.46 674.74 208.85ZM675.50 226.76L675.50 278.50L667.06 278.50L667.06 226.76L675.50 226.76ZM708.47 272.84L708.47 278.21Q705.88 278.98 703.86 278.98L703.86 278.98Q697.33 278.98 694.16 275.14Q691.00 271.30 691.00 265.92L691.00 265.92L691.00 232.04L685.04 232.04L685.04 226.76L691.00 226.76L691.00 214.85L699.44 212.26L699.44 226.76L708.47 226.76L708.47 232.04L699.44 232.04L699.44 265.73Q699.44 269.09 701.03 271.16Q702.61 273.22 705.97 273.22L705.97 273.22Q706.74 273.22 708.47 272.84L708.47 272.84ZM754.97 251.14L754.97 251.14L722.42 255.84Q723.86 273.32 738.17 273.32L738.17 273.32Q745.75 273.32 750.94 270.34L750.94 270.34L753.14 275.91Q747.29 279.46 737.50 279.46L737.50 279.46Q726.94 279.46 720.70 272.64Q714.46 265.83 714.46 252.48L714.46 252.48Q714.46 239.62 720.17 232.71Q725.88 225.80 735.29 225.80L735.29 225.80Q744.79 225.80 749.93 232.13Q755.06 238.47 754.97 251.14ZM722.14 251.33L746.90 247.59Q746.90 231.27 735 231.27L735 231.27Q729.05 231.27 725.54 236.26Q722.04 241.25 722.14 251.33L722.14 251.33Z M857.71 241.06L857.71 278.50L849.26 278.50L849.26 241.25Q849.26 236.93 846.91 234.15Q844.56 231.36 839.28 231.36L839.28 231.36Q832.94 231.36 828.62 235.97L828.62 235.97L828.62 278.50L820.17 278.50L820.17 240.87Q820.17 236.45 817.24 233.86Q814.32 231.27 808.84 231.27L808.84 231.27Q803.66 231.27 799.53 233.00L799.53 233.00L799.53 278.50L791.08 278.50L791.08 229.44Q798.57 225.80 809.04 225.80L809.04 225.80Q819.88 225.80 824.88 232.04L824.88 232.04Q830.83 225.80 840.91 225.80L840.91 225.80Q849.45 225.80 853.58 230.31Q857.71 234.82 857.71 241.06L857.71 241.06ZM901.04 272.55L901.04 278.50L870.42 278.50L870.42 212.45L901.04 212.45L901.04 218.40L879.25 218.40L879.25 241.44L898.83 241.44L898.83 247.30L879.25 247.30L879.25 272.55L901.04 272.55ZM930.55 249.41L952.15 278.50L942.16 278.50L920.47 247.68L920.28 247.68L920.28 278.50L911.54 278.50L911.54 215.04Q917.97 211.49 927.96 211.49L927.96 211.49Q939.09 211.49 944.85 216.63Q950.61 221.76 950.61 231.08L950.61 231.08Q950.61 239.43 945.19 244.23Q939.76 249.03 930.55 249.22L930.55 249.22L930.55 249.41ZM941.88 231.46L941.88 231.46Q941.88 223.88 938.47 220.28Q935.06 216.68 927.76 216.68L927.76 216.68Q922.87 216.68 920.28 218.12L920.28 218.12L920.28 245.76Q922.20 246.34 925.94 246.34L925.94 246.34Q941.88 246.34 941.88 231.46ZM1000.95 231.46L1000.95 231.46Q1000.95 241.06 994.09 246.87Q987.22 252.68 973.50 251.33L973.50 251.33L970.52 251.04L970.52 278.50L961.88 278.50L961.88 215.14Q968.22 211.49 978.39 211.49L978.39 211.49Q989.62 211.49 995.29 216.92Q1000.95 222.34 1000.95 231.46ZM992.41 231.36L992.41 231.36Q992.41 224.07 988.95 220.42Q985.50 216.77 978.01 216.77L978.01 216.77Q973.40 216.77 970.52 218.02L970.52 218.02L970.52 245.67L973.40 245.96Q992.41 247.78 992.41 231.36Z M1032.43 226.84L1032.43 226.84Q1032.43 231.80 1028.90 235.32Q1025.36 238.84 1020.40 238.84Q1015.43 238.84 1011.91 235.32Q1008.39 231.80 1008.39 226.84L1008.39 226.84Q1008.39 221.84 1011.91 218.32Q1015.43 214.80 1020.40 214.80Q1025.36 214.80 1028.90 218.32Q1032.43 221.84 1032.43 226.84ZM1027.88 234.28Q1030.97 231.19 1030.97 226.84Q1030.97 222.49 1027.88 219.38Q1024.78 216.26 1020.40 216.26L1020.40 216.26Q1016.04 216.26 1012.95 219.38Q1009.86 222.49 1009.86 226.84Q1009.86 231.19 1012.95 234.28Q1016.04 237.38 1020.40 237.38L1020.40 237.38Q1024.78 237.38 1027.88 234.28ZM1020.50 227.11L1025.33 233.77L1023.42 233.77L1018.76 227.21L1018.25 227.21L1018.25 233.77L1016.66 233.77L1016.66 219.90Q1018.02 219.22 1019.99 219.22L1019.99 219.22Q1021.99 219.22 1023.35 220.28Q1024.71 221.33 1024.71 223.23L1024.71 223.23Q1024.71 225.00 1023.54 226.00Q1022.37 227.01 1020.50 227.11L1020.50 227.11ZM1023.08 223.20L1023.08 223.20Q1023.08 221.77 1022.11 221.16Q1021.14 220.55 1019.78 220.55L1019.78 220.55Q1018.90 220.55 1018.25 220.82L1018.25 220.82L1018.25 226.09L1019.51 226.09Q1021.08 226.09 1022.08 225.41Q1023.08 224.73 1023.08 223.20Z"></path></svg></span>' +
            '<span class="x-fin-search" data-super><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"></circle><path d="M16.5 16.5L21 21"></path></svg> <span>⌘K</span></span></div>' +
            '<div class="x-fin-wrap"><div class="x-fin-grid">' + cards + '</div>' +
            '<aside class="x-fin-news"><div class="x-fin-newshd"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" style="vertical-align:-3px;margin-right:6px"><rect x="3.5" y="4.5" width="17" height="15" rx="2"></rect><path d="M7.5 9h5M7.5 12.5h9M7.5 16h9"></path></svg>Newsfeed</div>' + news +
            '<a class="x-fin-newslink">Open Newsfeed</a></aside></div>' +
          '</main>' +
        '</div>' +
        '<div class="x-mwin-foot"><span>© 2026 TownSuite mERP · v2026.6.1</span><span class="x-mwin-status"><span class="x-mwin-statusdot"></span>YOW-02 · Connected</span></div>' +
      '</div>';
  }

  /* ---------- Accounts Receivable module window ---------- */
  var AR_DATA = {
    customer: {
      label: 'Customer Records',
      cols: ['Account #', 'Name', 'Service address', 'Balance', 'Status'],
      rows: [
        ['10042-001', 'Beauchamp, Marie', '24 Rideau Terrace', '$0.00', 'Current'],
        ['10118-002', 'Okafor, Daniel', '187 Laurier Ave W', '$142.50', 'Due'],
        ['10231-001', 'Tremblay Holdings Inc.', '9 Sparks St, Unit 300', '$0.00', 'Current'],
        ['10377-004', 'Nguyen, Linh', '63 Bronson Ave', '$58.20', 'Due'],
        ['10489-001', 'Whitebear, Joseph', '412 Bank St', '$0.00', 'Current'],
        ['10502-003', 'MacDonald, Erin', '78 Clarence St', '$1,204.00', 'Overdue']
      ]
    },
    property: {
      label: 'Property Records',
      cols: ['Roll #', 'Address', 'Owner', 'Assessment', 'Taxes due'],
      rows: [
        ['0614-220-118', '24 Rideau Terrace', 'Beauchamp, Marie', '$486,000', '$0.00'],
        ['0614-220-204', '187 Laurier Ave W', 'Okafor, Daniel', '$372,500', '$842.10'],
        ['0614-310-009', '9 Sparks St, Unit 300', 'Tremblay Holdings Inc.', '$1,240,000', '$0.00'],
        ['0614-118-063', '63 Bronson Ave', 'Nguyen, Linh', '$298,000', '$214.55'],
        ['0614-405-412', '412 Bank St', 'Whitebear, Joseph', '$455,200', '$0.00']
      ]
    },
    meter: {
      label: 'Meter Records',
      cols: ['Meter #', 'Service', 'Address', 'Last read', 'Status'],
      rows: [
        ['W-88204', 'Water', '24 Rideau Terrace', '142,330 m³', 'Active'],
        ['W-88311', 'Water', '187 Laurier Ave W', '88,540 m³', 'Active'],
        ['W-88477', 'Water', '63 Bronson Ave', '201,118 m³', 'Active'],
        ['E-44012', 'Electric', '412 Bank St', '12,904 kWh', 'Active'],
        ['W-88590', 'Water', '78 Clarence St', '54,002 m³', 'Est. read']
      ]
    }
  };

  function arWindow(sel, detail, tab, search) {
    if (detail) sel = 'customer';
    if (search) sel = sel || 'customer';
    var tabPill = function (key, label) {
      var icon = key === 'customer'
        ? '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="3.5"></circle><path d="M5 19a7 7 0 0 1 14 0"></path></svg>'
        : key === 'property'
        ? '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M4 11l8-6 8 6"></path><path d="M6 10v9h12v-9"></path></svg>'
        : '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="8"></circle><path d="M12 12l4-2"></path></svg>';
      return '<button class="x-ar-tab' + (sel === key ? ' is-active' : '') + '" data-arsel="' + key + '">' + icon + label + '</button>';
    };
    var toolItem = function (label, svg) {
      return '<button class="x-ar-tool" data-demo>' + svg + '<span>' + label + '</span></button>';
    };
    var icReceipt = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"></path><path d="M9 8h6M9 12h6"></path></svg>';
    var icCalc = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><rect x="5" y="3" width="14" height="18" rx="2"></rect><path d="M8 7h8M8 11h2M12 11h2M16 11h0M8 15h2M12 15h2M16 15h0"></path></svg>';
    var icSetup = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M14.5 4l-1 2.5-2.5 1L8 6.5 6.5 8l1 2.5-1 2.5L4 14.5 4 16l2.5.5 1 2.5L6.5 21 8 22.5l2.5-1 2.5 1 1.5-1.5-1-2.5 1-2.5 2.5-.5V14l-2.5-1-1-2.5L17 8z"></path><circle cx="12" cy="12" r="2.5"></circle></svg>';
    var icAsst = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M3.5 20.5h17M6.5 20v-6.5M11.5 20V5.5M16.5 20v-9.5"></path></svg>';

    var d = sel ? AR_DATA[sel] : null;
    var body;
    if (search) {
      body = arSearchContent();
    } else if (detail) {
      body = arDetailContent(detail, tab);
    } else if (d) {
      var head = d.cols.map(function (c) { return '<th>' + c + '</th>'; }).join('');
      var body_rows = d.rows.map(function (r, i) {
        var tds = r.map(function (cell, ci) {
          var cls = '';
          if (ci === r.length - 1) cls = ' class="x-ar-status x-ar-status--' + cell.toLowerCase().replace(/[^a-z]/g, '') + '"';
          return '<td' + cls + '>' + cell + '</td>';
        }).join('');
        return '<tr data-rowidx="' + i + '"' + (sel === 'customer' ? '' : ' data-demo') + (i === 0 ? ' class="is-sel"' : '') + '>' + tds + '</tr>';
      }).join('');
      body = '<div class="x-ar-recview">' +
        '<div class="x-ar-rechead"><div class="x-ar-rectitle">' + d.label + '</div>' +
          '<span class="x-ar-recfind" data-seopen><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"></circle><path d="M16.5 16.5L21 21"></path></svg> Find a record…</span>' +
          '<button class="x-ar-recnew" data-demo>+ New</button></div>' +
        '<div class="x-ar-tablewrap"><table class="x-ar-table"><thead><tr>' + head + '</tr></thead><tbody>' + body_rows + '</tbody></table></div>' +
      '</div>';
    } else {
      body = '<div class="x-ar-empty">' +
        '<div class="x-ar-emptyic"><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"></path><path d="M9 8h6M9 12h5"></path></svg><span class="x-ar-emptybadge">2</span></div>' +
        '<div class="x-ar-emptyh">Accounts Receivable</div>' +
        '<p class="x-ar-emptyp">Open a record to begin — customers, properties, or meters — or write a receipt.<br>Once a type is open you can look up any record from the bar.</p>' +
        '<div class="x-ar-emptybtns">' +
          '<button class="x-ar-btn x-ar-btn--primary" data-arsel="customer">Customer Records</button>' +
          '<button class="x-ar-btn" data-arsel="property">Property Records</button>' +
          '<button class="x-ar-btn" data-arsel="meter">Meter Records</button>' +
        '</div>' +
        '<button class="x-ar-btn x-ar-btn--receipt" data-demo>Receipt</button>' +
      '</div>';
    }

    return '' +
      '<div class="x-mwin x-arwin">' +
        '<div class="x-mwin-titlebar"><span class="x-mwin-temblem"><svg class="ts-logo" viewBox="151 154 360 200" style="height:18px;width:auto"><rect x="-12" y="-12" width="24" height="24" fill="#D8E0ED" transform="translate(200,200) rotate(65) scale(1.3)"></rect><rect x="-12" y="-12" width="24" height="24" fill="#6B95BE" transform="translate(176,260) rotate(65) scale(1.3)"></rect><rect x="-12" y="-12" width="24" height="24" fill="#00578E" transform="translate(218,235) rotate(65) scale(1.3)"></rect><rect x="-6" y="-6" width="12" height="12" fill="#E48D1A" transform="translate(258,272) rotate(65) scale(1.3)"></rect><rect x="-3.2" y="-3.2" width="6.4" height="6.4" fill="#2DA343" transform="translate(278,258) rotate(65) scale(1.3)"></rect><rect x="-3.3" y="-3.3" width="6.6" height="6.6" fill="#E03A3E" transform="translate(265,293) rotate(65) scale(1.3)"></rect></svg></span>' +
          '<span class="x-mwin-titletext">Accounts Receivable — TownSuite mERP · (Production Server: YOW-02\\TownSuite Financials)</span>' +
          '<span class="x-mwin-wc"><span class="wc-min"></span><span class="wc-max"></span><span class="wc-close" data-arclose>✕</span></span></div>' +
        '<div class="x-mwin-menubar x-ar-menubar">' +
          ['Customers', 'Property', 'Meters', 'Transaction Processing', 'Reports', 'Other', 'HRLE'].map(function (m) { return '<span data-demo>' + m + '</span>'; }).join('') +
          '<span class="x-ar-menuclose" data-arclose>Close</span></div>' +
        '<div class="x-ar-toolbar">' +
          '<button class="x-ar-applauncher" data-arclose><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><circle cx="5" cy="5" r="1.6"></circle><circle cx="12" cy="5" r="1.6"></circle><circle cx="19" cy="5" r="1.6"></circle><circle cx="5" cy="12" r="1.6"></circle><circle cx="12" cy="12" r="1.6"></circle><circle cx="19" cy="12" r="1.6"></circle><circle cx="5" cy="19" r="1.6"></circle><circle cx="12" cy="19" r="1.6"></circle><circle cx="19" cy="19" r="1.6"></circle></svg><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"></path></svg></button>' +
          '<span class="x-ar-search" data-super><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"></circle><path d="M16.5 16.5L21 21"></path></svg><span class="x-ar-kbd">⌘K</span></span>' +
          '<span class="x-ar-tabs">' + tabPill('customer', 'Customer Records') + tabPill('property', 'Property Records') + tabPill('meter', 'Meter Records') + '</span>' +
          '<span class="x-ar-toolspacer"></span>' +
          toolItem('Receipt', icReceipt) + toolItem('Calculator', icCalc) + toolItem('Setup', icSetup) + toolItem('Assistant', icAsst) +
        '</div>' +
        '<div class="x-ar-body">' + body + '</div>' +
        '<div class="x-mwin-foot"><span>© 2026 TownSuite mERP · v26.3.27 · Site: TownSuite Municipal Software Inc.</span><span class="x-mwin-status"><span class="x-ar-statusdiamond"></span>Procom Data (PP02) · Connected</span></div>' +
      '</div>';
  }

  /* ---------- Search Engine (contained in AR window body) ---------- */
  function arSearchRows() {
    return AR_DATA.customer.rows.map(function (r) {
      var name = r[1], biz = name.indexOf(',') === -1, last, first;
      if (biz) { last = name; first = ''; }
      else { var p = name.split(','); last = (p[0] || '').trim(); first = (p[1] || '').trim(); }
      var code = (last.replace(/[^A-Za-z]/g, '').slice(0, 5).toUpperCase() || 'CUST') + '001';
      var out = (r[3] || '$0.00').replace(/^\$/, '');
      return [code, last, first, out, biz ? 'BUSI' : 'RESI'];
    });
  }

  function arSearchContent() {
    var SR = arSearchRows();
    var funnel = '<svg class="x-se-funnel" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M3 5h18l-7 8v5l-4 2v-7z"></path></svg>';
    var cols = [['Customer Code', 'code'], ['Last Name', ''], ['First Name', ''], ['Outstanding', 'num'], ['Type', '']];
    var head = cols.map(function (c) { return '<th class="' + (c[1] === 'num' ? 'x-se-num' : '') + '">' + c[0].toUpperCase() + ' ' + funnel + '</th>'; }).join('');
    var rows = SR.map(function (r, i) {
      return '<tr data-serow="' + i + '"' + (i === 0 ? ' class="is-sel"' : '') + '>' +
        '<td class="x-se-code">' + r[0] + '</td><td>' + r[1] + '</td><td>' + r[2] + '</td>' +
        '<td class="x-se-num' + (parseFloat(r[3].replace(/,/g, '')) > 0 ? ' x-se-owing' : '') + '">' + r[3] + '</td>' +
        '<td>' + r[4] + '</td></tr>';
    }).join('');

    var radio = function (label, on) {
      return '<label class="x-se-radio' + (on ? ' is-on' : '') + '" data-demo><span class="x-se-dot"></span>' + label + '</label>';
    };
    var sbtn = function (label, cls) {
      return '<button class="x-se-btn' + (cls ? ' ' + cls : '') + '" data-demo>' + label + '</button>';
    };

    return '' +
      '<div class="x-se">' +
        '<div class="x-se-bar">CUSTOMERS — ' + SR.length + ' Rows</div>' +
        '<div class="x-se-tablewrap"><table class="x-se-table"><thead><tr>' + head + '</tr></thead><tbody>' + rows + '</tbody></table></div>' +
        '<div class="x-se-pager">' +
          '<div class="x-se-pagebtns">' +
            ['«', '‹', '…'].map(function (b) { return '<button class="x-se-pg" data-demo>' + b + '</button>'; }).join('') +
            '<button class="x-se-pg is-active" data-demo>1</button>' +
            ['…', '›', '»'].map(function (b) { return '<button class="x-se-pg" data-demo>' + b + '</button>'; }).join('') +
          '</div>' +
          '<span class="x-se-pginfo">Page <b>1</b> of 1</span>' +
        '</div>' +
        '<div class="x-se-filters">' +
          '<div class="x-se-radios">' + radio('Active', false) + radio('InActive', false) + radio('Both', true) + '</div>' +
          '<div class="x-se-fontsize"><span class="x-se-fa-sm">A</span><span class="x-se-slider"><span class="x-se-slidertrack"></span><span class="x-se-sliderknob"></span></span><span class="x-se-fa-lg">A</span></div>' +
        '</div>' +
        '<div class="x-se-searchpane">' +
          '<div class="x-se-searchmain">' +
            '<div class="x-se-tabs"><span class="x-se-tab is-active" data-demo>Search</span><span class="x-se-tab" data-demo>Advance Search</span></div>' +
            '<div class="x-se-searchbox">' +
              '<div class="x-se-searchlbl">Type your search criteria <b>Customer Code</b></div>' +
              '<input class="x-se-input" autofocus data-demo>' +
            '</div>' +
          '</div>' +
          '<div class="x-se-searchbtns">' +
            sbtn('SEARCH', 'x-se-btn--primary') +
            sbtn('Reset', '') +
            '<button class="x-se-btn x-se-btn--cancel" data-seclose>Cancel</button>' +
            '<button class="x-se-btn x-se-btn--select" data-seselect>Select »</button>' +
          '</div>' +
        '</div>' +
        '<div class="x-se-foot">' +
          '<span class="x-se-splitlbl">SPLIT MODE</span>' +
          '<div class="x-se-radios">' + radio('None', true) + radio('Horizontal', false) + radio('Vertical', false) + '</div>' +
          '<span class="x-se-footspacer"></span>' +
          sbtn('Save Layout', '') + sbtn('Load Layout', '') + sbtn('Load Default', '') +
        '</div>' +
      '</div>';
  }

  /* ---------- Maintain Customer drill-down (rendered inside AR window body) ---------- */
  function arDetailContent(row, tab) {
    tab = tab || 'Information';
    var name = row[1], addr = row[2], bal = row[3];
    var biz = name.indexOf(',') === -1;
    var last, first;
    if (biz) { last = name; first = ''; }
    else { var p = name.split(','); last = (p[0] || '').trim(); first = (p[1] || '').trim(); }
    var code = (last.replace(/[^A-Za-z]/g, '').slice(0, 5).toUpperCase() || 'CUST') + '001';

    var tabs = ['Information', 'Receivables', 'Property/Meter Info', 'Notes', 'Tax Info', 'EFT', 'Other Information', 'Reminders', 'Attribute'];
    var tabHTML = tabs.map(function (t) {
      return '<span class="x-cd-tab' + (t === tab ? ' is-active' : '') + '" data-artab="' + t + '">' + t + '</span>';
    }).join('');

    function field(label, val, opts) {
      opts = opts || {};
      return '<div class="x-cd-row">' +
        '<label class="x-cd-lbl">' + label + '</label>' +
        '<div class="x-cd-inwrap' + (opts.wide ? ' is-wide' : '') + '"><input class="x-cd-in' + (opts.ro ? ' is-ro' : '') + '" value="' + (val || '').replace(/"/g, '&quot;') + '"' + (opts.ro ? ' readonly' : '') + ' data-demo></div>' +
        '</div>';
    }
    function check(label, on, dis) {
      var box = on
        ? '<span class="x-cd-chk is-on' + (dis ? ' is-dis' : '') + '"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"></path></svg></span>'
        : '<span class="x-cd-chk"></span>';
      return '<div class="x-cd-setrow' + (dis ? ' is-dis' : '') + '" data-demo>' + box + '<span>' + label + '</span></div>';
    }
    function panelTable(cols, rows, statusIdx) {
      var head = cols.map(function (c) { return '<th>' + c + '</th>'; }).join('');
      var body = rows.map(function (r) {
        var tds = r.map(function (cell, ci) {
          var cls = (statusIdx != null && ci === statusIdx) ? ' class="x-ar-status x-ar-status--' + String(cell).toLowerCase().replace(/[^a-z]/g, '') + '"' : '';
          return '<td' + cls + '>' + cell + '</td>';
        }).join('');
        return '<tr data-demo>' + tds + '</tr>';
      }).join('');
      return '<div class="x-cd-tablewrap"><table class="x-ar-table"><thead><tr>' + head + '</tr></thead><tbody>' + body + '</tbody></table></div>';
    }

    /* ---- Information tab ---- */
    var infoForm = '<div class="x-cd-form">' +
      field('Code:', code, { ro: true }) +
      field('Last Name:', last) +
      field('First Name:', first) +
      field('Middle Name:', '') +
      field('Second Owner:', '') +
      '<div class="x-cd-row"><label class="x-cd-lbl">Address:</label><div class="x-cd-addr">' +
        '<input class="x-cd-in" value="' + addr.replace(/"/g, '&quot;') + '" data-demo>' +
        '<input class="x-cd-in" value="' + (biz ? 'Arnold\'s Cove' : 'Ottawa') + '" data-demo>' +
        '<input class="x-cd-in" value="" data-demo>' +
      '</div></div>' +
      field('Attention:', '') +
      '<div class="x-cd-row"><label class="x-cd-lbl">Prov.:</label><div class="x-cd-provrow">' +
        '<span class="x-cd-sel" data-demo>' + (biz ? 'NL' : 'ON') + '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 10l4-4 4 4M8 14l4 4 4-4"></path></svg></span>' +
        '<label class="x-cd-lbl2">Postal/Zip:</label>' +
        '<input class="x-cd-in x-cd-in--sm" value="' + (biz ? 'A0B 1A0' : 'K1P 5J6') + '" data-demo>' +
      '</div></div>' +
      field('Contact:', biz ? 'Mary Brown' : first + ' ' + last) +
      '<div class="x-cd-row"><label class="x-cd-lbl">Telephone 1:</label><div class="x-cd-telrow">' +
        '<input class="x-cd-in x-cd-in--tel" value="709-463-2323" data-demo>' +
        '<label class="x-cd-lbl3">2:</label>' +
        '<input class="x-cd-in x-cd-in--tel" value="" data-demo>' +
      '</div></div>' +
    '</div>';
    var infoSide = '<div class="x-cd-side">' +
      '<div class="x-cd-card"><div class="x-cd-cardh">Account Settings</div>' +
        check('Adjust To Minimum Tax', true, false) +
        check('Send Statements', true, false) +
        check('Charge Interest', true, false) +
        check('Active', true, true) +
        check('Miscellaneous Account', false, false) +
      '</div>' +
      '<div class="x-cd-card x-cd-balcard"><span class="x-cd-ballbl">Balance</span><span class="x-cd-balval">' + bal + '</span></div>' +
    '</div>';

    /* ---- per-tab panels ---- */
    var panel;
    if (tab === 'Information') {
      panel = infoForm + infoSide;
    } else if (tab === 'Receivables') {
      panel = '<div class="x-cd-panel">' +
        '<div class="x-cd-aging">' +
          ['Current', '31–60', '61–90', '90+', 'Total'].map(function (l, i) {
            var v = ['$0.00', '$0.00', '$0.00', '$0.00', bal][i];
            return '<div class="x-cd-agecell' + (i === 4 ? ' is-total' : '') + '"><span class="x-cd-agelbl">' + l + '</span><span class="x-cd-ageval">' + v + '</span></div>';
          }).join('') +
        '</div>' +
        panelTable(['Date', 'Type', 'Reference', 'Charge', 'Payment', 'Balance'], [
          ['Jun 02, 2026', 'Invoice', 'INV-204881', '$420.00', '—', '$420.00'],
          ['Jun 14, 2026', 'Payment', 'RCPT-90233', '—', '$420.00', '$0.00'],
          ['May 01, 2026', 'Invoice', 'INV-203117', '$420.00', '—', '$420.00'],
          ['May 11, 2026', 'Payment', 'RCPT-89540', '—', '$420.00', '$0.00'],
          ['Apr 01, 2026', 'Invoice', 'INV-201998', '$405.00', '—', '$405.00']
        ]) + '</div>';
    } else if (tab === 'Property/Meter Info') {
      panel = '<div class="x-cd-panel">' +
        panelTable(['Roll / Meter #', 'Type', 'Service address', 'Last activity', 'Status'], [
          ['0614-220-118', 'Property', addr, 'Jun 02, 2026', 'Active'],
          ['W-88204', 'Water meter', addr, '142,330 m³', 'Active'],
          ['0614-220-119', 'Property', addr + ' (rear lot)', 'Jan 14, 2026', 'Active'],
          ['E-44012', 'Electric meter', addr, '12,904 kWh', 'Active']
        ], 4) + '</div>';
    } else if (tab === 'Notes') {
      var notes = [
        ['Jun 14, 2026 · J. Reyes', 'Customer called to confirm pre-authorized payment switched to the new account ending 4421.'],
        ['May 03, 2026 · A. Singh', 'Mailed statement returned — address verified and re-sent to attention of Mary Brown.'],
        ['Feb 22, 2026 · System', 'Account flagged for annual tax recalculation. No action required.']
      ];
      panel = '<div class="x-cd-panel x-cd-notes">' +
        '<div class="x-cd-noteadd"><input class="x-cd-in" placeholder="Add a note…" data-demo><button class="x-cd-btn x-cd-btn--primary" data-demo>Add note</button></div>' +
        notes.map(function (n) { return '<div class="x-cd-note"><div class="x-cd-notemeta">' + n[0] + '</div><div class="x-cd-notebody">' + n[1] + '</div></div>'; }).join('') +
      '</div>';
    } else if (tab === 'Tax Info') {
      panel = '<div class="x-cd-panel x-cd-twocol">' +
        '<div class="x-cd-form">' +
          field('Tax Class:', biz ? 'Commercial' : 'Residential') +
          field('GST/HST #:', biz ? '80124 5567 RT0001' : '') +
          field('Exemption:', 'None') +
          field('Minimum Tax:', '$285.00') +
          field('Mill Rate:', '7.4120') +
        '</div>' +
        '<div class="x-cd-side"><div class="x-cd-card"><div class="x-cd-cardh">Tax Flags</div>' +
          check('Adjust To Minimum Tax', true, false) +
          check('Charge Interest', true, false) +
          check('Tax Exempt', false, false) +
        '</div></div>' +
      '</div>';
    } else if (tab === 'EFT') {
      panel = '<div class="x-cd-panel x-cd-twocol">' +
        '<div class="x-cd-form">' +
          field('Status:', 'Enrolled — Pre-authorized') +
          field('Institution:', '003 — Royal Bank of Canada') +
          field('Transit #:', '00482') +
          field('Account #:', '••••• 4421') +
          field('Withdrawal Day:', '15th of month') +
        '</div>' +
        '<div class="x-cd-side"><div class="x-cd-card x-cd-balcard"><span class="x-cd-ballbl">Next Debit</span><span class="x-cd-balval">$420.00</span></div>' +
        '<div class="x-cd-card"><div class="x-cd-cardh">EFT Flags</div>' + check('Active', true, false) + check('Send Pre-notification', true, false) + '</div></div>' +
      '</div>';
    } else if (tab === 'Other Information') {
      panel = '<div class="x-cd-panel"><div class="x-cd-form">' +
        field('Customer Since:', 'Mar 1998') +
        field('Statement Delivery:', 'Email + Mail') +
        field('Email:', biz ? 'finance@arnoldscove.ca' : (first + '.' + last + '@example.ca').toLowerCase()) +
        field('Preferred Language:', 'English') +
        field('Department:', biz ? 'Town Office' : '') +
        field('Notes:', 'Key municipal account — priority handling.') +
      '</div></div>';
    } else if (tab === 'Reminders') {
      panel = '<div class="x-cd-panel x-cd-notes">' +
        '<div class="x-cd-noteadd"><input class="x-cd-in" placeholder="New reminder…" data-demo><span class="x-cd-sel" data-demo>Due date<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 10l4-4 4 4M8 14l4 4 4-4"></path></svg></span><button class="x-cd-btn x-cd-btn--primary" data-demo>Add</button></div>' +
        [['Jul 15, 2026', 'Confirm pre-authorized debit processed for July billing.', 'Open'],
         ['Aug 01, 2026', 'Annual statement mailing — verify mailing address.', 'Open'],
         ['Jan 31, 2026', 'Year-end tax recalculation review.', 'Done']].map(function (r) {
          return '<div class="x-cd-note"><div class="x-cd-notemeta">' + r[0] + ' · <span class="x-ar-status x-ar-status--' + r[2].toLowerCase() + '">' + r[2] + '</span></div><div class="x-cd-notebody">' + r[1] + '</div></div>';
        }).join('') +
      '</div>';
    } else { /* Attribute */
      panel = '<div class="x-cd-panel">' +
        panelTable(['Attribute', 'Value'], [
          ['Ward', 'Ward 3 — Central'],
          ['Collection Route', 'RT-04 (Tuesday)'],
          ['Assessment Region', 'NL-East'],
          ['Customer Group', biz ? 'Municipal / Government' : 'Residential'],
          ['Portal Access', 'Enabled']
        ]) + '</div>';
    }

    var footBtns = ['Address', 'Print', 'Track', 'Change Type', 'Add'].map(function (b) {
      return '<button class="x-cd-btn" data-demo>' + b + '</button>';
    }).join('');

    return '' +
      '<div class="x-cd-detail">' +
        '<div class="x-cd-header">' +
          '<span class="x-cd-srch"><input class="x-cd-srchin" value="' + code + '" data-seopen readonly><button class="x-cd-srchbtn" data-seopen><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"></circle><path d="M16.5 16.5L21 21"></path></svg></button><button class="x-cd-go" data-seopen>GO</button></span>' +
          '<span class="x-cd-headtitle"><b>' + name + '</b><span>Maintain Customer (' + (biz ? 'Business' : 'Residential') + ')</span></span>' +
          '<span class="x-cd-headbtns"><button class="x-cd-headbtn" data-demo>Attribute Data Search</button><button class="x-cd-headbtn" data-demo>Extended Data Search</button><button class="x-cd-headbtn x-cd-headbtn--back" data-arback>← Records</button></span>' +
        '</div>' +
        '<div class="x-cd-tabs">' + tabHTML + '</div>' +
        '<div class="x-cd-body">' + panel + '</div>' +
        '<div class="x-cd-foot">' +
          '<button class="x-cd-btn x-cd-btn--ghost" data-demo>Show Emails</button>' +
          '<span class="x-cd-footspacer"></span>' +
          footBtns +
          '<button class="x-cd-btn x-cd-btn--primary" data-demo>Save</button>' +
          '<button class="x-cd-btn" data-arback>Close</button>' +
        '</div>' +
      '</div>';
  }

  function viewEvents() {
    function ev(title, cat, when, spots, closing) {
      return '<div class="tsapp__card x-pv-event"><div class="x-pv-evtop"><span class="x-pv-evcat">' + cat + '</span>' +
        (closing ? '<span class="x-pv-evclose">Closes Friday</span>' : '') + '</div>' +
        '<div class="x-pv-evtitle">' + title + '</div><div class="x-pv-evmeta">' + when + ' · ' + spots + '</div>' +
        '<span class="tsapp__btn x-pv-evbtn">Register</span></div>';
    }
    return '' +
      '<div class="tsapp__head"><h3>Events &amp; programs</h3><span class="tsapp__date">6 open for registration</span></div>' +
      '<div class="tsapp__cols"><div style="flex:1;min-width:0;"><div class="x-pv-evgrid">' +
        ev('Outdoor Soccer — U10', 'Recreation', 'Tue &amp; Thu, 6:00 PM', '4 spots left', true) +
        ev('Learn to Swim — Level 2', 'Aquatics', 'Sat, 9:30 AM', '8 spots left', false) +
        ev('Seniors Yoga', 'Wellness', 'Mon, 10:00 AM', 'Open', false) +
        ev('Winter Skating Lessons', 'Arena', 'Sun, 1:00 PM', '12 spots left', false) +
        ev('Summer Day Camp', 'Camps', dRange(-16, -20) + ', all day', 'Waitlist', false) +
        ev('Pottery Workshop', 'Arts', 'Wed, 7:00 PM', '2 spots left', false) +
      '</div></div>' + railHTML() + '</div>';
  }

  function todayStr() {
    try { return new Date().toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }); }
    catch (e) { return 'Today'; }
  }

  /* ---------- launch / navigate ---------- */
  function launch(startView) {
    if (stage) return;
    var protoLast = document.activeElement, protoInert = [];
    var paid = false;
    var view = startView || 'dashboard';
    var arSel = null;
    var arDetail = null;
    var arTab = 'Information';
    var arSearch = false;

    stage = document.createElement("div");
    stage.className = "x-portal-stage";
    stage.setAttribute("role", "dialog");
    stage.setAttribute("aria-modal", "true");
    stage.setAttribute("aria-label", "TownSuite mERP interactive demo");
    stage.innerHTML =
      '<div class="x-portal-bar">' +
        '<span class="x-portal-bar__label"><svg class="ts-maple" style="width:16px;height:16px" aria-hidden="true"><use href="#i-maple"></use></svg>' +
        'TownSuite mERP&reg; — interactive demo</span>' +
        '<div class="x-portal-zoom" role="group" aria-label="Zoom">' +
          '<button type="button" class="x-portal-zbtn" data-zoom="out" aria-label="Zoom out">&minus;</button>' +
          '<button type="button" class="x-portal-zval" data-zoom="reset" aria-label="Reset zoom">100%</button>' +
          '<button type="button" class="x-portal-zbtn" data-zoom="in" aria-label="Zoom in">+</button>' +
        '</div>' +
        '<button type="button" class="x-portal-exit" aria-label="Exit demo and return to site">Exit demo <span aria-hidden="true">&times;</span></button>' +
      '</div>' +
      '<div class="x-portal-screen"><div class="x-portal-fit"></div></div>' +
      '<div class="x-portal-disclaimer">Illustrative example. Figures shown are for demonstration only.</div>';
    document.body.appendChild(stage);
    document.body.style.overflow = "hidden";
    /* isolate the rest of the page from keyboard + screen readers while the demo is open */
    (function () { var k = document.body.children, i, el; for (i = 0; i < k.length; i++) { el = k[i]; if (el === stage) continue; el.setAttribute("aria-hidden", "true"); try { el.inert = true; } catch (e) {} protoInert.push(el); } })();

    var screenFit = stage.querySelector(".x-portal-fit");
    var clone = shot.cloneNode(true);
    clone.className = "ts-dash x-portal-clone";
    ["role", "tabindex", "aria-label"].forEach(function (a) { clone.removeAttribute(a); });
    var h = clone.querySelector(".x-portal-hint"); if (h) h.remove();
    screenFit.appendChild(clone);

    var main = clone.querySelector(".tsapp__main");
    var navItems = clone.querySelectorAll(".tsapp__side .tsapp__navitem");

    function render() {
      if (view === 'financial') {
        screenFit.classList.add('is-finmode');
        screenFit.innerHTML = financialWindow();
        wireFinancial();
        fit();
        return;
      }
      if (view === 'ar') {
        screenFit.classList.add('is-finmode');
        screenFit.innerHTML = arWindow(arSel, arDetail, arTab, arSearch);
        wireAR();
        fit();
        return;
      }
      screenFit.classList.remove('is-finmode');
      if (!screenFit.contains(clone)) { screenFit.innerHTML = ''; screenFit.appendChild(clone); }
      if (view === 'account') main.innerHTML = viewAccount();
      else if (view === 'ebills') main.innerHTML = viewEBills(paid);
      else if (view === 'events') main.innerHTML = viewEvents();
      else if (view === 'requests') main.innerHTML = viewRequests();
      else if (view === 'employee') main.innerHTML = viewEmployee();
      else main.innerHTML = viewDashboard(paid);
      // sidebar active state
      navItems.forEach(function (n) {
        var txt = n.textContent.trim().toLowerCase();
        var on = (view === 'dashboard' && /dashboard/.test(txt)) || (view === 'account' && /account/.test(txt)) || (view === 'employee' && /employee/.test(txt));
        n.classList.toggle("is-active", on);
      });
      wireMain();
      fit();
    }
    function openSearchRow(tr) {
      if (!tr) return;
      arDetail = AR_DATA.customer.rows[+tr.getAttribute("data-serow")];
      arSearch = false;
      arTab = 'Information';
      render();
    }
    function wireAR() {
      screenFit.querySelectorAll("[data-arsel]").forEach(function (el) {
        el.style.cursor = "pointer";
        el.addEventListener("click", function (e) {
          e.stopPropagation();
          arSel = el.getAttribute("data-arsel");
          arDetail = null; arSearch = false;
          render();
        });
      });
      /* customer rows drill into the maintain-customer screen */
      if (arSel === 'customer' && !arDetail) {
        screenFit.querySelectorAll(".x-ar-table tbody tr").forEach(function (tr) {
          tr.addEventListener("click", function (e) {
            e.stopPropagation();
            arDetail = AR_DATA.customer.rows[+tr.getAttribute("data-rowidx")];
            arTab = 'Information';
            render();
          }, true);
        });
      }
      screenFit.querySelectorAll("[data-artab]").forEach(function (el) {
        el.style.cursor = "pointer";
        el.addEventListener("click", function (e) { e.stopPropagation(); arTab = el.getAttribute("data-artab"); render(); });
      });
      /* search engine open / rows / select / close */
      screenFit.querySelectorAll("[data-seopen]").forEach(function (el) {
        el.style.cursor = "pointer";
        el.addEventListener("click", function (e) { e.stopPropagation(); arSearch = true; render(); });
      });
      screenFit.querySelectorAll("[data-serow]").forEach(function (tr) {
        tr.style.cursor = "pointer";
        tr.addEventListener("click", function (e) {
          e.stopPropagation();
          screenFit.querySelectorAll("[data-serow]").forEach(function (t) { t.classList.remove("is-sel"); });
          tr.classList.add("is-sel");
        });
        tr.addEventListener("dblclick", function (e) { e.stopPropagation(); openSearchRow(tr); });
      });
      var seSelect = screenFit.querySelector("[data-seselect]");
      if (seSelect) {
        seSelect.style.cursor = "pointer";
        seSelect.addEventListener("click", function (e) {
          e.stopPropagation();
          var sel = screenFit.querySelector("[data-serow].is-sel") || screenFit.querySelector("[data-serow]");
          openSearchRow(sel);
        });
      }
      screenFit.querySelectorAll("[data-seclose]").forEach(function (el) {
        el.style.cursor = "pointer";
        el.addEventListener("click", function (e) { e.stopPropagation(); arSearch = false; render(); });
      });
      screenFit.querySelectorAll("[data-arback]").forEach(function (el) {
        el.style.cursor = "pointer";
        el.addEventListener("click", function (e) { e.stopPropagation(); arDetail = null; render(); });
      });
      screenFit.querySelectorAll("[data-arclose]").forEach(function (el) {
        el.style.cursor = "pointer";
        el.addEventListener("click", function (e) {
          e.stopPropagation();
          arSel = null; arDetail = null; arSearch = false;
          go('financial');
        });
      });
      screenFit.querySelectorAll("[data-demo]").forEach(function (el) {
        el.style.cursor = "pointer";
        el.addEventListener("click", function (e) { e.stopPropagation(); showDemoPrompt(); });
      });
    }
    function wireFinancial() {
      var arCard = screenFit.querySelector("[data-ar]");
      if (arCard) {
        arCard.style.cursor = "pointer";
        arCard.addEventListener("click", function (e) {
          e.stopPropagation();
          go('ar');
        });
      }
      screenFit.querySelectorAll("[data-demo]").forEach(function (el) {
        el.style.cursor = "pointer";
        el.addEventListener("click", function (e) { e.stopPropagation(); showDemoPrompt(); });
      });
      var lo = screenFit.querySelector("[data-logout]");
      if (lo) lo.addEventListener("click", function () { go('dashboard'); });
      var winEl = screenFit.querySelector('.x-mwin');
      if (winEl) winEl.addEventListener('click', function (e) {
        if (e.target.closest('[data-demo],[data-logout],[data-ar],[data-super]')) return;
        var hit = e.target.closest('.x-mwin-railitem,.x-mwin-menubar span,.x-fin-newslink,.x-mwin-wc,.x-mwin-card');
        if (hit) showDemoPrompt();
      });
    }
    function go(v) { view = v; render(); }

    function goToDemo() {
      close();
      setTimeout(function () {
        var hit = null;
        document.querySelectorAll('a.ts-btn, .ts-btn').forEach(function (b) {
          if (!hit && /book a demo/i.test(b.textContent || '')) hit = b;
        });
        if (hit) hit.click();
        else { var s = document.getElementById('start'); if (s) { var y = s.getBoundingClientRect().top + window.pageYOffset - 84; window.scrollTo({ top: y, behavior: 'smooth' }); } }
      }, 380);
    }
    function showDemoPrompt() {
      if (!stage || stage.querySelector('.x-portal-prompt')) return;
      var p = document.createElement('div');
      p.className = 'x-portal-prompt';
      p.innerHTML = '<div class="x-portal-promptcard">' +
        '<div class="x-portal-prompttitle">Book a demo to see more</div>' +
        '<div class="x-portal-promptsub">This opens in a guided walkthrough with our team.</div>' +
        '<div class="x-portal-promptactions"><button type="button" class="ts-btnish" data-dismiss>Not now</button>' +
        '<button type="button" class="ts-btnish is-primary" data-godemo>Book a demo \u2192</button></div></div>';
      stage.appendChild(p);
      p.addEventListener('click', function (e) { if (e.target === p) p.remove(); });
      p.querySelector('[data-dismiss]').addEventListener('click', function () { p.remove(); });
      p.querySelector('[data-godemo]').addEventListener('click', goToDemo);
    }

    function wireMain() {
      main.querySelectorAll("[data-go]").forEach(function (el) {
        el.style.cursor = "pointer";
        el.addEventListener("click", function (e) { e.stopPropagation(); go(el.getAttribute("data-go")); });
      });
      main.querySelectorAll("[data-pay]").forEach(function (el) {
        el.addEventListener("click", function (e) {
          e.stopPropagation();
          if (paid) return;
          paid = true;
          EXTRA_TX.unshift(['Miscellaneous charges', 'Paid · just now', '\u2212$40.00', false]);
          EXTRA_ACT.unshift(['Payment received — <b>Miscellaneous charges</b>', 'now']);
          if (window.__prtoast) window.__prtoast();
          go(view === 'dashboard' ? 'ebills' : view);
        });
      });
      main.querySelectorAll(".tsapp__tab").forEach(function (tab) {
        tab.style.cursor = "pointer";
        tab.addEventListener("click", function () {
          main.querySelectorAll(".tsapp__tab").forEach(function (t) { t.classList.remove("is-active"); });
          tab.classList.add("is-active");
          var rows = main.querySelector(".tsapp__feedrows");
          if (rows) rows.innerHTML = feedRows(tab.getAttribute("data-feed") || 'activity');
        });
      });
      main.querySelectorAll("[data-demo]").forEach(function (el) {
        el.style.cursor = "pointer";
        el.addEventListener("click", function (e) { e.stopPropagation(); showDemoPrompt(); });
      });
      main.querySelectorAll(".x-pv-evbtn").forEach(function (b) {
        b.addEventListener("click", function () {
          if (b.classList.contains('is-done')) return;
          b.textContent = "Registered ✓"; b.classList.add("is-done");
          var card = b.closest('.x-pv-event');
          var title = card ? (card.querySelector('.x-pv-evtitle') || {}).textContent : 'event';
          EXTRA_ACT.unshift(['Registered for — <b>' + (title || 'event') + '</b>', 'now']);
          var rows = main.querySelector('.tsapp__feedrows');
          var activeTab = main.querySelector('.tsapp__tab.is-active');
          if (rows) rows.innerHTML = feedRows(activeTab ? (activeTab.getAttribute('data-feed') || 'activity') : 'activity');
        });
      });
    }

    // left-nav navigation (persistent shell)
    navItems.forEach(function (n) {
      var txt = n.textContent.trim().toLowerCase();
      n.style.cursor = "pointer";
      n.addEventListener("click", function () {
        if (/dashboard/.test(txt)) go('dashboard');
        else if (/account/.test(txt)) go('account');
        else if (/employee/.test(txt)) go('employee');
        else showDemoPrompt();
      });
    });
    /* any other interactive-looking element with no real page → same book-a-demo gate */
    main.addEventListener('click', function (e) {
      if (e.target.closest('[data-go],[data-pay],.tsapp__tab,.x-pv-evbtn,[data-demo],.tsapp__navitem')) return;
      var hit = e.target.closest('.tsapp__chip,.tsapp__filter,.tsapp__link,.tsapp__btn,.tsapp__ic,.tsapp__app,.tsapp__switch,.x-pv-acct,.x-pv-ebrow,.x-pv-srrow,.x-pv-event,.x-pv-stat,.x-fin-newslink');
      if (hit) showDemoPrompt();
    });
    /* persistent top bar: logo + Home switcher → dashboard; cart/bell/avatar → gate */
    var topbar = clone.querySelector('.tsapp__top');
    if (topbar) topbar.addEventListener('click', function (e) {
      if (e.target.closest('.tsapp__logo,.tsapp__switch')) { go('dashboard'); return; }
      if (e.target.closest('.tsapp__ic,.tsapp__av')) showDemoPrompt();
    });
    /* sidebar product-menu header (Home) → dashboard */
    var prod = clone.querySelector('.tsapp__prod');
    if (prod) { prod.style.cursor = 'pointer'; prod.addEventListener('click', function () { go('dashboard'); }); }

    var userZoom = (function () { var z = NaN; try { z = parseFloat(localStorage.getItem("ts-demo-zoom")); } catch (e) {} return (z && z >= 0.7 && z <= 1.8) ? z : 1; })();
    function fit() {
      var el = screenFit.firstElementChild;
      if (!el) return;
      el.style.transform = "none";
      var w = el.offsetWidth, hh = el.offsetHeight;
      if (!w || !hh) return;
      /* use nearly the full viewport height (only the top bar is reserved) so
         desktop screens show more rows of text; the screen area scrolls if needed */
      var availW = window.innerWidth - 48, availH = window.innerHeight - 52 - 16;
      var base = Math.min(availW / w, availH / hh, 1.9);
      var s = Math.max(0.4, base * userZoom);
      screenFit.style.width = Math.round(w * s) + "px";
      screenFit.style.height = Math.round(hh * s) + "px";
      el.style.transform = "scale(" + s + ")";
    }
    function setZoom(z) {
      userZoom = Math.max(0.7, Math.min(1.8, Math.round(z * 100) / 100));
      try { localStorage.setItem("ts-demo-zoom", String(userZoom)); } catch (e) {}
      var lbl = stage.querySelector(".x-portal-zval");
      if (lbl) lbl.textContent = Math.round(userZoom * 100) + "%";
      fit();
    }
    stage.querySelector(".x-portal-zoom").addEventListener("click", function (e) {
      var b = e.target.closest("[data-zoom]"); if (!b) return;
      var k = b.getAttribute("data-zoom");
      if (k === "in") setZoom(userZoom + 0.1);
      else if (k === "out") setZoom(userZoom - 0.1);
      else setZoom(1);
    });
    (function () { var lbl = stage.querySelector(".x-portal-zval"); if (lbl) lbl.textContent = Math.round(userZoom * 100) + "%"; })();

    render();
    requestAnimationFrame(function () { if (stage) { stage.classList.add("is-open"); var ex = stage.querySelector(".x-portal-exit"); if (ex) ex.focus(); } });
    window.addEventListener("resize", fit);

    /* ---------- Super search (command palette) ---------- */
    var SUPER_IC = {
      cust: '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="5" width="18" height="14" rx="2"></rect><circle cx="9" cy="11" r="2"></circle><path d="M5.5 16.5c.6-1.6 2-2.4 3.5-2.4s2.9.8 3.5 2.4M15 10h4M15 13.5h4"></path></svg>',
      prop: '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M4 11l8-6 8 6"></path><path d="M6 10v9h12v-9"></path></svg>',
      meter: '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="8"></circle><path d="M12 12l4-2"></path></svg>',
      receipt: '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"></path><path d="M9 8h6M9 12h6"></path></svg>'
    };
    function routeRecords(sel, detail) {
      return function () { arSel = sel; arDetail = detail || null; arSearch = false; arTab = 'Information'; hideSuper(); go('ar'); };
    }
    var SUPER_ITEMS = [
      { g: 'recent', ic: 'receipt', label: 'Receipt Writer', run: function () { hideSuper(); showDemoPrompt(); } },
      { g: 'recent', ic: 'meter', label: 'Meter Records', run: routeRecords('meter') },
      { g: 'recent', ic: 'cust', label: 'Customer Records', run: routeRecords('customer') },
      { g: 'recent', ic: 'cust', label: 'Beauchamp, Marie', sub: 'BEAUC001', run: routeRecords('customer', AR_DATA.customer.rows[0]) },
      { g: 'action', ic: 'cust', label: 'Customer Records', run: routeRecords('customer') },
      { g: 'action', ic: 'prop', label: 'Property Records', run: routeRecords('property') },
      { g: 'action', ic: 'meter', label: 'Meter Records', run: routeRecords('meter') },
      { g: 'action', ic: 'receipt', label: 'Receipt Writer', run: function () { hideSuper(); showDemoPrompt(); } },
      { g: 'action', ic: 'prop', label: 'Property Tax Reports', run: function () { hideSuper(); showDemoPrompt(); } }
    ];
    var superEl = null, superSel = 0, superMatches = [];
    function renderSuperList(q) {
      q = (q || '').trim().toLowerCase();
      superMatches = SUPER_ITEMS.filter(function (it) { return !q || it.label.toLowerCase().indexOf(q) > -1 || (it.sub && it.sub.toLowerCase().indexOf(q) > -1); });
      if (superSel >= superMatches.length) superSel = 0;
      var groups = [['recent', 'Recent'], ['action', 'Actions']];
      var html = '';
      groups.forEach(function (grp) {
        var items = superMatches.filter(function (it) { return it.g === grp[0]; });
        if (!items.length) return;
        html += '<div class="x-sup-grouphd">' + grp[1] + '</div>';
        items.forEach(function (it) {
          var idx = superMatches.indexOf(it);
          html += '<button class="x-sup-item' + (idx === superSel ? ' is-active' : '') + '" data-supidx="' + idx + '">' +
            '<span class="x-sup-ic">' + SUPER_IC[it.ic] + '</span>' +
            '<span class="x-sup-label">' + it.label + (it.sub ? '<span class="x-sup-sub">' + it.sub + '</span>' : '') + '</span>' +
            (it.g === 'action' ? '<span class="x-sup-run">Run action</span>' : '') +
            '</button>';
        });
      });
      if (!superMatches.length) html = '<div class="x-sup-empty">No results for “' + q + '”</div>';
      superEl.querySelector('.x-sup-list').innerHTML = html;
      superEl.querySelectorAll('[data-supidx]').forEach(function (b) {
        b.addEventListener('click', function () { superMatches[+b.getAttribute('data-supidx')].run(); });
        b.addEventListener('mousemove', function () { superSel = +b.getAttribute('data-supidx'); highlightSuper(); });
      });
    }
    function highlightSuper() {
      superEl.querySelectorAll('[data-supidx]').forEach(function (b) {
        b.classList.toggle('is-active', +b.getAttribute('data-supidx') === superSel);
      });
    }
    function showSuper() {
      if (superEl) return;
      superEl = document.createElement('div');
      superEl.className = 'x-sup';
      superEl.innerHTML = '<div class="x-sup-backdrop"></div>' +
        '<div class="x-sup-panel" role="dialog" aria-label="Search">' +
          '<div class="x-sup-search"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"></circle><path d="M16.5 16.5L21 21"></path></svg>' +
            '<input class="x-sup-input" placeholder="Search modules, records, actions, reports…" autofocus>' +
            '<button class="x-sup-esc">ESC</button></div>' +
          '<div class="x-sup-list"></div>' +
          '<div class="x-sup-foot"><span><span class="x-sup-key">↑</span><span class="x-sup-key">↓</span> navigate</span><span><span class="x-sup-key">↩</span> open</span><span><span class="x-sup-key">esc</span> close</span></div>' +
        '</div>';
      stage.appendChild(superEl);
      superSel = 0;
      renderSuperList('');
      var input = superEl.querySelector('.x-sup-input');
      input.addEventListener('input', function () { superSel = 0; renderSuperList(input.value); });
      input.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowDown') { e.preventDefault(); superSel = Math.min(superSel + 1, superMatches.length - 1); highlightSuper(); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); superSel = Math.max(superSel - 1, 0); highlightSuper(); }
        else if (e.key === 'Enter') { e.preventDefault(); if (superMatches[superSel]) superMatches[superSel].run(); }
      });
      superEl.querySelector('.x-sup-backdrop').addEventListener('click', hideSuper);
      superEl.querySelector('.x-sup-esc').addEventListener('click', hideSuper);
      requestAnimationFrame(function () { superEl.classList.add('is-open'); input.focus(); });
    }
    function hideSuper() {
      if (!superEl) return;
      var s = superEl; superEl = null;
      s.classList.remove('is-open');
      setTimeout(function () { if (s.parentNode) s.parentNode.removeChild(s); }, 200);
    }
    stage.addEventListener('click', function (e) {
      if (e.target.closest('[data-super]')) { e.stopPropagation(); showSuper(); }
    });

    function close() {
      stage.classList.remove("is-open");
      document.body.style.overflow = "";
      window.removeEventListener("resize", fit);
      document.removeEventListener("keydown", onKey);
      protoInert.forEach(function (el) { el.removeAttribute("aria-hidden"); try { el.inert = false; } catch (e) {} });
      if (protoLast && protoLast.focus) { try { protoLast.focus(); } catch (e) {} }
      var s = stage; stage = null;
      setTimeout(function () { if (s.parentNode) s.parentNode.removeChild(s); }, 320);
    }
    function onKey(e) {
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) { e.preventDefault(); if (superEl) hideSuper(); else showSuper(); return; }
      if (e.key === "Escape") { if (superEl) hideSuper(); else close(); }
    }
    stage.querySelector(".x-portal-exit").addEventListener("click", close);
    document.addEventListener("keydown", onKey);
  }

  shot.addEventListener("click", function (e) {
    var acct = e.target.closest && e.target.closest(".tsapp__profile");
    launch(acct ? "account" : "dashboard");
  });
  shot.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); launch("dashboard"); }
  });

  /* If the user clicked the hero dashboard BEFORE this script finished loading, the
     inline loader flagged the intent — honour it now so the first click reliably
     opens the demo. */
  if (window.__tsDemoPending) { window.__tsDemoPending = false; launch("dashboard"); }
})();
