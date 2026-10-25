"""Finalize creation metadata and report actual native results without promotion."""
from pathlib import Path
from collections import Counter
from datetime import datetime,timezone
import hashlib,json
OUT=Path(__file__).resolve().parent;ROOT=OUT.parents[2]
C=ROOT/'governance_packages/candidates/AGHR_T12_Candidate'
def load(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def write(p,v):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def digest(p):return {'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'bytes':p.stat().st_size}
if (OUT/'REPORT_RECEIPT.json').exists():raise FileExistsError('Preserve the finalized report')
runs=load(OUT/'RUN_RESULTS.json');comparison=load(OUT/'BEFORE_AFTER.json')['items'];provenance=load(C/'drafting/FIELD_PROVENANCE.json')
assert runs['per_rule']=={'strict_exit_0':0,'strict_blocked':47,'strict_invalid':0,'structural_pass':47}
assert len(provenance['items'])==47
p=C/'PACKAGE_STATUS.json';old=digest(p);before=OUT/'before/package/PACKAGE_STATUS.json.raw';before.parent.mkdir(parents=True,exist_ok=True);before.write_bytes(p.read_bytes())
status=load(p);status.update(strict_status='BLOCKED',structure_status='PASS',validation_exit_code=3,lint_exit_code=3,
 admitted_ids=[],blocked_draft_ids=[d['id'] for d in comparison],last_execution_scope='E2 static native CLI; zero source writes. Evidence external to this package.',
 validation_evidence='../../../docs/evidence/studio-t12-2026-10-23/RUN_RESULTS.json')
write(p,status)
readme='''# AGHR T12 Candidate — 47 provisional rule drafts

**Status: DRAFT_ONLY_NOT_ADMITTED / PROVISIONAL_OWNER_REVIEW.**

This operator-authored package contains exactly 47 governance items in `policies/drafts/`. It contains no skill library, imported examples, Active instructions or generated AGENTS.md.

Every authored item value is marked by JSON Pointer in `drafting/FIELD_PROVENANCE.json`. Typed enum values remain valid: e.g. `authority.level=project`, `authority.status=draft`, and `impact.evidence=assumed`. Only inherited id and force are unchanged source values. Original applicability conditions are retained explicitly in rule text; project-wide path scope is a proposal, not automatic understanding of those conditions.

The owner authorized drafting; final approval of drafted values is pending. `authority.approvedBy=PROVISIONAL_OWNER_REVIEW` denotes pending review. The declaration in `drafting/OWNER_DIRECTIVE.json` cannot authenticate itself or supply a host SourceGrant. No enterprise authority is claimed. All prospective eval fixtures are NOT_RUN; no E3/E4 implementation or qualification was performed.

The unchanged protocol-3 engine structurally accepts all 47 records. Native `validate --strict`, `validate` and `lint` return **BLOCKED / exit 3**: unverified sources (47), draft mandatory authority (44), and missing E3 evidence (3). **Admitted items: zero.** PACKAGE_STATUS is operator creation/result metadata; the engine's actual consumed inputs remain the manifest and 47 rule files.

[Delivery and raw executions](../../../docs/evidence/studio-t12-2026-10-23/README.md). Reference 1.2.0 and candidate 1.3.0 are unchanged. Provisional owner/license remain as accepted in E1; no final signature or deployment acceptance is asserted.
'''
(C/'README.md').write_text(readme,encoding='utf-8')
write(OUT/'PACKAGE_METADATA_UPDATE.json',{'at':datetime.now(timezone.utc).isoformat(),'scope':'Operator updates metadata after observed CLI results, adds README. No governing input or engine change.',
 'changes':[{'path':'PACKAGE_STATUS.json','before':old,'after':digest(p),'before_copy':'before/package/PACKAGE_STATUS.json.raw'}, {'path':'README.md','before':None,'after':digest(C/'README.md')}],
 'engine_inputs_unchanged':all(digest(C/name)['sha256']==sha for name,sha in load(OUT/'CANDIDATE_BEFORE_CLI.json').items() if name=='aghr.json' or name.startswith('policies/'))})
write(OUT/'CANDIDATE_FINAL_PIN.json',{p.relative_to(C).as_posix():digest(p) for p in sorted(C.rglob('*')) if p.is_file()})

diff=['# مقارنة القواعد الـ47: المرجع 1.2.0 → مسودة rc.3','',
 'جميع القيم الجديدة **PROVISIONAL_OWNER_REVIEW**؛ لا اعتماد حاكم أو ادعاء نجاح strict. تحفظ [BEFORE_AFTER.json](BEFORE_AFTER.json) كل سجل أصلي وكل سجل جديد مع وسم كل حقل ومصدره. المرجع 1.2.0 ومرشح 1.3.0 متطابقان لهذه القواعد الـ47؛ لا اختلاف نصي مخفي بينهما.','',
 '## التحويل المشترك','',
 '| قبل 1.2.0 | بعد rc.3 المقترح |','| --- | --- |',
 '| الهوية وforce | محفوظان دون تعديل؛ 41 MUST، 3 MUST_NOT، 3 SHOULD |',
 '| applies_when وtext | الشرط الأصلي مقدم صراحة داخل rule، والنص الأصلي محفوظ كاملاً بعده |',
 '| لا scope typed | paths=["**"] داخل المشروع؛ لا استثناءات خفية أو تصفية باللغة |',
 '| لا authority.level | project لكل البنود؛ لا دليل يبرر enterprise، ولا توسيع إلى organization |',
 '| لا بيانات سلطة كاملة | owner مقترح من بيانات الحزمة؛ approvedBy=PROVISIONAL_OWNER_REVIEW؛ status=draft؛ تاريخ النفاذ مقترح فقط |',
 '| لا severity/impact | خطورة مختلفة بحسب الأثر؛ impact.evidence=assumed، دون قياس أو Calibration مختلق |',
 '| verification نثري | ملف fixtures استشرافي مرتبط بمعيار قبول لكل قاعدة؛ كله NOT_RUN، وليس أدلة تنفيذ |',
 '| إنفاذ معلن في مصدر قديم | نصي للمسودات؛ الثلاث MUST_NOT critical لها human-approval مطلوب وblocking، ودليل E3 غير متوفر |',
 '| waivable | exceptions.allowed مقترح يطابق قيمة الأصل؛ لا إنشاء استثناء نافذ |',
 '| kind مقترح سابقاً لـAGHR-033=POLICY | PROCEDURE مقترح لإجراء اختيار ملف الضمان؛ لا تغيير لقوة MUST أو ادعاء اعتماد نوع متقدم |','',
 '## حالة كل قاعدة','',
 'كل بند أدناه: scope مشروع كامل، authority.level=project/status=draft، impact.evidence=assumed، والبنية PASS، وstrict BLOCKED/3.','',
 '| البند | force المحفوظة | kind المقترح | severity المقترحة | سبب تقدير الخطورة |','| --- | --- | --- | --- | --- |']
for d in comparison:
 a=d['after_rc3'];diff.append(f"| {d['id']} — {a['title']} | {a['force']} | {a['kind']} | {a['severity']} | {a['rationale'].replace(' PROVISIONAL_OWNER_REVIEW','')} |")
(OUT/'BEFORE_AFTER_AR.md').write_text('\n'.join(diff)+'\n',encoding='utf-8')

report='''# T12 — حزمة القواعد الـ47 المصاغة مؤقتاً

**الحالة: DRAFTED_47 / STRUCTURE_PASS / NATIVE_STRICT_BLOCKED.** اعتمد المالك T11b وأغلق الجرد وأجاز صياغة الـ47 وحزمتها. اكتملت الصياغة والتغليف واختبارات CLI الفعلية؛ **شرط نجاح T12 بـExit 0 لم يتحقق، ولذلك لا تغلق T12 كحزمة ناجحة أو مقبولة للترحيل.**

## المخرجات

- [حزمة AGHR_T12_Candidate](../../../governance_packages/candidates/AGHR_T12_Candidate/README.md)، وبها 47 بنداً فقط في policies/drafts. metadata/fixtures معزولة في drafting؛ لا مكتبة مهارات أو أمثلة مستوردة أو ملف AGENTS مولد.
- [وسم الحقول](../../../governance_packages/candidates/AGHR_T12_Candidate/drafting/FIELD_PROVENANCE.json): PROVISIONAL_OWNER_REVIEW لكل قيمة صاغها الوكيل، باستخدام JSON Pointer؛ وُضعت الوسوم خارج الحقول ذات enum المغلق حتى يبقى المخطط سليماً. id وforce من الأصل دون تغيير.
- [المقارنة المقروءة](BEFORE_AFTER_AR.md) و[قبل/بعد كاملاً](BEFORE_AFTER.json)، مع نسخ الأصل والبصمات. لا نص قاعدة أو قوة مفقودة، والشروط الأصلية محفوظة في rule. نطاق paths=["**"] مشروع كامل، والحاجة النوعية للقاعدة باقية في النص؛ لم يدّع المحرك فهم هذه الشروط دلالياً.
- قيم authority.level كلها project؛ القيم غير المعتمدة تبقى draft. impact.evidence كله assumed وموسوم مؤقتاً. لم تملأ enterprise أو تزعم قياس أثر.

## نتائج المحرك الأصلي الفعلية

| الاختبار | النتيجة | Exit |
| --- | --- | ---: |
| كل قاعدة منفردة — validate --strict، 47 تجربة | بنية PASS؛ 47 BLOCKED | 3 لكل قاعدة |
| الحزمة الكاملة — validate --strict | BLOCKED؛ 47 بنداً ظاهراً، structure PASS | 3 |
| الحزمة الكاملة — validate | BLOCKED | 3 |
| الحزمة الكاملة — lint | BLOCKED؛ دون تحذيرات حقول اختيارية ناقصة | 3 |
| حذف authority.level من AGHR-001 | INVALID | 1 |
| حذف scope من AGHR-001 | INVALID | 1 |

**الجاهز/الناجح بـExit 0: صفر. المعطوب بنيوياً في المسودات: صفر. المحجوب: 47.** توجد تجربة طيار إضافية قبل التوسيع، وكانت structure PASS / BLOCKED 3. مجموع التشغيلات المحفوظة 53: الطيار و52 تشغيلًا موثقًا في السجل.

مقتطف حقول من stdout الحقيقي، دون إعادة كتابة النتيجة:

```json
{"protocol_version":"3","command":"validate","result":"BLOCKED","exit_code":3}
```

لا يوجد مقتطف validate/Exit 0 لهذه الحزمة؛ لا يحوَّل PASS البنيوي إلى نجاح strict. [stdout الكامل للحزمة](runs/package-strict/stdout.json)، [stderr](runs/package-strict/stderr.txt)، [تنفيذ strict](runs/package-strict/execution.json)، [سجل التشغيلات](RUN_RESULTS.json).

## أسباب الحجب بالضبط

| التشخيص | عدد القواعد | المطلوب الحقيقي |
| --- | ---: | --- |
| AUTHORITY_SOURCE_UNVERIFIED | 47 | SourceGrant مطابق للملف والبصمة والجهة والنطاق من مضيف موثوق؛ CLI المقبول لا يستقبل منح ثقة من ملفات المرشح |
| AUTHORITY_NOT_ACTIVE | 44 | قرار اعتماد القيم الفعلية قبل جعل سلطة MUST/MUST_NOT active؛ تفويض الصياغة لا يسجل كموافقة عليها |
| ENFORCEMENT_E3_EVIDENCE_UNAVAILABLE | 3 | دليل إنفاذ E3 للقواعد AGHR-004 وAGHR-014 وAGHR-016؛ لا تخفيض critical أو إزالة gate.required للحصول على PASS |

العدادات متداخلة وليست 94 قاعدة. الثلاث SHOULD لا تتطلب active في هذا المحرك، لكن إعلان level=project فيها ما زال يحتاج مصدر سلطة موثوقاً. ملف داخل الحزمة يعلن موافقة المالك أو يحتوي بصمة لا يصادق نفسه.

لم يتغير المحرك أو أي مخطط. لم يستخدم موائم T06 المحاكى خارج تفويضه، ولم تُنشأ منحة ثقة أو بوابة وهمية. استبقاء 47 مسودة غير معتمدة تحت مساحة المرشح لا يعني إدراجها في مجموعة البنود المجتازة؛ admitted_ids=[]، ولا يوجد Active.

## الحفظ والتحقق

[PREFLIGHT](PREFLIGHT.json) يثبت مطابقة 931 ملفاً من القفل السابق قبل الصياغة. [قفل المرشح النهائي](CANDIDATE_FINAL_PIN.json) و[تحديث metadata المعلن](PACKAGE_METADATA_UPDATE.json) يميزان كتابة المشغل عن الكتابة الممنوعة من CLI. كل تشغيل قورن مدخله قبل/بعد دون كتابة. لم تتغير المدخلات التي يستهلكها المحرك بعد الاختبار؛ أضيف README وحالة النتيجة خارج مسار قواعده فقط.

نتائج اختبارات المشروع والتحقق من الوسوم والبصمات في [VERIFICATION.json](VERIFICATION.json)، وفروق وثائق الحالة في [DIFFS.json](DIFFS.json). سجل SHA-256 النهائي CUSTODY.lock.json يربط الأدلة الجديدة بالسابقة؛ لا يعد توقيعاً أو قرار إصدار.

## الحد التالي

T11 مغلقة باعتماد المالك، وT12 **STRICT_BLOCKED**. المسودات الـ47 جاهزة لمراجعة القيم المقترحة. بلوغ Exit 0 يحتاج قرار اعتمادها وطريق منح مصدر موثوق على المضيف، ثم دليل الإنفاذ المطلوب في E3. هذه أعمال لاحقة لا ينفذها تفويض الصياغة الحالي. تبقى فحوص E4 السبعة REQUIRED / NOT_RUN / NOT_WAIVED. التطبيق وقاعدة البيانات والمرجع 1.2.0 محفوظة، ولا توليد أو استيراد Active أو ترقية مرجع.
'''
(OUT/'README.md').write_text(report,encoding='utf-8')
write(OUT/'REPORT_RECEIPT.json',{'at':datetime.now(timezone.utc).isoformat(),'status':'DRAFTING_COMPLETE_T12_STRICT_BLOCKED','drafts':47,'structure_pass':47,'strict_exit_0':0,'strict_blocked':47,'T11':'ACCEPTED_BY_OWNER / CLOSED','T12':'NOT_CLOSED_AS_VALIDATED_PACKAGE','rule_severity_distribution':dict(Counter(d['after_rc3']['severity'] for d in comparison)),'authority_levels':{'project':47,'organization':0,'enterprise':0},'impact_evidence':{'assumed':47},'admitted_ids':[]})
print(json.dumps({'status':'REPORT_WRITTEN','drafts':47,'strict_pass':0,'strict_blocked':47,'source_inputs_unchanged':True},ensure_ascii=False))
