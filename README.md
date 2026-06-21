# Maleka AI Studio — Landing Site

A premium, dark, futuristic marketing site for **Maleka AI Studio**, an AI automation & creative technology studio. The single goal of the page is to get visitors to **book a free AI audit**.

Built from the *Maleka AI Studio Design System*: token-driven CSS, the cinematic "AI Command Core" 3D hero, services, process, case studies, and an accessible booking form.

## Structure

```
.
├── styles.css              # entry point — imports every token file
├── tokens/                 # design tokens (CSS custom properties)
│   ├── fonts.css           #   Sora · Manrope · JetBrains Mono (Google Fonts)
│   ├── colors.css          #   ground scale + blue/violet/cyan accents
│   ├── typography.css      #   fluid type scale, weights, tracking
│   ├── spacing.css         #   4px scale, container, section rhythm
│   └── effects.css         #   radii, blur, shadows, glows, motion
├── ui_kits/website/
│   └── index.html          # the full landing page
└── vercel.json             # serves the landing page at the site root
```

Everything is driven by the design tokens — change a value in `tokens/` and it cascades across the whole page.

## Local preview

It's a static site with no build step. Any static server works:

```bash
# Python
python3 -m http.server 5173
# then open http://localhost:5173/ui_kits/website/index.html

# or Node
npx serve .
```

## Deploy to Vercel

`vercel.json` rewrites `/` to `ui_kits/website/index.html`, so the site loads at the root domain with no framework or build configuration.

1. Push this repo to GitHub (see below).
2. In Vercel: **Add New… → Project → Import** the GitHub repo.
3. Framework Preset: **Other**. Build Command: *(none)*. Output Directory: *(leave default / root)*.
4. **Deploy.** The landing page will be served at `/`.

Or deploy straight from the CLI:

```bash
npm i -g vercel
vercel        # preview deploy
vercel --prod # production deploy
```

## Booking form

The booking form in the final CTA validates client-side and shows a confirmation. It is **not yet wired to a backend** — before launch, connect it to a real endpoint (Formspree, a Vercel `/api` route, or your CRM). See the `TODO` in the `<script>` at the bottom of `ui_kits/website/index.html`.

## Notes / substitutions

- **Fonts** are Google Fonts (Sora / Manrope / JetBrains Mono) — swap in licensed brand fonts when available.
- **Icons** are [Lucide](https://lucide.dev) via CDN.
- **Logo** is a CSS gradient "core" glyph; replace with a real SVG when provided.

---

© 2026 Maleka AI Studio
