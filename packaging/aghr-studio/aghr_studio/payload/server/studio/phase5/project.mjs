import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {repository} from '../aghr/cli-bridge.js';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
export function registeredProject(){
 const folder=path.join(repository,'server/studio/phase5/evaluators'),lock=JSON.parse(fs.readFileSync(folder+'/SOURCE.lock.json','utf8'));
 for(const [name,h]of Object.entries(lock.files))if(sha(fs.readFileSync(path.join(folder,name)))!==h)throw Error('PROJECT_EVALUATOR_SOURCE_DRIFT');
 const scope=repository.replaceAll('\\','/')+'/**';
 return {project:{id:'agent-files-explorer',name:'Agent Files Explorer',root:repository,scope,registration:'OWNER_AUTHORIZED_PHASE5',host:'aghr-local-process',host_version:process.version,critical_paths:['server/studio/write-authorization.js','server/studio/db/persistent.js','server/studio/ci/submission-service.mjs']},
  e4Config:{scope,permissions:[],skills:['project-measurement','project-meta'].map(id=>({id,source:'project',skillPath:folder+'/SKILL.md',entry:folder+'/worker.py',triggers:['قياس','مراجعة','measure','review']}))},
  phase4Options:{measurementSkillId:'project-measurement',metaSkillId:'project-meta',requiredBehavioralEvals:['schema-examples','authority-negative','scope-negative']}};
}
