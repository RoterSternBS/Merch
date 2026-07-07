// ============================================================
// NEW LOOK — new-look.js
// Hero, Header-Nav, Countdown-Ticker, Sticky-CTA, Dropdown-Wiring
// Abhängigkeiten: app.js (escapeHtml), group-order.js
//   (openGroupPanel, closeGroupPanel, joinGroupOrder — global;
//    Daten kommen per CustomEvent "go:orders-changed" / "go:mode-changed")
// Muss NACH group-order.js geladen werden.
// ============================================================

(function () {
  "use strict";

  let goOrders = [];
  let inited = false;

  const $ = (id) => document.getElementById(id);

  // ----------------------------------------------------------
  // Countdown
  // ----------------------------------------------------------
  function remaining(deadline) {
    const ms = new Date(deadline).getTime() - Date.now();
    if (!isFinite(ms) || ms <= 0) return { text: t("cd.ended"), urgent: true, over: true };
    const s = Math.floor(ms / 1000);
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    const uD = t("cd.days"), uH = t("cd.hours"), uM = t("cd.minutes"), uS = t("cd.seconds");
    let text;
    if (d > 0)      text = d + " " + uD + " " + h + " " + uH;
    else if (h > 0) text = h + " " + uH + " " + m + " " + uM;
    else            text = m + " " + uM + " " + String(s % 60).padStart(2, "0") + " " + uS;
    return { text, urgent: ms < 24 * 3600 * 1000, over: false };
  }

  function tick() {
    document.querySelectorAll("[data-go-countdown]").forEach((el) => {
      const r = remaining(el.getAttribute("data-go-countdown"));
      el.textContent = (el.hasAttribute("data-countdown-bare") || r.over) ? r.text : t("cd.remainingPrefix", { time: r.text });
      el.classList.toggle("go-countdown--urgent", r.urgent);
    });
    updateStickyCta();
  }

  // ----------------------------------------------------------
  // Vorgestellte Aktion = nächste Deadline (Liste ist danach sortiert)
  // ----------------------------------------------------------
  function featured() { return goOrders.length ? goOrders[0] : null; }
  function supplierName(o) { return (o && (o.suppliers?.name || o.title)) || t("go.defaultName"); }

  function renderFeatured() {
    const wrap = $("hero-featured");
    if (!wrap) return;
    const f = featured();

    if (!f) {
      wrap.innerHTML =
        '<div class="hero-featured-card hero-featured-card--empty">' +
        '<p class="hero-featured-sub">' + t("hero.emptyText") + '</p>' +
        '<button type="button" class="hero-featured-join" data-hero-create>' + escapeHtml(t("hero.createBtn")) + '</button>' +
        "</div>";
      return;
    }

    const name = supplierName(f);
    const initials = name.trim().slice(0, 2).toUpperCase();
    const loc = (typeof i18nLocale === "function") ? i18nLocale() : "de-DE";
    const dateStr = new Date(f.deadline).toLocaleDateString(loc, {
      day: "2-digit", month: "2-digit", year: "numeric",
    });

    wrap.innerHTML =
      '<div class="hero-featured-card">' +
        '<div class="hero-featured-head">' +
          '<div class="hero-featured-logo" aria-hidden="true">' + escapeHtml(initials) + "</div>" +
          "<div>" +
            '<p class="hero-featured-name">' + escapeHtml(name) + "</p>" +
            '<p class="hero-featured-sub">' + escapeHtml(t("hero.endsOn", { date: dateStr })) + "</p>" +
          "</div>" +
        "</div>" +
        '<div class="hero-featured-count">' +
          "<span>" + escapeHtml(t("hero.endsIn")) + "</span>" +
          '<span class="hero-featured-time" data-go-countdown="' + escapeHtml(String(f.deadline)) + '" data-countdown-bare></span>' +
        "</div>" +
        '<button type="button" class="hero-featured-join" data-hero-join="' + escapeHtml(String(f.id)) + '">' + escapeHtml(t("hero.join")) + '</button>' +
      "</div>";

    tick();
  }

  // ----------------------------------------------------------
  // Sichtbarkeiten (Hero, Nav, Sticky-CTA, Badges)
  // ----------------------------------------------------------
  function isAuthed() {
    const btn = $("user-menu-btn");
    return !!btn && !btn.classList.contains("hidden");
  }
  function shopVisible() {
    const ps = $("products-section");
    return !!ps && !ps.classList.contains("hidden");
  }

  function syncUI() {
    const authed = isAuthed();
    const inGo = !!window.goSession;

    $("shop-hero")?.classList.toggle("hidden", !(authed && shopVisible() && !inGo));
    $("header-nav")?.classList.toggle("hidden", !authed);
    updateAvatar();

    const n = goOrders.length;
    const navBadge = $("nav-go-count");
    if (navBadge) {
      navBadge.textContent = String(n);
      navBadge.classList.toggle("hidden", n === 0);
    }
    const ddBadge = $("my-go-badge");
    if (ddBadge) {
      ddBadge.textContent = String(n);
      ddBadge.classList.toggle("hidden", n === 0);
    }

    updateStickyCta();
  }

  // Avatar-Initiale aus der (versteckten) E-Mail ableiten. app.js setzt
  // #user-menu-email beim Login — wir spiegeln nur den ersten Buchstaben.
  function updateAvatar() {
    const avatar = $("user-menu-avatar");
    const emailEl = $("user-menu-email");
    if (!avatar || !emailEl) return;
    const em = (emailEl.textContent || "").trim();
    avatar.textContent = em ? em[0].toUpperCase() : "?";
  }

  // ----------------------------------------------------------
  // Theme-Umschalter — Auto / Hell / Dunkel
  // Speichert die Präferenz; „Auto" wird nach Systemeinstellung aufgelöst.
  // ----------------------------------------------------------
  const THEME_KEY = "rs-theme";
  const media = window.matchMedia("(prefers-color-scheme: light)");

  function getThemePref() {
    try { return localStorage.getItem(THEME_KEY) || "auto"; } catch (e) { return "auto"; }
  }
  function resolveTheme(pref) {
    if (pref === "light" || pref === "dark") return pref;
    return media.matches ? "light" : "dark";
  }
  function applyTheme(pref) {
    document.documentElement.setAttribute("data-theme", resolveTheme(pref));
    document.querySelectorAll(".theme-opt").forEach((btn) => {
      const on = btn.getAttribute("data-theme-choice") === pref;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-pressed", String(on));
    });
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", resolveTheme(pref) === "light" ? "#f6f6fa" : "#0d0819");
  }
  function initTheme() {
    applyTheme(getThemePref());
    document.querySelectorAll(".theme-opt").forEach((btn) => {
      btn.addEventListener("click", () => {
        const pref = btn.getAttribute("data-theme-choice") || "auto";
        try { localStorage.setItem(THEME_KEY, pref); } catch (e) {}
        applyTheme(pref);
      });
    });
    // Systemwechsel nur berücksichtigen, solange „Auto" aktiv ist
    const onSystemChange = () => { if (getThemePref() === "auto") applyTheme("auto"); };
    if (media.addEventListener) media.addEventListener("change", onSystemChange);
    else if (media.addListener) media.addListener(onSystemChange);
  }

  function updateStickyCta() {
    const cta = $("go-sticky-cta");
    if (!cta) return;
    const f = featured();
    const show = isAuthed() && shopVisible() && !window.goSession && !!f;
    cta.classList.toggle("hidden", !show);
    document.body.classList.toggle("has-go-cta", show);
    if (show) {
      const r = remaining(f.deadline);
      const label = $("go-sticky-label");
      if (label) label.textContent = t("sticky.label", { name: supplierName(f), time: r.text });
    }
  }

  // ----------------------------------------------------------
  // Dropdown schließen (Logik aus user-dropdown.js gespiegelt)
  // ----------------------------------------------------------
  function closeUserDropdown() {
    const dd = $("user-dropdown");
    const btn = $("user-menu-btn");
    dd?.classList.remove("user-dropdown--open");
    btn?.setAttribute("aria-expanded", "false");
    dd?.setAttribute("aria-hidden", "true");
  }

  // ----------------------------------------------------------
  // Events aus group-order.js
  // ----------------------------------------------------------
  document.addEventListener("go:orders-changed", (e) => {
    // Defensiv nach Deadline sortieren → [0] ist die dringendste Aktion
    goOrders = (((e.detail && e.detail.orders) || []).slice())
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    renderFeatured();
    syncUI();
  });
  document.addEventListener("go:mode-changed", syncUI);

  // Sprachwechsel: Hero-Karte, Countdown-Ticker und Sticky-CTA neu aufbauen
  document.addEventListener("i18n:changed", () => {
    renderFeatured();
    syncUI();
    tick();
  });

  // ----------------------------------------------------------
  // Init
  // ----------------------------------------------------------
  function init() {
    if (inited) return;
    inited = true;

    initTheme();

    const ps = $("products-section");
    if (ps) new MutationObserver(syncUI).observe(ps, { attributes: true, attributeFilter: ["class"] });
    const umb = $("user-menu-btn");
    if (umb) new MutationObserver(syncUI).observe(umb, { attributes: true, attributeFilter: ["class"] });

    // Header-Nav
    function goToShop() {
      if (typeof closeGroupPanel === "function") closeGroupPanel();
      const cs = $("checkout-section");
      if (cs && !cs.classList.contains("hidden") && typeof closeCheckout === "function") closeCheckout();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    $("nav-go-btn")?.addEventListener("click", () => {
      if (typeof openGroupPanel === "function") openGroupPanel();
    });
    $("nav-shop-btn")?.addEventListener("click", goToShop);
    $("brand-home")?.addEventListener("click", (e) => { e.preventDefault(); goToShop(); });

    // Dropdown: Meine Sammelbestellungen → Panel
    $("my-group-orders-btn")?.addEventListener("click", () => {
      closeUserDropdown();
      if (typeof openGroupPanel === "function") openGroupPanel();
    });

    // Hero
    $("hero-howto-btn")?.addEventListener("click", () => {
      const el = $("hero-howto");
      if (!el) return;
      const nowHidden = el.classList.toggle("hidden");
      $("hero-howto-btn")?.setAttribute("aria-expanded", String(!nowHidden));
    });
    $("hero-go-btn")?.addEventListener("click", () => {
      const f = featured();
      if (f && typeof joinGroupOrder === "function") joinGroupOrder(String(f.id));
      else if (typeof openGroupPanel === "function") openGroupPanel();
    });
    $("hero-featured")?.addEventListener("click", (e) => {
      const join = e.target.closest("[data-hero-join]");
      if (join && typeof joinGroupOrder === "function") {
        joinGroupOrder(join.getAttribute("data-hero-join"));
        return;
      }
      if (e.target.closest("[data-hero-create]") && typeof openGroupPanel === "function") openGroupPanel();
    });

    // Sticky-CTA
    $("go-sticky-cta")?.addEventListener("click", () => {
      const f = featured();
      if (f && typeof joinGroupOrder === "function") joinGroupOrder(String(f.id));
    });

    setInterval(tick, 1000);
    syncUI();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
