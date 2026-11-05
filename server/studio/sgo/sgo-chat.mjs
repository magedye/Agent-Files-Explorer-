/**
 * SGO Grounded Policy Chat: Evidence-Grounded, Bilingual, Offline-First
 */

function normalizeArabic(text) {
  if (!text) return '';
  return text
    .replace(/[\u064B-\u065F\u0670]/g, '') // Remove tashkeel / harakat
    .replace(/[إأآا]/g, 'ا') // Normalize alef
    .replace(/[يى]/g, 'ي') // Normalize yaa
    .replace(/ة/g, 'ه') // Normalize ta marbuta
    .toLowerCase()
    .trim();
}

export class SgoChat {
  constructor(store) {
    this.store = store;
  }

  ask(question, options = {}) {
    if (!question || typeof question !== 'string') {
      return {
        answer_ar: 'الرجاء إدخال سؤال أو استفسار محدد للبحث في مدونة الحوكمة.',
        answer_en: 'Please provide a valid question or query to search the governance codex.',
        status: 'INVALID_INPUT',
        citations: []
      };
    }

    const trimmed = question.trim();

    // -------------------------------------------------------------------------
    // Prompt Injection & Adversarial Defense Guard
    // -------------------------------------------------------------------------
    const injectionPatterns = [
      /ignore\s+(?:all\s+)?previous\s+instructions/i,
      /you\s+are\s+now\s+in\s+developer\s+mode/i,
      /system\s*override/i,
      /execute\s+(?:code|tool|command)/i,
      /disregard\s+(?:all\s+)?rules/i,
      /تجاهل\s+(?:جميع\s+)?التعليمات\s+السابقة/i,
      /أنت\s+الآن\s+متحرر\s+من\s+القيود/i
    ];

    for (const pat of injectionPatterns) {
      if (pat.test(trimmed)) {
        return {
          answer_ar: 'تم رصد محاولة حقن أوامر غير مصرح بها. يعمل مساعد الحوكمة في وضع القراءة الصارم المستند للأدلة ولا يملك صلاحية تجاوز القواعد أو تنفيذ أوامر برمجية.',
          answer_en: 'Unauthorized prompt injection detected. The Governance Assistant operates in strict, read-only evidence-grounded mode without tool execution capabilities.',
          status: 'PROMPT_INJECTION_DEFANGED',
          citations: []
        };
      }
    }

    // -------------------------------------------------------------------------
    // Exact ID Search (Item IDs or Decision IDs)
    // -------------------------------------------------------------------------
    const idMatch = trimmed.match(/\b(QL4-[A-Z0-9]+|LISAN-GOV-\d+|QL2-\d+|V4-D\d+|G1-D\d+)\b/i);
    if (idMatch) {
      const targetId = idMatch[1].toUpperCase();

      // Check if it's a priority decision
      if (targetId.startsWith('V4-D') || targetId.startsWith('G1-D')) {
        const dec = this.store.getPriorityDecision(targetId);
        if (dec) {
          return {
            query: trimmed,
            status: 'EVIDENCE_FOUND',
            answer_ar: `قرار الأولوية [${dec.id}] - ${dec.title_ar}:\n\nالسؤال: ${dec.question_ar}\n\nالتوصية الاستشارية (غير المختارة): ${dec.recommended_option} (${dec.recommendation_advisory_note})\n\nالصفوف المعنية: ${dec.rows.length} صفاً.\n\nحالة القرار: ${dec.status}.`,
            answer_en: `Priority Decision [${dec.id}] - ${dec.title_en}:\n\nQuestion: ${dec.question_ar}\n\nAdvisory Recommendation: ${dec.recommended_option}\n\nAffected Rows: ${dec.rows.length}\n\nStatus: ${dec.status}`,
            citations: [
              {
                source_id: 'OWNER_PRIORITY_DECISIONS_AR.md',
                sheet: 'قرارات_الأولوية',
                row_or_section: dec.id,
                citation_path: dec.citation,
                target_id: dec.id,
                target_type: 'PRIORITY_DECISION',
                excerpt_ar: dec.question_ar
              }
            ]
          };
        }
      }

      // Check if it's an item
      const item = this.store.getItem(targetId);
      if (item) {
        return {
          query: trimmed,
          status: 'EVIDENCE_FOUND',
          answer_ar: `بند الحوكمة [${item.id}] (${item.origin}):\n\nالعنوان: ${item.title_ar}\nالقوة الإلزامية: ${item.source_declared_force}\nالأصل المرجعي: ${item.baseline_ref || 'أصل مستقل'}\n\nالنص المعتمد:\n"${item.original_statement_ar}"\n\nنطاق التطبيق: ${item.scope_trigger}\nحالة الفحوص المصممة: ${item.test_execution_status} (${item.case_count} فحوص مصممة لم تُنفذ)`,
          answer_en: `Governance Item [${item.id}] (${item.origin}):\n\nForce: ${item.source_declared_force}\nBaseline Ref: ${item.baseline_ref || 'None'}\n\nStatement:\n"${item.proposed_statement_en || item.original_statement_ar}"`,
          citations: [
            {
              source_id: 'QLE_423_Skill_v1.2.0',
              sheet: 'البنود_423',
              row_or_section: item.id,
              citation_path: `QLE_423_V12_ITEM_INDEX.json#${item.id}`,
              target_id: item.id,
              target_type: 'GOVERNANCE_ITEM',
              excerpt_ar: item.original_statement_ar.slice(0, 150) + '...'
            }
          ]
        };
      }

      // If ID format matched but not found in repository
      return {
        query: trimmed,
        status: 'INSUFFICIENT_EVIDENCE',
        reason: `المعرف '${targetId}' غير موجود في سجل البنود الـ423 ولا في قرارات الأولوية الـ11.`,
        answer_ar: `عذراً، لم يتم العثور على المعرف '${targetId}' في سجل بنود الحوكمة المعتمدة (423 بنداً) أو قرارات الأولوية (11 قراراً). لا يتم اختلاق مصادر أو استنتاجات غير موثقة.`,
        answer_en: `Identifier '${targetId}' was not found in the 423 governance items or 11 priority decisions. No unverified sources will be manufactured.`,
        citations: []
      };
    }

    // -------------------------------------------------------------------------
    // Lexical Search with Arabic Normalization
    // -------------------------------------------------------------------------
    const normalizedQuery = normalizeArabic(trimmed);
    const queryTokens = normalizedQuery.split(/\s+/).filter(t => t.length > 2);

    if (queryTokens.length === 0) {
      return {
        query: trimmed,
        status: 'INSUFFICIENT_EVIDENCE',
        reason: 'كلمات البحث قصيرة جداً أو غير محددة.',
        answer_ar: 'الاستفسار غير محدد أو لا يحتوي على كلمات دلالية كافية للبحث الموثق في السجلات.',
        answer_en: 'Search query is too short or ambiguous.',
        citations: []
      };
    }

    // Search across 423 items and 11 priority groups
    const matchingItems = [];
    const allItems = this.store.getItems({ limit: 500 }).items;

    for (const item of allItems) {
      const normText = normalizeArabic(
        (item.id || '') + ' ' +
        (item.title_ar || '') + ' ' +
        (item.original_statement_ar || '') + ' ' +
        (item.scope_trigger || '')
      );

      let hits = 0;
      for (const token of queryTokens) {
        if (normText.includes(token)) hits++;
      }

      if (hits > 0) {
        matchingItems.push({
          item,
          score: hits / queryTokens.length
        });
      }
    }

    matchingItems.sort((a, b) => b.score - a.score);

    if (matchingItems.length === 0) {
      return {
        query: trimmed,
        status: 'INSUFFICIENT_EVIDENCE',
        reason: 'لم يتم العثور على شواهد أو نصوص مطابقة في مدونة الحوكمة الـ423.',
        answer_ar: `لم يتم العثور على أدلة موثقة أو بنود مطابقة للاستفسار في مدونة الحوكمة (423 بنداً). يمتنع المساعد عن تقديم استنتاجات تخمينية بدون نصوص مرجعية.`,
        answer_en: 'No verified citations or governance items matched this query. Speculative assertions without evidence are refused.',
        citations: []
      };
    }

    // Pick top 3 matches
    const topMatches = matchingItems.slice(0, 3);
    const citations = topMatches.map(m => ({
      source_id: 'QLE_423_Skill_v1.2.0',
      sheet: 'البنود_423',
      row_or_section: m.item.id,
      citation_path: `QLE_423_V12_ITEM_INDEX.json#${m.item.id}`,
      target_id: m.item.id,
      target_type: 'GOVERNANCE_ITEM',
      excerpt_ar: (m.item.original_statement_ar || '').slice(0, 140) + '...'
    }));

    const lines = topMatches.map((m, idx) => 
      `${idx + 1}. **[${m.item.id}]** (${m.item.source_declared_force}): "${(m.item.original_statement_ar || '').slice(0, 160)}..."`
    ).join('\n\n');

    return {
      query: trimmed,
      status: 'EVIDENCE_FOUND',
      matched_count: matchingItems.length,
      answer_ar: `تم العثور على ${matchingItems.length} بنداً مرتبطاً بالاستفسار:\n\n${lines}\n\nيمكنك النقر على أي معرف بند للانتقال إلى شاشة الفحص والتفاصيل الكاملة.`,
      answer_en: `Found ${matchingItems.length} governance items matching the query. Top citations are attached.`,
      citations
    };
  }
}
