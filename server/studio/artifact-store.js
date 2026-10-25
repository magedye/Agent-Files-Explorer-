import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const hash=b=>'sha256:'+crypto.createHash('sha256').update(b).digest('hex');
export function createArtifactStore(storageRoot){
 const root=path.resolve(storageRoot),dir=path.join(root,'artifacts');
 const check=()=>{
  for(const p of [root,dir]){const s=fs.lstatSync(p,{throwIfNoEntry:false});if(s&&(s.isSymbolicLink()||!s.isDirectory()))throw Error('ARTIFACT_ROOT_UNSAFE');}
  if(fs.realpathSync(root)!==root)throw Error('ARTIFACT_ROOT_UNSAFE');
 };
 return Object.freeze({
  write({id,versionHash,patch,draftOnly}){
   if(!/^CP-[a-zA-Z0-9-]+$/.test(id)||!/^sha256:[a-f0-9]{64}$/.test(versionHash)||typeof patch!=='string'||Buffer.byteLength(patch)>2*1024**2)throw Error('ARTIFACT_INPUT_INVALID');
   check();if(!fs.existsSync(dir))fs.mkdirSync(dir);check();
   const name=id+'-'+(draftOnly?'draft-':'approved-')+versionHash.slice(7)+'.patch',target=path.join(dir,name);
   if(path.dirname(target)!==dir)throw Error('ARTIFACT_PATH_INVALID');
   const bytes=Buffer.from(patch),fd=fs.openSync(target,'wx',0o600);
   const identity=fs.fstatSync(fd);let failed;
   try{fs.writeFileSync(fd,bytes);fs.fsyncSync(fd);}catch(error){failed=error;}finally{fs.closeSync(fd);}
   if(failed){const s=fs.lstatSync(target,{throwIfNoEntry:false});if(s?.isFile()&&s.ino===identity.ino&&!s.isSymbolicLink()&&s.nlink===1)fs.unlinkSync(target);throw failed;}
   return {artifact:{path:target,content_hash:hash(bytes),bytes:bytes.length},rollback(){
    const current=fs.lstatSync(target,{throwIfNoEntry:false});if(current?.isFile()&&!current.isSymbolicLink()&&current.ino===identity.ino&&current.nlink===1&&path.dirname(target)===dir)fs.unlinkSync(target);
   }};
  },
  read(artifact){
   check();if(path.dirname(artifact.path)!==dir)throw Error('ARTIFACT_PATH_INVALID');
   const s=fs.lstatSync(artifact.path);if(s.isSymbolicLink()||!s.isFile()||s.nlink!==1)throw Error('ARTIFACT_FILE_UNSAFE');
   const bytes=fs.readFileSync(artifact.path);if(hash(bytes)!==artifact.content_hash||bytes.length!==artifact.bytes)throw Error('ARTIFACT_DRIFT');return bytes;
  },
 });
}
