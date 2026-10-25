// Installed only by the isolated Phase 0 server. Existing application modes
// retain their behavior. This is an application/API boundary, not an OS sandbox.
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import {syncBuiltinESMExports} from 'node:module';

export const writeAttempts=[];
function denied(operation){writeAttempts.push({operation,at:new Date().toISOString()});throw Object.assign(Error('STUDIO_ZERO_WRITE: '+operation),{code:'STUDIO_ZERO_WRITE'});}
for(const name of ['writeFile','writeFileSync','appendFile','appendFileSync','truncate','truncateSync','ftruncate','ftruncateSync','rename','renameSync','unlink','unlinkSync','rm','rmSync','rmdir','rmdirSync','mkdir','mkdirSync','mkdtemp','mkdtempSync','copyFile','copyFileSync','cp','cpSync','link','linkSync','symlink','symlinkSync','chmod','chmodSync','fchmod','fchmodSync','chown','chownSync','utimes','utimesSync','createWriteStream'])if(typeof fs[name]==='function')fs[name]=()=>denied('fs.'+name);
for(const name of ['writeFile','appendFile','truncate','rename','unlink','rm','rmdir','mkdir','mkdtemp','copyFile','cp','link','symlink','chmod','chown','utimes'])if(typeof fsp[name]==='function')fsp[name]=async()=>denied('fsp.'+name);
const writeFlags=fs.constants.O_WRONLY|fs.constants.O_RDWR|fs.constants.O_CREAT|fs.constants.O_TRUNC|fs.constants.O_APPEND;
const writable=flags=>typeof flags==='number'?Boolean(flags&writeFlags):typeof flags==='string'&&/[wax+]/.test(flags);
for(const name of ['open','openSync']){const original=fs[name];fs[name]=function(p,flags,...args){if(writable(flags))return denied('fs.'+name);return original.call(this,p,flags,...args);};}
const originalOpen=fsp.open;fsp.open=async function(p,flags,...args){if(writable(flags))return denied('fsp.open');return originalOpen.call(this,p,flags,...args);};
for(const name of ['write','writeSync','writev','writevSync']){const original=fs[name];fs[name]=function(fd,...args){if(fd!==1&&fd!==2)return denied('fs.'+name);return original.call(this,fd,...args);};}
syncBuiltinESMExports();
