// ============================================================
// MEINE BESTELLUNGEN — my-orders.js
// Neue View: Bestellhistorie aus orders + order_items.
// Abhängigkeiten: auth.js (db, getCurrentUser),
//   app.js (escapeHtml, formatPrice),
//   group-order.js (openPanelOverlay, closePanelOverlay),
//   Panel-Rahmen-Styles: panel-base.css / group-checkout.css (.go-panel),
//   Inhalts-Styles: new-look.css (.mo-*)
// Muss NACH group-order.js geladen werden.
// ============================================================

(function () {
  "use strict";

  const STATUS_LABELS = {
    submitted:  "Eingegangen",
    processing: "In Bearbeitung",
    ordered:    "Bestellt",
    shipped:    "Versendet",
    completed:  "Abgeschlossen",
    cancelled:  "Storniert",
  };
  const STATUS_DONE = new Set(["shipped", "completed"]);

  function ensurePanel() {
    if (document.getElementById("my-orders-panel")) return;

    const panel = document.createElement("div");
    panel.id = "my-orders-panel";
    panel.className = "go-panel app-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.setAttribute("aria-label", "Meine Bestellungen");
    panel.setAttribute("aria-hidden", "true");
    panel.innerHTML = `
      <div class="go-panel-inner app-panel-inner">
        <div class="go-panel-handle" aria-hidden="true"></div>
        <div class="go-panel-header app-panel-header">
          <button class="go-panel-back-btn app-panel-back-btn" id="my-orders-back" type="button">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
            Zurück
          </button>
          <h2 class="go-panel-header-title">Meine Bestellungen</h2>
          <button class="go-panel-close-btn" id="my-orders-close" type="button" aria-label="Schließen">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="go-panel-body" id="my-orders-body"></div>
      </div>`;
    document.body.appendChild(panel);

    document.getElementById("my-orders-back")?.addEventListener("click", closeMyOrders);
    document.getElementById("my-orders-close")?.addEventListener("click", closeMyOrders);

    // Swipe-down zum Schließen (wie go-panel)
    let touchStartY = 0;
    panel.addEventListener("touchstart", (e) => { touchStartY = e.touches[0].clientY; }, { passive: true });
    panel.addEventListener("touchend", (e) => {
      if (e.changedTouches[0].clientY - touchStartY > 70) closeMyOrders();
    }, { passive: true });
  }

  function isOpen() {
    return document.getElementById("my-orders-panel")?.classList.contains("go-panel--open");
  }

  async function openMyOrders() {
    ensurePanel();

    // Andere Panels schließen
    if (typeof closeGroupPanel === "function") closeGroupPanel();

    const panel = document.getElementById("my-orders-panel");
    if (window.innerWidth >= 1024) {
      document.getElementById("products-section")?.classList.add("hidden");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    panel.classList.add("go-panel--open");
    panel.setAttribute("aria-hidden", "false");
    if (typeof openPanelOverlay === "function") openPanelOverlay();
    history.pushState({ view: "my-orders" }, "", location.href);

    await renderMyOrders();
  }

  function closeMyOrders() {
    const panel = document.getElementById("my-orders-panel");
    if (!panel) return;
    panel.classList.remove("go-panel--open");
    panel.setAttribute("aria-hidden", "true");
    if (typeof closePanelOverlay === "function") closePanelOverlay();
    if (window.innerWidth >= 1024) {
      document.getElementById("products-section")?.classList.remove("hidden");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  async function renderMyOrders() {
    const body = document.getElementById("my-orders-body");
    if (!body) return;
    body.innerHTML = '<p class="mo-intro">Wird geladen …</p>';

    const user = await getCurrentUser();
    if (!user) {
      body.innerHTML = '<div class="mo-empty">Kein angemeldeter Nutzer gefunden.</div>';
      return;
    }

    const { data, error } = await db
      .from("orders")
      .select(`id, status, created_at, group_order_id,
               group_orders ( title, suppliers ( name ) ),
               order_items ( id, product_name, quantity, size_label, unit_price_netto )`)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      body.innerHTML = '<div class="mo-empty">Fehler beim Laden: ' + escapeHtml(error.message) + "</div>";
      return;
    }

    if (!data || data.length === 0) {
      body.innerHTML =
        '<p class="mo-intro">Alle deine Einzel- und Sammelbestellungen mit Status und Positionen.</p>' +
        '<div class="mo-empty">Noch keine Bestellungen.</div>';
      return;
    }

    const cards = data.map((o) => {
      const isGo = !!o.group_order_id;
      const supplier = o.group_orders?.suppliers?.name || o.group_orders?.title || null;
      const heading = isGo ? (supplier || "Sammelbestellung") : "Einzelbestellung";
      const initials = (supplier || "RS").trim().slice(0, 2).toUpperCase();
      const typeLabel = isGo ? "Sammelbestellung" : "Einzelbestellung";
      const dateStr = o.created_at
        ? new Date(o.created_at).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })
        : "";
      const statusLabel = STATUS_LABELS[o.status] || o.status || "—";
      const statusCls = STATUS_DONE.has(o.status) ? " mo-status--done" : "";

      const items = o.order_items || [];
      const itemCount = items.reduce((s, l) => s + Number(l.quantity || 0), 0);
      const totalNetto = items.reduce((s, l) => s + Number(l.unit_price_netto || 0) * Number(l.quantity || 0), 0);

      const lines = items.map((l) => {
        const size = l.size_label ? " (Gr. " + escapeHtml(l.size_label) + ")" : "";
        return '<div class="mo-line"><span><b>' + Number(l.quantity) + "×</b> " +
          escapeHtml(l.product_name || "Produkt") + size + "</span>" +
          '<span class="mo-line-price">' + formatPrice(Number(l.unit_price_netto || 0) * Number(l.quantity || 0)) + "</span></div>";
      }).join("");

      return (
        '<article class="mo-card">' +
          '<div class="mo-head">' +
            '<div class="mo-logo" aria-hidden="true">' + escapeHtml(initials) + "</div>" +
            '<div class="mo-head-info">' +
              '<p class="mo-title">' + escapeHtml(heading) + "</p>" +
              '<p class="mo-meta"><span class="' + (isGo ? "mo-type-go" : "") + '">' + typeLabel + "</span> · " + escapeHtml(dateStr) + "</p>" +
            "</div>" +
            '<span class="mo-status' + statusCls + '">' + escapeHtml(statusLabel) + "</span>" +
          "</div>" +
          '<div class="mo-lines">' + lines + "</div>" +
          '<div class="mo-foot"><span>' + itemCount + " Artikel</span>" +
          '<span class="mo-foot-total">Summe (netto): ' + formatPrice(totalNetto) + "</span></div>" +
        "</article>"
      );
    }).join("");

    body.innerHTML =
      '<p class="mo-intro">Alle deine Einzel- und Sammelbestellungen mit Status und Positionen.</p>' +
      '<div class="mo-list">' + cards + "</div>";
  }

  // ----------------------------------------------------------
  // Wiring
  // ----------------------------------------------------------
  function init() {
    document.getElementById("my-orders-btn")?.addEventListener("click", () => {
      // Dropdown schließen (Logik aus user-dropdown.js gespiegelt)
      const dd = document.getElementById("user-dropdown");
      const btn = document.getElementById("user-menu-btn");
      dd?.classList.remove("user-dropdown--open");
      btn?.setAttribute("aria-expanded", "false");
      dd?.setAttribute("aria-hidden", "true");
      openMyOrders();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && isOpen()) closeMyOrders();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Für Debug/Konsole
  window.openMyOrders = openMyOrders;
  window.closeMyOrders = closeMyOrders;
})();
