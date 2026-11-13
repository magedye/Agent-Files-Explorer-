# DESIGN_SYSTEM — AGHR Governance Studio

A single, theme-aware design system defined in `src/index.css`. All colours are semantic tokens, so light and dark modes work everywhere without per-component colour handling.

## 1. Visual identity
Restrained, information-dense enterprise UI (Linear/Vercel/Grafana influence): neutral surfaces, one accent, semantic colour only for meaning, subtle borders, minimal shadows, clear typographic hierarchy. No decorative gradients, no oversized cards.

## 2. Design tokens (CSS custom properties on `:root` / `[data-theme="dark"]`)

| Group | Tokens |
|---|---|
| Surfaces | `--bg`, `--surface`, `--surface-2`, `--surface-sunken`, `--surface-raised` |
| Borders | `--border`, `--border-strong` |
| Text | `--text`, `--text-secondary`, `--muted`, `--faint` |
| Accent | `--accent`, `--accent-hover`, `--accent-soft`, `--on-accent` |
| Semantic | `--success`, `--success-soft`, `--danger`, `--danger-soft`, `--warning`, `--warning-soft`, `--info`, `--info-soft` |
| Effects | `--shadow`, `--shadow-lg`, `--overlay`, `--code-bg` |
| Geometry | `--radius-sm|--radius|--radius-lg|--radius-pill` |
| Spacing | `--space-1` (4px) … `--space-6` (32px) |
| Layout | `--rail-w` (212 → 64px), `--topbar-h` (60px) |

Colour is never the only signal: badges pair colour with a text label.

## 3. Typography
- System stack with Arabic support: `system-ui, "Segoe UI", "Noto Sans Arabic", Tahoma`.
- Mono: `"Cascadia Code", Consolas`.
- Hierarchy: page title 20px → section 14–16px → body 14px → secondary 12–13px → micro-label 10.5px (uppercase, `.meta-lbl`).
- Line height 1.55 body / 1.85 long-form markdown.

## 4. Layout
- **Top bar** (`.topbar`): brand + subtitle, global controls (language, back, theme).
- **Nav rail** (`.nav-rail`): persistent vertical mode navigation, icon + label, `.active` state, `aria-current="page"`.
- **Workspace**: optional content sidebar (`.sidebar`, Explorer tree) + `.main`.
- **Page container**: `.studio-full-pane` for full-page modes.

## 5. Components
| Component | Classes |
|---|---|
| Buttons | `.btn` + `.btn-primary|secondary|success|danger|warning|ghost|sm|block` |
| Inputs / selects | `.input`, `.input-text`, `.input-textarea`, `.search-input`, focus ring via `:focus-visible` + soft accent glow |
| Tabs | `.tab`, `.subtab`, `.gov-tab-btn` (`.on` / `.active`) |
| Cards | `.card`, `.metric-card`, `.inspector-panel`, `.gov-summary-card` |
| Badges / pills | `.badge-*`, `.force-badge.force-*`, `.action-badge.action-*`, `.gov-status-pill`, `.chip` |
| Tables | `.table`, `.matrix-table`, sticky header, row hover |
| Alerts | `.alert`, `.gov-alert-banner`, `.gov-success-banner`, `.gov-error-msg`, `.progress`, `.error` |
| Empty states | `.state-empty`, `.empty-state` (icon + message) |
| Skeletons | `.skeleton` (theme-aware shimmer) |
| Modal | `.modal-overlay`, `.modal`, `.modal-head`, `.modal-body` |
| Tree | `.tree`, `.tree-label`, `.tree-children` |
| Markdown preview | `.md-body` (headings, code, tables, blockquote) |

## 6. Force / action semantics
`force-must` (accent), `force-must_not` (danger), `force-should` (warning), `force-should_not|may` (neutral), `force-not_required|review_required|info` (muted). Action badges: add/merge/strengthen/reject/weakening_review.

## 7. Responsive
- ≥1180px: full 212px labelled rail; two-column content grids.
- ≤1180px: 64px icon rail; content grids collapse to one column.
- ≤820px: rail becomes a horizontal scrollable bar; sidebar stacks above content.
- ≤520px: compact top bar, icons-only rail.

## 8. Accessibility
- `:focus-visible` ring on every interactive element.
- Native `<button>`/`<select>`/`<input>`; nav uses `aria-current`; modal uses `role="dialog" aria-modal="true"`.
- `prefers-reduced-motion` disables transitions/animations.
- `prefers-color-scheme` seeds the initial theme; stored choice wins.

## 9. Usage rules
- Never hardcode hex colours in components; use tokens (`var(--…)`).
- Reuse the documented classes; don't invent near-duplicates.
- Keep one `h1` per page; use `.meta-lbl` for field labels.
- Every list has an empty state; every async surface has a loading state.
