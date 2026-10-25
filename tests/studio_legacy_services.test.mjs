// T37: legacy-service contracts with temporary storage and scripted subprocess
// output. These tests do not run or qualify an AGHR engine or touch owner data.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import childProcess from 'node:child_process';
import {EventEmitter} from 'node:events';
import {syncBuiltinESMExports} from 'node:module';
import {evaluationService} from '../server/evaluation.js';
import {intakeService} from '../server/intake.js';
import {governanceService} from '../server/governance.js';
import {PROJECT_ROOT} from '../server/security.js';

function isolatedStorage(t,kind){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'aghr-t37-legacy-'));
 const target=path.join(PROJECT_ROOT,'.governance',kind),storage=path.join(root,kind),mocks=[];
 const map=p=>typeof p==='string'&&(p===target||p.startsWith(target+path.sep))?storage+p.slice(target.length):p;
 for(const name of ['existsSync','mkdirSync','writeFileSync','readFileSync','readdirSync']){
  const original=fs[name];
  mocks.push(t.mock.method(fs,name,function(p,...args){return original.call(this,map(p),...args);}));
 }
 t.after(()=>{for(const fn of mocks)fn.mock.restore();fs.rmSync(root,{recursive:true,force:true});});
 return storage;
}

test('T37 legacy intake persists proposals without approval and tolerates foreign corrupt history',t=>{
 const storage=isolatedStorage(t,'intake');
 t.mock.method(governanceService,'getRules',()=>[]);
 assert.deepEqual(intakeService.listPackets(),[]);assert.equal(intakeService.getPacket('absent'),null);
 assert.throws(()=>intakeService.submitIntake({rawText:'  '}),/cannot be empty/);
 const packet=intakeService.submitIntake({rawText:'A distinct requirement for local review.',metadata:{fixture:'SYNTHETIC_ONLY'}});
 assert.equal(packet.status,'PROPOSED_READY_FOR_REVIEW');assert.equal(packet.authorityRequired,'PROJECT_OWNER_OR_HOST_AUTHORITY');
 assert.ok(packet.changeItems.length>0);assert.ok(packet.changeItems.every(x=>x.status==='PROPOSED'));
 assert.deepEqual(intakeService.getPacket(packet.packetId),packet);
 fs.writeFileSync(path.join(storage,'old.json'),JSON.stringify({...packet,packetId:'CP-old',createdAt:'2000-01-01T00:00:00Z'}));
 fs.writeFileSync(path.join(storage,'bad.json'),'{invalid');fs.writeFileSync(path.join(storage,'ignored.txt'),'foreign');
 assert.deepEqual(intakeService.listPackets().map(p=>p.packetId),[packet.packetId,'CP-old']);
 assert.equal(intakeService.getPacket('bad'),null);assert.equal(intakeService.getPacket('absent'),null);
});

test('T37 legacy evaluation preserves failed and malformed subprocess output without granting review',async t=>{
 const storage=isolatedStorage(t,'evaluations'),observed=[];
 let response={stdout:'log\n{"status":"FAIL"}',stderr:'fixture diagnostic',code:1};
 const spawn=t.mock.method(childProcess,'spawn',(binary,args,options)=>{
  observed.push({binary,args,options});const child=new EventEmitter();child.stdout=new EventEmitter();child.stderr=new EventEmitter();
  queueMicrotask(()=>{if(response.error)child.emit('error',Error('scripted spawn failure'));else{child.stdout.emit('data',Buffer.from(response.stdout));child.stderr.emit('data',Buffer.from(response.stderr));child.emit('close',response.code);}});return child;
 });
 syncBuiltinESMExports();t.after(()=>{spawn.mock.restore();syncBuiltinESMExports();});
 assert.deepEqual(evaluationService.listEvaluationHistory(),[]);
 const failed=await evaluationService.runUnitTestSuite();
 assert.equal(failed.status,'FAIL');assert.equal(failed.exitCode,1);assert.equal(failed.rawStderr,'fixture diagnostic');
 assert.equal(failed.independent_review,'NOT_PERFORMED');assert.equal(failed.release_acceptance,'NOT_GRANTED');
 response={stdout:'{malformed',stderr:'retained',code:7};
 const malformed=await evaluationService.runUnitTestSuite();assert.equal(malformed.status,'FAIL');assert.equal(malformed.summary.raw_output_available,true);
 response={stdout:'{"status":"PASS"}',stderr:'',code:0};
 const pkg=await evaluationService.runPackageCheck();assert.equal(pkg.status,'PASS');assert.equal(pkg.report.status,'PASS');assert.equal(pkg.release_acceptance,'NOT_GRANTED');
 response={stdout:'not JSON',stderr:'failure bytes',code:2};
 const badPackage=await evaluationService.runPackageCheck();assert.equal(badPackage.status,'FAIL');assert.equal(badPackage.report,null);assert.equal(badPackage.rawStdout,'not JSON');
 response={error:true};
 const missing=await evaluationService.runPackageCheck();assert.equal(missing.status,'FAIL');assert.equal(missing.exitCode,-1);
 assert.ok(observed.length>=5);assert.ok(observed.every(x=>path.isAbsolute(x.binary)&&Array.isArray(x.args)&&x.options.cwd));
 fs.writeFileSync(path.join(storage,'bad.json'),'broken');fs.writeFileSync(path.join(storage,'ignored.txt'),'foreign');
 const history=evaluationService.listEvaluationHistory();assert.ok(history.length>0);assert.ok(history.every(x=>x.release_acceptance==='NOT_GRANTED'));
});

test('T37 reference projections filter sources and preserve typed graph relations without duplicating nodes',t=>{
 const fixture={id:'aghr_minimal_1_1_0',sources:[{id:'S1',title:'Evidence Source',publisher:'Publisher',kind:'standard',supported_takeaway:'Context',locator:'local',url:'https://example.invalid'}],rules:[{id:'R1',title:'First governing rule',text:'Example',force:'MUST',basis:['S1','absent'],explanation_ref:'contracts/GOVERNANCE.md'},{id:'R2',title:'Runtime rule',force:'SHOULD',basis:['S1'],explanation_ref:'contracts/RUNTIME.md'},{id:'R3',title:'Enforcement rule',force:'MUST_NOT',explanation_ref:'contracts/ENFORCEMENT.md'},{id:'R4',title:'Evidence rule',force:'INFO',explanation_ref:'contracts/EVIDENCE.md'},{id:'R5',title:'Core rule',force:'INFO',explanation_ref:'CORE.md'}],adapters:[{id:'fixture-adapter'}],profiles:{fixture:true}};
 t.mock.method(governanceService,'_getPackage',id=>id==='absent'?null:structuredClone(fixture));
 for(const filter of [{publisher:'other'},{kind:'other'},{search:'unmatched'},{packageId:'absent'}])assert.deepEqual(governanceService.getSources(filter),[]);
 assert.equal(governanceService.getSources({search:'evidence',publisher:'Publisher',kind:'standard'}).length,1);
 assert.equal(governanceService.getSource('S1').derived_rules.length,2);
 assert.equal(governanceService.getSource('missing'),null);assert.equal(governanceService.getSource('S1','absent'),null);
 assert.deepEqual(governanceService.getAdapters(),fixture.adapters);assert.deepEqual(governanceService.getProfiles(),fixture.profiles);
 assert.deepEqual(governanceService.getAdapters('absent'),[]);assert.deepEqual(governanceService.getProfiles('absent'),{});
 assert.deepEqual(governanceService.getRelationshipGraph('absent'),{nodes:[],edges:[]});
 const graph=governanceService.getRelationshipGraph();assert.equal(new Set(graph.nodes.map(n=>n.id)).size,graph.nodes.length);
 assert.equal(graph.edges.filter(e=>e.type==='AUTHORITATIVE_BASIS').length,2);
 assert.equal(graph.edges.filter(e=>e.type==='NORMATIVE_CONTRACT').length,5);
 assert.ok(graph.edges.every(e=>graph.nodes.some(n=>n.id===e.to)&&graph.nodes.some(n=>n.id===e.from)));
});
