// ============================================================
// i18n.js — Mehrsprachigkeit (Deutsch / Englisch / Arabisch)
// Leichtgewichtiges i18n ohne Framework / Build-Schritt.
//
// Muss VOR auth.js/app.js/... geladen werden, damit window.t(),
// window.i18nLocale() usw. bereitstehen.
//
// Öffentliche API (window):
//   t(key, vars)        → übersetzter String, {var}-Interpolation
//   setLanguage(lang)   → Sprache umschalten (de|en|ar)
//   getLanguage()       → aktuelle Sprache
//   i18nLocale()        → BCP47-Locale für Intl (Preis/Datum)
//   translateTree(el)   → data-i18n in einem Teilbaum anwenden
//   onLangChange(cb)    → Kurzform für addEventListener('i18n:changed')
//
// Statisches HTML: Attribute data-i18n / data-i18n-html / data-i18n-attr.
// Dynamische JS-Texte: t('key').
// Beim Sprachwechsel wird 'i18n:changed' auf document dispatcht.
// ============================================================

(function () {
  "use strict";

  const LANGS   = ["de", "en", "ar"];
  const RTL     = new Set(["ar"]);
  const LS_KEY  = "rs-lang";
  const LOCALES = { de: "de-DE", en: "en-GB", ar: "ar-u-nu-latn" };

  // ----------------------------------------------------------
  // WÖRTERBUCH
  // ----------------------------------------------------------
  const DICT = {
    de: {
      // — Meta / Kopf —
      "meta.title": "Roter Stern BS · Vereins-Merch",
      "meta.description": "Vereinsshop und Sammelbestellungen für Vereinsmitglieder.",
      "header.subtitle": "Vereins · Merch",
      "nav.shop": "Shop",
      "nav.groupOrders": "Sammelbestellungen",

      // — Theme-Umschalter —
      "theme.label": "Farbschema wählen",
      "theme.auto": "Auto",
      "theme.autoTitle": "Automatisch (System)",
      "theme.lightAria": "Helles Design",
      "theme.lightTitle": "Hell",
      "theme.darkAria": "Dunkles Design",
      "theme.darkTitle": "Dunkel",

      // — Sprach-Umschalter —
      "lang.label": "Sprache wählen",
      "lang.deTitle": "Deutsch",
      "lang.enTitle": "English",
      "lang.arTitle": "العربية",
      "settings.language": "Sprache",
      "settings.theme": "Design",

      // — Header-Aktionen / Benutzermenü —
      "cart.openAria": "Warenkorb öffnen",
      "user.menuOpenAria": "Benutzermenü öffnen",
      "user.myOrders": "Meine Bestellungen",
      "user.myGroupOrders": "Meine Sammelbestellungen",
      "user.account": "Kontodaten",
      "user.accountSub": "Profil · Adresse ändern",
      "user.logout": "Abmelden",

      // — Login —
      "login.welcome": "Willkommen",
      "login.sub": "Melde dich an, um die Sammelbestellung einzusehen.",
      "login.email": "E-Mail",
      "login.emailPh": "name@beispiel.de",
      "login.password": "Passwort",
      "login.passwordPh": "Passwort",
      "login.submit": "Einloggen",
      "login.or": "oder",
      "login.signup": "Neu registrieren",
      "login.loggingIn": "Wird angemeldet…",
      "login.enterCredentials": "Bitte E-Mail und Passwort eingeben.",
      "login.noSession": "Login war erfolgreich, aber es wurde keine Session gefunden.",
      "login.logoutError": "Fehler beim Abmelden: {msg}",

      // — Registrierung —
      "reg.title": "Konto erstellen",
      "reg.sub": "Fülle alle Pflichtfelder aus. Dein Konto wird nach der Registrierung von einem Admin freigeschaltet.",
      "reg.accountType": "Kontotyp",
      "reg.person": "Person",
      "reg.org": "Organisation",
      "reg.firstName": "Vorname",
      "reg.firstNamePh": "Max",
      "reg.lastName": "Nachname",
      "reg.lastNamePh": "Mustermann",
      "reg.email": "E-Mail",
      "reg.emailPh": "name@beispiel.de",
      "reg.password": "Passwort",
      "reg.passwordPh": "Mindestens 6 Zeichen",
      "reg.street": "Straße",
      "reg.streetPh": "Musterstraße",
      "reg.house": "Hausnr.",
      "reg.housePh": "12",
      "reg.postal": "PLZ",
      "reg.postalPh": "13121",
      "reg.city": "Ort",
      "reg.cityPh": "Musterstadt",
      "reg.orgData": "Vereinsdaten",
      "reg.orgName": "Vereinsname",
      "reg.orgNamePh": "Musterverein e.V.",
      "reg.orgStreet": "Vereinssitz (Straße)",
      "reg.orgStreetPh": "Musterweg",
      "reg.orgHouse": "Hausnr.",
      "reg.orgHousePh": "161",
      "reg.orgPostal": "PLZ",
      "reg.orgPostalPh": "13121",
      "reg.orgCity": "Ort",
      "reg.orgCityPh": "Musterstadt",
      "reg.registerNumber": "Vereinsregisternummer",
      "reg.registerNumberPh": "VR 12345",
      "reg.orgEmail": "Vereins-E-Mail",
      "reg.orgEmailPh": "info@verein.de",
      "reg.submit": "Registrieren",
      "reg.backToLogin": "Zurück zum Login",
      "reg.fillRequired": "Bitte alle Pflichtfelder ausfüllen.",
      "reg.fillOrg": "Bitte alle Vereinsdaten ausfüllen.",
      "reg.registering": "Wird registriert…",
      "reg.emailExists": "Diese E-Mail ist bereits registriert.",
      "reg.success": "Registrierung erfolgreich! Bitte bestätige deine E-Mail-Adresse. Danach wird dein Konto von einem Admin freigeschaltet.",
      "reg.successShort": "Registrierung erfolgreich. Bitte E-Mail bestätigen.",

      // — Pending —
      "pending.title": "Konto wird geprüft",
      "pending.sub": "Deine Registrierung war erfolgreich. Ein Admin schaltet dein Konto in Kürze frei. Du wirst automatisch weitergeleitet sobald dein Konto freigegeben wurde.",
      "pending.logout": "Abmelden",

      // — Hero —
      "hero.kicker": "★ Gemeinsam bestellen",
      "hero.titleLine1": "Einer bestellt.",
      "hero.titleLine2": "Der ganze Verein",
      "hero.titleLine3": "spart.",
      "hero.copy": "Bei einer <strong>Sammelbestellung</strong> bündeln wir alle Bestellungen bei einem Lieferanten bis zur Deadline — ein Versand, weniger Kosten, mehr für den Verein.",
      "hero.ctaActive": "Zur aktiven Sammelbestellung →",
      "hero.howtoToggle": "So funktioniert's",
      "hero.runningNow": "Läuft gerade",
      "hero.step1Title": "Aktion beitreten",
      "hero.step1Text": "Wähle eine laufende Sammelbestellung deines Lieferanten aus.",
      "hero.step2Title": "Artikel wählen",
      "hero.step2Text": "Leg deine Artikel bis zur Deadline in den gemeinsamen Warenkorb.",
      "hero.step3Title": "Gebündelt bestellen",
      "hero.step3Text": "Nach der Deadline geht alles in einem Sammelversand raus.",
      "hero.emptyText": "Gerade läuft keine Sammelbestellung.<br>Eröffne die nächste Aktion für deinen Lieferanten.",
      "hero.createBtn": "+ Sammelbestellung eröffnen",
      "hero.endsOn": "Endet am {date}",
      "hero.endsIn": "Endet in",
      "hero.join": "Mitmachen",

      // — Sticky CTA —
      "sticky.cta": "Zur Sammelbestellung →",
      "sticky.label": "Sammelbestellung „{name}“ · noch {time} →",

      // — Shop / Filter —
      "sidebar.shop": "Shop",
      "sidebar.filter": "Filter",
      "sidebar.category": "Kategorie",
      "sidebar.supplier": "Lieferant",
      "sidebar.brand": "Marke",
      "sidebar.reset": "Filter zurücksetzen",
      "topbar.assortment": "Sortiment",
      "topbar.availableItems": "Verfügbare Artikel",
      "filter.openAria": "Filter öffnen",
      "filter.closeAria": "Filter schließen",
      "filter.label": "Filter",
      "filter.apply": "Anwenden",
      "products.empty": "Keine Produkte für diese Filter.",
      "products.loadError": "Fehler beim Laden der Produkte: {msg}",
      "products.none": "Noch keine Produkte vorhanden.",
      "products.noImage": "Kein Bild",

      // — Produktkarte / Warenkorb —
      "product.addToCart": "In den Warenkorb",
      "product.qty": "Menge",
      "product.selectSize": "Bitte zuerst eine Größe auswählen.",
      "product.validQty": "Bitte eine gültige Menge eingeben.",
      "product.removeAria": "Produkt entfernen",
      "product.removeCartAria": "Produkt aus dem Warenkorb entfernen",
      "product.removeTitle": "Entfernen",
      "cart.title": "Warenkorb",
      "cart.closeAria": "Warenkorb schließen",
      "cart.checkout": "Zur Bestellübersicht →",
      "cart.totalLabel": "Gesamt",
      "cart.sizeColon": "Größe: {code}",
      "cart.qtyColon": "Menge: {n}",
      "cart.emptyYet": "Dein Warenkorb ist noch leer.",
      "cart.emptyInGroup": "Noch keine Produkte in dieser Sammelbestellung.",
      "cart.loadError": "Fehler beim Laden: {msg}",
      "cart.loadCartError": "Fehler beim Laden des Warenkorbs: {msg}",
      "cart.checkError": "Fehler beim Prüfen des Warenkorbs: {msg}",
      "cart.updateError": "Fehler beim Aktualisieren des Warenkorbs: {msg}",
      "cart.saveError": "Fehler beim Speichern im Warenkorb: {msg}",
      "cart.removeError": "Fehler beim Entfernen: {msg}",
      "cart.added": "Produkt zum Warenkorb hinzugefügt.",
      "cart.removed": "Produkt aus dem Warenkorb entfernt.",
      "cart.addedToGroup": "Produkt zur Sammelbestellung hinzugefügt.",
      "cart.loginRequired": "Du musst eingeloggt sein.",
      "cart.error": "Fehler: {msg}",

      // — Checkout —
      "checkout.back": "Zurück zum Shop",
      "checkout.step": "Schritt 2 von 2",
      "checkout.title": "Bestellübersicht",
      "checkout.groupLabel": "Sammelbestellung",
      "checkout.cartArea": "Warenkorb",
      "checkout.cartEmpty": "Dein Warenkorb ist leer.",
      "checkout.orderArea": "Meine Bestellung",
      "checkout.orderEmpty": "Du hast noch keine Artikel zur Bestellung hinzugefügt.",
      "checkout.summary": "Zusammenfassung",
      "checkout.items": "Artikel",
      "checkout.total": "Gesamt",
      "checkout.submit": "Bestellung absenden",
      "checkout.update": "Bestellung aktualisieren",
      "checkout.sizeHeader": "Größe",
      "checkout.qtyHeader": "Menge",
      "checkout.priceHeader": "Preis",
      "checkout.noSize": "Keine Größe",
      "checkout.qtyDecAria": "Menge verringern",
      "checkout.qtyIncAria": "Menge erhöhen",
      "checkout.removePosAria": "Position entfernen",
      "checkout.loadError": "Fehler beim Laden: {msg}",

      // — Bestellung absenden —
      "order.cartEmpty": "Dein Warenkorb ist leer.",
      "order.error": "Fehler: {msg}",
      "order.errorUnknown": "Unbekannt",
      "order.saveError": "Fehler beim Speichern: {msg}",
      "order.mailFailed": "Bestellung gespeichert (ID: {id}), E-Mail fehlgeschlagen.",
      "order.savedNotCleared": "Gespeichert, aber Warenkorb nicht geleert: {msg}",
      "order.success": "Bestellung erfolgreich. ID: {id}",
      "order.updated": "Bestellung aktualisiert.",
      "order.addedToGroup": "Zur Sammelbestellung hinzugefügt.",
      "order.noToken": "Kein Access Token.",

      // — GO Confirm/Merge Fehler —
      "go.confirmLoadError": "Fehler beim Laden: {msg}",
      "go.confirmCheckError": "Fehler beim Prüfen bestehender Positionen: {msg}",
      "go.mergeError": "Fehler beim Zusammenführen: {msg}",
      "go.cleanupError": "Fehler beim Aufräumen der Warenkorb-Zeile: {msg}",
      "go.addToOrderError": "Fehler beim Hinzufügen zur Bestellung: {msg}",
      "go.deleteError": "Fehler beim Löschen: {msg}",
      "go.updateError": "Fehler beim Aktualisieren: {msg}",

      // — Post-Submit-Dialog —
      "dialog.savedAria": "Bestellung gespeichert",
      "dialog.savedTitle": "Bestellung gespeichert",
      "dialog.updatedTitle": "Bestellung aktualisiert",
      "dialog.savedMsg": "Deine Artikel wurden der Sammelbestellung <strong>{name}</strong> hinzugefügt.",
      "dialog.updatedMsg": "Deine Änderungen wurden in der Sammelbestellung <strong>{name}</strong> gespeichert.",
      "dialog.goToGroup": "Zur Sammelbestellung",
      "dialog.closeGroup": "Sammelbestellung schließen",

      // — Sammelbestellungen (Panel / Trigger) —
      "go.defaultName": "Sammelbestellung",
      "go.createBtn": "+ Sammelbestellung eröffnen",
      "go.countActive": "{n} Sammelbestellungen aktiv",
      "go.openBtn": "Zur Sammelbestellung",
      "go.newBtn": "+ Neu",
      "go.signalLabel": "Sammelbestellung",
      "go.leave": "Verlassen",
      "go.supplierLogoAlt": "Lieferanten-Logo",
      "go.panelTitle": "Sammelbestellungen",
      "go.back": "Zurück",
      "go.closeAria": "Schließen",
      "go.activeOrders": "Aktive Bestellungen",
      "go.endsOn": "Endet am {date}",
      "go.join": "Mitmachen",
      "go.joined": "Beigetreten ✓",
      "go.leaveBtn": "Austreten",
      "go.gotoGroup": "→ Zur Sammelbestellung",
      "go.editAria": "Bearbeiten",
      "go.editOnlyCreator": "Nur der Ersteller kann die Deadline ändern",
      "go.none": "Keine aktiven Sammelbestellungen.",
      "go.newOrder": "Neue Sammelbestellung",
      "go.supplier": "Lieferant",
      "go.loadingOption": "— wird geladen …",
      "go.deadline": "Deadline",
      "go.createSubmit": "Sammelbestellung erstellen",
      "go.loadFailedOption": "Fehler beim Laden",
      "go.noActiveSuppliers": "Keine aktiven Lieferanten",
      "go.pleaseSelect": "Bitte wählen …",
      "go.alreadyActive": "(bereits aktiv)",
      "go.supplierBlocked": "Es gibt bereits eine offene Sammelbestellung für „{name}“.",
      "go.selectSupplier": "Bitte einen Lieferanten wählen.",
      "go.enterDeadline": "Bitte eine Deadline angeben.",
      "go.deadlineFuture": "Die Deadline muss in der Zukunft liegen.",
      "go.checkErrorPrefix": "Prüfungsfehler: {msg}",
      "go.notLoggedIn": "Nicht eingeloggt.",
      "go.createError": "Fehler beim Erstellen: {msg}",
      "go.editTitle": "Sammelbestellung bearbeiten",
      "go.cancel": "Abbrechen",
      "go.save": "Speichern",
      "go.editError": "Fehler: {msg}",
      "go.leaveDeadlinePassed": "Deadline abgelaufen. Austreten nicht mehr möglich.",
      "go.leaveError": "Fehler beim Austreten: {msg}",

      // — Meine Bestellungen —
      "mo.title": "Meine Bestellungen",
      "mo.loading": "Wird geladen …",
      "mo.noUser": "Kein angemeldeter Nutzer gefunden.",
      "mo.loadError": "Fehler beim Laden: {msg}",
      "mo.intro": "Alle deine Einzel- und Sammelbestellungen mit Status und Positionen.",
      "mo.none": "Noch keine Bestellungen.",
      "mo.groupOrder": "Sammelbestellung",
      "mo.singleOrder": "Einzelbestellung",
      "mo.itemsCount": "{n} Artikel",
      "mo.sumNetto": "Summe (netto): {price}",
      "mo.sizeShort": "(Gr. {code})",
      "status.submitted": "Eingegangen",
      "status.processing": "In Bearbeitung",
      "status.ordered": "Bestellt",
      "status.shipped": "Versendet",
      "status.completed": "Abgeschlossen",
      "status.cancelled": "Storniert",

      // — Kontodaten —
      "account.title": "Kontodaten",
      "account.intro": "Verwalte hier deine persönlichen Daten und deine Lieferadresse.",
      "account.note": "Name und E-Mail wurden bei der Registrierung festgelegt. Zum Ändern wende dich an den Vorstand.",
      "account.deliveryAddress": "Lieferadresse",
      "account.deliverySub": "Wohin deine Bestellungen geliefert werden.",
      "account.discard": "Verwerfen",
      "account.save": "Speichern",
      "account.saving": "Wird gespeichert …",
      "account.org": "Organisation",
      "account.person": "Person",
      "account.accountTypeLabel": "Kontotyp",
      "account.club": "Verein",
      "account.loadingData": "Daten werden geladen …",
      "account.noUser": "Kein angemeldeter Nutzer gefunden.",
      "account.noUserShort": "Kein angemeldeter Nutzer.",
      "account.loadError": "Fehler beim Laden: {msg}",
      "account.fillAll": "Bitte alle Felder ausfüllen.",
      "account.saveError": "Fehler beim Speichern: {msg}",
      "account.saved": "Adresse erfolgreich gespeichert.",

      // — Countdown —
      "cd.ended": "beendet",
      "cd.remainingPrefix": "noch {time}",
      "cd.days": "Tg",
      "cd.hours": "Std",
      "cd.minutes": "Min",
      "cd.seconds": "Sek",

      "common.product": "Produkt",
    },

    en: {
      "meta.title": "Roter Stern BS · Club Merch",
      "meta.description": "Club shop and group orders for club members.",
      "header.subtitle": "Club · Merch",
      "nav.shop": "Shop",
      "nav.groupOrders": "Group orders",

      "theme.label": "Choose colour scheme",
      "theme.auto": "Auto",
      "theme.autoTitle": "Automatic (system)",
      "theme.lightAria": "Light theme",
      "theme.lightTitle": "Light",
      "theme.darkAria": "Dark theme",
      "theme.darkTitle": "Dark",

      "lang.label": "Choose language",
      "lang.deTitle": "Deutsch",
      "lang.enTitle": "English",
      "lang.arTitle": "العربية",
      "settings.language": "Language",
      "settings.theme": "Theme",

      "cart.openAria": "Open cart",
      "user.menuOpenAria": "Open user menu",
      "user.myOrders": "My orders",
      "user.myGroupOrders": "My group orders",
      "user.account": "Account",
      "user.accountSub": "Profile · edit address",
      "user.logout": "Log out",

      "login.welcome": "Welcome",
      "login.sub": "Log in to view the group order.",
      "login.email": "Email",
      "login.emailPh": "name@example.com",
      "login.password": "Password",
      "login.passwordPh": "Password",
      "login.submit": "Log in",
      "login.or": "or",
      "login.signup": "Create account",
      "login.loggingIn": "Signing in…",
      "login.enterCredentials": "Please enter email and password.",
      "login.noSession": "Login succeeded, but no session was found.",
      "login.logoutError": "Error logging out: {msg}",

      "reg.title": "Create account",
      "reg.sub": "Fill in all required fields. Your account will be activated by an admin after registration.",
      "reg.accountType": "Account type",
      "reg.person": "Person",
      "reg.org": "Organisation",
      "reg.firstName": "First name",
      "reg.firstNamePh": "Max",
      "reg.lastName": "Last name",
      "reg.lastNamePh": "Sample",
      "reg.email": "Email",
      "reg.emailPh": "name@example.com",
      "reg.password": "Password",
      "reg.passwordPh": "At least 6 characters",
      "reg.street": "Street",
      "reg.streetPh": "Sample Street",
      "reg.house": "No.",
      "reg.housePh": "12",
      "reg.postal": "Postcode",
      "reg.postalPh": "13121",
      "reg.city": "City",
      "reg.cityPh": "Sample City",
      "reg.orgData": "Club details",
      "reg.orgName": "Club name",
      "reg.orgNamePh": "Sample Club",
      "reg.orgStreet": "Club address (street)",
      "reg.orgStreetPh": "Sample Road",
      "reg.orgHouse": "No.",
      "reg.orgHousePh": "161",
      "reg.orgPostal": "Postcode",
      "reg.orgPostalPh": "13121",
      "reg.orgCity": "City",
      "reg.orgCityPh": "Sample City",
      "reg.registerNumber": "Club register number",
      "reg.registerNumberPh": "VR 12345",
      "reg.orgEmail": "Club email",
      "reg.orgEmailPh": "info@club.com",
      "reg.submit": "Register",
      "reg.backToLogin": "Back to login",
      "reg.fillRequired": "Please fill in all required fields.",
      "reg.fillOrg": "Please fill in all club details.",
      "reg.registering": "Registering…",
      "reg.emailExists": "This email is already registered.",
      "reg.success": "Registration successful! Please confirm your email address. Your account will then be activated by an admin.",
      "reg.successShort": "Registration successful. Please confirm your email.",

      "pending.title": "Account under review",
      "pending.sub": "Your registration was successful. An admin will activate your account shortly. You will be redirected automatically once your account is approved.",
      "pending.logout": "Log out",

      "hero.kicker": "★ Order together",
      "hero.titleLine1": "One person orders.",
      "hero.titleLine2": "The whole club",
      "hero.titleLine3": "saves.",
      "hero.copy": "With a <strong>group order</strong> we bundle all orders from one supplier until the deadline — one shipment, lower costs, more for the club.",
      "hero.ctaActive": "Go to the active group order →",
      "hero.howtoToggle": "How it works",
      "hero.runningNow": "Running now",
      "hero.step1Title": "Join the order",
      "hero.step1Text": "Pick an active group order from your supplier.",
      "hero.step2Title": "Choose items",
      "hero.step2Text": "Add your items to the shared cart before the deadline.",
      "hero.step3Title": "Order in bulk",
      "hero.step3Text": "After the deadline everything ships in one combined delivery.",
      "hero.emptyText": "No group order is running right now.<br>Start the next one for your supplier.",
      "hero.createBtn": "+ Start group order",
      "hero.endsOn": "Ends on {date}",
      "hero.endsIn": "Ends in",
      "hero.join": "Join",

      "sticky.cta": "Go to group order →",
      "sticky.label": "Group order “{name}” · {time} left →",

      "sidebar.shop": "Shop",
      "sidebar.filter": "Filter",
      "sidebar.category": "Category",
      "sidebar.supplier": "Supplier",
      "sidebar.brand": "Brand",
      "sidebar.reset": "Reset filters",
      "topbar.assortment": "Range",
      "topbar.availableItems": "Available items",
      "filter.openAria": "Open filter",
      "filter.closeAria": "Close filter",
      "filter.label": "Filter",
      "filter.apply": "Apply",
      "products.empty": "No products for these filters.",
      "products.loadError": "Error loading products: {msg}",
      "products.none": "No products available yet.",
      "products.noImage": "No image",

      "product.addToCart": "Add to cart",
      "product.qty": "Qty",
      "product.selectSize": "Please select a size first.",
      "product.validQty": "Please enter a valid quantity.",
      "product.removeAria": "Remove product",
      "product.removeCartAria": "Remove product from cart",
      "product.removeTitle": "Remove",
      "cart.title": "Cart",
      "cart.closeAria": "Close cart",
      "cart.checkout": "Go to order summary →",
      "cart.totalLabel": "Total",
      "cart.sizeColon": "Size: {code}",
      "cart.qtyColon": "Qty: {n}",
      "cart.emptyYet": "Your cart is still empty.",
      "cart.emptyInGroup": "No products in this group order yet.",
      "cart.loadError": "Error loading: {msg}",
      "cart.loadCartError": "Error loading the cart: {msg}",
      "cart.checkError": "Error checking the cart: {msg}",
      "cart.updateError": "Error updating the cart: {msg}",
      "cart.saveError": "Error saving to the cart: {msg}",
      "cart.removeError": "Error removing: {msg}",
      "cart.added": "Product added to cart.",
      "cart.removed": "Product removed from cart.",
      "cart.addedToGroup": "Product added to the group order.",
      "cart.loginRequired": "You must be logged in.",
      "cart.error": "Error: {msg}",

      "checkout.back": "Back to shop",
      "checkout.step": "Step 2 of 2",
      "checkout.title": "Order summary",
      "checkout.groupLabel": "Group order",
      "checkout.cartArea": "Cart",
      "checkout.cartEmpty": "Your cart is empty.",
      "checkout.orderArea": "My order",
      "checkout.orderEmpty": "You haven't added any items to the order yet.",
      "checkout.summary": "Summary",
      "checkout.items": "Items",
      "checkout.total": "Total",
      "checkout.submit": "Place order",
      "checkout.update": "Update order",
      "checkout.sizeHeader": "Size",
      "checkout.qtyHeader": "Qty",
      "checkout.priceHeader": "Price",
      "checkout.noSize": "No size",
      "checkout.qtyDecAria": "Decrease quantity",
      "checkout.qtyIncAria": "Increase quantity",
      "checkout.removePosAria": "Remove item",
      "checkout.loadError": "Error loading: {msg}",

      "order.cartEmpty": "Your cart is empty.",
      "order.error": "Error: {msg}",
      "order.errorUnknown": "Unknown",
      "order.saveError": "Error saving: {msg}",
      "order.mailFailed": "Order saved (ID: {id}), email failed.",
      "order.savedNotCleared": "Saved, but cart not cleared: {msg}",
      "order.success": "Order successful. ID: {id}",
      "order.updated": "Order updated.",
      "order.addedToGroup": "Added to the group order.",
      "order.noToken": "No access token.",

      "go.confirmLoadError": "Error loading: {msg}",
      "go.confirmCheckError": "Error checking existing items: {msg}",
      "go.mergeError": "Error merging: {msg}",
      "go.cleanupError": "Error cleaning up the cart line: {msg}",
      "go.addToOrderError": "Error adding to the order: {msg}",
      "go.deleteError": "Error deleting: {msg}",
      "go.updateError": "Error updating: {msg}",

      "dialog.savedAria": "Order saved",
      "dialog.savedTitle": "Order saved",
      "dialog.updatedTitle": "Order updated",
      "dialog.savedMsg": "Your items were added to the group order <strong>{name}</strong>.",
      "dialog.updatedMsg": "Your changes were saved in the group order <strong>{name}</strong>.",
      "dialog.goToGroup": "Go to group order",
      "dialog.closeGroup": "Close group order",

      "go.defaultName": "Group order",
      "go.createBtn": "+ Start group order",
      "go.countActive": "{n} group orders active",
      "go.openBtn": "Go to group order",
      "go.newBtn": "+ New",
      "go.signalLabel": "Group order",
      "go.leave": "Leave",
      "go.supplierLogoAlt": "Supplier logo",
      "go.panelTitle": "Group orders",
      "go.back": "Back",
      "go.closeAria": "Close",
      "go.activeOrders": "Active orders",
      "go.endsOn": "Ends on {date}",
      "go.join": "Join",
      "go.joined": "Joined ✓",
      "go.leaveBtn": "Leave",
      "go.gotoGroup": "→ Go to group order",
      "go.editAria": "Edit",
      "go.editOnlyCreator": "Only the creator can change the deadline",
      "go.none": "No active group orders.",
      "go.newOrder": "New group order",
      "go.supplier": "Supplier",
      "go.loadingOption": "— loading …",
      "go.deadline": "Deadline",
      "go.createSubmit": "Create group order",
      "go.loadFailedOption": "Error loading",
      "go.noActiveSuppliers": "No active suppliers",
      "go.pleaseSelect": "Please choose …",
      "go.alreadyActive": "(already active)",
      "go.supplierBlocked": "There is already an open group order for “{name}”.",
      "go.selectSupplier": "Please choose a supplier.",
      "go.enterDeadline": "Please enter a deadline.",
      "go.deadlineFuture": "The deadline must be in the future.",
      "go.checkErrorPrefix": "Validation error: {msg}",
      "go.notLoggedIn": "Not logged in.",
      "go.createError": "Error creating: {msg}",
      "go.editTitle": "Edit group order",
      "go.cancel": "Cancel",
      "go.save": "Save",
      "go.editError": "Error: {msg}",
      "go.leaveDeadlinePassed": "Deadline passed. Leaving is no longer possible.",
      "go.leaveError": "Error leaving: {msg}",

      "mo.title": "My orders",
      "mo.loading": "Loading …",
      "mo.noUser": "No logged-in user found.",
      "mo.loadError": "Error loading: {msg}",
      "mo.intro": "All your individual and group orders with status and items.",
      "mo.none": "No orders yet.",
      "mo.groupOrder": "Group order",
      "mo.singleOrder": "Individual order",
      "mo.itemsCount": "{n} items",
      "mo.sumNetto": "Total (net): {price}",
      "mo.sizeShort": "(size {code})",
      "status.submitted": "Received",
      "status.processing": "Processing",
      "status.ordered": "Ordered",
      "status.shipped": "Shipped",
      "status.completed": "Completed",
      "status.cancelled": "Cancelled",

      "account.title": "Account",
      "account.intro": "Manage your personal details and delivery address here.",
      "account.note": "Name and email were set during registration. To change them, contact the board.",
      "account.deliveryAddress": "Delivery address",
      "account.deliverySub": "Where your orders are delivered.",
      "account.discard": "Discard",
      "account.save": "Save",
      "account.saving": "Saving …",
      "account.org": "Organisation",
      "account.person": "Person",
      "account.accountTypeLabel": "Account type",
      "account.club": "Club",
      "account.loadingData": "Loading data …",
      "account.noUser": "No logged-in user found.",
      "account.noUserShort": "No logged-in user.",
      "account.loadError": "Error loading: {msg}",
      "account.fillAll": "Please fill in all fields.",
      "account.saveError": "Error saving: {msg}",
      "account.saved": "Address saved successfully.",

      "cd.ended": "ended",
      "cd.remainingPrefix": "{time} left",
      "cd.days": "d",
      "cd.hours": "h",
      "cd.minutes": "m",
      "cd.seconds": "s",

      "common.product": "Product",
    },

    ar: {
      "meta.title": "Roter Stern BS · منتجات النادي",
      "meta.description": "متجر النادي والطلبات الجماعية لأعضاء النادي.",
      "header.subtitle": "النادي · المنتجات",
      "nav.shop": "المتجر",
      "nav.groupOrders": "الطلبات الجماعية",

      "theme.label": "اختر نظام الألوان",
      "theme.auto": "تلقائي",
      "theme.autoTitle": "تلقائي (النظام)",
      "theme.lightAria": "المظهر الفاتح",
      "theme.lightTitle": "فاتح",
      "theme.darkAria": "المظهر الداكن",
      "theme.darkTitle": "داكن",

      "lang.label": "اختر اللغة",
      "lang.deTitle": "Deutsch",
      "lang.enTitle": "English",
      "lang.arTitle": "العربية",
      "settings.language": "اللغة",
      "settings.theme": "المظهر",

      "cart.openAria": "فتح السلة",
      "user.menuOpenAria": "فتح قائمة المستخدم",
      "user.myOrders": "طلباتي",
      "user.myGroupOrders": "طلباتي الجماعية",
      "user.account": "بيانات الحساب",
      "user.accountSub": "الملف الشخصي · تعديل العنوان",
      "user.logout": "تسجيل الخروج",

      "login.welcome": "مرحباً",
      "login.sub": "سجّل الدخول لعرض الطلب الجماعي.",
      "login.email": "البريد الإلكتروني",
      "login.emailPh": "name@example.com",
      "login.password": "كلمة المرور",
      "login.passwordPh": "كلمة المرور",
      "login.submit": "تسجيل الدخول",
      "login.or": "أو",
      "login.signup": "إنشاء حساب جديد",
      "login.loggingIn": "جارٍ تسجيل الدخول…",
      "login.enterCredentials": "يرجى إدخال البريد الإلكتروني وكلمة المرور.",
      "login.noSession": "تم تسجيل الدخول بنجاح، لكن لم يتم العثور على جلسة.",
      "login.logoutError": "خطأ أثناء تسجيل الخروج: {msg}",

      "reg.title": "إنشاء حساب",
      "reg.sub": "املأ جميع الحقول المطلوبة. سيتم تفعيل حسابك من قِبل المشرف بعد التسجيل.",
      "reg.accountType": "نوع الحساب",
      "reg.person": "فرد",
      "reg.org": "مؤسسة",
      "reg.firstName": "الاسم الأول",
      "reg.firstNamePh": "محمد",
      "reg.lastName": "اسم العائلة",
      "reg.lastNamePh": "مثال",
      "reg.email": "البريد الإلكتروني",
      "reg.emailPh": "name@example.com",
      "reg.password": "كلمة المرور",
      "reg.passwordPh": "6 أحرف على الأقل",
      "reg.street": "الشارع",
      "reg.streetPh": "شارع المثال",
      "reg.house": "رقم",
      "reg.housePh": "12",
      "reg.postal": "الرمز البريدي",
      "reg.postalPh": "13121",
      "reg.city": "المدينة",
      "reg.cityPh": "مدينة المثال",
      "reg.orgData": "بيانات النادي",
      "reg.orgName": "اسم النادي",
      "reg.orgNamePh": "نادي المثال",
      "reg.orgStreet": "مقر النادي (الشارع)",
      "reg.orgStreetPh": "طريق المثال",
      "reg.orgHouse": "رقم",
      "reg.orgHousePh": "161",
      "reg.orgPostal": "الرمز البريدي",
      "reg.orgPostalPh": "13121",
      "reg.orgCity": "المدينة",
      "reg.orgCityPh": "مدينة المثال",
      "reg.registerNumber": "رقم سجل النادي",
      "reg.registerNumberPh": "VR 12345",
      "reg.orgEmail": "البريد الإلكتروني للنادي",
      "reg.orgEmailPh": "info@club.com",
      "reg.submit": "تسجيل",
      "reg.backToLogin": "العودة إلى تسجيل الدخول",
      "reg.fillRequired": "يرجى ملء جميع الحقول المطلوبة.",
      "reg.fillOrg": "يرجى ملء جميع بيانات النادي.",
      "reg.registering": "جارٍ التسجيل…",
      "reg.emailExists": "هذا البريد الإلكتروني مسجّل بالفعل.",
      "reg.success": "تم التسجيل بنجاح! يرجى تأكيد بريدك الإلكتروني. بعد ذلك سيتم تفعيل حسابك من قِبل المشرف.",
      "reg.successShort": "تم التسجيل بنجاح. يرجى تأكيد بريدك الإلكتروني.",

      "pending.title": "الحساب قيد المراجعة",
      "pending.sub": "تم تسجيلك بنجاح. سيقوم المشرف بتفعيل حسابك قريباً. سيتم تحويلك تلقائياً بمجرد الموافقة على حسابك.",
      "pending.logout": "تسجيل الخروج",

      "hero.kicker": "★ اطلبوا معاً",
      "hero.titleLine1": "شخص واحد يطلب.",
      "hero.titleLine2": "والنادي بأكمله",
      "hero.titleLine3": "يوفّر.",
      "hero.copy": "في <strong>الطلب الجماعي</strong> نجمع كل الطلبات من مورّد واحد حتى الموعد النهائي — شحنة واحدة، تكاليف أقل، والمزيد لصالح النادي.",
      "hero.ctaActive": "← إلى الطلب الجماعي النشط",
      "hero.howtoToggle": "كيف يعمل",
      "hero.runningNow": "نشط الآن",
      "hero.step1Title": "انضم إلى الطلب",
      "hero.step1Text": "اختر طلباً جماعياً نشطاً من مورّدك.",
      "hero.step2Title": "اختر المنتجات",
      "hero.step2Text": "أضف منتجاتك إلى السلة المشتركة قبل الموعد النهائي.",
      "hero.step3Title": "اطلبوا معاً",
      "hero.step3Text": "بعد الموعد النهائي يتم شحن كل شيء في شحنة واحدة مجمّعة.",
      "hero.emptyText": "لا يوجد طلب جماعي نشط حالياً.<br>ابدأ الطلب التالي لمورّدك.",
      "hero.createBtn": "+ بدء طلب جماعي",
      "hero.endsOn": "ينتهي في {date}",
      "hero.endsIn": "ينتهي خلال",
      "hero.join": "انضمام",

      "sticky.cta": "← إلى الطلب الجماعي",
      "sticky.label": "← الطلب الجماعي «{name}» · متبقٍّ {time}",

      "sidebar.shop": "المتجر",
      "sidebar.filter": "تصفية",
      "sidebar.category": "الفئة",
      "sidebar.supplier": "المورّد",
      "sidebar.brand": "العلامة التجارية",
      "sidebar.reset": "إعادة ضبط التصفية",
      "topbar.assortment": "التشكيلة",
      "topbar.availableItems": "المنتجات المتاحة",
      "filter.openAria": "فتح التصفية",
      "filter.closeAria": "إغلاق التصفية",
      "filter.label": "تصفية",
      "filter.apply": "تطبيق",
      "products.empty": "لا توجد منتجات لهذه التصفية.",
      "products.loadError": "خطأ في تحميل المنتجات: {msg}",
      "products.none": "لا توجد منتجات بعد.",
      "products.noImage": "لا توجد صورة",

      "product.addToCart": "أضف إلى السلة",
      "product.qty": "الكمية",
      "product.selectSize": "يرجى اختيار المقاس أولاً.",
      "product.validQty": "يرجى إدخال كمية صحيحة.",
      "product.removeAria": "إزالة المنتج",
      "product.removeCartAria": "إزالة المنتج من السلة",
      "product.removeTitle": "إزالة",
      "cart.title": "السلة",
      "cart.closeAria": "إغلاق السلة",
      "cart.checkout": "← إلى ملخّص الطلب",
      "cart.totalLabel": "الإجمالي",
      "cart.sizeColon": "المقاس: {code}",
      "cart.qtyColon": "الكمية: {n}",
      "cart.emptyYet": "سلتك فارغة حتى الآن.",
      "cart.emptyInGroup": "لا توجد منتجات في هذا الطلب الجماعي بعد.",
      "cart.loadError": "خطأ في التحميل: {msg}",
      "cart.loadCartError": "خطأ في تحميل السلة: {msg}",
      "cart.checkError": "خطأ في التحقق من السلة: {msg}",
      "cart.updateError": "خطأ في تحديث السلة: {msg}",
      "cart.saveError": "خطأ في الحفظ إلى السلة: {msg}",
      "cart.removeError": "خطأ في الإزالة: {msg}",
      "cart.added": "تمت إضافة المنتج إلى السلة.",
      "cart.removed": "تمت إزالة المنتج من السلة.",
      "cart.addedToGroup": "تمت إضافة المنتج إلى الطلب الجماعي.",
      "cart.loginRequired": "يجب تسجيل الدخول.",
      "cart.error": "خطأ: {msg}",

      "checkout.back": "العودة إلى المتجر",
      "checkout.step": "الخطوة 2 من 2",
      "checkout.title": "ملخّص الطلب",
      "checkout.groupLabel": "طلب جماعي",
      "checkout.cartArea": "السلة",
      "checkout.cartEmpty": "سلتك فارغة.",
      "checkout.orderArea": "طلبي",
      "checkout.orderEmpty": "لم تُضِف أي منتجات إلى الطلب بعد.",
      "checkout.summary": "الملخّص",
      "checkout.items": "المنتجات",
      "checkout.total": "الإجمالي",
      "checkout.submit": "إرسال الطلب",
      "checkout.update": "تحديث الطلب",
      "checkout.sizeHeader": "المقاس",
      "checkout.qtyHeader": "الكمية",
      "checkout.priceHeader": "السعر",
      "checkout.noSize": "بدون مقاس",
      "checkout.qtyDecAria": "إنقاص الكمية",
      "checkout.qtyIncAria": "زيادة الكمية",
      "checkout.removePosAria": "إزالة العنصر",
      "checkout.loadError": "خطأ في التحميل: {msg}",

      "order.cartEmpty": "سلتك فارغة.",
      "order.error": "خطأ: {msg}",
      "order.errorUnknown": "غير معروف",
      "order.saveError": "خطأ في الحفظ: {msg}",
      "order.mailFailed": "تم حفظ الطلب (المعرّف: {id})، لكن فشل إرسال البريد الإلكتروني.",
      "order.savedNotCleared": "تم الحفظ، لكن لم يتم إفراغ السلة: {msg}",
      "order.success": "تم الطلب بنجاح. المعرّف: {id}",
      "order.updated": "تم تحديث الطلب.",
      "order.addedToGroup": "تمت الإضافة إلى الطلب الجماعي.",
      "order.noToken": "لا يوجد رمز وصول.",

      "go.confirmLoadError": "خطأ في التحميل: {msg}",
      "go.confirmCheckError": "خطأ في التحقق من العناصر الموجودة: {msg}",
      "go.mergeError": "خطأ في الدمج: {msg}",
      "go.cleanupError": "خطأ في تنظيف سطر السلة: {msg}",
      "go.addToOrderError": "خطأ في الإضافة إلى الطلب: {msg}",
      "go.deleteError": "خطأ في الحذف: {msg}",
      "go.updateError": "خطأ في التحديث: {msg}",

      "dialog.savedAria": "تم حفظ الطلب",
      "dialog.savedTitle": "تم حفظ الطلب",
      "dialog.updatedTitle": "تم تحديث الطلب",
      "dialog.savedMsg": "تمت إضافة منتجاتك إلى الطلب الجماعي <strong>{name}</strong>.",
      "dialog.updatedMsg": "تم حفظ تغييراتك في الطلب الجماعي <strong>{name}</strong>.",
      "dialog.goToGroup": "إلى الطلب الجماعي",
      "dialog.closeGroup": "إغلاق الطلب الجماعي",

      "go.defaultName": "طلب جماعي",
      "go.createBtn": "+ بدء طلب جماعي",
      "go.countActive": "{n} طلبات جماعية نشطة",
      "go.openBtn": "إلى الطلب الجماعي",
      "go.newBtn": "+ جديد",
      "go.signalLabel": "طلب جماعي",
      "go.leave": "مغادرة",
      "go.supplierLogoAlt": "شعار المورّد",
      "go.panelTitle": "الطلبات الجماعية",
      "go.back": "رجوع",
      "go.closeAria": "إغلاق",
      "go.activeOrders": "الطلبات النشطة",
      "go.endsOn": "ينتهي في {date}",
      "go.join": "انضمام",
      "go.joined": "منضم ✓",
      "go.leaveBtn": "انسحاب",
      "go.gotoGroup": "← إلى الطلب الجماعي",
      "go.editAria": "تعديل",
      "go.editOnlyCreator": "يمكن للمُنشئ فقط تغيير الموعد النهائي",
      "go.none": "لا توجد طلبات جماعية نشطة.",
      "go.newOrder": "طلب جماعي جديد",
      "go.supplier": "المورّد",
      "go.loadingOption": "— جارٍ التحميل …",
      "go.deadline": "الموعد النهائي",
      "go.createSubmit": "إنشاء طلب جماعي",
      "go.loadFailedOption": "خطأ في التحميل",
      "go.noActiveSuppliers": "لا يوجد مورّدون نشطون",
      "go.pleaseSelect": "يرجى الاختيار …",
      "go.alreadyActive": "(نشط بالفعل)",
      "go.supplierBlocked": "يوجد بالفعل طلب جماعي مفتوح لـ «{name}».",
      "go.selectSupplier": "يرجى اختيار مورّد.",
      "go.enterDeadline": "يرجى تحديد موعد نهائي.",
      "go.deadlineFuture": "يجب أن يكون الموعد النهائي في المستقبل.",
      "go.checkErrorPrefix": "خطأ في التحقق: {msg}",
      "go.notLoggedIn": "غير مسجّل الدخول.",
      "go.createError": "خطأ في الإنشاء: {msg}",
      "go.editTitle": "تعديل الطلب الجماعي",
      "go.cancel": "إلغاء",
      "go.save": "حفظ",
      "go.editError": "خطأ: {msg}",
      "go.leaveDeadlinePassed": "انتهى الموعد النهائي. لم يعد الانسحاب ممكناً.",
      "go.leaveError": "خطأ في الانسحاب: {msg}",

      "mo.title": "طلباتي",
      "mo.loading": "جارٍ التحميل …",
      "mo.noUser": "لم يتم العثور على مستخدم مسجّل الدخول.",
      "mo.loadError": "خطأ في التحميل: {msg}",
      "mo.intro": "جميع طلباتك الفردية والجماعية مع الحالة والعناصر.",
      "mo.none": "لا توجد طلبات بعد.",
      "mo.groupOrder": "طلب جماعي",
      "mo.singleOrder": "طلب فردي",
      "mo.itemsCount": "{n} منتجات",
      "mo.sumNetto": "الإجمالي (صافي): {price}",
      "mo.sizeShort": "(مقاس {code})",
      "status.submitted": "تم الاستلام",
      "status.processing": "قيد المعالجة",
      "status.ordered": "تم الطلب",
      "status.shipped": "تم الشحن",
      "status.completed": "مكتمل",
      "status.cancelled": "ملغى",

      "account.title": "بيانات الحساب",
      "account.intro": "أدر بياناتك الشخصية وعنوان التسليم هنا.",
      "account.note": "تم تحديد الاسم والبريد الإلكتروني أثناء التسجيل. لتغييرهما، تواصل مع الإدارة.",
      "account.deliveryAddress": "عنوان التسليم",
      "account.deliverySub": "المكان الذي تُسلَّم إليه طلباتك.",
      "account.discard": "تجاهل",
      "account.save": "حفظ",
      "account.saving": "جارٍ الحفظ …",
      "account.org": "مؤسسة",
      "account.person": "فرد",
      "account.accountTypeLabel": "نوع الحساب",
      "account.club": "النادي",
      "account.loadingData": "جارٍ تحميل البيانات …",
      "account.noUser": "لم يتم العثور على مستخدم مسجّل الدخول.",
      "account.noUserShort": "لا يوجد مستخدم مسجّل الدخول.",
      "account.loadError": "خطأ في التحميل: {msg}",
      "account.fillAll": "يرجى ملء جميع الحقول.",
      "account.saveError": "خطأ في الحفظ: {msg}",
      "account.saved": "تم حفظ العنوان بنجاح.",

      "cd.ended": "انتهى",
      "cd.remainingPrefix": "متبقٍّ {time}",
      "cd.days": "يوم",
      "cd.hours": "س",
      "cd.minutes": "د",
      "cd.seconds": "ث",

      "common.product": "منتج",
    },
  };

  // ----------------------------------------------------------
  // STATE
  // ----------------------------------------------------------
  function detectLanguage() {
    try {
      const stored = localStorage.getItem(LS_KEY);
      if (stored && LANGS.includes(stored)) return stored;
    } catch (e) {}
    const cands = (navigator.languages && navigator.languages.length)
      ? navigator.languages
      : [navigator.language || navigator.userLanguage || "de"];
    for (const c of cands) {
      const base = String(c).toLowerCase().split("-")[0];
      if (LANGS.includes(base)) return base;
    }
    return "de";
  }

  let currentLang = detectLanguage();

  // ----------------------------------------------------------
  // ÜBERSETZEN
  // ----------------------------------------------------------
  function t(key, vars) {
    const table = DICT[currentLang] || DICT.de;
    let str = table[key];
    if (str == null) str = DICT.de[key];
    if (str == null) return key;
    if (vars) {
      str = str.replace(/\{(\w+)\}/g, (m, name) =>
        (vars[name] != null ? String(vars[name]) : m));
    }
    return str;
  }

  function i18nLocale() { return LOCALES[currentLang] || "de-DE"; }
  function getLanguage() { return currentLang; }
  function isRtl(lang) { return RTL.has(lang || currentLang); }

  // ----------------------------------------------------------
  // DOM-DURCHLAUF (data-i18n / data-i18n-html / data-i18n-attr)
  // ----------------------------------------------------------
  function translateTree(root) {
    const scope = root || document;

    scope.querySelectorAll("[data-i18n]").forEach((el) => {
      el.textContent = t(el.getAttribute("data-i18n"));
    });

    scope.querySelectorAll("[data-i18n-html]").forEach((el) => {
      el.innerHTML = t(el.getAttribute("data-i18n-html"));
    });

    // Format: "placeholder:login.emailPh;aria-label:cart.openAria"
    scope.querySelectorAll("[data-i18n-attr]").forEach((el) => {
      el.getAttribute("data-i18n-attr").split(";").forEach((pair) => {
        const idx = pair.indexOf(":");
        if (idx === -1) return;
        const attr = pair.slice(0, idx).trim();
        const key  = pair.slice(idx + 1).trim();
        if (attr && key) el.setAttribute(attr, t(key));
      });
    });
  }

  // ----------------------------------------------------------
  // ANWENDEN / UMSCHALTEN
  // ----------------------------------------------------------
  function applyDocumentLang() {
    const html = document.documentElement;
    html.setAttribute("lang", currentLang);
    html.setAttribute("dir", isRtl() ? "rtl" : "ltr");
    document.title = t("meta.title");
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", t("meta.description"));
  }

  function updateSwitcherUI() {
    document.querySelectorAll("[data-lang-choice]").forEach((btn) => {
      const on = btn.getAttribute("data-lang-choice") === currentLang;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-pressed", String(on));
    });
  }

  function setLanguage(lang) {
    if (!LANGS.includes(lang)) return;
    currentLang = lang;
    try { localStorage.setItem(LS_KEY, lang); } catch (e) {}
    applyDocumentLang();
    translateTree(document);
    updateSwitcherUI();
    document.dispatchEvent(new CustomEvent("i18n:changed", { detail: { lang } }));
  }

  function wireSwitcher() {
    document.querySelectorAll("[data-lang-choice]").forEach((btn) => {
      btn.addEventListener("click", () => setLanguage(btn.getAttribute("data-lang-choice")));
    });
    updateSwitcherUI();
  }

  function onLangChange(cb) { document.addEventListener("i18n:changed", cb); }

  // ----------------------------------------------------------
  // EXPORT
  // ----------------------------------------------------------
  window.t            = t;
  window.i18nT        = t;
  window.setLanguage  = setLanguage;
  window.getLanguage  = getLanguage;
  window.i18nLocale   = i18nLocale;
  window.i18nIsRtl    = isRtl;
  window.translateTree = translateTree;
  window.onLangChange = onLangChange;

  // ----------------------------------------------------------
  // INIT — lang/dir sofort setzen (Flash vermeiden), Rest bei DOM-ready
  // ----------------------------------------------------------
  applyDocumentLang();

  function init() {
    applyDocumentLang();
    translateTree(document);
    wireSwitcher();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
