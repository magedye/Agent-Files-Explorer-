import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {createJobRunner,resourceProfiles} from '../server/studio/aghr/job-runner.js';
const python=path.resolve('temp/aghr-e1a-20261022-01/venv/Scripts/python.exe'),cwd=process.cwd();
const profile=(timeoutMs=15000,memoryBytes=128*1024**2)=>({eval:{timeoutMs,memoryBytes},qualify:{timeoutMs,memoryBytes}});
const run=(code,options={})=>createJobRunner({python,profiles:profile(options.timeoutMs,options.memoryBytes)}).run('eval',{executable:python,args:['-I','-B','-S','-u','-c',code],cwd,...options});

test('T15 Windows job adapter captures normal stdout/stderr and enforces default profiles',async t=>{
 assert.deepEqual(resourceProfiles.eval,{timeoutMs:600000,memoryBytes:2147483648});assert.deepEqual(resourceProfiles.qualify,{timeoutMs:3600000,memoryBytes:2147483648});
 const r=await run('import sys; print("partial-out"); print("partial-err",file=sys.stderr)');
 assert.equal(r.status,'passed');assert.match(r.stdout,/partial-out/);assert.match(r.stderr,/partial-err/);assert.equal(r.active_processes_after,0);assert(r.resource_peak_mb>0);
 t.diagnostic(JSON.stringify(r));
});
test('T15 actual timeout reaps root and child tree and retains partial output',async t=>{
 // Leave room for Python/venv startup during the parallel repository suite.
 // The production 600s/3600s profiles remain unchanged. Still require the tree,
 // partial output, actual configured deadline and complete reaping.
 const r=await run('import subprocess,sys,time; p=subprocess.Popen([sys.executable,"-I","-B","-S","-c","import time; time.sleep(60)"]); print("CHILD:"+str(p.pid),flush=True); time.sleep(60)',{timeoutMs:10000});
 assert.equal(r.status,'resource_limit_exceeded');assert.equal(r.reason,'timeout');assert.equal(r.active_processes_after,0);assert.match(r.stdout,/CHILD:/);assert(r.observed_pids.length>=2);
 assert(r.duration_ms>=10000&&r.duration_ms<15000);
 for(const pid of r.observed_pids)assert.throws(()=>process.kill(pid,0));t.diagnostic(JSON.stringify(r));
});
test('T15 actual hard memory limit produces memory_limit with no surviving process',async t=>{
 const r=await run('import time; print("MEMORY_PROBE",flush=True); blocks=[]\ntry:\n while True: blocks.append(bytearray(8*1024*1024))\nexcept MemoryError:\n print("ALLOCATION_BLOCKED completed_bytes="+str(len(blocks)*8*1024*1024),flush=True); time.sleep(10)',{timeoutMs:5000});
 t.diagnostic(JSON.stringify(r));
 assert.equal(r.status,'resource_limit_exceeded');assert.equal(r.reason,'memory_limit');assert.equal(r.active_processes_after,0);assert.match(r.stdout,/MEMORY_PROBE/);
 assert.equal(r.started.hard_memory_bytes,134217728);assert.equal(r.started.limit_flags&0x2200,0x2200);
 // PeakJobMemoryUsed is retained verbatim. Observed Windows accounting can
 // include the rejected allocation; verify real denial, not an assumed bound
 // on that diagnostic counter. Both the old failed check and probe are saved.
 const allocated=/ALLOCATION_BLOCKED completed_bytes=(\d+)/.exec(r.stdout);assert(allocated,'The workload must observe a rejected allocation');assert(Number(allocated[1])<134217728);assert(r.resource_peak_mb>0);assert(r.memory_events.some(e=>[9,10].includes(e.message)||e.message===11&&(e.flags&0x200)));
});
test('T15 user cancellation differs from resource limit and output is bounded',async t=>{
 const controller=new AbortController();
 const cancelled=await run('import time; print("CANCEL_PROBE",flush=True); time.sleep(60)',{signal:controller.signal,onStarted:()=>setTimeout(()=>controller.abort(),150)});
 assert.equal(cancelled.status,'errored');assert.equal(cancelled.reason,'user_cancelled');assert.equal(cancelled.active_processes_after,0);
 const output=await run('print("x"*1000000,flush=True)',{maxOutputBytes:32768});assert.equal(output.reason,'output_limit');assert(Buffer.byteLength(output.stdout)<=32768);
 t.diagnostic(JSON.stringify({cancelled,output:{...output,stdout:'omitted '+output.stdout.length+' chars'}}));
 assert.throws(()=>createJobRunner({python}).run('shell',{executable:python,args:[],cwd}),/RESOURCE_CONFIG_INVALID/);
 await assert.rejects(createJobRunner({python:path.resolve('temp/nonexistent-python.exe')}).run('eval',{executable:python,args:[],cwd}),/ENOENT/);
});
