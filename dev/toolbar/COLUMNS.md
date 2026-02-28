# Plan: Exakte Spaltenlinien via Canvas (Variante E)

## Context

Im `lines`-Modus des Dev-Grids werden Spaltenlinien über `linear-gradient` + `background-size` als Kachelmuster erzeugt. Die Kachelbreite löst auf Bruchpixel-Werte auf → die `0.5px`-Gradient-Stops landen an leicht unterschiedlichen physischen Pixeln pro Kachel. Ergebnis: Linien erscheinen wackelnd oder inkonsistent.

**Lösung:** `<canvas>`-Element mit korrekter `devicePixelRatio`-Behandlung und dem "Half-Pixel"-Trick für pixelgenaue, scharf gerenderte Linien. Funktioniert auf 1×- und Retina-Displays gleich gut.

---

## Betroffene Dateien

- [dev/toolbar/Toolbar.js](dev/toolbar/Toolbar.js)
- [dev/toolbar/toolbar.scss](dev/toolbar/toolbar.scss)

---

## Architektur

```text
.dev-toolbar__grid (position: fixed, 100vw×100vh)
└── <canvas>            ← neu, ersetzt ::after für "lines"
::after                 ← bleibt für "ribbons" erhalten
```

Das Canvas-Element wird als Kind von `#gridElement` angehängt. Es erbt dessen Fixed-Positioning und Visibility-Steuerung über `data-dev`. Für den `lines`-Modus zeichnet das Canvas; für `ribbons` wird das Canvas geleert und `::after` übernimmt.

---

## SCSS — `toolbar.scss`

### 1. CSS Custom Properties im Mixin ergänzen

Im Block `body[data-dev='true']` innerhalb von `dev-toolbar-grid`:

```scss
body[data-dev='true'] {
    --dev-columns: #{$columns};        // unitless integer
    --dev-gutter: #{$gutter};          // CSS-Wert (z. B. "1.5rem" oder "20px")
    --dev-margin-left: #{$margin-left};
    --dev-margin-right: #{$margin-right};

    .dev-toolbar__grid::after { ... }  // unverändert
}
```

### 2. `lines`-Gradient entfernen

Den gesamten Block (Zeilen 28–39) entfernen — das Canvas übernimmt die Darstellung:

```scss
// ENTFERNEN:
body[data-dev='true'][data-dev-grid="lines"] {
    .dev-toolbar__grid::after { background: ...; }
}
```

### 3. Canvas-Styling ergänzen

```scss
.dev-toolbar__grid {
    canvas {
        display: block;
        width: 100%;
        height: 100%;
    }
}
```

---

## JavaScript — `Toolbar.js`

### Neue private Fields

```javascript
#gridElement = null;    // bisher nur lokale Variable, jetzt gespeichert
#canvas = null;
#ctx = null;
```

### `constructor()` — Änderungen

1. `gridOverlay` → `this.#gridElement` (Referenz speichern)
2. `#initCanvas()` aufrufen nach `prepend`

```javascript
this.#gridElement = document.createElement('div');
this.#gridElement.classList.add('dev-toolbar__grid');
document.body.prepend(this.#gridElement);
this.#initCanvas();
```

### Neue Methode `#initCanvas()`

```javascript
#initCanvas() {
    this.#canvas = document.createElement('canvas');
    this.#gridElement.appendChild(this.#canvas);
    this.#ctx = this.#canvas.getContext('2d');
}
```

### Neue Methode `#drawGrid()`

Wird aufgerufen bei: State-Wechsel (`#applyState`), Resize (`#onResize`).

```javascript
#drawGrid() {
    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;

    this.#canvas.width  = Math.round(w * dpr);
    this.#canvas.height = Math.round(h * dpr);

    this.#ctx.clearRect(0, 0, this.#canvas.width, this.#canvas.height);

    if (this.#state.grid !== 'lines') return;

    this.#ctx.setTransform(dpr, 0, 0, dpr, 0.5, 0);  // scale + half-pixel shift

    this.#drawColumnLines();
}
```

**Half-pixel-Trick:** `ctx.setTransform(dpr, 0, 0, dpr, 0.5, 0)` — der 0.5px-Shift zentriert 1px-Linien exakt auf physische Pixel bei dpr=1. Bei dpr=2 (Retina) ist 0.5 CSS-px = 1 physischer Pixel, ebenfalls scharf.

### Neue Methode `#drawColumnLines()`

```javascript
#drawColumnLines() {
    const style = getComputedStyle(document.body);
    const columns    = parseInt(style.getPropertyValue('--dev-columns'));
    const gutter     = this.#resolveToPx(style.getPropertyValue('--dev-gutter').trim());
    const marginLeft = this.#resolveToPx(style.getPropertyValue('--dev-margin-left').trim());

    // Kachelbreite = (Viewport - Margins + Gutter) / Spalten
    // (identisch zur background-size-Formel im SCSS)
    const gridWidth = window.innerWidth - marginLeft
        - this.#resolveToPx(style.getPropertyValue('--dev-margin-right').trim())
        + gutter;
    const tileWidth  = gridWidth / columns;
    const colContent = tileWidth - gutter;

    this.#ctx.strokeStyle = 'rgba(0, 0, 255, 0.5)';
    this.#ctx.lineWidth   = 1;
    const h = window.innerHeight;

    for (let i = 0; i < columns; i++) {
        const leftEdge  = marginLeft + i * tileWidth;
        const rightEdge = leftEdge + colContent;

        this.#ctx.beginPath();
        this.#ctx.moveTo(Math.round(leftEdge),  0);
        this.#ctx.lineTo(Math.round(leftEdge),  h);
        this.#ctx.stroke();

        this.#ctx.beginPath();
        this.#ctx.moveTo(Math.round(rightEdge), 0);
        this.#ctx.lineTo(Math.round(rightEdge), h);
        this.#ctx.stroke();
    }
}
```

### Neue Methode `#resolveToPx(cssValue)`

Löst beliebige CSS-Einheiten (rem, vw, calc, …) auf px auf, ohne Unit-Parsing-Logik:

```javascript
#resolveToPx(cssValue) {
    if (/^-?\d+(\.\d+)?px$/.test(cssValue)) return parseFloat(cssValue);

    const probe = document.createElement('div');
    probe.style.cssText = `position:fixed;visibility:hidden;width:${cssValue};top:0;left:0;`;
    document.body.appendChild(probe);
    const px = probe.getBoundingClientRect().width;
    probe.remove();
    return px;
}
```

### `#applyState()` — Ergänzung

```javascript
#applyState() {
    const gridActive = this.#state.grid !== 'aus';
    document.body.setAttribute('data-dev', String(gridActive));
    document.body.setAttribute('data-dev-grid', this.#state.grid);
    this.#updateImageSize();
    this.#drawGrid();   // ← neu
}
```

### `#onResize` — Ergänzung

```javascript
#onResize = () => {
    this.#gui.title(this.#getViewportText());
    this.#updateImageSize();
    this.#drawGrid();   // ← neu
}
```

---

## Positionsformel (Herleitung)

Das SCSS positioniert `::after` mit `margin-left = marginLeft - gutter/2`, sodass die Kacheln mittig zwischen Spalten beginnen. Die resultierenden Canvas-Positionen sind:

| | Formel | Beispiel (12 Spalten, gutter=20px, marginLeft=40px) |
| --- | --- | --- |
| Linke Kante Spalte i | `marginLeft + i × tileWidth` | i=0: 40px, i=1: 120px, … |
| Rechte Kante Spalte i | `marginLeft + i × tileWidth + colContent` | i=0: 100px, i=1: 180px, … |

Diese Formel ist identisch zur bestehenden `background-size`-Logik, nur ohne Kachel-Grenz-Problem.

---

## Verifikation

1. `ddev npm run dev` starten
2. Dev-Toolbar öffnen (Ctrl), Grid auf "lines" schalten
3. **Browserfenster in verschiedene Breiten ziehen** → Linien dürfen nicht wackeln
4. **Safari (Retina) + Chrome (1×)** vergleichen → gleiche Schärfe
5. **Ribbons-Modus** prüfen → Canvas geleert, `::after`-Gradient unverändert
6. **Breakpoint-Wechsel** prüfen → CSS Custom Properties werden neu gelesen, Linienanzahl passt sich an
