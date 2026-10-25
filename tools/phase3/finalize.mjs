import fs from 'node:fs';
import {out} from './prepare.mjs';
const log=fs.readFileSync(out+'/NPM_TEST.log','utf8'),passed=Number(log.match(/ℹ pass (\d+)/)?.[1]);
if(!passed||!log.includes('ℹ fail 0')||!log.includes('ℹ skipped 0'))throw Error('FULL_TEST_GATE_PENDING');
if(!fs.readFileSync(out+'/CI_FOCUSED_FINAL.log','utf8').includes('ℹ pass 3'))throw Error('FINAL_CI_GATE_PENDING');
if(JSON.parse(fs.readFileSync(out+'/browser-final-v2/BROWSER_ACCEPTANCE.json')).status!=='PASS')throw Error('FINAL_BROWSER_GATE_PENDING');
fs.writeFileSync('docs/status/CURRENT.md',`# Active Project Execution State — Derived View

> Updated2026-10-24. Reopen Git, source and exact custody; prose is not authority.

## Accepted position

E1/E2, T01–T05/T07–T10 and E4 local core accepted by owner. T06/T12/T19 accepted only within explicit MOCK scopes; original SEC-001 remains BLOCKED/3 without real authority/gates/P0 evidence. T11 inventory accepted, no automatic Active adoption. T13–T18 Draft storage, grants,12 tables, hash-bound approvals, bounded local E3 generation and patch workflow accepted. Reference1.2.0, contracts and E1–E4 remain preserved.

T20/T21 now formally ACCEPTED_BY_OWNER: bounded verification, authenticated polling and original runtime-evidence reader. [Accepted delivery](../evidence/studio-native-t20-t21-2026-10-24/README.md).

## Current authorized delivery

[T22/T23/T24](../evidence/studio-phase3-2026-10-24/README.md): T22 real lifecycle HTTP/UI, three independent axes, actual criteria and3-run local qualification; scoped grants and durable history cannot restore live E4 proofs. T23 UI links the pinned8 scenarios and7 honesty results for the unchanged local core; every native column remains REQUIRED / NOT_RUN / NOT_WAIVED.

One additional owner-bounded Codex stdio diagnosis completed: no initialize response in20s, no diagnostic stderr, T15 tree reaped; ENVIRONMENT_BLOCKED, deeper cause UNPROVEN. agy absence is inherited from accepted observation; no second attempt/install. No native qualification claimed.

T24 provides scoped local PR-bundle preparation, exact original bytes/hashes, real E2/E4 inspection,100 seeded parity units, signed GitHub OIDC publisher and post-merge workflow. Only L0/NOT_RUN state is supported; existing qualified state cannot be downgraded. Matching JSON/producer labels never grant execution trust. Hosted PR/post-merge publication NOT_RUN; no state was written. Full suite${passed}/${passed}, final CI3/3, final Edge AR/EN/RTL and Sentinel passed. No independent/release acceptance.

## Preserved boundaries and next action

App writes only authorized disposable/Draft storage; no reference/source apply, owner default DB use, runtime_evidence rewrite, local state writer, push or merge. Owner permitted proceeding to publisher despite native blockers; this does not waive them or close Phase3 operational qualification. Reopen new custody before resuming. Next unfinished gates: owner review/deployment of the publisher followed by a genuine merged evidence PR; native trials require a working isolated channel and fresh authorization after the one-attempt limit. No automatic Phase4.
`);
fs.writeFileSync('docs/status/HANDOFF.md',`# Studio handoff —2026-10-24, derived position

Branch main, base133746a0ad99d10568a44c8d225219df8454271c; prior dirty work preserved. No commit/push/merge. Owner accepted T20/T21, authorized one bounded host diagnosis and T22–T24 regardless of its result. Reopen CURRENT, live Git and [delivery/custody](../evidence/studio-phase3-2026-10-24/README.md).

Native attempt: Codex stdio initialize timed out at20s with empty stderr; total controller22.641s, tree reaped under30s/2GiB. Further cause UNPROVEN. No agy installation/retry; accepted absence retained. Both hosts'7 checks/8 scenarios REQUIRED / NOT_RUN / NOT_WAIVED.

T22 real HTTP/UI handles select/load/execute/verify/eval/qualify/phase with mandatory one-use exact grants. Qualification uses actual3-run local evidence and host/version/scope/content/driver/engine tuple; imported/history JSON cannot restore proofs. T23 bilingual matrix separates pinned local conformance from native NOT_RUN. T24 prepares exact PR attachments locally, checks E2 strict and E4 imported-evidence trust, verifies signed GitHub identity/repo IDs/workflow/SHA/merged PR and non-force head update. Single remote state path, L0/NOT_RUN profile only; qualified-state update remains unavailable. No Studio state writer or PR creation.

Verification: full${passed}/${passed}; CI final3/3 (includes E4 mock-evidence rejection);100 seeded valid/invalid parity units; final Edge AR/EN four widths, keyboard and source/state sentinel; context/custody recorded in delivery. Full regression began before the final additive E4-inspection/UI metadata changes; final focused CI and rebuilt Edge checks cover those exact changes. Not an exact-source hosted CI run or independent review.

Next: review/deploy the workflow, then real merged evidence PR under GitHub OIDC. Hosted publication NOT_RUN. Native channel availability remains an environmental prerequisite, not waived. Do not retry native diagnosis automatically; owner authorized one attempt only. No Phase4, reference promotion, source apply or release acceptance. Original SEC-001 stays BLOCKED/3 outside prior authorized MOCK scope.
`);
let p='docs/plans/STUDIO_UPGRADE_TASKS_AR.md',s=fs.readFileSync(p,'utf8');
s=s.replace('TESTED_LOCAL_DRAFT؛ T15','ACCEPTED_BY_OWNER؛ T15').replace('TESTED_LOCAL_READ_ONLY؛ T20','ACCEPTED_BY_OWNER؛ T20');
s=s.replace('| [ ] T22 — دورة اختيار وتأهيل المهارة | T08','| [x] T22 — دورة اختيار وتأهيل المهارة | IMPLEMENTED_TESTED_LOCAL؛ T08');
s=s.replace('| [ ] T23 — سيناريوهات الصدق وتجارب المضيف | T22','| [ ] T23 — سيناريوهات الصدق وتجارب المضيف | UI_LOCAL_MATRIX_TESTED؛ NATIVE_ENVIRONMENT_BLOCKED؛ T22');
s=s.replace('| [ ] T24 — الأدلة وناشر CI والتطابق | T18','| [ ] T24 — الأدلة وناشر CI والتطابق | CODE_LOCAL_TESTED؛ HOSTED_NOT_RUN؛ T18');
s+='\n### تسليم T22–T24 بتفويض المالك\n\nاعتمد المالك T20/T21 وسمح ببدء الناشر رغم العائق الأصلي. [التسليم والأدلة](../evidence/studio-phase3-2026-10-24/README.md): محاولة Codex واحدة انتهت دون initialize؛ لا إعادة محاولة. T22 مرتبط فعليًا بالواجهة، T23 يعرض8+7 محليًا دون نقل التأهيل إلى المضيفين. T24 جهز مرفقات PR الأصلية وناشر OIDC وworkflow بعد الدمج، مع مقارنة100 بند. الملف المدعوم L0/NOT_RUN فقط؛ النشر المستضاف وتأهيل المضيفين NOT_RUN، لذلك لا إغلاق شامل للمرحلة الثالثة ولا بدء تلقائي للرابعة.\n';fs.writeFileSync(p,s);
p='docs/INDEX.md';s=fs.readFileSync(p,'utf8');s+='\n- [T22–T24 local delivery](evidence/studio-phase3-2026-10-24/README.md) — real skill lifecycle, native environmental blocker, PR-byte bundles and signed post-merge CI publisher; hosted publication NOT_RUN.\n';fs.writeFileSync(p,s);
console.log(JSON.stringify({status:'DERIVED_DOCS_UPDATED',full_tests:passed}));
