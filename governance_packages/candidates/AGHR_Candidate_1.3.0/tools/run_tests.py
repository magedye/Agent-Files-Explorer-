#!/usr/bin/env python3
"""Run actual local tests; zero discovered tests can never be PASS."""
import argparse
import datetime
import io
import json
import platform
import sys
import unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--output',type=Path);a=p.parse_args()
    start=datetime.datetime.now(datetime.timezone.utc).isoformat()
    suite=unittest.defaultTestLoader.discover(str(ROOT/'tests'),pattern='test_*.py')
    discovered=suite.countTestCases()
    stream=io.StringIO();result=unittest.TextTestRunner(stream=stream,verbosity=2).run(suite)
    raw=stream.getvalue();print(raw,end='')
    summary={'status':'PASS' if discovered>0 and result.wasSuccessful() and not result.skipped else 'FAIL','discovered':discovered,'executed':result.testsRun,'failures':len(result.failures),'errors':len(result.errors),'skipped':len(result.skipped),'started_at':start,'finished_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'python':platform.python_version(),'platform':platform.platform(),'scope':'LOCAL_REFERENCE_TOOLS_ONLY','live_model':'NOT_RUN','native_host':'NOT_RUN','independent_review':'NOT_PERFORMED'}
    print(json.dumps(summary,indent=2))
    if a.output:
        a.output.mkdir(parents=True,exist_ok=False)
        (a.output/'unittest-raw.txt').write_text(raw, encoding='utf-8')
        (a.output/'unittest-summary.json').write_text(json.dumps(summary,indent=2)+'\n', encoding='utf-8')
    return 0 if summary['status']=='PASS' else 1
if __name__=='__main__':sys.exit(main())
