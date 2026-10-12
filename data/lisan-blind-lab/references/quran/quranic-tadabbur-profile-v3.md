# الملف التنفيذي للتدبر اللساني القرآني — v3.3.0

## السلطة

عند التعارض في المسار القرآني:

1. قرار المالك الصريح والحالي.
2. `references/quran/governance/OWNER_CONSTITUTIONAL_DECISIONS.md`.
3. `references/quran/governance/SOURCE_FIREWALL_CANONICAL.md`.
4. `references/quran/governance/CANONICAL_QURAN_TEXT_ARTIFACT_CONTRACT.md`.
5. `references/quran/governance/MANDATORY_LAYERED_SEMANTIC_ANALYSIS_PRESENTATION_PROTOCOL.md`.
6. `references/quran/governance/ARABIC_FIRST_SCIENTIFIC_PRESENTATION_STANDARD.md`.
7. `references/quran/governance/QURANIC_OUTPUT_LEVELS_STANDARD.md`.
8. `rules/06-quranic-semantic-constitution-v3.md` و`rules/v3.2/RULE_STATUS_LEDGER.md`.
9. قواعد المهارة العامة.
10. هذا الملف.
11. المراجع القديمة بوصفها مواد سلالة غير حاكمة.

## النص والسلطة الدلالية

- النص القانوني: **حفص عن عاصم / مصحف المدينة فقط** ضمن corpus موثق.
- الدليل الدلالي: **قرآني داخلي فقط**.
- التفاسير والمعاجم والحديث والشعر والترجمات والمصطلحات الموروثة والمعاني المتذكّرة ليست أدلة أو مولدات فرضيات أو مؤيدات في أي مرحلة.
- الدراسات التاريخية/المقارنة أو التفسيرية لا تُفتح إلا بعد القفل وبطلب مالك مستقل، ووفق `POST-LOCK INTERPRETIVE REVIEW POLICY`، وتبقى خارج خط التحقق والاعتماد.

## المسار التنفيذي

1. `RESET`: ابدأ `UNKNOWN` وسجّل أي gloss مألوف بلا lineage بوصفه `PRIOR_CONTAMINATED`.
2. `ISOLATE`: ثبّت Blind Source Manifest؛ عند فشل العزل أخرج `BLIND_ISOLATION_NOT_VERIFIED`.
3. `CANONICALIZE`: ثبّت النص والعناوين والنطاق وArtifact النص القانوني وبصمته؛ عند غيابه لا تدع تحققًا نهائيًا.
4. `COLLECT`: اجمع كل المشتقات الصريحة في corpus واحد، مع stratification صرفي؛ الوحدة لا تثبت الجسر الدلالي.
5. `COVERAGE`: القليل = 100% مع Evidence Matrix؛ الكثير = ≥10 مواضع متنوعة خصومياً كبداية مع إعلان النسبة الحقيقية.
6. `PROFILE`: أنشئ ملفاً مستقلاً لكل موضع: Observation / Constraint / Structural Alternatives / Unknowns.
7. `FORM IDENTITY`: تحقق من الصيغة الدقيقة قبل أي operator claim، ولا تعامل الحاوية غير الموسومة في QAC بوصفها Form I مؤكدة.
8. `OPERATOR REFERENCE`: استخدم المرجع الصرفي v0.2 لتنظيم الطبقات فقط؛ افصل structural status عن semantic status، وطبّق R112/R113.
9. `HYPOTHESIZE`: Semantic Exclusion Ledger + فرضيات إيجابية متنافسة + `C0`. طبّق R109 عند غياب الأساس، وR110 عند النواة السلبية المحضة.
10. `FALSIFY`: أصعب موضع، parse alternatives، lexical competitors، وHoldout عند الإمكان بعد تجميد التنبؤ كتابيًا.
11. `DECOMPOSE`: `ROOT + STEM FORM + ASPECT/VIEW + VOICE + MOOD + NOMINALIZATION + PARTICLE/CONSTRUCTION + ARGUMENT ROLE + CONTEXT = LOCAL MEANING`.
12. `OPERATIONALIZE`: كل core مجرد يتحول إلى REQUIRED/EXCLUDED وتنبؤ وشرط دحض.
13. `BRIDGE`: الفروع البعيدة تحتاج Cross-Derivation Bridge Evidence؛ لا يكفي اشتراك الجذر.
14. `DIFFERENTIATE`: جيران قرآنيون مستخرجون داخلياً، Semantic Residue، Substitution، Collision Limit.
15. `BOUNDARY`: REQUIRED / PERMITTED / EXCLUDED / UNKNOWN.
16. `LOCK ELIGIBILITY`: تقرير صريح؛ القناعة لا تكفي.
17. `LOCK_INTERNAL_RESULT`: snapshot داخلي لا يساوي قبول المالك أو اعتماد السجل.
18. `POST-LOCK`: مقارنة تفاضلية مع Priors المشروع، ودراسة تفسيرية/تاريخية اختيارية منفصلة إذا طُلبت، دون إعادة كتابة صامتة أو رفع الثقة.
19. `AUDIT`: Methodology Audit + Rule/Refinement/Regression extraction بعد القفل.
20. `OUTPUT`: طبّق البروتوكول الطبقي بالعربية أولًا. استخدم الملخص المنضبط فقط ضمن شروطه.

## الصيغ والحروف والتراكيب

- ثبات العامل اللغوي (`OPERATOR INVARIANCE`) مبدأ بحثي؛ قيمة العامل بعينه فرضية تجريبية.
- R111 يلزم فصل مساهمة الصيغة/الحرف/التركيب عن الجذر والمشاركين والسياق، مع Scope صريح.
- R112 يمنع الاستدلال من العدد أو وسم QAC على معنى العامل.
- R113 يلزم تفكيك طبقات `STEM FORM + ASPECT/VIEW + VOICE + MOOD + NOMINALIZATION` بدل دمجها في gloss واحد.
- المرجع النشط: `references/quran/morphology/LISAN_Quranic_Morphological_Operator_Reference_v0.2.md`.
- كل claim عن Form/Particle/Construction يحمل scope:
  `LOCAL_CONSTRUCTION | ROOT_INTERNAL | CROSS_ROOT_SUPPORTED | CORPUS_WIDE_SUPPORTED | REGRESSION_BACKED`.
- لا تُعمم قيمة مثل `أفعل = ...` أو `ب = ...` من جذر واحد.

## التغطية والثقة

افصل دائماً:

- `Corpus Coverage`.
- `Context Diversity Coverage`.
- `Positive Core Confidence`.
- `Negative Determination Confidence`.
- `Structural Stability`.
- `Lexical Differentiation Status`.

النسب ليست احتمالات رياضية ما لم توجد معايرة مستقلة.

## نتيجة مشروعة

قد تنتهي العملية إلى:

`UNKNOWN | CANDIDATE_HYPOTHESIS | QURAN_TESTED | PROVISIONALLY_ACCEPTABLE | LOCK_BLOCKED | LOCK_INTERNAL_RESULT | CONTRADICTED | HUMAN_REVIEW_REQUIRED`.
