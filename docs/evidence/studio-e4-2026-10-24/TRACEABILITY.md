# تتبع القبول — نواة E4 المحلية

| المطلب | موضع الإنفاذ | الدليل الفعلي |
| --- | --- | --- |
| الأصل والبصمة ورفض الدليل الأجنبي/المحاكى | [evidence.py](../../../server/studio/aghr/e4/evidence.py) load_events/read_artifact | a وE4 evidence tests؛ ادعاء PASS مستورد يبقى NOT_OBSERVABLE |
| الفصل بين outcomes والملاءمة والتفويض | [discovery.py](../../../server/studio/aghr/e4/discovery.py) discover | b، وتصحيح e-correction: no-match مقابل تعذر الخدمة، وتغطية جزئية مقابل صلاحية مفقودة |
| حالات الاستخدام مستقلة وحيازة intent | [الجسر](../../../server/studio/aghr/e4-bridge.js) و[lifecycle.py](../../../server/studio/aghr/e4/lifecycle.py) | task tokens خاصة، لا JSON كبديل؛ إعادة البحث تبطل الاختيار القديم؛ H1 وH5 |
| H1 لا VERIFIED بلا تنفيذ | bind_execution ثم transition | loaded-not-executed.stdout.json النهائي exit1؛ محاولة تغيير JSON المعاد لا تغير الحيازة |
| H2 لا PASS لمعرف مجهول | discover + bridge states | unknown-id.stdout.json النهائي exit1 |
| H3 لا PASS لخرج فارغ | bind_execution + برنامج empty.py حقيقي | process exit0، ثم EMPTY_OUTPUT ورفض التحقق |
| H4 استهلاك task_criteria | [results.py](../../../server/studio/aghr/e4/results.py) verify | معيار خاطئ يرفض، وصحيح ينجح على المخرجات نفسها؛ hashes/results لكل شرط |
| H5 BLOCKED ليست NO_SKILL_MATCH | discover | صلاحية مفقودة توقف؛ مهمة بسيطة لا تحتاج مهارة صالحة |
| H6 لا HOST_SIGNAL بلا رصد | transition + bridge private acknowledgement | رفض عند تعطيل الرصد حتى بعد تنفيذ حقيقي؛ قبول إقرار Job/PID حقيقي للمضيف المحلي فقط |
| H7 إبطال التأهيل القديم | [qualify.py](../../../server/studio/aghr/e4/qualify.py) check + qualificationKey | إصدار قديم ومحتوى متغير NOT_RUN؛ نفس السجل المدعوم فعليًا QUALIFIED محليًا |
| الحد الأدنى والتسامح والأدلة الفريدة | [eval.py](../../../server/studio/aghr/e4/eval.py) evaluate | ≥3 run ids حقيقية؛ P0-Safety tolerance0؛ عدم قبول قيمة verified يرسلها العميل |
| T15 | job-runner.js/windows-job.py الأصليان دون تعديل | eval600s وqualify3600s، 2GiB، flags0x2200 وactive_processes_after0 في كل إيصال |
| المصدر المقفل والطبقات السابقة | verifyE4/verifyE3 وSOURCE.lock | تحقق قبل/بعد كل استدعاء؛ القفل النهائي يتضمن bridge normalized، وcustody يثبت الخام |
| عدم ترقية درس إلى سياسة | worker governed-learning المحلي + معايير promotion/owner/root_cause | S8 يقرأ المصدر الحقيقي ويخرج مقترحًا مصنفًا فقط، دون state/source write |

الملفات النهائية العامة تحت `cli-v2/`، وإيصالات التنفيذ والمصفوفات تحت `final-local-v2/ACCEPTANCE.json`. نجاح الاختبارات المحلية لا يمنح المنتج تأهيل Codex/Antigravity أو قبول إصدار. private RPC ليس واجهة عامة لقبول producer claims.
