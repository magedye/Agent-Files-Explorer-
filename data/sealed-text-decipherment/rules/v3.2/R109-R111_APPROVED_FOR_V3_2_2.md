# R109–R111 — القواعد المعتمدة في v3.2.2

## R109 — بوابة الحذر من الصيغة الأساس غير الموثقة (`UNATTESTED-BASE FORM CAUTION GATE`)

- **الوزن:** HIGH
- **الحالة:** ACTIVE / REGRESSION_BACKED_IN_PACKAGE
- **القاعدة:** لا يُخترع معنى لصيغة أساس غائبة أو غير مستقرة ليُستخدم في تفسير صيغة مزيدة موثقة.
- **نمط الفشل:** `UNATTESTED BASE → INVENTED GLOSS → FALSE FORM OPERATOR`.
- **Regression:** `tests/quran-v3.2.2-methodology-regressions.md`.

## R110 — بوابة البقية الإيجابية للنواة السلبية (`PRIVATIVE-CORE POSITIVE-RESIDUE GATE`)

- **الوزن:** HIGH؛ حاجبة قبل القفل عند تفعيلها.
- **الحالة:** ACTIVE / REGRESSION_BACKED_IN_PACKAGE
- **القاعدة:** النواة المصاغة كغياب محض تحتاج اختبارًا يبحث عن أثر إيجابي مستقل للجذر.
- **نمط الفشل:** `PRIVATIVE CORE → UNIVERSAL FIT → NO POSITIVE PREDICTION`.
- **Regression:** `tests/quran-v3.2.2-methodology-regressions.md`.

## R111 — استقلال مساهمة العامل اللغوي وثباتها (`OPERATOR-CONTRIBUTION INDEPENDENCE & INVARIANCE`)

- **الوزن:** HIGH / FOUNDATIONAL OPERATIONAL RULE
- **الحالة:** ACTIVE_WITH_SCOPE_LABELING
- **القاعدة:** تُفصل مساهمة الصيغة أو الحرف أو التركيب عن الجذر والمشاركين والسياق، ولا يعمم معناها إلا بعد اختبار داخلي عابر للبيئات مع Scope صريح.
- **Regression:** `tests/quran-v3.2.2-methodology-regressions.md`.
