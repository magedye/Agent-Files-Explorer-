# سياسة الأدوات والنماذج الحاسوبية

## الاستخدامات المشروعة

- OCR/vision لتوليد sign candidates.
- clustering لاكتشاف allographs أو families.
- n-grams/entropy للتقطيع.
- graph analysis للعلاقات.
- sequence models لتوليد alignments.
- embeddings للاسترجاع والتشابه المرشح.
- LLM لصياغة hypotheses أو objections أو تقارير.

## القيود

- مخرج الأداة `candidate` لا `fact`.
- يجب حفظ version/config/hash.
- لا تنقل label دلالياً من embedding neighbor إلى الوحدة.
- لا تقبل black-box score دون benchmark أو تفسير كافٍ.
- لا تستخدم model memory لإثبات نص أو قراءة.
- لا تجعل model agreement استقلالاً؛ النماذج قد تشترك في بيانات التدريب.

## اختبار الأداة

يجب وجود:

- baseline بسيط.
- negative controls.
- synthetic cases.
- held-out evaluation.
- sensitivity to preprocessing.
- failure examples.

## الأتمتة والإنسان

الأداة تسرع الفرز والتوليد. القرارات عالية الأثر—دمج العلامات، القيم الصوتية، المعاني الحساسة، الترجمة النهائية—تحتاج سلسلة أدلة ومراجعة بشرية عند اللزوم.
