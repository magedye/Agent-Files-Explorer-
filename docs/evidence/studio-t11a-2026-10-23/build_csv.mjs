import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import path from 'node:path';
import {Workbook} from '@oai/artifact-tool';

const out=path.resolve('docs/evidence/studio-t11a-2026-10-23');
const data=JSON.parse(await fs.readFile(path.join(out,'REVIEW_DECISIONS.json'),'utf8')).items;
const headers=['ترتيب','المعرف','فئة المصدر','وظيفة الوحدة','حالة المراجعة','التصرف المقترح','السبب','النوع المقترح غير المعتمد','نواقص rc.3 المثبتة','نواقص ومواءمات إضافية','السؤال المطلوب من المالك','هدف الربط البنيوي','مسار الاستخراج','استخراج مصدر منظم','زمن المراجعة المرصود ثانية','قراءة الملف ثانية','قراءة وتحليل دور الوكيل ثانية','تحقق آلي ثانية','إعادة عمل أولية ثانية','انتظار الأداة ثانية','مسار المصدر','الموضع في المصدر','بصمة المصدر SHA256','النص الأصلي'];
const safe=value=>{
 if(value==null)return '';
 if(typeof value!=='string')return value;
 return /^[\t\r\n ]*[=+@-]/u.test(value)?"'"+value:value;
};
const matrix=[headers,...data.map((d,n)=>[
 n+1,d.id,d.source_record_type,d.semantic_role,d.review_status,d.disposition||'UNRESOLVED',d.reason_ar,d.proposed_kind,
 d.confirmed_target_gaps.join('; '),d.missing_fields.join('; '),d.owner_question,d.merge_targets.join('; '),d.route,d.structured_extraction?'YES':'NO',
 d.review_seconds,d.read_seconds,d.classify_seconds,d.verification_seconds+d.supplementary_verification_seconds,d.rework_seconds,d.tool_wait_seconds,
 d.source.path,d.source.json_pointer||(d.source.line_start?`L${d.source.line_start}-L${d.source.line_end}`:'JSON root/projection'),d.source.sha256,d.original_text,
].map(safe))];
const book=Workbook.create(),sheet=book.worksheets.add('Review');
const range=sheet.getRangeByIndexes(0,0,matrix.length,headers.length);
range.values=matrix;
book.recalculate();
const values=range.values;
assert.deepEqual(values,matrix,'Artifact authoring must preserve every source/decision value');
assert.equal(values.length,51);assert.equal(new Set(values.slice(1).map(r=>r[1])).size,50);
const quote=v=>'"'+String(v??'').replaceAll('"','""')+'"';
const csv='\uFEFF'+values.map(row=>row.map(quote).join(',')).join('\r\n')+'\r\n';
await fs.writeFile(path.join(out,'T11A_REVIEW.csv'),csv,'utf8');
const inspect=await book.inspect({kind:'region',sheetId:'Review',range:'A1:F4',maxChars:1800,tableMaxRows:4,tableMaxCols:6});
await fs.writeFile(path.join(out,'CSV_ARTIFACT_INSPECT.txt'),inspect.ndjson,'utf8');
await fs.copyFile(new URL(import.meta.url),path.join(out,'build_csv.mjs'));
await fs.writeFile(path.join(out,'CSV_AUTHORING.json'),JSON.stringify({tool:'@oai/artifact-tool',rows:50,columns:headers.length,format:'UTF-8 BOM, RFC4180 quoted CSV, CRLF',method:'Workbook block values + documented range getter; CSV serialized from verified authored values. No XLSX requested or emitted.',literal_text_guard:'Prefix apostrophe for source strings beginning Excel formula control characters; original raw text remains exact in REVIEW_DECISIONS.json',checks:['all values equal authoring matrix','50 unique identities','all 50 source locations, hashes and reasons retained'],review_effect:'NONE; proposal export only'},null,2)+'\n');
console.log(JSON.stringify({status:'PASS',rows:50,columns:headers.length,path:'T11A_REVIEW.csv'}));
