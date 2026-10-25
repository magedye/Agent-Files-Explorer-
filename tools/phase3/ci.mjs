import fs from 'node:fs';
import path from 'node:path';
import {publishFromGithub,checkPullRequest} from '../../server/studio/ci/github-publisher.mjs';
const args=process.argv.slice(2),mode=args.shift(),options=new Map(args.map(s=>{const p=s.indexOf('=');if(p<0)throw Error('Use --name=value');return [s.slice(0,p),s.slice(p+1)];}));
if(!['check-pr','publish'].includes(mode)||[...options.keys()].some(k=>!['--python','--pr'].includes(k)))throw Error('CI_COMMAND_INVALID');
const python=options.get('--python');if(!python||!path.isAbsolute(python))throw Error('ABSOLUTE_VENV_PYTHON_REQUIRED');
const policy=JSON.parse(fs.readFileSync('.github/aghr-publisher-policy.json','utf8'));
try{
 const result=mode==='publish'?await publishFromGithub({python,policy}):await checkPullRequest({python,policy,prNumber:Number(options.get('--pr'))});
 process.stdout.write(JSON.stringify(result)+'\n');
}catch(error){process.stdout.write(JSON.stringify({profile:'aghr-ci.1',result:'BLOCKED',reason:error.message,state_written:false,published:false,native_qualification:'NOT_RUN'})+'\n');process.exitCode=3;}
