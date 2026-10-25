"""Signed T12 simulation host; unchanged E2 validator, scoped E3 stub only."""
import argparse,hashlib,json,sys
from pathlib import Path
from dataclasses import asdict
from unittest.mock import patch
p=argparse.ArgumentParser(allow_abbrev=False);p.add_argument('--engine-root',required=True);p.add_argument('command',choices=('validate','lint'));p.add_argument('--strict',action='store_true');args=p.parse_args()
if args.command=='validate' and not args.strict:raise ValueError('Strict required')
engine=Path(args.engine_root);sys.path.insert(0,str(engine/'tools'))
from cli import source_identity,response,emit
from loader import read_package,read_support_sources
from catalog import build_catalog,compact_json,serialize_catalog
from scope import ScopeContext
from authority import SourceGrant
from validate import validate_package
from lint import lint_package
from jsonschema import Draft202012Validator
import evidence
raw=sys.stdin.buffer.read(131073)
if len(raw)>131072:raise ValueError('Host input limit')
host=json.loads(raw);profile='T12_OWNER_APPROVED_MOCK'
if host['profile']!=profile or host['fixture_id']!='T12_47_OWNER_OVERRIDE_20261023' or host['production_permission']!='NOT_GRANTED':raise ValueError('Invalid mock host')
identity=source_identity()
if identity['content_hash']!=host['engine_hash']:raise ValueError('Engine drift')
root=Path.cwd();package=read_package(root);catalog=build_catalog(package)
support=read_support_sources(root,tuple((name,'provenance') for name in host['support_hashes']))
if {s.path:s.sha256 for s in support}!=host['support_hashes']:raise ValueError('Support drift')
grants=tuple(SourceGrant(**{**g,'item_ids':tuple(g['item_ids'])}) for g in host['grants'])
hashes={s.path:s.sha256 for s in package.sources}
if len(grants)!=47 or hashes!=host['source_set'] or any(hashes.get(g.item_path)!=g.source_sha256 for g in grants):raise ValueError('Grant drift')
original=evidence.check_evidence
def mock_dependency(current,context):
 issues=original(current,context);allowed=set()
 for member in current.items:
  value=member.value;g=host['gates'].get(value['id'])
  if g and value['force']=='MUST_NOT' and value['severity']=='critical' and member.location.path==g['path'] and value['enforcement']['gate']==g['gate']=={'type':'human-approval','required':True} and g['profile']==profile:
   allowed.add((value['id'],member.location.path))
 return [f for f in issues if not(f['code']=='ENFORCEMENT_E3_EVIDENCE_UNAVAILABLE' and (f['item_id'],f['path']) in allowed)]
context=ScopeContext(as_of=host['as_of']);verify=lint_package if args.command=='lint' else validate_package
with patch('evidence.check_evidence',mock_dependency):validation,additional=verify(package,root,context,grants=grants)
sources={s.path:s for s in (*package.sources,*support,*additional)}
observed=read_support_sources(root,tuple((s.path,s.role) for s in sources.values()))
if any(s.sha256!=sources[s.path].sha256 for s in observed) or source_identity()['content_hash']!=identity['content_hash']:raise ValueError('Input drift')
digest=lambda v:hashlib.sha256(compact_json(v).encode('utf-8')).hexdigest()
candidate_hash=digest({s.path:s.sha256 for s in sources.values()});config={'command':args.command,'strict':True,'profile':profile,'host':host,'context':{**asdict(context),'as_of':str(context.day)},'adapter_sha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'trust_grants':[asdict(g) for g in grants]}
report=response(args.command,validation['result'],validation['exit_code'],identity,data={'catalog':catalog,'validation':validation})
report['inputs']={'candidate_hash':candidate_hash,'config_hash':digest(config),'inputs_hash':digest({'engine':identity['content_hash'],'candidate':candidate_hash,'config':digest(config),'schema_closure':catalog['schema_closure']['lock_sha256']}),'catalog':[{'path':s.path,'sha256':s.sha256,'role':s.role} for s in sorted(sources.values(),key=lambda s:s.path)]}
report['checks']={'status':'BLOCKED' if validation['result']=='BLOCKED' else 'COMPLETE','reason':profile+': OWNER_GRANTED_T12; signed simulation SourceGrants and three E3 gates only. Native trust/enforcement/production NOT_GRANTED; E4 NOT_RUN.'}
report['diagnostics']=[{**f,'stage':'E2.e'} for f in validation['findings'] if f['disposition']!='WARNING']
Draft202012Validator(json.loads((engine/'CLI_CONTRACT.json').read_text(encoding='utf-8'))).validate(report);serialize_catalog(report)
print(profile+': local simulation; never real backend write permission or production qualification.',file=sys.stderr)
raise SystemExit(emit(report,'json'))
