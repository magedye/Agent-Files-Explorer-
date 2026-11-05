import fs from 'node:fs';
import path from 'node:path';

const baseDir = path.resolve('server/studio/sgo/data');

const indexData = JSON.parse(fs.readFileSync(path.join(baseDir, 'QLE_423_V12_ITEM_INDEX.json'), 'utf8'));
const mappingData = JSON.parse(fs.readFileSync(path.join(baseDir, 'source_to_candidates.json'), 'utf8'));
const queueData = JSON.parse(fs.readFileSync(path.join(baseDir, 'OWNER_REVIEW_QUEUE.json'), 'utf8'));
const recommendationsData = JSON.parse(fs.readFileSync(path.join(baseDir, 'PRIORITY_11_RECOMMENDATIONS_NOT_APPROVED.json'), 'utf8'));

// Load curated workbook datasets
const workbookItems451 = fs.existsSync(path.join(baseDir, 'workbook_451_items.json'))
  ? JSON.parse(fs.readFileSync(path.join(baseDir, 'workbook_451_items.json'), 'utf8'))
  : [];
const workbookAdditions28 = fs.existsSync(path.join(baseDir, 'workbook_28_additions.json'))
  ? JSON.parse(fs.readFileSync(path.join(baseDir, 'workbook_28_additions.json'), 'utf8'))
  : [];
const workbookRelations294 = fs.existsSync(path.join(baseDir, 'workbook_294_relations.json'))
  ? JSON.parse(fs.readFileSync(path.join(baseDir, 'workbook_294_relations.json'), 'utf8'))
  : [];
const workbookTests882 = fs.existsSync(path.join(baseDir, 'workbook_882_tests.json'))
  ? JSON.parse(fs.readFileSync(path.join(baseDir, 'workbook_882_tests.json'), 'utf8'))
  : [];

// Build lookup maps
const mappingById = new Map();
for (const m of mappingData) {
  mappingById.set(m.id, m);
}

// Map AAPES 12 domains to QLE items deterministically based on kind, family, authority domain
const aapesDomains = [
  'D01', 'D02', 'D03', 'D04', 'D05', 'D06',
  'D07', 'D08', 'D09', 'D10', 'D11', 'D12'
];

function inferAapesDomains(item, mapping) {
  const domains = ['D01', 'D02']; // All items have D01 (Authority) and D02 (Atomicity)
  const kind = (item.kind_candidate || mapping?.inferred_kind || '').toUpperCase();
  const domain = (item.authority_domain_candidate || '').toUpperCase();
  
  if (kind === 'CONSTRAINT' || domain.includes('INTEGRITY')) domains.push('D03', 'D05');
  if (item.test_case_count > 0 || (mapping?.case_count || 0) > 0) domains.push('D04');
  if (item.origin === 'V4') domains.push('D06', 'D07');
  if (domain.includes('EVALUATION') || domain.includes('BENCHMARK')) domains.push('D08');
  if (item.review_flags && item.review_flags.length > 0) domains.push('D09');
  if (domain.includes('SECURITY') || domain.includes('PROTECTION')) domains.push('D10');
  if (item.origin === 'SOURCE_255') domains.push('D11');
  domains.push('D12'); // Governance change package lineage
  return [...new Set(domains)];
}

// Compile 423 items
const compiledItems = indexData.items.map((item, idx) => {
  const map = mappingById.get(item.id) || {};
  const caseIds = map.case_ids || [
    `${item.id}-V12-POSITIVE`,
    `${item.id}-V12-NEGATIVE`,
    `${item.id}-V12-BOUNDARY`,
    `${item.id}-V12-UNVERIFIABLE`
  ];
  
  const originalAr = item.original_wording_ar || map.source_text_ar || '';
  const candidateAr = item.candidate_wording_ar || map.proposed_statement_ar || originalAr;
  const proposedEn = map.proposed_statement_en || null;
  const force = item.source_declared_force || map.source_force || 'MUST';
  const baselineRef = map.baseline_ref || (item.origin === 'SOURCE_255' ? item.id : null);
  const crossrefs = map.crossrefs || [item.id];
  const aapesRefs = inferAapesDomains(item, map);
  
  return {
    id: item.id,
    candidate_id: item.candidate_id || `QLE-GIC-${item.id}-V12INPUT`,
    origin: item.origin, // 'V4' | 'V2' | 'SOURCE_255'
    title_ar: item.title_ar || `${item.id}: بند الحوكمة الدلالية`,
    title_en: `${item.id}: Semantic Governance Clause`,
    source_declared_force: force,
    proposed_force: force,
    original_statement_ar: originalAr,
    proposed_statement_ar: candidateAr,
    proposed_statement_en: proposedEn,
    atomicity: item.atomicity || map.atomicity || 'ATOMIC',
    family: item.family || 'GOVERNANCE',
    kind_candidate: item.kind_candidate || map.inferred_kind || 'REQUIREMENT',
    authority_domain_candidate: item.authority_domain_candidate || 'TEXT_INTEGRITY',
    scope_trigger: item.scope_trigger || `نطاق التطبيق وسياق التفعيل لقاعدة ${item.id}`,
    application_modes: item.application_modes || ['SCHEMA_CONSTRAINT'],
    verification_modes: item.verification_modes || ['DETERMINISTIC_PREDICATE'],
    owner_review_flags: item.owner_review_flags || map.review_flags || ['OWNER_APPROVAL_NOT_GRANTED'],
    baseline_ref: baselineRef,
    crossrefs: crossrefs,
    case_ids: caseIds,
    case_count: caseIds.length,
    test_execution_status: 'DESIGNED_NOT_RUN', // Invariant: Designed tests are NOT executed
    potentially_protected: !!map.potentially_protected,
    aapes_domains: aapesRefs,
    decision_status: 'PENDING_OWNER_REVIEW'
  };
});

// Compile 11 Priority Groups with exact Arabic text, options, and row citations
const priorityGroupsData = [
  {
    id: "V4-D01",
    priority: "P0",
    title_ar: "اختيار بنية المدونة الموحدة المرشحة (110 قواعد)",
    title_en: "Adoption of Unified Candidate Codex Structure (110 Rules)",
    question_ar: "هل تعتمد استخدام 110 قواعد v4 كطبقة تنظيمية مرشحة فوق السجل الأصلي 255، مع إبقاء الأصول سارية بحسب وضعها الحالي حتى يُعتمد استبدالها صراحة؟",
    options: [
      { id: "APPROVE_PROPOSAL", label_ar: "قبول البنية التنظيمية فقط (مع حفظ الأصول 255)", effect_ar: "يسمح بترتيب الحزم التنظيمية دون إحلال معياري ودون تفعيل" },
      { id: "APPROVE_WITH_CHANGES", label_ar: "قبول معدل بشروط محددة", effect_ar: "يتطلب تقديم التعديل الدقيق وتعليله وحفظ النسخ السابقة" },
      { id: "REJECT", label_ar: "رفض المقترح التنظيمي", effect_ar: "رفض المقترح مع حفظ تاريخه وأصله في السجل" },
      { id: "DEFER", label_ar: "تأجيل القرار", effect_ar: "يبقى القرار غير محسوم وتبقى الالتزامات الأصلية نافذة" },
      { id: "REQUEST_EVIDENCE", label_ar: "طلب أدلة إضافية", effect_ar: "طلب إثباتات تكافؤ الحكم قبل اتخاذ القرار" }
    ],
    recommended_option: "APPROVE_PROPOSAL",
    recommendation_advisory_note: "توصية استشارية غير مختارة: نعم للتصميم التنظيمي المرشح فقط؛ لا ترقية للتفعيل ولا إلغاء للأصل 255.",
    rows: [
      "QL4-A01", "QL4-A02", "QL4-A03", "QL4-A04", "QL4-A05", "QL4-A06", "QL4-A07", "QL4-X01", "QL4-X02",
      "QL4-B01", "QL4-B02", "QL4-B03", "QL4-B04", "QL4-B05", "QL4-B06", "QL4-B07", "QL4-B08", "QL4-B09", "QL4-X03", "QL4-X04", "QL4-X51",
      "QL4-C01", "QL4-C02", "QL4-C03", "QL4-C04", "QL4-C05", "QL4-C06", "QL4-C07", "QL4-C08", "QL4-C09", "QL4-C10", "QL4-C11", "QL4-X05", "QL4-X06", "QL4-X07", "QL4-X08", "QL4-X52",
      "QL4-D01", "QL4-D02", "QL4-D03", "QL4-D04", "QL4-D05", "QL4-D06", "QL4-D07", "QL4-X09", "QL4-X10", "QL4-X11", "QL4-X12", "QL4-X13",
      "QL4-E01", "QL4-E02", "QL4-E03", "QL4-E04",
      "QL4-F01", "QL4-F02", "QL4-F03", "QL4-F04", "QL4-F05", "QL4-F06", "QL4-F07", "QL4-F08", "QL4-X19", "QL4-X20", "QL4-X21", "QL4-X22", "QL4-X44",
      "QL4-G01", "QL4-G02", "QL4-G03", "QL4-G04", "QL4-G05", "QL4-G06", "QL4-G07", "QL4-X23", "QL4-X24", "QL4-X25", "QL4-X33", "QL4-X34", "QL4-X49",
      "QL4-H01", "QL4-H02", "QL4-H03", "QL4-H04", "QL4-H05", "QL4-X14", "QL4-X15", "QL4-X16", "QL4-X17", "QL4-X18", "QL4-X28", "QL4-X29", "QL4-X30", "QL4-X31", "QL4-X32", "QL4-X40", "QL4-X42", "QL4-X43", "QL4-X46", "QL4-X36", "QL4-X37", "QL4-X38", "QL4-X39", "QL4-X47", "QL4-X48", "QL4-X26", "QL4-X27", "QL4-X35", "QL4-X41", "QL4-X45", "QL4-X50"
    ],
    citation: "OWNER_PRIORITY_DECISIONS_AR.md §V4-D01; OWNER_RULE_DECISION_TABLE_DRAFT_423.xlsx!H2",
    status: "PENDING_OWNER_REVIEW"
  },
  {
    id: "V4-D02",
    priority: "P0",
    title_ar: "فروق الإلزام الجوهرية المحتملة",
    title_en: "Substantive Normative Force Differences",
    question_ar: "أي تخفيف أو تشديد أو إعادة توزيع للقوة الإلزامية بين أحكام الأصل وقواعد v4 تقبله، بعد مقارنة الشرط والممثل والنطاق؟",
    options: [
      { id: "REQUEST_EVIDENCE", label_ar: "طلب أدلة ومقارنة تفصيلية قبل أي تعديل", effect_ar: "يمنع أي تخفيف إلزامي دون قرار محدد ومعلل ويحكم الأصل" },
      { id: "APPROVE_WITH_CHANGES", label_ar: "اعتماد فروق محددة حصراً بالصفوف والتعليل", effect_ar: "تحديث ملفات الانطباق للبند المعين فقط" },
      { id: "DEFER", label_ar: "تأجيل التغيير وإبقاء الأصل", effect_ar: "بقاء النسخ الأصلية والخلافات كما هي" }
    ],
    recommended_option: "REQUEST_EVIDENCE",
    recommendation_advisory_note: "توصية استشارية: لا تخفف حكماً إلزامياً إلا بقرار محدد ومعلل؛ اجعل الأصل يحكم أي تفصيل لم يثبت تكافؤه.",
    rows: [
      "QL4-B05", "QL4-B09", "QL4-X04", "QL4-C08", "QL4-X52", "QL4-D04", "QL4-D07", "QL4-E03", "QL4-F07", "QL4-F08",
      "QL4-X20", "QL4-G07", "QL4-H03", "QL4-H05", "QL4-X29", "QL4-X31", "QL4-X32", "QL4-X37", "QL4-X27", "QL4-X45",
      "LISAN-GOV-068", "LISAN-GOV-077", "LISAN-GOV-095", "LISAN-GOV-097", "LISAN-GOV-117", "LISAN-GOV-136", "LISAN-GOV-137",
      "LISAN-GOV-156", "LISAN-GOV-157", "LISAN-GOV-162", "LISAN-GOV-165", "LISAN-GOV-180", "LISAN-GOV-183", "LISAN-GOV-204",
      "LISAN-GOV-205", "LISAN-GOV-209", "LISAN-GOV-210", "LISAN-GOV-214", "LISAN-GOV-216", "LISAN-GOV-217", "LISAN-GOV-227",
      "LISAN-GOV-237", "LISAN-GOV-238", "LISAN-GOV-239", "LISAN-GOV-248"
    ],
    citation: "OWNER_PRIORITY_DECISIONS_AR.md §V4-D02; OWNER_RULE_DECISION_TABLE_DRAFT_423.xlsx!H3",
    status: "PENDING_OWNER_REVIEW"
  },
  {
    id: "V4-D03",
    priority: "P0",
    title_ar: "42 بندًا مرتبطًا موضوعيًا دون تضمين مثبت",
    title_en: "42 Topically Linked Items Without Proven Subsumption",
    question_ar: "هل تريد استبدال أي من هذه الأحكام الأصلية الـ42؟ وإذا نعم، ما القاعدة البديلة الدقيقة التي تحفظ كل واجب وإجراء؟",
    options: [
      { id: "DEFER", label_ar: "الإبقاء على 42 بنداً مرجعياً دون استبدال", effect_ar: "يحفظ 42 حكماً أصلياً مستقلاً حتى يثبت تكافؤ كل التزام بدقة" },
      { id: "APPROVE_WITH_CHANGES", label_ar: "استبدال جزئي محدد مع جدول تغطية الذرات", effect_ar: "يتطلب جدول مطابقة ذرية كامل يثبت عدم إسقاط أي واجب" },
      { id: "REQUEST_EVIDENCE", label_ar: "طلب دراسة تغطية تفصيلية", effect_ar: "إجراء تدقيق تغطية مستقل" }
    ],
    recommended_option: "DEFER",
    recommendation_advisory_note: "توصية استشارية: الإبقاء على 42 بنداً مرجعياً غير مستبدل (منها 28 حكماً قوياً) إلى حين إثبات تغطية مفردة لكل حكم.",
    rows: [
      "QL4-A04", "QL4-B04", "QL4-C01", "QL4-C02", "QL4-C03", "QL4-C04", "QL4-C07", "QL4-C10", "QL4-C11", "QL4-D02",
      "QL4-D03", "QL4-D06", "QL4-E01", "QL4-F04", "QL4-F07", "QL4-F08", "QL4-G01", "QL4-G02", "QL4-G03", "QL4-G05",
      "QL4-G06", "QL4-H01", "QL4-H02", "LISAN-GOV-002", "LISAN-GOV-004", "LISAN-GOV-005", "LISAN-GOV-009", "LISAN-GOV-011",
      "LISAN-GOV-012", "LISAN-GOV-042", "LISAN-GOV-047", "LISAN-GOV-051", "LISAN-GOV-056", "LISAN-GOV-057", "LISAN-GOV-061",
      "LISAN-GOV-091", "LISAN-GOV-113", "LISAN-GOV-114", "LISAN-GOV-115", "LISAN-GOV-117", "LISAN-GOV-120", "LISAN-GOV-122",
      "LISAN-GOV-123", "LISAN-GOV-124", "LISAN-GOV-125", "LISAN-GOV-126", "LISAN-GOV-128", "LISAN-GOV-129", "LISAN-GOV-132",
      "LISAN-GOV-135", "LISAN-GOV-142", "LISAN-GOV-152", "LISAN-GOV-155", "LISAN-GOV-157", "LISAN-GOV-159", "LISAN-GOV-164",
      "LISAN-GOV-166", "LISAN-GOV-178", "LISAN-GOV-179", "LISAN-GOV-183", "LISAN-GOV-184", "LISAN-GOV-189", "LISAN-GOV-200",
      "LISAN-GOV-233", "LISAN-GOV-243"
    ],
    citation: "OWNER_PRIORITY_DECISIONS_AR.md §V4-D03; OWNER_RULE_DECISION_TABLE_DRAFT_423.xlsx!H4",
    status: "PENDING_OWNER_REVIEW"
  },
  {
    id: "V4-D04",
    priority: "P0",
    title_ar: "المحافظة على الهدف الذهبي للجذر (LISAN-GOV-244)",
    title_en: "Preservation of Golden Root Hypothesis (LISAN-GOV-244)",
    question_ar: "هل أية صياغة في 110 تُغيّر قصدك من إلزام محاولة اكتشاف جامع واختبارها دون فرض النجاح؟",
    options: [
      { id: "APPROVE_WITH_CHANGES", label_ar: "إبقاء GOV-244 مرجعاً للمقصد وصياغة مراجعة محددة", effect_ar: "إلزام محاولة كشف المفهوم الجامع واختبارها دون فرض نجاح مصطنع" },
      { id: "DEFER", label_ar: "تأجيل البت وإبقاء النص الأصلي لـ LISAN-GOV-244", effect_ar: "حفظ الحكم الذهبي الأصلي كما هو" },
      { id: "REQUEST_EVIDENCE", label_ar: "طلب مراجعة الصياغات البديلة مع الأصل", effect_ar: "مقارنة C03 وC04 وC05 وX48 بالأصل" }
    ],
    recommended_option: "APPROVE_WITH_CHANGES",
    recommendation_advisory_note: "توصية استشارية: إبقاء GOV-244 مرجعاً للمقصد: إلزام محاولة كشف المفهوم الجامع واختبارها دون فرض نجاح؛ لا تخفيف ولا إنكار للوحدة.",
    rows: [
      "QL4-C03", "QL4-C04", "QL4-C05", "QL4-X48", "LISAN-GOV-045", "LISAN-GOV-046", "LISAN-GOV-242", "LISAN-GOV-244", "LISAN-GOV-250"
    ],
    citation: "OWNER_PRIORITY_DECISIONS_AR.md §V4-D04; OWNER_RULE_DECISION_TABLE_DRAFT_423.xlsx!H5",
    status: "PENDING_OWNER_REVIEW"
  },
  {
    id: "V4-D05",
    priority: "P1",
    title_ar: "حالة UNRESOLVED_CORE والتوافق العقدي",
    title_en: "UNRESOLVED_CORE State and Contract Compatibility",
    question_ar: "هل تقر إضافة حالة عقدية جديدة (UNRESOLVED_CORE) إلى محرك لسان أم تؤجل ذلك حتى مراجعة توافق العقود؟",
    options: [
      { id: "DEFER", label_ar: "تأجيل إضافة الحالة العقدية إلى المحرك", effect_ar: "عدم إدراج UNRESOLVED_CORE كقيمة تعداد في المحرك حالياً وحفظها كملصق تحليلي خارجي" },
      { id: "REQUEST_EVIDENCE", label_ar: "طلب دراسة الأثر العقدي في المحرك", effect_ar: "فحص توافق المخططات في Lisan-Engine" },
      { id: "REJECT", label_ar: "رفض الحالة العقدية الجديدة", effect_ar: "الاكتفاء بحالات المحرك القائمة" }
    ],
    recommended_option: "DEFER",
    recommendation_advisory_note: "توصية استشارية: تأجيل إضافة UNRESOLVED_CORE كقيمة تعداد جديدة في المحرك لحين دراسة التوافق العقدي.",
    rows: ["QL4-X08", "LISAN-GOV-102", "LISAN-GOV-144"],
    citation: "OWNER_PRIORITY_DECISIONS_AR.md §V4-D05; OWNER_RULE_DECISION_TABLE_DRAFT_423.xlsx!H6",
    status: "PENDING_OWNER_REVIEW"
  },
  {
    id: "V4-D06",
    priority: "P0",
    title_ar: "تصحيح إحالة 091 والتشوهات الطباعية",
    title_en: "Correction of Crossref 091 and Textual Defects",
    question_ar: "هل تعتمد تصحيح الإحالات الخاطئة والتشوهات الطباعية في النصوص مع التحقق من عدم المساس بالمعنى المعياري؟",
    options: [
      { id: "REQUEST_EVIDENCE", label_ar: "طلب التحقق من سلامة التصحيح ومطابقة المعنى", effect_ar: "التحقق من أن تصحيح الإحالة لا يغير الالتزام الموضوعي" },
      { id: "APPROVE_PROPOSAL", label_ar: "اعتماد التصحيحات النصية المصوبة فقط", effect_ar: "تصحيح إحالة 091 مع حفظ التاريخ الأصلي" },
      { id: "DEFER", label_ar: "تأجيل البت وإبقاء الأصل المطبوع", effect_ar: "إبقاء النص الأصلي كما هو" }
    ],
    recommended_option: "REQUEST_EVIDENCE",
    recommendation_advisory_note: "توصية استشارية: التحقق من الإحالات والنصوص المصوبة؛ التصحيحات يجب ألا تمس المعنى الدلالي.",
    rows: ["QL4-B04", "LISAN-GOV-091"],
    citation: "OWNER_PRIORITY_DECISIONS_AR.md §V4-D06; OWNER_RULE_DECISION_TABLE_DRAFT_423.xlsx!H7",
    status: "PENDING_OWNER_REVIEW"
  },
  {
    id: "V4-D07",
    priority: "P1",
    title_ar: "علاقة 58 بندًا تاريخيًا بالإصدار v4",
    title_en: "Relationship of 58 Historical V2 Items to v4",
    question_ar: "ما الوضع المعياري الذي تقره للـ 58 بنداً التاريخية (v2): هل تبقى مرجعية تاريخية أم تُنسخ رسمياً؟",
    options: [
      { id: "DEFER", label_ar: "إبقاء الـ 58 بنداً كمرجعية تاريخية سارية دون نسخ رسمي", effect_ar: "حفظ السجلات الـ 58 كمرجع تاريخي وتأجيل الإحلال الرسمي" },
      { id: "APPROVE_WITH_CHANGES", label_ar: "إحلال مقيد ومفصل لكل بند مثبت التكافؤ", effect_ar: "تحديد البنود المنسوخة بدقة في السجل" },
      { id: "REQUEST_EVIDENCE", label_ar: "طلب تقرير مقارنة شامل لـ 58 بنداً مع v4", effect_ar: "إعداد مصفوفة تتبع دقيقة" }
    ],
    recommended_option: "DEFER",
    recommendation_advisory_note: "توصية استشارية: إبقاء الـ 58 بنداً تاريخية حتى يصدر قرار نسخ رسمي معلل.",
    rows: Array.from({length: 58}, (_, i) => `QL2-${String(i+1).padStart(3, '0')}`),
    citation: "OWNER_PRIORITY_DECISIONS_AR.md §V4-D07; OWNER_RULE_DECISION_TABLE_DRAFT_423.xlsx!H8",
    status: "PENDING_OWNER_REVIEW"
  },
  {
    id: "V4-D08",
    priority: "P1",
    title_ar: "ربط التقييم السلوكي والمقياس",
    title_en: "Behavioral Model Evaluation and Metric Linkage",
    question_ar: "هل تريد تكليف تجربة منفصلة بقياس أثر 110 قواعد؟ وبأي نموذج وميزانية ومحك مرجعي؟",
    options: [
      { id: "DEFER", label_ar: "تأجيل التقييم الحي المدفوع والبدء بربط الاختبارات المصممة محلياً", effect_ar: "ربط 1568 اختباراً مصمماً محلياً دون استدعاءات نماذج مدفوعة وتأجيل Promptfoo" },
      { id: "APPROVE_PROPOSAL", label_ar: "الموافقة على خطة التقييم السلوكي بميزانية محددة", effect_ar: "إصدار تفويض منفصل للتقييم مع حوكمة التكاليف" },
      { id: "REQUEST_EVIDENCE", label_ar: "طلب خطة متطلبات وميزانية مفصلة", effect_ar: "إعداد كشف التكاليف والمحكات المرجعية" }
    ],
    recommended_option: "DEFER",
    recommendation_advisory_note: "توصية استشارية: ربط الاختبارات الـ1568 المصممة محلياً دون تكاليف مدفوعة؛ تأجيل التقييم الخارجي لتفويض منفصل.",
    rows: ["ALL_423_ITEMS"],
    citation: "OWNER_PRIORITY_DECISIONS_AR.md §V4-D08; OWNER_RULE_DECISION_TABLE_DRAFT_423.xlsx!H9",
    status: "PENDING_OWNER_REVIEW"
  },
  {
    id: "G1-D09",
    priority: "P1",
    title_ar: "فصل قوة المصدر عن خلاف التصنيف وقوة الملف الناقصة",
    title_en: "Separation of Source Force from Classification Conflicts and Missing Force",
    question_ar: "ما القوة والتفسير اللذان تقرهما للبنود الستة عشر ذات ملصق غير محسوم ولملفات 244..255 الناقصة، مع بقاء الأصل محفوظًا؟",
    options: [
      { id: "REQUEST_EVIDENCE", label_ar: "طلب أدلة مع إبقاء القوة المنقولة للأصل دون ملء افتراضي", effect_ar: "KEEP_ORIGINAL للقوة المنقولة؛ لا تملأ null ولا تفرض SHOULD افتراضياً" },
      { id: "APPROVE_WITH_CHANGES", label_ar: "تثبيت قوة صريحة للبند المحدد بالصف والتعليل", effect_ar: "تحديد القوة الإلزامية لكل بند على حدة" },
      { id: "DEFER", label_ar: "تأجيل البت في البنود الـ 16 وملفات 244-255", effect_ar: "حفظ الوضع الحالي دون إحلال" }
    ],
    recommended_option: "REQUEST_EVIDENCE",
    recommendation_advisory_note: "توصية استشارية: KEEP_ORIGINAL للقوة المنقولة؛ لا تملأ null ولا تفرض SHOULD افتراضياً.",
    rows: [
      "LISAN-GOV-001", "LISAN-GOV-002", "LISAN-GOV-009", "LISAN-GOV-010", "LISAN-GOV-012", "LISAN-GOV-054",
      "LISAN-GOV-067", "LISAN-GOV-075", "LISAN-GOV-102", "LISAN-GOV-112", "LISAN-GOV-144", "LISAN-GOV-155",
      "LISAN-GOV-171", "LISAN-GOV-178", "LISAN-GOV-181", "LISAN-GOV-207", "LISAN-GOV-244", "LISAN-GOV-245",
      "LISAN-GOV-246", "LISAN-GOV-247", "LISAN-GOV-248", "LISAN-GOV-249", "LISAN-GOV-250", "LISAN-GOV-251",
      "LISAN-GOV-252", "LISAN-GOV-253", "LISAN-GOV-254", "LISAN-GOV-255"
    ],
    citation: "OWNER_PRIORITY_DECISIONS_AR.md §G1-D09; OWNER_RULE_DECISION_TABLE_DRAFT_423.xlsx!H10",
    status: "PENDING_OWNER_REVIEW"
  },
  {
    id: "G1-D10",
    priority: "P1",
    title_ar: "النطاق والترجمة المقترحان",
    title_en: "Proposed Scopes and Translations",
    question_ar: "هل تريد اعتماد صياغة أو نطاق أو استثناء أو ترجمة بعينها؟ حدّد المعرف والنص والقوة والنطاق؛ ليست العبارات القالبية مصدر إذن.",
    options: [
      { id: "DEFER", label_ar: "إبقاء الترجمة ومساحات النطاق القالبية DRAFT دون اعتماد جماعي", effect_ar: "NO_ACTION للنص الكافي؛ إبقاء الترجمات مسودة حتى مراجعة تكافؤ الحكم" },
      { id: "APPROVE_WITH_CHANGES", label_ar: "اعتماد ترجمة أو استثناء لبند محدد بالاسم والصف", effect_ar: "حصر الاعتماد بالبنود المحددة حصراً" },
      { id: "REQUEST_EVIDENCE", label_ar: "طلب تدقيق لغوي للترجمات الإنجليزية المقترحة", effect_ar: "إجراء مراجعة لغوية مستقلة" }
    ],
    recommended_option: "DEFER",
    recommendation_advisory_note: "توصية استشارية: NO_ACTION للنص الكافي؛ أبق الترجمة مسودة DRAFT حتى مراجعة تعادل الحكم؛ لا اعتماد جماعي للاستثناءات.",
    rows: ["EXPLICIT_GROUP_SCOPE_ONLY"],
    citation: "OWNER_PRIORITY_DECISIONS_AR.md §G1-D10; OWNER_RULE_DECISION_TABLE_DRAFT_423.xlsx!H11",
    status: "PENDING_OWNER_REVIEW"
  },
  {
    id: "G1-D11",
    priority: "P0",
    title_ar: "الخط الأساس المحدد وإذن G0 المنفصل",
    title_en: "Specified Baseline and Separate G0 Authorization",
    question_ar: "ما نسخة وصفوف الخط الأساس المعياري التي قررتها؟ وهل تأذن صراحة بتخطيط G0 فقط بعد تسليم الجدول؟",
    options: [
      { id: "OWNER_DECISION_REQUIRED_LATER", label_ar: "إرسال قرار محدد النسخة والنطاق في جلسة المالك المستقلة", effect_ar: "لا يبدأ G0 بالاسم أو الصمت أو الجدول وحده بل بإذن مستقل منفصل" },
      { id: "DEFER", label_ar: "تأجيل التخطيط لمرحلة G0", effect_ar: "بقاء المشروع في مرحلة المراجعة الحالية G-1" }
    ],
    recommended_option: "OWNER_DECISION_REQUIRED_LATER",
    recommendation_advisory_note: "توصية استشارية: إرسال قرار محدد النسخة والنطاق في جلسة المالك؛ لا يبدأ G0 بالاسم أو الصمت أو الجدول وحده.",
    rows: ["SEPARATE_EXPLICIT_OWNER_DECISION"],
    citation: "OWNER_PRIORITY_DECISIONS_AR.md §G1-D11; OWNER_RULE_DECISION_TABLE_DRAFT_423.xlsx!H12",
    status: "PENDING_OWNER_REVIEW"
  }
];

// Compile Semantic Relations (edges between items)
const relations = [];
let relId = 1;

for (const item of compiledItems) {
  // Baseline reference relations
  if (item.baseline_ref && item.baseline_ref !== item.id) {
    relations.push({
      id: `REL-${String(relId++).padStart(4, '0')}`,
      source: item.id,
      target: item.baseline_ref,
      type: item.origin === 'V4' ? 'CANDIDATE_SEMANTIC_EQUIVALENT' : 'SUBSUMES',
      direction: 'DIRECTED',
      confidence: item.origin === 'V4' ? 0.85 : 0.95,
      basis: 'EXPLICIT_BASELINE_REF',
      explanation: `العلاقة المرجعية بين ${item.id} والأصل ${item.baseline_ref}`,
      evidence_refs: [`QLE_423_Skill_v1.2.0#source_to_candidates.json#${item.id}`],
      status: 'CANDIDATE_UNVERIFIED'
    });
  }

  // Cross reference relations
  if (item.crossrefs) {
    for (const ref of item.crossrefs) {
      if (ref !== item.id && ref !== item.baseline_ref) {
        relations.push({
          id: `REL-${String(relId++).padStart(4, '0')}`,
          source: item.id,
          target: ref,
          type: 'TOPICALLY_RELATED',
          direction: 'BIDIRECTIONAL',
          confidence: 0.75,
          basis: 'SOURCE_CROSSREF',
          explanation: `إحالة موضوعية متبادلة بين ${item.id} و ${ref}`,
          evidence_refs: [`QLE_423_V12_ITEM_INDEX.json#${item.id}`],
          status: 'CANDIDATE_UNVERIFIED'
        });
      }
    }
  }

  // Exact duplicate text detection
  for (const other of compiledItems) {
    if (other.id !== item.id && other.original_statement_ar && other.original_statement_ar.length > 20 && other.original_statement_ar === item.original_statement_ar) {
      // Add exact text duplicate only once per pair
      if (item.id < other.id) {
        relations.push({
          id: `REL-${String(relId++).padStart(4, '0')}`,
          source: item.id,
          target: other.id,
          type: 'EXACT_TEXT_DUPLICATE',
          direction: 'BIDIRECTIONAL',
          confidence: 1.0,
          basis: 'BYTE_EXACT_TEXT_MATCH',
          explanation: `تطابق لفظي حرفي بين نص ${item.id} ونص ${other.id} (تطابق لفظي فقط ولا يعني التكافؤ المعياري)`,
          evidence_refs: ['BYTE_COMPARISON'],
          status: 'CANDIDATE_UNVERIFIED'
        });
      }
    }
  }
}

// Compile 2,240 Test Case Designs (all DESIGNED_NOT_RUN)
const testCases = [];
let testSeq = 1;
for (const item of compiledItems) {
  const count = item.case_count || 4;
  for (let c = 0; c < count; c++) {
    const caseType = c === 0 ? 'POSITIVE' : c === 1 ? 'NEGATIVE' : c === 2 ? 'BOUNDARY' : 'UNVERIFIABLE';
    testCases.push({
      test_id: `TC-${item.id}-${caseType}`,
      item_id: item.id,
      title: `فحص ${caseType} لقاعدة ${item.id}`,
      case_type: caseType,
      designed_oracle: `DETERMINISTIC_ASSERTION_${caseType}`,
      execution_status: 'DESIGNED_NOT_RUN', // Crucial: must NOT be reported as executed
      actual_result: null,
      evidence_receipt: null
    });
  }
}

// Compiled SGO dataset
const compiledSgo = {
  version: "1.0.0",
  contract_version: "1.2.0",
  metadata: {
    total_items: compiledItems.length,
    v4_count: compiledItems.filter(i => i.origin === 'V4').length,
    v2_count: compiledItems.filter(i => i.origin === 'V2').length,
    source_255_count: compiledItems.filter(i => i.origin === 'SOURCE_255').length,
    additions_28_count: workbookAdditions28.length,
    expanded_owner_review_count: compiledItems.length + workbookAdditions28.length,
    priority_groups_count: priorityGroupsData.length,
    total_relations: relations.length,
    workbook_relations_count: workbookRelations294.length,
    workbook_relations_fact_count: workbookRelations294.filter(r => r.basis === 'FACT').length,
    workbook_relations_inference_count: workbookRelations294.filter(r => r.basis === 'INFERENCE').length,
    total_designed_tests: testCases.length,
    workbook_designed_tests: workbookTests882.length,
    executed_tests: 0,
    active_approvals: 0,
    owner_decisions_recorded: 0
  },
  items: compiledItems,
  additions_28: workbookAdditions28,
  items_451: [...compiledItems, ...workbookAdditions28.map(a => ({
    id: a.id,
    origin: 'QLE_ADD',
    title_ar: a.title_ar,
    title_en: `${a.id}: Proposed Addition`,
    source_declared_force: 'SHOULD',
    proposed_force: 'SHOULD',
    original_statement_ar: a.original_statement_ar || '',
    proposed_statement_ar: a.proposed_statement_ar || '',
    family: 'QLE_ADD',
    priority: a.priority,
    treatment_proposed: a.treatment_proposed,
    test_execution_status: 'DESIGNED_NOT_RUN'
  }))],
  priority_groups: priorityGroupsData,
  relations: relations,
  workbook_relations_294: workbookRelations294,
  test_cases: testCases,
  workbook_tests_882: workbookTests882
};

fs.writeFileSync(path.join(baseDir, 'sgo-compiled.json'), JSON.stringify(compiledSgo, null, 2), 'utf8');
console.log('Successfully compiled SGO dataset:');
console.log(compiledSgo.metadata);
