# The Wind's Scent — Style Guide (Sprint 0 draft)

Cozy, soft-illustrated rooftop farm in a Vietnamese city. Calm, warm, never busy.

## Art source
Decided at Sprint 0: **AI-generated art, then touched up by hand.**
- Generate with one fixed style prompt (below) so every asset matches.
- Touch up: clean edges, fix hands/text, match the palette, remove the AI background.
- Export transparent PNG (later WebP), 2x size, keep each sprite under ~100 KB (N07).
- Keep the prompt, seed and source image for every asset in `art/source/` so it can be redone.
- Placeholder art is used until final art lands in Sprint 5.

**Base style prompt (draft):** soft hand-painted illustration, cozy rooftop garden in a Vietnamese city, foam boxes with vegetables, warm afternoon light, pastel colors, gentle shading, rounded shapes, no text, no outlines heavier than 2px, transparent background.

## Colors
| Token | Hex | Use |
|---|---|---|
| sky | `#a8d5c2` | Background, app theme color |
| cream | `#f6f1e7` | Main game area |
| paper | `#fffdf8` | Cards, panels |
| leaf | `#5e9e6e` | Main buttons, plants |
| leaf-dark | `#3f7a50` | Titles, pressed state |
| terracotta | `#d98b62` | Foam box rims, accents, coins |
| ink | `#3b3a36` | Main text |
| ink-soft | `#6f6b62` | Secondary text |
| line | `#e6dccb` | Borders |
| warn | `#b5642f` | Warnings |
| danger | `#b84a3e` | Delete actions only |

Night (F08, Sprint 4) will darken the sky toward `#2f3e5c` with warm `#ffd27a` lamp light.

## Text
- Font: the phone's system font (works offline, full Vietnamese support). A custom rounded font may replace it in Sprint 5 if it supports Vietnamese and stays small.
- Sizes: title 26, heading 17, body 16, hint 13. Never below 13.
- All text comes from `text/vi.json` (N11). Short, friendly, no blame ("Bạn chưa đủ xu" not "Lỗi").

## Shapes and touch
- Rounded corners: cards 18px, buttons 14px.
- Touch targets at least 44 × 44 px.
- Portrait only. On computers the game sits in a centered 430px frame (N09).

## Motion
- Light and slow: 150–250 ms ease-out. No constant animation loops that drain battery (N08).
