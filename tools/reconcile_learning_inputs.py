"""Build the bounded, human-reviewed 1.2.0 source disposition ledger."""
from pathlib import Path
import collections
import json
import re

ROOT = Path(__file__).resolve().parents[1]
PACKAGE = ROOT / 'governance_packages/candidates/AGHR_Reference_1.2.0_update_20261020'
INBOX = ROOT / 'governance_packages/INBOX'
EVIDENCE = ROOT / 'docs/evidence/reference-1.2.0-update'
ROWS = []

def add(source, section, kind, coverage, disposition, target, finding, force='SHOULD', scope='PACKAGE'):
    canonical = {'CLARIFY':'ADOPT','EXTEND':'ADOPT','IMPLEMENT_CONTROL':'ADOPT','RECONCILE':'RECONCILE',
                 'REUSE':'REFERENCE_ONLY','REFERENCE_ONLY':'REFERENCE_ONLY','DEFER':'DEFER','NEEDS_INFORMATION':'HOLD','REJECT':'REJECT'}[disposition]
    ROWS.append({'id': f'INT-{len(ROWS)+1:03d}', 'source': source, 'section': section, 'kind': kind,
                 'classification_layer': 'SOURCE_ASSET' if kind=='REFERENCE_DOCUMENT' else 'PROPOSED_IMPROVEMENT',
                 'proposed_force': force, 'scope': scope, 'source_authority': 'PROPOSED_NOT_EFFECTIVE',
                 'coverage_before': coverage, 'disposition': canonical, 'engineering_action': disposition,
                 'targets': target.split('|'), 'finding_and_effect': finding})

def main():
    add('1.MD','1 / callers and interface contracts','PROCEDURE','PARTIAL','CLARIFY','policies/ENGINEERING.md','Generalized consumer/type/sync/null/error impact checks; no MARSAD file was edited.')
    add('1.MD','2 / historical and temporal validity','PROCEDURE','PARTIAL','CLARIFY','policies/ENGINEERING.md','Preserve applicable as-of/effective-date and explicit supersession semantics; latest alone is insufficient.','MUST')
    add('1.MD','3 / boundary cases','RECOMMENDATION','COVERED','CLARIFY','policies/ENGINEERING.md','Select relevant empty/zero/extreme/failure cases by contract and impact rather than mandatory universal cases.')
    add('1.MD','4 / model and effort selection','RECOMMENDATION','COVERED','REUSE','policies/CONTEXT_AND_MODELS.md','Use actual complexity/risk/availability and measured results; model names do not establish review independence.')
    add('1.MD','5 / task formulation','PROCEDURE','PARTIAL','CLARIFY','policies/CONTEXT_AND_MODELS.md','Bound delegated tasks with paths/contracts, outcomes, criteria, constraints and resume points as applicable.')
    add('1.MD','MARSAD target paths and merge constraints','POLICY','NOT_APPLICABLE','REFERENCE_ONLY','design/INBOX_RECONCILIATION.md','MARSAD paths and adopted force require that project owner; retain as provenance, not a new AGHR taxonomy.','INFORMATIVE','MARSAD_ONLY')
    add('2.MD','1.1 / receive originals','PROCEDURE','COVERED','REUSE','procedures/PROJECT_INBOX.md|procedures/REQUEST_INTAKE.md','Retain exact source locators and hashes; no placement-derived permission.')
    add('2.MD','1.2 / atomize and classify','PROCEDURE','PARTIAL','EXTEND','procedures/GOVERNED_LEARNING.md|schemas/LESSON.schema.json','Nine distinct kinds, proposed force, authority, scope and effect are now explicit lesson fields.')
    add('2.MD','1.3-4 / coverage and impact','PROCEDURE','COVERED','EXTEND','procedures/GOVERNED_LEARNING.md','Preserve exact owner references and COVERED/PARTIAL/MISSING/CONFLICT plus UNVERIFIED/NOT_APPLICABLE.')
    add('2.MD','3 / generalization and destination','POLICY','PARTIAL','EXTEND','policies/CHANGE_CONTROL.md|procedures/GOVERNED_LEARNING.md','Generalization needs evidence for the broader context and the competent owner; reuse the existing owner file.')
    add('2.MD','3.7 / Problem-Lesson-Rule-Enforcement','TECHNICAL_CONTROL','PARTIAL','IMPLEMENT_CONTROL','runtime/learning.py|tests/test_learning.py','Add evidence/semantic checks and negative-path regression coverage; a rule is one possible outcome, not a mandatory stage.')
    add('2.MD','2 / suggested folder and final routing','PROCEDURE','COVERED','RECONCILE','procedures/PROJECT_INBOX.md','Consumer _INBOX and Studio governance_packages/INBOX have distinct scope; derived artifacts go to their owner targets.')
    add('2.MD','4 / Explorer UI and ChangePackets','RECOMMENDATION','UNVERIFIED','DEFER','design/INBOX_RECONCILIATION.md','A new visual lesson-management product slice is outside this package update; existing Studio registration only.','INFORMATIVE','STUDIO_PRODUCT')
    add('for-learning.md','inbox placement and authority','POLICY','COVERED','REUSE','procedures/PROJECT_INBOX.md','Use the current intake procedure, not another parallel inbox skill.')
    add('for-learning.md','single canonical state','POLICY','COVERED','REUSE','policies/STATE_AND_RECOVERY.md|runtime/learning.py','Respect native canonical trackers; capture refuses a parallel LOCAL_JSON lesson store when external backend is declared.')
    add('for-learning.md','Windows portable paths and foreign encodings','PROCEDURE','PARTIAL','RECONCILE','runtime/learning.py|runtime/inbox.py','Portable recorded relative paths use POSIX separators; native operations use Path. Owned JSON is UTF-8; foreign claim inspection uses replacement decoding.')
    add('for-learning.md','context budget and archives','RECOMMENDATION','PARTIAL','RECONCILE','CONTEXT_GUIDE.md|CONTENTS.md','Advisory configurable context budgets, targeted retrieval and tool-level auditing replace universal 1000-token acceptance claims.')
    add('for-learning.md','baseline fingerprint gates','TECHNICAL_CONTROL','COVERED','REUSE','MANIFEST.json|tools/check_package.py','Freeze/check at relevant boundaries; preserve complete original candidate rather than rehash all references after every edit.')
    add('for-learning.md','avoid duplicate Skill/AGENTS patch','POLICY','COVERED','RECONCILE','AGENTS.md|optional_skills/governed-learning/SKILL.md','Short router links to a distinct missing learning workflow; no extra inbox skill or global instruction patch.')
    add('guide.md','missing attached Antigravity guide','OBSERVATION','UNVERIFIED','NEEDS_INFORMATION','design/INBOX_RECONCILIATION.md','The mentioned attachment is absent from the eight captured inputs; no invented source or adapter qualification.','INFORMATIVE')
    add('guide.md','official host version and qualification claims','PROCEDURE','COVERED','REUSE','procedures/HOST_QUALIFICATION.md','Verify official selected host/version/OS when source is supplied. This update makes no new Antigravity technical claim.','INFORMATIVE')
    add('IMPOERTANT.md','1-2 / five-pass method','PROCEDURE','PARTIAL','EXTEND','procedures/GOVERNED_LEARNING.md','Adapt Scan-Generate-Dedup-Confirm-Execute with source/authority review and a later validity review.')
    add('IMPOERTANT.md','2 / problem-cause-prevention-detection','LESSON','MISSING','IMPLEMENT_CONTROL','schemas/LESSON.schema.json|templates/LESSON.json','Capture what happened, causal support, counterevidence review, prevention and a concrete detection signal.')
    add('IMPOERTANT.md','3 / confidence and root cause','POLICY','PARTIAL','EXTEND','runtime/learning.py|tests/test_learning.py','Confidence cannot replace evidence or authority. Unknown cause remains UNPROVEN and blocks instruction-promotion preconditions.')
    add('IMPOERTANT.md','3 / content approval vs write vs activation','POLICY','COVERED','EXTEND','procedures/GOVERNED_LEARNING.md|runtime/learning.py','Separate capture/adoption/effect references; local fields authenticate none of them.')
    add('IMPOERTANT.md','4 / knowledge lifecycle','PROCEDURE','MISSING','IMPLEMENT_CONTROL','schemas/LESSON.schema.json|runtime/learning.py','CANDIDATE/SUPPORTED/NEEDS_REVIEW/STALE/SUPERSEDED/REJECTED independent from execution state.')
    add('IMPOERTANT.md','4 / action lifecycle','PROCEDURE','PARTIAL','IMPLEMENT_CONTROL','schemas/LESSON.schema.json|runtime/learning.py','NOT_APPLIED/APPLIED/DEFERRED/NOT_APPLICABLE separate from disposition; applied claims require artifact and check evidence.')
    add('IMPOERTANT.md','5-6 / owning architecture and single store','POLICY','COVERED','EXTEND','policies/CHANGE_CONTROL.md|procedures/GOVERNED_LEARNING.md','Reuse existing rules and intake; no competing policy or user-global memory store.')
    add('IMPOERTANT.md','6.6 / existing learn commands','SKILL','UNVERIFIED','RECONCILE','procedures/GOVERNED_LEARNING.md|design/LEARNING_SOURCE_REVIEW.json','External commands are optional capture adapters after actual host review; no reserved slash alias or invented native command.')
    add('IMPOERTANT.md','6.7 / hooks and private transcripts','RISK','COVERED','REUSE','design/LEARNING_SOURCE_REVIEW.json|procedures/GOVERNED_LEARNING.md','Inspected pinned hook code and write destinations without executing it; no installation, background collection or transcript migration.')
    add('IMPOERTANT.md','6.8 / qualified lesson implementation','TECHNICAL_CONTROL','PARTIAL','IMPLEMENT_CONTROL','runtime/learning.py|tests/test_learning.py','Keep extraction, approval, effect and verification explicit; route improvements to existing procedure/skill or test.')
    add('IMPOERTANT.md','6.9 / stale and superseded lessons','PROCEDURE','PARTIAL','EXTEND','procedures/MAINTENANCE.md|runtime/learning.py','Candidate changes and review dates block reliance; preserve previous IDs and explicit successor links.')
    add('IMPOERTANT.md','6.10 / false lesson negative case','TECHNICAL_CONTROL','MISSING','IMPLEMENT_CONTROL','tests/test_learning.py','Rejected knowledge never passes promotion checks.')
    add('IMPOERTANT.md','6.10 / injection negative case','TECHNICAL_CONTROL','PARTIAL','IMPLEMENT_CONTROL','tests/test_learning.py','Unknown approval fields rejected; malicious source prose can be captured as data without changing active files.')
    add('IMPOERTANT.md','6.10 / duplicate and conflict cases','TECHNICAL_CONTROL','PARTIAL','IMPLEMENT_CONTROL','tests/test_learning.py','Exact overlap and recorded decision conflicts block new instruction promotion; semantic coverage still requires review.')
    add('IMPOERTANT.md','6.10 / global-policy and stale-version cases','TECHNICAL_CONTROL','PARTIAL','IMPLEMENT_CONTROL','tests/test_learning.py','Missing adoption authority, unsafe targets, changed candidate and expired applicability do not pass promotion checks.')
    add('IMPOERTANT.md','7 / installing Aprende now','SKILL','CONFLICT','REJECT','design/LEARNING_SOURCE_REVIEW.json','Use original host-neutral AGHR implementation; external skill/scripts remain inspected sources only.')
    add('IMPOERTANT.md','retrospective triggers and Definition of Done','PROCEDURE','PARTIAL','RECONCILE','protocols/EXECUTION.md|procedures/GOVERNED_LEARNING.md','A learning review is required at meaningful checkpoints; NO_NEW_LESSON is valid and owner pause takes precedence.','MUST')
    add('IMPOERTANT.md','mandatory always convert to rule and write memory','RULE','CONFLICT','REJECT','procedures/GOVERNED_LEARNING.md','No automatic global rule/skill/memory promotion; disposition follows support, scope and actual authority.','MUST')
    add('IMPOERTANT.md','PREFER/AVOID force labels','RECOMMENDATION','CONFLICT','RECONCILE','schemas/LESSON.schema.json','Use the existing normative taxonomy; map preferences/avoidance to applicable SHOULD/SHOULD_NOT or INFORMATIVE.')
    add('IMPOERTANT.md','Docker/MSSQL example','LESSON','NOT_APPLICABLE','REFERENCE_ONLY','guide/LEARNING_AND_REPORTS_AR.md','Illustration is not observed evidence here; do not impose its container prerequisite universally.','INFORMATIVE')
    add('IMPOERTANT.md','startup brief and memory folder proposal','PROCEDURE','PARTIAL','RECONCILE','procedures/COMMUNICATION_AND_HANDOFF_AR.md|policies/CONTEXT_AND_MODELS.md','Retrieve only task-relevant accepted guidance through existing handoff/intake; no full-history preload or duplicate memory files.')
    add('IMPOERTANT.md','quality criteria and reusable skill','SKILL','MISSING','EXTEND','optional_skills/governed-learning/SKILL.md','Add one complete evidence/classification workflow wrapper; no compulsory host installation or unfinished skill stub.')
    add('learning_proposal.md','1 / five lessons','LESSON','PARTIAL','RECONCILE','design/INBOX_RECONCILIATION.json','Reconcile against the more precise for-learning corrections; preserve the original as pending proposal.')
    add('learning_proposal.md','2 / blanket AGENTS patch','RULE','CONFLICT','REJECT','AGENTS.md','No universal POSIX operations, blanket decoding or independent state rewrite; retain a short route to owning procedures.')
    add('learning_proposal.md','3 / optional inbox skill','SKILL','COVERED','REJECT','procedures/PROJECT_INBOX.md','Existing inbox procedure and CLI suffice; the new distinct learning skill does not duplicate them.')
    guide='MARSAD_Agent_Language_and_Decision_Guide_2026-10-19.md'
    add(guide,'1-4 / reading result, scope, verification and authority','REFERENCE_DOCUMENT','COVERED','REUSE','procedures/COMMUNICATION_AND_HANDOFF_AR.md|guide/LEARNING_AND_REPORTS_AR.md','Reuse scoped outcome/evidence/decision reporting without importing a project taxonomy.','INFORMATIVE')
    add(guide,'5-10 / identifiers and qualification states','REFERENCE_DOCUMENT','NOT_APPLICABLE','REFERENCE_ONLY','guide/LEARNING_AND_REPORTS_AR.md','MARSAD G/W/PR/I/V/E identifiers are project-specific examples, not universal AGHR state values.','INFORMATIVE','MARSAD_ONLY')
    add(guide,'11-14 / tests, review, Git and architecture language','REFERENCE_DOCUMENT','COVERED','REUSE','procedures/COMMUNICATION_AND_HANDOFF_AR.md','Keep tests/review/acceptance/merge/publication distinct and link evidence.','INFORMATIVE')
    add(guide,'15 / historical MARSAD cases','OBSERVATION','UNVERIFIED','REFERENCE_ONLY','design/INBOX_RECONCILIATION.md','MARSAD runtime/CI facts were not refreshed in this repository; no live claims are inherited.','INFORMATIVE','MARSAD_ONLY')
    add(guide,'16-24 / hypothetical examples and owner decisions','RECOMMENDATION','COVERED','REUSE','guide/LEARNING_AND_REPORTS_AR.md','Use narrow conditional examples and owner decision questions without compulsory long reports for small edits.','INFORMATIVE')
    add(guide,'25 and appendices A/B / glossary and source limits','REFERENCE_DOCUMENT','NOT_APPLICABLE','REFERENCE_ONLY','design/INBOX_RECONCILIATION.md','Retain educational reference status; do not copy the 260-entry project glossary into governing instructions.','INFORMATIVE','MARSAD_ONLY')
    add('MARSAD_Agent_Language_and_Decision_Guide_2026-10-19.pdf','entire paired PDF','REFERENCE_DOCUMENT','UNVERIFIED','REFERENCE_ONLY','design/INBOX_SOURCES.json','Independent original hash; text extraction is review evidence, not a proof of exact semantic equivalence with Markdown.','INFORMATIVE','MARSAD_ONLY')

    receipt=json.loads((ROOT/'docs/evidence/inbox/2026-10-20-custody.json').read_text(encoding='utf-8'))
    sources={'scope':'Eight owner-supplied inputs; external originals are preserved outside this portable distribution.',
             'source_authority':'UNKNOWN_UNLESS_SEPARATELY_ESTABLISHED', 'files':receipt['files']}
    ledger=[]
    for source in sources['files']:
        if source['name'].lower().endswith('.md'):
            lines=(INBOX/source['name']).read_text(encoding='utf-8').splitlines()
            headings=[{'line':n,'heading':line,'locator_kind':'MARKDOWN_HEADING'} for n,line in enumerate(lines,1) if re.match(r'^#{1,4} ',line)]
            if not headings:
                headings=[{'line':1,'heading':'Entire document body; source has no Markdown headings','locator_kind':'DOCUMENT_BODY'}]
            ledger.append({'source':source['name'],'headings':headings,'disposition_rows':[row['id'] for row in ROWS if row['source']==source['name']]})
    # Read-only PDF inspection; preserve the binary original and do not infer exact equivalence.
    import pymupdf
    with pymupdf.open(INBOX/'MARSAD_Agent_Language_and_Decision_Guide_2026-10-19.pdf') as document:
        sources['pdf_inspection']={'pages':len(document),'extracted_characters':sum(len(page.get_text()) for page in document),'exact_markdown_equivalence':'NOT_PROVEN','method':'PyMuPDF text extraction; no PDF mutation'}
    design=PACKAGE/'design'
    for name,record in [('INBOX_SOURCES.json',sources),('INBOX_RECONCILIATION.json',{'schema_version':'1.0','review_date':'2026-10-20','scope':'Owner-directed package update; classifications/dispositions are scoped engineering judgments, not universal semantic proof.','rows':ROWS,'source_section_index':ledger})]:
        (design/name).write_text(json.dumps(record,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
    external=json.loads((EVIDENCE/'external-source-receipt.json').read_text(encoding='utf-8'))
    external['role']='SUPPLEMENTARY_WORKFLOW_SOURCE_NOT_RULE_AUTHORITY'
    external['observations']=['Plugin metadata version 0.1.1; SKILL frontmatter version 0.1.0; pin commit rather than selecting either as the whole-source identity.',
      'Five-pass candidate review, four observation destinations and a four-part lesson model are useful concepts; AGHR authored its own procedure/schema/runtime.',
      'External skill directs dual writes to CLAUDE/AGENTS, host-specific memory destinations and incomplete skill stubs; AGHR uses one canonical intake and qualified complete skills.',
      'hooks.json registers PostToolUse and Stop shell scripts. Capture handler records error signals and repeated-edit paths in user Claude directories; Stop handler emits a reminder.',
      'Hook code was read, never executed. Runtime privacy, host event behavior, Windows shell behavior and effective permissions are NOT_QUALIFIED.',
      'Confirmation fields, confidence and a user correction do not authenticate general rule authority or causal truth.']
    (design/'LEARNING_SOURCE_REVIEW.json').write_text(json.dumps(external,indent=2)+'\n',encoding='utf-8')
    counts=dict(collections.Counter(row['disposition'] for row in ROWS))
    lines=['# مصالحة الوارد وتطوير التعلم المحكوم — 1.2.0','',
      f'راجع هذا التحديث الملفات الثمانية وصنف {len(ROWS)} بنداً/مجموعة مطالبات. المصادر وبصماتها في [إيصال المصادر](INBOX_SOURCES.json)، والتفاصيل ومعرفات كل بند وفهرس أقسام الوثائق في [المصفوفة](INBOX_RECONCILIATION.json). هذه أحكام مراجعة محددة بالنطاق، وليست إثباتاً آلياً لاكتمال التغطية الدلالية.','',
      'السلطة الحالية هي طلب المالك في 2026-10-20 لتحديث الحزمة وترقية المرشح إلى مرجع؛ النصوص السابقة داخل الوارد التي كانت تقصر العمل على الاقتراح بقيت محفوظة كمصدر. لا يرث أي مستهلك قرار التبني من مجرد استلام هذه الحزمة.','',
      '## تحليل IMPOERTANT.md','',
      'اعتمد التحديث فكرة Scan/Generate/Dedup/Confirm/Execute بعد تكييفها، وحالة المعرفة المنفصلة عن حالة الأثر، ونموذج المشكلة والسبب والدليل والمنع والكشف. أضيفت مراجعة صلاحية لاحقة. جرى حل التعارض مع النص اللاحق الذي يفرض تحويل كل درس إلى قاعدة وذاكرة: المراجعة مطلوبة عند الحدود المهمة، بينما التحويل والحفظ والتفعيل قرارات مختلفة بحسب الدليل والتفويض. لا يلزم إنشاء درس في كل جلسة، ولا يُخترع سبب جذري من نجاح محاولة ثانية.','',
      'فُحص [مصدر Aprende المثبت](LEARNING_SOURCE_REVIEW.json) مع ملف المهارة وHooks ومقاصد الكتابة ودورة التقادم والترخيص. سجلنا اختلاف إصدار الإضافة 0.1.1 عن ترويسة المهارة 0.1.0؛ هوية الفحص هي commit المثبت، لا رقم مستنتج. لم يثبت هذا الفحص تأهيل المضيف أو سلامة التشغيل الفعلي. لا تتضمن الحزمة تثبيتاً أو مراقبة محادثات أو كتابة ذاكرة عامة.','',
      '## تصرفات البنود','', '| ID | المصدر / القسم | النوع | التغطية السابقة | التصرف | الموضع والنتيجة |','| --- | --- | --- | --- | --- | --- |']
    for row in ROWS:
        links=', '.join('['+target+'](../'+target+')' for target in row['targets'])
        lines.append(f"| {row['id']} | {row['source']} / {row['section']} | {row['kind']} | {row['coverage_before']} | {row['disposition']} / {row['engineering_action']} | {links}: {row['finding_and_effect']} |")
    lines+=['','## الحدود والبنود المتبقية','',
      'دليل Antigravity المشار إليه في guide.md غير مرفق؛ يتطلب مصدراً وإصداراً وبيئة محددة قبل أي موائم جديد. خصائص MARSAD وحالاته وأرقام CI تبقى معلومات مشروع آخر غير متحققة هنا. PDF وMarkdown أصلان مستقلان؛ لم نثبت التطابق الكامل بينهما. بناء واجهة Explorer جديدة لإدارة الدروس مؤجل كميزة منتج منفصلة. هذه البنود مسجلة وليست شروطاً مخفية لاعتبار أدوات المرجع المحلية مكتملة ضمن نطاقها.','',
      'التصرف الحاكم يستخدم نفس القيم الست في سجل LESSON؛ أما REUSE/CLARIFY/EXTEND/IMPLEMENT_CONTROL فهي أفعال هندسية في حقل منفصل. REFERENCE_DOCUMENT تصنيف أصل مرجعي، وليس نوع درس جديداً في مخطط LESSON. تستند المبادئ العامة إلى القواعد القائمة AGHR-002/004/006/013–017/021–023/026/029/031–032/038/045، لذلك لم نضف قواعد مرقمة مترادفة. [التعلم المحكوم](../procedures/GOVERNED_LEARNING.md) هو الإجراء المالك، والمهارة والقالب والمخطط والأداة والاختبارات تشير إليه.']
    (design/'INBOX_RECONCILIATION.md').write_text('\n'.join(lines)+'\n',encoding='utf-8')
    print(json.dumps({'inputs':len(sources['files']),'reviewed_groups':len(ROWS),'dispositions':counts,'pdf_pages':sources['pdf_inspection']['pages']}))

if __name__=='__main__':main()
