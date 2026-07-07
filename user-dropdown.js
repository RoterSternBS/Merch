// ============================================================
// user-dropdown.js — Dropdown-Toggle + Adressänderung
// Abhängigkeiten: auth.js (window.db, window.getCurrentUser)
//                 muss nach auth.js und app.js geladen werden.
// ============================================================

(function () {
  "use strict";

  const userMenuBtn  = document.getElementById("user-menu-btn");
  const userDropdown = document.getElementById("user-dropdown");
  const addressBtn   = document.getElementById("address-change-btn");
  // NEW LOOK: Kontodaten sind jetzt ein Fullscreen-Panel statt Mini-Modal
  const accountPanel     = document.getElementById("account-panel");
  const accountBackBtn   = document.getElementById("account-back-btn");
  const accountCloseBtn  = document.getElementById("account-close-btn");
  const accountCancelBtn = document.getElementById("account-cancel-btn");
  const addressForm       = document.getElementById("address-form");
  const addressMessage    = document.getElementById("address-message");
  const addressSubmitBtn  = document.getElementById("address-submit-btn");
  const fieldStreet  = document.getElementById("address-street");
  const fieldHouse  = document.getElementById("address-house");
  const fieldPostal  = document.getElementById("address-postal");
  const fieldCity    = document.getElementById("address-city");

  // ── DROPDOWN TOGGLE (aus auth.js übernommen) ──────────────
  userMenuBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = userDropdown.classList.contains("user-dropdown--open");
    userDropdown.classList.toggle("user-dropdown--open", !isOpen);
    userMenuBtn.setAttribute("aria-expanded", String(!isOpen));
    userDropdown.setAttribute("aria-hidden", String(isOpen));
  });

  document.addEventListener("click", (e) => {
    if (!userDropdown.contains(e.target) && !userMenuBtn.contains(e.target)) {
      userDropdown.classList.remove("user-dropdown--open");
      userMenuBtn.setAttribute("aria-expanded", "false");
      userDropdown.setAttribute("aria-hidden", "true");
    }
  });

  // ── KONTODATEN-PANEL ÖFFNEN / SCHLIESSEN ──────────────────
  function isAccountOpen() {
    return !!accountPanel && accountPanel.classList.contains("go-panel--open");
  }

  function openAccountPanel() {
    // Dropdown schließen
    userDropdown.classList.remove("user-dropdown--open");
    userMenuBtn.setAttribute("aria-expanded", "false");
    userDropdown.setAttribute("aria-hidden", "true");
    if (!accountPanel) return;

    // Andere Fullscreen-Panels schließen, damit sich nichts überlagert
    if (typeof closeGroupPanel === "function") closeGroupPanel();
    if (typeof closeMyOrders === "function") closeMyOrders();

    if (window.innerWidth >= 1024) {
      document.getElementById("products-section")?.classList.add("hidden");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    accountPanel.classList.add("go-panel--open");
    accountPanel.setAttribute("aria-hidden", "false");
    if (typeof openPanelOverlay === "function") openPanelOverlay();
    history.pushState({ view: "account" }, "", location.href);

    loadAccount();
  }

  function closeAccountPanel() {
    if (!accountPanel) return;
    accountPanel.classList.remove("go-panel--open");
    accountPanel.setAttribute("aria-hidden", "true");
    if (typeof closePanelOverlay === "function") closePanelOverlay();
    if (window.innerWidth >= 1024) {
      document.getElementById("products-section")?.classList.remove("hidden");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    setAddressMessage("", false);
  }

  // Profil (read-only) aus den Auth-Metadaten rendern
  function renderProfile(user) {
    const md = user.user_metadata || {};
    const first = (md.first_name || "").trim();
    const last  = (md.last_name  || "").trim();
    const email = user.email || "";
    const fullName = [first, last].filter(Boolean).join(" ")
      || (email ? email.split("@")[0] : "—");
    const isOrg = md.account_type === "organization";

    const nameEl   = document.getElementById("account-name");
    const emailEl  = document.getElementById("account-email");
    const avatarEl = document.getElementById("account-avatar");
    const badgeEl  = document.getElementById("account-type-badge");
    const factsEl  = document.getElementById("account-facts");

    if (nameEl)   nameEl.textContent   = fullName;
    if (emailEl)  emailEl.textContent  = email;
    if (avatarEl) avatarEl.textContent = (first[0] || email[0] || "?").toUpperCase();
    if (badgeEl) {
      badgeEl.textContent = isOrg ? t("account.org") : t("account.person");
      badgeEl.classList.remove("hidden");
    }
    if (factsEl) {
      const rows = [fact(t("account.accountTypeLabel"), isOrg ? t("account.org") : t("account.person"))];
      if (isOrg && md.organization_name) rows.push(fact(t("account.club"), md.organization_name));
      factsEl.innerHTML = rows.join("");
    }
  }

  function fact(label, value) {
    return '<div class="account-fact"><dt>' + esc(label) + "</dt><dd>" + esc(value) + "</dd></div>";
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  // Adresse laden (Panel ist bereits sichtbar)
  async function loadAccount() {
    setAddressMessage(t("account.loadingData"), false);
    addressSubmitBtn.disabled = true;
    try {
      const user = await window.getCurrentUser();
      if (!user) { setAddressMessage(t("account.noUser"), true); return; }

      renderProfile(user);

      const { data, error } = await window.db
        .from("user_addresses")
        .select("street, house_number, postal_code, city")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      fieldStreet.value = data?.street       ?? "";
      fieldHouse.value  = data?.house_number ?? "";
      fieldPostal.value = data?.postal_code  ?? "";
      fieldCity.value   = data?.city         ?? "";
      setAddressMessage("", false);
    } catch (err) {
      setAddressMessage(t("account.loadError", { msg: err.message }), true);
    } finally {
      addressSubmitBtn.disabled = false;
    }
  }

  addressBtn.addEventListener("click", openAccountPanel);
  accountBackBtn?.addEventListener("click", closeAccountPanel);
  accountCloseBtn?.addEventListener("click", closeAccountPanel);
  accountCancelBtn?.addEventListener("click", closeAccountPanel);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isAccountOpen()) closeAccountPanel();
  });

  // ── ADRESSE SPEICHERN ─────────────────────────────────────
  addressForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const street        = fieldStreet.value.trim();
    const house_number  = fieldHouse.value.trim();
    const postal_code   = fieldPostal.value.trim();
    const city          = fieldCity.value.trim();

    if (!street || !house_number || !postal_code || !city) {
      setAddressMessage(t("account.fillAll"), true);
      return;
    }

    addressSubmitBtn.disabled    = true;
    addressSubmitBtn.textContent = t("account.saving");

    try {
      const user = await window.getCurrentUser();
      if (!user) throw new Error(t("account.noUserShort"));

      const { error } = await window.db
        .from("user_addresses")
        .update({ street, house_number, postal_code, city })
        .eq("user_id", user.id);

      if (error) throw error;
      setAddressMessage(t("account.saved"), false);
      setTimeout(() => closeAccountPanel(), 1200);
    } catch (err) {
      setAddressMessage(t("account.saveError", { msg: err.message }), true);
    } finally {
      addressSubmitBtn.disabled    = false;
      addressSubmitBtn.textContent = t("account.save");
    }
  });

  function setAddressMessage(text, isError) {
    addressMessage.textContent = text;
    addressMessage.className = "address-message"
      + (isError ? " address-message--error" : text ? " address-message--success" : "");
  }

  // Sprachwechsel: bei offenem Konto-Panel Profil-Fakten neu laden
  document.addEventListener("i18n:changed", () => {
    if (isAccountOpen()) loadAccount();
  });

})();
