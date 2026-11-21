#!/usr/bin/env python3
"""RCCA test-fixture-only GATED WRITE demonstration, NOT a production PEP.

Applies only to an explicitly marked NON-GIT synthetic fixture. This does not
intercept IDE/Shell/MCP calls, and an agent with unrestricted filesystem access
can bypass this wrapper. Writes ONLY with --apply and to a NEW allowlisted file.
Exit 0 authorized fixture result, 2 denied, 3 inconclusive.
"""
from __future__ import annotations
import argparse, importlib.util, json, sys
from pathlib import Path

MARKER='SYNTHETIC_FIXTURE_ONLY_V1_2'

def load_module(filename,name):
    spec=importlib.util.spec_from_file_location(name,Path(__file__).with_name(filename))
    mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod);return mod


def main():
    p=argparse.ArgumentParser(description=__doc__)
    for a in ('--root','--policy','--request','--trace','--target'):p.add_argument(a,required=True)
    p.add_argument('--content',default='synthetic example\n')
    p.add_argument('--apply',action='store_true')
    ns=p.parse_args()
    out={'tool':'GATED_WRITE_DEMO','runtime_security_enforcement':False,
         'status':'INCONCLUSIVE','side_effects':False,
         'scope':'single_wrapped_fixture_write_only'}
    code=3
    try:
        root=Path(ns.root).resolve(strict=True)
        if not root.is_dir():raise ValueError('root_not_dir')
        if any((ancestor/'.git').exists() for ancestor in (root,*root.parents)):
            raise ValueError('git_repository_or_descendant_not_allowed_for_demo')
        marker=root/'RCCA_TEST_ONLY.marker'
        if marker.is_symlink() or not marker.is_file() or marker.read_text(encoding='utf-8').strip()!=MARKER:
            raise ValueError('synthetic_fixture_marker_required')
        if len(ns.content)>1000:raise ValueError('demo_content_too_large')
        trace_tool=load_module('08_RCCA_TRACE.py','rcca_trace')
        scope_tool=load_module('06_WRITESET_CHECK.py','rcca_writeset')
        text,sha=trace_tool.source_from_file(ns.request)
        trace=json.loads(Path(ns.trace).read_text(encoding='utf-8'))
        for stage in ('G1','G2'):
            issues,_=trace_tool.validate(text,sha,trace,stage)
            if issues:
                out.update(status='DENIED_REQUIREMENTS_GATE',gate=stage,reason=issues[0]);code=2
                break
        else:
            cfg=scope_tool.load_policy(Path(ns.policy))
            result=scope_tool.inspect_path(root,cfg,ns.target)
            if result['decision']!='PASS_PATH_MATCH':
                out.update(status='DENIED_WRITESET',decision=result['decision']);code=2
            else:
                target=root/Path(ns.target.replace('\\','/'))
                if target.is_symlink() or target.exists() or not target.parent.is_dir():
                    raise ValueError('demo_refuses_overwrite_or_missing_parent')
                if ns.apply:
                    # Exclusive create refuses replacement if another process created it.
                    with target.open('x',encoding='utf-8') as stream:
                        stream.write(ns.content)
                    out.update(status='DEMO_WRITE_PERFORMED',side_effects=True);code=0
                else:
                    out.update(status='DEMO_WRITE_ELIGIBLE_DRY_RUN',side_effects=False);code=0
    except (OSError,ValueError,TypeError,json.JSONDecodeError) as e:
        out['reason']=str(e)[:100] if isinstance(e,ValueError) else type(e).__name__
    print(json.dumps(out,ensure_ascii=False,indent=2))
    return code
if __name__=='__main__':sys.exit(main())
