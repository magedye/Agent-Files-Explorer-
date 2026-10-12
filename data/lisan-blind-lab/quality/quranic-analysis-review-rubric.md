# معيار مراجعة التحليل القرآني

قيّم كل محور: مستوفٍ / ناقص / مفقود، مع منع الرتبة العليا عند فشل بوابة لازمة.

| المحور | السؤال |
|---|---|
| النص والجمع | هل النص والإصدار والفهرس والتغطية موثقة؟ |
| الملف المحلي | هل بُني مستقلاً عن النواة والـpriors؟ |
| البدائل | هل حُفظت بدائل الجذر والصرف والنحو؟ |
| الفصل الدلالي | هل فُصلت النواة والصيغة والتركيب والسياق والبواقي؟ |
| الأسرة الاشتقاقية | هل كل المشتقات الصريحة ضمن corpus واحد وهل اختبرت النواة الواحدة عبرها؟ |
| السياق الحاسم | هل بحث التحليل عن موضع ناقض أو مضيق؟ |
| المقارنة | هل طُبق التفريد وعدم الترادف التام وNearest-Lexeme/Semantic-Residue/Substitution/Lexical-Collision؟ |
| السيادة الدلالية | هل استُبعد الفهم الشائع والموروث والمعاجم والحديث والشعر والترجمات والتفاسير من مسار الدلالة كله؟ وهل أي مراجعة تفسيرية بعد القفل منفصلة وغير حاكمة؟ |
| الاعتراض | هل عُرض الأقوى قبل الترجيح؟ |
| الدحض والـholdout | هل جُمد الشرط والتنبؤ قبل الكشف؟ |
| العزل | هل بقي الخارج والـpriors محجوبين حسب المرحلة وهل مُنع التفسير كلياً؟ |
| السلالة | هل مُنع وهم الإجماع والتصويت؟ |
| طبقات الدليل | هل أ/ب/ج/د مستعملة بالنموذج الحالي؟ |
| الصدق المعرفي | هل ظهرت unknowns والامتناع وحدود الادعاء؟ |
| الحساسية | هل يتغير المعنى تحت تحليل بنيوي معقول؟ |
| الاستشهاد | هل الاقتباس والموقع متحققان من Artifact نص قانوني مثبت الإصدار والبصمة؟ |

لا تحول عدد السياقات أو درجة رقمية إلى بديل عن هذه البوابات.


## بوابات v3 الإضافية

- [ ] `ZERO-PRIOR-MEANING` مطبق وprior contamination معلنة.
- [ ] `SINGLE ROOT CORE` محفوظ؛ لا توجد نوى متعددة للجذر المؤكد.
- [ ] `FORM–MEANING COVARIANCE` مطبق على الفروق البنيوية المهمة.
- [ ] كل Local Meaning يمر `ROOT-TRACEABILITY GATE`.
- [ ] لا `NO-SEMANTIC-MUTATION` violation.
- [ ] الجذر القليل غُطي 100%، والكثير يبدأ بعينة ≥10 متنوعة خصومياً عند عدم الفحص الكامل.
- [ ] `Corpus Coverage`, `Context Diversity Coverage`, `Semantic Confidence` منفصلة، ولا يُستنتج أحدها من الآخر.
- [ ] النص حفص/مصحف المدينة فقط؛ لا قراءات أخرى في الدليل.
- [ ] لا tafsir في أي مرحلة دلالية.
- [ ] المعاجم/الحديث/الشعر/الترجمات والموروث الدلالي محظورة من مسار الدلالة القرآنية في جميع المراحل.
- [ ] الفرضيات الصوتية موسومة Supporting/Hypothesis فقط.

## بوابات v3.2

- [ ] R96 source isolation verified.
- [ ] R97 methodology frozen.
- [ ] R98 form identity verified.
- [ ] R99 Coverage claim evidence-backed.
- [ ] R100 positive competition + C0.
- [ ] R101/R102 parse robustness before decisiveness.
- [ ] R103 argument frame not mistaken for Root Core.
- [ ] R104 constructional contribution subtracted.
- [ ] R105 abstract core operationalized.
- [ ] R106 predictive content demonstrated or lock blocked.
- [ ] R107 cross-derivation bridge demonstrated or branch remains unresolved.
- [ ] R108 Lock Eligibility Report passed.
- [ ] R109 blocked invented glosses for unattested bases when triggered.
- [ ] R110 extracted positive residue when a privative core was proposed.
- [ ] R111 operator contributions are independent, invariant-tested, and scope-labeled.
- [ ] Occurrence Evidence Matrix and Semantic Exclusion Ledger are present for a full report.
- [ ] Lexical distinctiveness is sufficient for the lock scope.
- [ ] Holdout prediction was frozen before reveal, or holdout was not used.
- [ ] Mandatory layered output contains all required user-visible layers.
- [ ] Arabic is the complete primary presentation language; English identifiers have Arabic labels.
- [ ] Any post-lock interpretive review is isolated and non-governing.

## بوابات v3.3 للعوامل الصرفية

- [ ] R112: الإثبات البنيوي مفصول عن إثبات دلالة العامل.
- [ ] R113: مكدس العوامل الصرفية غير مدمج في معنى واحد.
- [ ] حالة كل عامل ونطاقه مصرح بهما.
- [ ] مرجع v0.2 لم يُعامل كمصدر معنى أو Oracle.
- [ ] الحسابات البنيوية قابلة لإعادة الإنتاج بواسطة `validate_operator_reference.py`.
- [ ] لا قيمة عاملية رُقيت إلى `AGREED` بلا Evidence Matrix واختبارات عبر جذور متعددة.
