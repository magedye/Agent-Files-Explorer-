# الإنفاذ وإثبات الالتزام — Controls, Trust & Assurance

## 1. طبقة الضبط ليست طريقة التحقق

| نوع الهدف | Control | Proof | القيد |
|---|---|---|---|
| أسلوب الإجابة | PROMPT / Few-shot | Rubric بشرية/آلية | لا حسم شامل للمحتوى الدلالي |
| JSON صالح | Constrained decoding / Validator | Parser + JSON Schema | بنية ≠ إذن تنفيذ |
| نقاط معدودة بدقة | Output Validator | عداد حتمي | لا يثبت صحة مضمون النقاط |
| عدم إفشاء معلومة | Access control + redaction + monitoring | Permission tests + leakage probes | تصنيف LLM وحده غير كافٍ |
| منع أداة حساسة | AuthN/AuthZ + PDP/PEP | Integration & bypass tests | يجب إثبات عدم وجود مسار جانبي |
| قرار إنساني حرج | Human Gate + trusted record | Approval log + scope check | ادعاء النموذج بأنه «موافق» ليس موافقة |
| تعارض مصدرين | Authority resolver + owner escalation | Source/version/decision record | التاريخ الأحدث لا يحسم وحده |

## 2. PEP/PDP/PIP/PAP

- `PAP` مسؤولة عن إدارة السياسات المعتمدة وإصداراتها.
- `PDP` تقرر `ALLOW`/`DENY`/`INDETERMINATE` (أو `REQUIRE_APPROVAL` حسب التصميم).
- `PEP` تعترض الإجراء الحقيقي وتفرض القرار.
- `PIP` توفر معلومات موثوقة مثل الصلاحيات والخصائص والبيئة.
- `IdP` جهة تحقق هوية المستخدم/الخدمة/الوكيل.
- `Audit` يربط القرار والفعل بالنسخ والهويات وسجلات موثوقة.

في الأفعال الحساسة عندما تكون الأدلة غير كافية، يجب أن يكون القرار التنفيذـي `DENY`, حتى لو كان النموذج يقترح الإجراء. هناك فرق بين `DENY` على أداة حساسة وبين `INCONCLUSIVE` في تحليل نص إرشادي.

## 3. مثال بوابة نشر

**نسخة تعليمية فقط**:

```text
request = {principal, environment, artifact_digest, action}
trusted = identity_service.lookup(principal)
approval = approval_service.get_verified_approval(request)
decision = policy_engine.evaluate(request, trusted, approval)
if decision != ALLOW:
    block(); audit(decision, "DENIED")
else:
    enforce_scope_and_execute_once(); audit(receipt)
```

هذا pseudocode وليس تطبيقًا جاهزًا. يجب فحص التجاوز، وربط الإذن بالإصدار والبيئة، وصلاحية التفويض، وعدم التكرار.

## 4. مخاطر شائعة تُنسى

- `TOCTOU`: تغير الحالة بين التفويض والتنفيذ؛ طبّق الضمانات قرب العملية أو في معاملة ذرية حيث يلزم.
- `Replay`: صلاحية مستند الموافقة لا تمنع إعادة استخدامه؛ استخدم ضبطًا ذريًا لعدم التكرار عند التنفيذ.
- `Cross-tenant`: تحقق من طرف النطاق/المستأجر في هوية مستقلة عن LLM.
- `Indirect Prompt Injection`: النص المسترجع والمستندات والإيميلات والتعليمات داخل ملفات البيانات غير موثوقة كأوامر حاكمة.
- `Delegation escalation`: وكيل فرعي لا يجوز أن يمتلك تفويضًا أعلى من أصله، وموافقته لا تعوّض موافقة المؤسسة.
- `Error branch`: فشل الشبكة أو تعطل PDP ليس سماحًا افتراضيًا في العملية الحساسة.
- `Tool schema`: مخطط بيانات يضبط الشكل ولا يثبت أن العملية قانونية أو مأذونة.
- `Audit spoofing`: سجل يكتبه النموذج عن نفسه ليس دليلًا مستقلًا على تشغيل أداة.

## 5. Traceability

```text
Source and authority
   -> one atomic obligation
       -> designated control owner + enforcement path
          -> oracle-defined test cases
             -> execution evidence + policy/model version
                -> independent review when required
                   -> owner decision
                      -> activation evidence (if authorized)
```

## 6. تقدير أثر الضوابط

قارن: الجودة/الرفض الخاطئ، زمن الاستجابة، استهلاك التكلفة، قابلية التحقيق، أمان الأسرار، وعمليات التعافي. اختبر P0 كحواجز صلبة مستقلة عن متوسط جودة المهمة. لا تجعل تكلفة إضافية صغيرة تبرر تجاوز عملية تفويض حساسة؛ ولا تُطبق متطلبات R3 كاملة على تنسيق عناوين R0 بلا سبب.
