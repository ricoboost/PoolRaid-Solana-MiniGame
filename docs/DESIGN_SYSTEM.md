# Design system

PoolRaid uses an obsidian interface with neon green, purple, and gold accents. The implementation source of truth is `src/app/globals.css`.

## Typography

- Outfit: display headings, large balances, tier names, and results
- Plus Jakarta Sans: navigation, controls, and body copy
- IBM Plex Mono: wallet addresses, hashes, amounts, timestamps, and compact labels

Fonts are loaded through `next/font`; do not add external stylesheet URLs.

## Interface principles

- Keep financial values explicit and label SOL separately from the number.
- Use green for positive or successful states, red for loss/errors, purple for secondary game actions, and gold sparingly for rewards.
- Never communicate status by color alone.
- Preserve readable contrast on the near-black surface hierarchy.
- Keep wallet addresses and transaction hashes selectable and monospaced.
- Respect reduced-motion preferences when adding game animation.
- Use existing images under `public/images` before introducing a new visual family.

## Responsive structure

Desktop pages use a persistent side rail and a bounded content column. Mobile pages use a fixed top bar, bottom navigation, and compact tier strip. New screens should remain usable at 320 CSS pixels and with keyboard-only navigation.

## Brand assets

`public/images/brand/bg_og.png`, its WebP counterpart, and `public/og-image.webp` contain no embedded text. Keep titles and deployment-specific URLs in HTML metadata or generated overlays, not raster artwork.
