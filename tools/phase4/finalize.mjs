import fs from 'node:fs';
import {out} from './prepare.mjs';
const log=fs.readFileSync(out+'/NPM_TEST_FINAL.log','utf8'),count=Number(log.match(/ℹ pass (\d+)/)?.[1]);if(!count||!log.includes('ℹ fail 0')||!log.includes('ℹ skipped 0'))throw Error('FINAL_REGRESSION_PENDING');
if(JSON.parse(fs.readFileSync(out+'/full-suite-final/HTTP_ACCEPTANCE.json')).status!=='PASS'||!fs.readFileSync(out+'/CONTRACTS_FINAL_V2.log','utf8').includes('ℹ pass 1'))throw Error('PHASE4_GATE_FAILED');
if(JSON.parse(fs.readFileSync(out+'/browser-final/BROWSER_ACCEPTANCE.json')).status!=='PASS')throw Error('BROWSER_GATE_FAILED');
fs.writeFileSync('docs/status/CURRENT.md',`# Active Project Execution State — Derived View

> Updated2026-10-24. Git, source and exact custody take precedence over this snapshot.

## Accepted position

Owner accepted E1/E2, T01–T05/T07–T10, E4 local core and T13–T18 Draft workflows. T06/T12/T19 accepted only in their explicit MOCK scopes. Original SEC-001 stays BLOCKED/3 without its real authority/gates/P0 evidence. T11 inventory accepted; no automatic Active adoption. Reference1.2.0 and E1–E4 source/contracts preserved.

Owner now formally accepts T22/T23/T24 and closure of Phase3 within [its documented NOT_RUN limits](../evidence/studio-phase3-2026-10-24/README.md). Codex's single extra attempt timed out before initialize; agy unavailable. Native checks REQUIRED / NOT_RUN / NOT_WAIVED; hosted CI publication NOT_RUN. No fresh diagnosis or publishing was attempted.

## Phase4 delivery — local Draft

[T25–T29 delivery](../evidence/studio-phase4-2026-10-24/README.md): separate Python proposal/hash/policy extension, shared CP identities and12-table SQLite, scoped one-use grants and audit. Meta changes route policies/schemas/tools through review; approval stays blocked until all registered behavioral evals/generation checks pass and distinct roles approve. No production meta evaluator registered/qualified yet.

Seven-step adoption was exercised through real3-run local qualification and owner Draft review; no skill installation/apply. Watcher is explicitly grant-activated on a trusted registered root,500ms debounce, md/yaml/json, bounded reads/exclusions/raw byte custody/dedup; no initial crawl or content execution. Lessons bind error/task/source hash and classifications, with UNPROVEN cause and proposed CP only. Unsupported causal claims and exact duplicates reject.

Calibration requires actual E4 eval,3 executions, measured before/after metrics + repo byte hash, target/source/reason/delta binding, then hash-bound owner approval. Ordinary create/edit cannot bypass this gate. Proposals and fixture evidence remain separate from canonical sources. Positive measurement evidence is confined to an isolated test repository; no production impact claim.

Verification: full${count}/${count}, final contract guard1/1, actual Edge AR/EN four widths/Sentinel and source preservation passed. First regression's SOURCE_DRIFT rejection retained; final run and custody are authoritative for this local delivery. No independent/release/Phase4 owner acceptance self-granted.

## Boundaries and next action

No reference/policy/state writes, owner default DB use, push/merge, native retry or T30/Phase5. Writing remains Draft-only. Reopen new custody and live Git before resuming. Next: owner review of Phase4 delivery and registration of project-specific trusted measurement/meta evaluators before operational use; absent configuration fails closed. Native/hosted gates remain separate.
`);
fs.writeFileSync('docs/status/HANDOFF.md',`# Studio handoff —2026-10-24, derived position

Branch main, base133746a0ad99d10568a44c8d225219df8454271c; prior dirty/untracked owner work preserved. No commit/push/merge. Owner accepted Phase3 within native/hosted NOT_RUN limits and authorized T25–T29. Reopen CURRENT, live Git and [Phase4 delivery/custody](../evidence/studio-phase4-2026-10-24/README.md).

Phase4 implemented/tested locally: meta CP routes, same-ID7-step adoption, real read-only qualification, explicitly authorized watcher, classified lesson proposals and actual-eval calibration. Python owns parse/JCS/hash/policy; original E1–E4/E5/E3 remain unchanged. SQLite stays12 tables, append-only audit, atomic Draft commits, hash-bound reviews/history. Legacy CP edits cannot bypass calibration or alter Phase4 CPs; frozen API reads keep contract.1 shape while extension uses phase4-local.1.

Tests: final full${count}/${count}, contract guard1/1, actual isolated Edge five workflows + bilingual/responsive/Sentinel, context and preservation receipts. First full run rejected changed Phase4 source; actual SQLite SOURCE_DRIFT is retained and final frozen regression supersedes it. Aggregate deadlines use immutable T15 profiles in addition to per-process600s eval/3600s qualify/2GiB. Runtime evidence/imported PASS cannot mint live proofs.

Operational gaps: owner must register actual project measurement/meta evaluators through trusted startup config. Without them calibration and meta approval block. Positive measurement evidence is an isolated repository fixture, not production improvement. Native Codex/Antigravity and hosted CI publication remain NOT_RUN; no further host attempt authorized. approved Phase4 CP means Draft review only, not export/apply/publication. Original SEC-001 unchanged/BLOCKED outside old MOCK scope.

Next: owner review of this delivery, then trusted project-specific evaluator registration and bounded operational trials. No automatic Phase5/T30, reference promotion, source apply, independent or release acceptance. Preserve source/evidence pins and backups.
`);
let p='docs/plans/STUDIO_UPGRADE_TASKS_AR.md',s=fs.readFileSync(p,'utf8');s=s.replace('| [ ] T23 —','| [x] T23 —').replace('UI_LOCAL_MATRIX_TESTED؛ NATIVE_ENVIRONMENT_BLOCKED','ACCEPTED_BY_OWNER_WITH_NATIVE_NOT_RUN').replace('| [ ] T24 —','| [x] T24 —').replace('CODE_LOCAL_TESTED؛ HOSTED_NOT_RUN','ACCEPTED_BY_OWNER_WITH_HOSTED_NOT_RUN');for(let n=25;n<=29;n++)s=s.replace('| [ ] T'+n+' —','| [x] T'+n+' —');s+='\n### تسليم المرحلة الرابعة في Draft\n\nاعتمد المالك إغلاق Phase3 ضمن حدود NOT_RUN وفوض T25–T29. [تسليم Phase4](../evidence/studio-phase4-2026-10-24/README.md): المسارات الخمسة منفذة ومختبرة محليًا؛ لا ترقية تلقائية للسياسة، ولا تبنٍ فعلي أو كتابة مرجع. نجاح CP معايرة في مستودع اختبار معزول لا يعاير المشروع الإنتاجي. تشغيل مقيّم الحزمة الإنتاجي وتسجيل مقاييس مشروع المالك لم ينفذا؛ عند غيابهما تستمر البوابات في الحجب. العلامات هنا IMPLEMENTED_TESTED_LOCAL_DRAFT؛ قبول المالك للمرحلة الرابعة أو الإصدار ليس ممنوحًا تلقائيًا.\n';fs.writeFileSync(p,s);
p='docs/INDEX.md';s=fs.readFileSync(p,'utf8');s+='\n- [Phase4 Draft governance and learning](evidence/studio-phase4-2026-10-24/README.md) — T25–T29, same-CP adoption, safe intake, lesson proposals and live-eval calibration; no canonical promotion.\n';fs.writeFileSync(p,s);
console.log(JSON.stringify({status:'DERIVED_DOCS_UPDATED',passed:count}));
