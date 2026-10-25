"""Read-only actual candidate rule lookup with content-bound retrieval receipts."""
from datetime import datetime, timezone
import uuid
from core import canonical, digest
import json
from pathlib import Path
import sqlite3

def stored_items(context, expected_hash, root):
    database=Path(context['database'])
    if not database.is_absolute() or database.is_symlink() or not database.is_file():raise ValueError('LOOKUP_DATABASE_UNAVAILABLE')
    with sqlite3.connect('file:'+database.as_posix()+'?mode=ro',uri=True) as db:
        db.row_factory=sqlite3.Row;db.execute('BEGIN')
        row=db.execute('SELECT * FROM change_packages WHERE id=?',(context['cp_id'],)).fetchone()
        if row is None or row['proposal_version_hash']!=expected_hash:raise ValueError('LOOKUP_STALE_HASH')
        origin=db.execute("SELECT payload_json FROM audit_events WHERE event_type='cp.create' AND resource_id=? AND json_extract(payload_json,'$.result')='SUCCESS' ORDER BY id LIMIT 1",(context['cp_id'],)).fetchone()
        frozen=json.loads(origin['payload_json'])
        payload={'title':row['title'],'kind':row['kind'],'proposed_yaml':row['proposed_yaml']}
        if frozen['source'] is not None:payload['source']=frozen['source']
        if row['target_item_id'] is not None:payload['target_item_id']=row['target_item_id']
        from core import prepare
        bound=prepare(payload,{'base_package_version':row['base_package_version'],'base_candidate_hash':frozen['base_candidate_hash']})
        if bound['proposal_version_hash']!=expected_hash:raise ValueError('LOOKUP_STORED_CONTENT_DRIFT')
    from workflow import items_for
    return items_for(payload,root)

def retrieve(items, item_id, expected_hash=None):
    matches=[i for i in items if i['id']==item_id]
    if len(matches)!=1:raise ValueError('UNKNOWN_ID')
    item=matches[0];raw=item['rule'].encode('utf-8');h=digest(raw)
    if expected_hash is not None and h!=expected_hash:raise ValueError('LOOKUP_STALE_HASH')
    return {'id':item_id,'rule':item['rule'],'content_hash':h,'bytes':len(raw)}

def probe(items, proposal_hash, context, root):
    try:
        actual=stored_items(context,proposal_hash,root)
        fetched=[retrieve(actual,i['id'],digest(i['rule'].encode('utf-8'))) for i in items]
    except (KeyError,ValueError,OSError,sqlite3.Error):
        return {'check':{'status':'NOT_RUN','evidence':[],'reason':'Actual read-only Draft lookup unavailable/stale; compact blocked.'},'rules':{},'records':[],'proposal_version_hash':proposal_hash}
    raw=canonical({'proposal_version_hash':proposal_hash,'rules':fetched})
    return {'check':{'status':'PASS','at':datetime.now(timezone.utc).isoformat(),'run_id':'LOOKUP-'+str(uuid.uuid4()),
                     'evidence':[{'path':'candidate-lookup:'+proposal_hash,'content_hash':digest(raw),'bytes':len(raw)}]},
            'rules':{i['id']:i['content_hash'] for i in fetched},'records':fetched,'proposal_version_hash':proposal_hash}
