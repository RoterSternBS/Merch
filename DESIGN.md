# Designsystem — Vereinsshop

Alle Farben werden zentral in [tokens.css](tokens.css) gesteuert. Die drei
Designrichtungen basieren auf den Vereinsfarben:

| Farbe | Hex | Rolle |
|---|---|---|
| Rot | `#FF0000` | Energie, Call-to-Action |
| Blau | `#2A3398` | Vertrauen, Gemeinschaft (Sammelbestellungen) |
| Navy/Dunkelviolett | `#190933` | Tiefe, Basis |

---

## Variante 1 — „Fight Night" ✅ (implementiert)

**Farbverwendung**
- Hintergrund/Flächen: dunkles Navy-Violett, abgeleitet aus `#190933`
  (`--bg: #0d0819`, Karten `#171029` bis `#2e224f`)
- Primär-CTAs (Kaufen, Login, Bestellen): Rot `#ff1f30` (aus `#FF0000`
  minimal entschärft, damit es auf dunklem Grund nicht flimmert), Text weiß
- Preise/Summen: helles Rot `#ff8791` — auf dunklem Grund deutlich besser
  lesbar als Vollrot (WCAG-Kontrast > 4,5:1)
- Sammelbestellungen (GO): Vereinsblau `#2A3398` für Buttons, helles Blau
  `#8f9dff` für Texte, Banner und Rahmen
- Fokus-Ringe: Blau statt Rot — rote Fokus-Ringe wirken wie Fehlermeldungen

**Stil:** Dunkel, kontraststark, sportlich. Produktfotos bleiben auf hellem
Bildgrund (`#f3f3f3`) und stechen dadurch hervor.

**Zielwirkung:** Kampfsport-Atmosphäre („Fight Night"), moderner
Mitgliederbereich-Charakter, angenehm bei abendlicher Nutzung auf dem Handy.

**Einsatzempfehlung:** Standard für den Mitglieder-Shop. Rot ist exklusiv
für Aktionen reserviert (klare Handlungsführung), Blau markiert durchgehend
alles rund um Sammelbestellungen — die zwei Bedeutungsebenen sind farblich
strikt getrennt.

---

## Variante 2 — „Vereinsheim" (helle Alternative, dokumentiert)

**Farbverwendung** (Token-Set zum Einwechseln in `tokens.css`):

```css
:root {
  --bg:            #f6f6fa;
  --surface:       #ffffff;
  --surface-2:     #f1f0f7;
  --surface-3:     #e8e6f2;
  --surface-4:     #dedbec;
  --surface-glass: rgba(255, 255, 255, 0.85);
  --text:          #190933;   /* Navy als Textfarbe */
  --muted:         #5f5878;
  --faint:         #a9a3c0;
  --accent:        #d90f1f;   /* Rot, für hellen Grund abgedunkelt */
  --accent-hover:  #b90d1a;
  --accent-text:   #b90d1a;
  --accent-contrast: #ffffff;
  --go-accent:     #2a3398;
  --go-accent-btn: #2a3398;
  --go-accent-btn-hover: #1f2775;
  --border:        rgba(25, 9, 51, 0.10);
  --border-strong: rgba(25, 9, 51, 0.18);
}
```

Zusätzlich müsste `color-scheme: dark` in `style.css` auf `light` geändert
und die Schatten-Tokens abgeschwächt werden.

**Stil:** Hell, freundlich, „Schwarzes Brett im Vereinsheim".
**Zielwirkung:** Maximale Lesbarkeit bei Tageslicht, niedrige Einstiegshürde
für ältere Mitglieder.
**Einsatzempfehlung:** Falls Rückmeldungen kommen, dass der dunkle Shop
draußen/tagsüber schlecht ablesbar ist — oder als automatische
`prefers-color-scheme: light`-Variante.

---

## Variante 3 — „Ring Corner" (plakative Alternative, dokumentiert)

**Farbverwendung:**
- Neutrale, fast schwarze Basis (`#0b0b0d`) statt Navy — Navy `#190933`
  wandert in großflächige Akzente: Header-Verlauf
  (`linear-gradient(135deg, #190933, #2A3398)`), Hero-/Bannerflächen
- Rot `#FF0000` unverdünnt als schmale Signalkante (Header-Unterlinie,
  aktive Tabs, Badges) — wie die rote Ringecke
- Blau bleibt GO-Farbe wie in Variante 1

**Stil:** Merch-Drop-Ästhetik, laut, jugendlich; große Typo
(`--text-2xl` hochskaliert), diagonale Schnittkanten via `clip-path`.
**Zielwirkung:** Hype-Gefühl bei neuen Kollektionen, starke Markenwirkung.
**Einsatzempfehlung:** Für Kampagnen/Drops oder als Landingpage-Look.
Für den täglichen Bestellprozess ist Variante 1 ruhiger und ergonomischer —
deshalb nicht als Standard empfohlen.

---

## Warum Variante 1 als Hauptvariante?

1. **Alle drei Vereinsfarben sinnvoll im Einsatz** — Navy als Raum, Rot als
   Handlung, Blau als Gemeinschaftsfunktion.
2. **Klare Bedeutungstrennung** — Nutzer lernen: „Rot = kaufen,
   Blau = Sammelbestellung".
3. **Geringstes Umbaurisiko** — die bestehende Dark-Mode-Architektur
   (Schatten, Glassmorphism-Header, Drawer) bleibt vollständig gültig.
4. **Mobile-first** — dunkle UI spart OLED-Akku und blendet nicht beim
   abendlichen Training.
