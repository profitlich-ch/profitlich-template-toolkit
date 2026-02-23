# CLAUDE.md – Entwicklungskonventionen

Zwei Template-Projekte teilen sich `@profitlich/template-toolkit` als npm-Paket für SCSS, JS-Utilities und Build-Skripte. Dieses Repo: Craft CMS. Schwester-Repo: `template-kirbycms` mit Kirby. Toolkit lokal unter `~/Profitlich/F Lokal/profitlich-template-toolkit`.

## Stack

- **ddev** – lokale Entwicklungsumgebung
- **npm immer über ddev** aufrufen: `ddev npm run dev`, `ddev npm install` etc.
- **Vite** – Build-Tool für JS und SCSS

## Git

- Dateien immer mit `git mv` umbenennen/verschieben, nie kopieren+löschen
- **Branches und Commits** werden ausschliesslich vom Entwickler erstellt, nie von Claude
- Commit-Messages auf Deutsch, kurz, beschreiben was geändert wurde (nicht warum)

## Toolkit vs. Projekt

Code gehört ins **Toolkit**, wenn er in mehr als einem Projekt verwendet wird oder werden könnte und keine projektspezifischen Pfade oder Inhalte enthält. Bei Toolkit-Änderungen: Version bumpen → publishen → hier in `package.json` updaten.

Code bleibt im **Projekt**, wenn er projektspezifische Pfade, CSS-Klassen oder CMS-Eigenheiten enthält.

## JavaScript

- **Klassen bevorzugen** mit private Fields per `#`-Prefix – nie Underscore-Konvention (`_field`)
- **Singleton-Pattern** für Utilities, die global einmalig sind (analog zu `MediaQueries`, `MenuToggle`)
- **Design Patterns:** Vor der Implementierung das passende Pattern vorschlagen und begründen – nicht immer ist Singleton richtig
- **Kommentare** dokumentieren Funktion und Zweck – keine Änderungshistorie im Code

## Custom Events und Data-Attributes

- Zustandskommunikation zwischen Komponenten über `CustomEvent`, nicht direkte Methodenaufrufe
- Event-Namenskonvention: `event` + PascalCase → `eventMenuStatus`, `eventBodyScrolled`
- DOM-Zustand per `data-*`-Attribut, nie als CSS-Klassen-Toggle: `document.body.setAttribute('data-menu-active', 'true')`

## SCSS

- Nie direkte `px`-, `vw`- oder `rem`-Werte – ausschliesslich Toolkit-Funktionen: `size()`, `columns()`, `font()`, `marginPadding()`
- `src/config.json` ist die einzige Quelle für Breakpoints, Layouts, Farben – nie im Code hardcodieren
- Jedes Modul/Snippet hat eine eigene `.js`-Datei, die das zugehörige SCSS importiert – auch wenn sie sonst keine Logik enthält
- Keine globalen Styles in Modul- oder Snippet-SCSS-Dateien

## Vite Entry

Einen neuen Entry in `rollupOptions.input` eintragen **nur wenn** das Script per Twig/PHP-Tag direkt eingebunden wird. Wird es von einem anderen Script importiert, braucht es keinen eigenen Entry.

## Bilder

Kein `lazysizes`. Ausschliesslich natives `loading="lazy"`.

## CSP Nonce (Craft CMS)

Beim `craft.vite.script()`-Aufruf immer den Nonce mitgeben:

```twig
{{ craft.vite.script("src/modules/module-name/Module.js", false, { 'nonce': csp('script-src') }) }}
```
