# Arabic and English interface

The Studio supports Arabic (RTL) and English (LTR). Use the language selector in the top bar; changes take effect immediately and the choice survives reloads in the same browser profile. Arabic remains the default when no valid preference is stored.

The selector covers all six Studio screens, file previews and search, graph legends, flow labels, placeholders, locally defined errors and loading messages. Dates use the selected locale. Documents, raw input, classification records, code, IDs and verification output retain their source text. Switching language preserves the current view and editable draft; it does not translate or resubmit user content.

## Implementation

- [messages.js](../../src/i18n/messages.js): 189 interface messages, grouped by component with Arabic/English pairs and named parameters.
- [locale.js](../../src/i18n/locale.js): preference key `aghr.locale`, validation, Arabic fallback, direction and literal-safe interpolation. Storage failures fall back safely within this locale module.
- [I18nProvider.jsx](../../src/i18n/I18nProvider.jsx): shared React context and updates to document title, `lang`, `dir` and saved preference. Consumers use `useI18n()` and `t(key, values)`.
- [index.html](../../index.html): restores the saved language/direction before the first paint.
- [index.css](../../src/index.css): inherited direction, logical spacing and responsive wrapping for longer labels.

New interface copy belongs in the catalog; keep both languages and their named parameters consistent. Display source material using its original text and `dir="auto"` or isolated bidirectional spans. Keep code and diffs LTR. API request keys, governance identifiers, default reference 1.2.0 and authorization behavior are unchanged by localization.

## Verification

[Local evidence](../evidence/english-ui-2026-10-20/verification.json) records 30/30 Studio tests, a successful build and checks in an isolated Edge context. The four focused locale tests cover complete bilingual messages, matching parameters, saved/invalid/blocked-storage preferences and literal interpolation.

Runtime checks covered all six screens, English persistence after reload, both directions, preservation of a mixed Arabic/English draft, comparison to 1.2.0 and translated graph/flow labels. Reference layouts were checked at 320, 768, 1024 and 1440 CSS pixels; all six screens were checked for page overflow at 320. Desktop/narrow screenshots were inspected. No console errors or warnings were observed in the checked final page; the existing build size advisory remains.
