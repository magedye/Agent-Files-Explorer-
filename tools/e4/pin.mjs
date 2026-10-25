import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {repository} from '../../server/studio/aghr/cli-bridge.js';
import {verifyE3} from '../../server/studio/aghr/bounded-validator.js';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),slice=process.argv[2];
if(!/^[abcde](?:-[a-z0-9]+)?$/.test(slice))throw Error('SLICE_REQUIRED');
const prefix='server/studio/aghr/e4',out='docs/evidence/studio-e4-2026-10-24/slices/'+slice;
if(fs.existsSync(out))throw Error('SLICE_ALREADY_PINNED');fs.mkdirSync(out,{recursive:true});
const names=fs.readdirSync(prefix).filter(n=>n.endsWith('.py')).map(n=>prefix+'/'+n);
for(const n of ['server/studio/hosts/local-process.mjs','tools/aghr_e4_cli.mjs'])if(fs.existsSync(n))names.push(n);
const lock=prefix+'/SOURCE.lock.json';if(fs.existsSync(lock))fs.copyFileSync(lock,out+'/SOURCE.before.json');
const files=Object.fromEntries(names.sort().map(n=>[n,sha(fs.readFileSync(n))]));
const bridgeFile='server/studio/aghr/e4-bridge.js',normalizedBridge=fs.readFileSync(bridgeFile,'utf8').replace(/export const sourceHash='[a-f0-9]{64}';/,"export const sourceHash='<SOURCE_HASH>';" );
const raw=Buffer.from(JSON.stringify({revision:'e4.'+slice+'.1',protocol_version:'3',native_e3_hash:verifyE3(),bridge_sha256:sha(normalizedBridge),bridge_normalization:'Only the self-referential sourceHash literal is replaced with <SOURCE_HASH>; all other bridge bytes are hashed.',files},null,2)+'\n');
fs.writeFileSync(lock,raw);fs.writeFileSync(out+'/SOURCE.after.json',raw,{flag:'wx'});
for(const n of names){const target=path.join(out,'source',n);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(n,target,fs.constants.COPYFILE_EXCL);}
const bridge='server/studio/aghr/e4-bridge.js';if(fs.existsSync(bridge)){const source=fs.readFileSync(bridge,'utf8');fs.writeFileSync(bridge,source.replace(/export const sourceHash='[a-f0-9]{64}';/,"export const sourceHash='"+sha(raw)+"';"));fs.copyFileSync(bridge,out+'/bridge.after.js',fs.constants.COPYFILE_EXCL);}
console.log(JSON.stringify({slice,source_hash:sha(raw),files:Object.keys(files).length}));
