# Vereinsshop — Bestellliste

Onlineshop für Vereinsmitglieder (Kampfsportverein) mit Einzelbestellungen
und Sammelbestellungen (Group Orders).

## Stack

- **Frontend:** Vanilla HTML/CSS/JS, kein Build-Schritt
- **Backend:** Supabase (Free Tier) — Auth, Postgres mit Row Level Security,
  Edge Function `resend-email` (Bestell-Mails), pg_cron-Job
  `close-and-flush-expired-go` (schließt abgelaufene Sammelbestellungen stündlich)
- **Hosting:** Cloudflare Worker `roter-stern-bs` (nur statische Assets,
  siehe [wrangler.jsonc](wrangler.jsonc))

## Dateien

| Datei | Aufgabe |
|---|---|
| `index.html` | Alle Views (Auth, Pending, Shop, Checkout, Drawer, Modals) |
| `auth.js` | Supabase-Client, Login/Registrierung/Logout, `auth:changed`-Event |
| `app.js` | Shop: Produkte, Filter, Warenkorb, Drawer, Badge |
| `checkout.js` | Bestellübersicht (Einzel- + GO-Modus), Bestellabschluss |
| `group-order.js` | Sammelbestellungen: Panel, GO-Modus, Realtime |
| `user-dropdown.js` | Benutzermenü + Adressänderung |
| `tokens.css` | **Zentrales Designsystem** (alle Farben/Radien/Spacing) |
| `style.css` | Layout, Header, Shop, Warenkorb, Drawer |
| `auth.css` | Login/Registrierung |
| `panel-base.css` | Generische Fullscreen-Panels |
| `single-checkout.css` / `group-checkout.css` | Checkout-Styles |
| `DESIGN.md` | Die 3 Designrichtungen (1 implementiert, 2 dokumentiert) |

## Lokale Entwicklung

Statischer Server genügt, z. B.:

```bash
npx serve .        # oder
npx wrangler dev   # echte Worker-Umgebung
```

Deployment (nicht automatisiert, bewusst manuell):

```bash
npx wrangler deploy
```

---

# Änderungen Juli 2026 (Branch `Fable_test`)

## Design „Fight Night" (siehe DESIGN.md)

Komplette Farbumstellung auf die Vereinsfarben Rot `#FF0000`,
Blau `#2A3398`, Navy `#190933` — ausschließlich über `tokens.css` plus
Ersetzung der zuvor hartcodierten Amber-/Teal-Werte in den CSS-Dateien:

- Hintergrund & Flächen: Navy-Violett-Skala statt Grau
- CTAs: Rot mit weißem Text (vorher Amber mit dunklem Text)
- Preise/Summen: helles Rot `--accent-text` (Kontrast > 4,5:1)
- Sammelbestellungen: Vereinsblau statt Teal (`--go-*`-Tokens)
- Fokus-Ringe: Blau (`--focus`) — Rot bleibt für Aktionen/Fehler reserviert

## Bugfixes

1. **Filter-Tag-Crash:** Klick auf ein aktives Filter-Tag in der
   Active-Filter-Bar warf `ReferenceError: sourceProducts is not defined`
   (app.js) — Tags ließen sich nicht entfernen. Behoben über neuen Helper
   `currentChipSource()`.
2. **Bild-Fallback defekt:** Die Inline-`onerror`-Handler der Produktbilder
   enthielten die Fallback-Data-URI mit einfachen Anführungszeichen und
   waren dadurch syntaktisch kaputt. Ersetzt durch `error`-Event-Listener.
3. **HTML-Verschachtelung:** Registrierungsformular (Vereinsdaten) und
   Adress-Modal hatten falsch verschachtelte/nicht geschlossene `div`s.
   Zusätzlich waren die Klassen `.form-row`, `.form-divider`, `.org-fields`
   im CSS nie definiert — ergänzt in `auth.css`.
4. **Doppelter Metadaten-Schlüssel** `organization_house_number` in
   `auth.js` (Registrierung) entfernt.
5. **Streu-Zeichen in CSS:** `*`-Reste in `.filter-fab` (style.css) und
   überzählige `}` in tokens.css entfernt.
6. **Registrierungs-Redirect:** Erfolgsmeldung war nur 0,5 s sichtbar,
   Kommentar versprach 2,5 s — auf 2,5 s korrigiert.

## UX-Verbesserungen

- Skeleton-Loading für das Produkt-Grid während des Ladens
- Login-Button mit Ladezustand („Wird angemeldet…")
- `aria-pressed` auf Größen-Buttons, dekoratives Hover-Bild mit leerem `alt`
- Straße/Hausnummer und PLZ/Ort jeweils in einer Zeile (Registrierung
  + Adress-Modal), `minlength="6"` fürs Passwort, `inputmode="numeric"`
  für PLZ-Felder
- `<meta name="theme-color">` und `<meta name="description">`
- Meldungsfarben über Design-Tokens statt hartcodierter Hexwerte

## Supabase-Änderungen (alle Free-Tier-kompatibel, als Migrationen dokumentiert)

| Migration | Inhalt | Risiko |
|---|---|---|
| `fix_check_organization_account_type` | **Bugfix:** Trigger-Funktion referenzierte die nicht existierende Tabelle `public.profiles` (richtig: `user_profiles`) — dadurch schlug **jede Organisations-Registrierung fehl**. | Keines — vorher war die Funktion immer kaputt |
| `pin_function_search_path_and_revoke_public_execute` | `search_path` der Funktionen gepinnt; `EXECUTE` auf die SECURITY-DEFINER-Funktionen für `anon`/`authenticated`/`public` entzogen. Der pg_cron-Job und die Auth-Trigger sind nicht betroffen (geprüft). | Verhaltensneutral |
| `optimize_rls_auth_initplan` | 15 RLS-Policies: `auth.uid()`/`auth.role()` in `(select …)` gewrappt (Auswertung pro Statement statt pro Zeile). | Verhaltensneutral, gleiche Semantik |

**Bewusst NICHT geändert (Empfehlungen):**

- **Leaked Password Protection** aktivieren: Dashboard → Auth → Passwords
  (nicht per SQL möglich)
- Extension `http` liegt im Schema `public` (Advisor-WARN). Verschieben
  würde die Cron-Funktion `close_and_flush_expired_group_orders` brechen
  (`http_post`-Aufruf) — nur zusammen mit Funktionsanpassung sinnvoll.
- `product_variants` ist leer, hat RLS ohne Policies (= komplett gesperrt)
  und wird laut Kommentar/Code nicht genutzt → Kandidat zum Löschen,
  Entscheidung liegt beim Betreiber.
- Unindizierte Foreign Keys (INFO-Level): bei aktuell < 100 Zeilen ohne
  praktische Auswirkung; bei Wachstum Indizes auf
  `cart_items(product_id)`, `group_order_cart(product_id)`,
  `order_items(order_id)` ergänzen.
- Die Registrierung nutzt eine hartcodierte Redirect-URL
  (`https://bestellliste.bastian-jonas.workers.dev/`), der Worker heißt
  aber `roter-stern-bs`. Falls die Domain gewechselt hat: URL in `auth.js`
  (`emailRedirectTo`) anpassen **und** in Supabase unter
  Auth → URL Configuration whitelisten.

## Cloudflare

Keine Änderungen. Der Worker liefert nur statische Assets aus; Deployment
bleibt manuell (`npx wrangler deploy`). Es wurden keine DNS-, Cache- oder
Routing-Einstellungen angefasst und kein Deployment ausgelöst.
