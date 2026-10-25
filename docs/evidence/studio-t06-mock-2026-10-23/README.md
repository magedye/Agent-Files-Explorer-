# T06 — إغلاق اختبار SEC-001 ضمن المحاكاة المصرح بها

**النتيجة:** `CLOSED_FOR_OWNER_AUTHORIZED_MOCK_PROFILE_ONLY`، 2026-10-23. أجاز المالك صراحةً دليلًا وهميًا/توقيعًا محليًا لإثبات القالب دون بناء E3، وقَبِل إغلاق T06 عند نجاح الاختبار. تحقق `VALID / exit 0` عبر موائم اختبار معزول يستدعي محرك E2 الفعلي؛ لا يمثل ذلك إثبات إنفاذ فعلي أو مصادقة مؤسسية.

## معالجة المشكلتين

1. **الملف الحقيقي:** أُنشئ [policies/security/secrets.yaml](../../../governance_packages/candidates/AGHR_T06_SEC001_Candidate/mock-authorized/policies/security/secrets.yaml)، بصيغة YAML 1.2 وقيم flow، بكل الحقول السبعة عشر، وربط `authority.source` به. تربط [بيانات المصدر](../../../governance_packages/candidates/AGHR_T06_SEC001_Candidate/mock-authorized/.t06/source-attestation.json) SHA-256 بالملف الفعلي. وجود الملف وحده لا يمنح السلطة.
2. **الدليل الوهمي:** [إيصال محلي](../../../governance_packages/candidates/AGHR_T06_SEC001_Candidate/mock-authorized/.t06/mock-evidence.json) موسوم `T06_MOCK_ONLY` وموقّع بـEd25519 بمفتاح اختبار مؤقت. يثبت فقط وجود البوابة داخل المضيف المحاكى. بقي `gate.required=true` و`MUST_NOT / critical` دون تخفيف. المفتاح الخاص لم يكتب أو يحتفظ به؛ المفتاح العام محفوظ، وبصمته مثبتة خارج الحزمة في [HOST_FIXTURE_PIN](HOST_FIXTURE_PIN.json).

## لماذا لزم موائم اختبار؟

محرك E2 المقبول لا يستهلك هذه الملفات كدليل إنتاجي، وCLI لا يحمل SourceGrant خارجيًا. لذلك لا تكفي إضافة بيانات للحزمة وحدها. أضيفت أدوات اختبار فقط تحت `tools/t06/`، دون تعديل المحرك أو server/ أو الواجهة أو بناء doctor:

- يتحقق الجسر الاختباري من التوقيع والمفتاح العام وبصمة المصدر والإيصال وهوية القالب، قبل أي استدعاء Python؛ لا يستمد الثقة من ملف يصدق نفسه.
- يمرر **SourceGrant محاكى** إلى API الموجود أصلًا، لا عبر اكتشاف منحة ذاتية من الحزمة.
- يستبدل `unittest.mock.patch` اعتماد الإنفاذ E3 غير المنفذ لهذه الحالة الموقعة فقط. يستدعي فاحص الأدلة الأصلي ويبقي كل نتائجه الأخرى؛ يستثني تشخيص عدم توفر E3 للبند SEC-001 المطابق فقط في هذه المحاكاة. لا يعيد كتابة النتيجة أو رمز الخروج بعد حسابهما؛ يحسب محرك E2 النتيجة بعد الفحوص.
- يحتفظ بفحوص البنية والنطاق والسلطة المطابقة والتعارض والأدلة الأخرى. تشمل الاختبارات رفض غياب scope حتى مع دليل محاكى موقّع، ورفض التوقيع التالف والبصمات غير المطابقة.
- المخرجات مطابقة لمخطط CLI 3 المثبت؛ يعلن `checks.reason` وstderr وضع `T06_MOCK_ONLY`. تحسب بصمة الإعدادات من هوية الموائم والمنح المحاكاة والأدلة، ويظل `publisher_authentication=UNKNOWN` و`qualification=NOT_RUN` ورفض قبول الإصدار محفوظًا.

## المخرجات الفعلية

| التشغيل على المصدر وملفات الدليل نفسها | النتيجة | Exit |
| --- | --- | --- |
| [CLI الأصلي دون موائم](normal-data-only-control.execution.json) | BLOCKED | 3 |
| [موائم T06 المصرح به](mock-pass.execution.json) | VALID، MOCK_ONLY | **0** |

من stdout المحاكى، حقول مقتطفة دون تغيير قيمها:

```json
{"protocol_version":"3","command":"validate","result":"VALID","exit_code":0}
```

ومن stderr:

```text
T06_MOCK_ONLY: local simulation; never a production enforcement or enterprise-authority verdict.
```

[stdout الكامل](mock-pass.stdout.json)، [stderr الكامل](mock-pass.stderr.txt)، [نتائج التشغيل](RUN_RESULTS.json). CLI الأصلي لا يزال يحجب الحالة بحق؛ لم يُحوّل هذا التشغيل إلى نجاح إنتاجي ولم تتغير نتيجة [T06 السابقة](../studio-t06-2026-10-23/README.md) بأثر رجعي.

## الحفظ والتحقق

[توجيه المالك ونطاقه](OWNER_DIRECTIVE.json)، [جرد المصدر](CANDIDATE_PIN.json)، [اختبارات التسليم](VERIFICATION.json)، [الفروق والبصمات](DIFFS.json)، [قفل الحفظ](CUSTODY.lock.json). حُفظت النسخ السابقة، والإيصالات السابقة دون تعديل. لا توجد مفاتيح خاصة أو بيانات اعتماد إنتاجية في هذا الدليل.

## حدود الإغلاق

قُبل إثبات **القالب في النطاق المحاكى الذي أجازه المالك**؛ لا يصبح ذلك Binding.QUALIFIED أو تأهيل مضيف أو إثبات أن gitleaks/CI gate يعمل فعليًا. تبقى أدلة الإنفاذ الحقيقية وdoctor في E3، وفحوص الصدق السبعة `REQUIRED / NOT_RUN / NOT_WAIVED` في E4. لا CRUD أو قاعدة دائمة أو توليد أو ترقية مرجع. المرجع 1.2.0 و46 ملفًا للمحرك مقفلان دون تعديل. الخطوة التالية المقترحة هي مراجعة دفعة العينة T11a وفق التبعيات؛ لم تبدأ في هذا التنفيذ.
