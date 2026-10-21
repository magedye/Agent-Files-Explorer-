import copy
import datetime as dt
import json
import os
import tempfile
import unittest
from pathlib import Path
from runtime.common import GovernanceError, sha
from runtime.policy import Context, FileExecutor

class ExecutorTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup)
        self.root=Path(self.temp.name);(self.root/'work').mkdir();(self.root/'input').mkdir()
        (self.root/'work/a.txt').write_text('old');(self.root/'input/allowed.txt').write_text('readable')
        self.ctx=[Context('actor','task','env','p1','a'*64)]
        self.time=[dt.datetime(2026,10,11,12,0,tzinfo=dt.timezone.utc)]
        self.exe=FileExecutor(self.root,lambda:self.ctx[0],clock=lambda:self.time[0])
    def action(self):return {'operation':'replace_file','path':'work/a.txt','content':'new','expected_sha256':sha(self.root/'work/a.txt')}
    def deny(self,action,token=None):
        before=(self.root/'work/a.txt').read_bytes();r=self.exe.execute(action,token)
        self.assertEqual(r['decision'],'DENY',r);self.assertEqual(r['result'],'NOT_EXECUTED',r)
        self.assertEqual((self.root/'work/a.txt').read_bytes(),before);return r
    def test_scoped_read(self):
        r=self.exe.execute({'operation':'read_file','path':'input/allowed.txt'});self.assertEqual(r['content'],'readable')
    def test_create_has_actual_effect(self):
        r=self.exe.execute({'operation':'create_file','path':'work/new.txt','content':'created'})
        self.assertEqual(r['result'],'EXECUTED');self.assertEqual((self.root/'work/new.txt').read_text(),'created')
    def test_create_never_overwrites(self):self.deny({'operation':'create_file','path':'work/a.txt','content':'bad'})
    def test_replace_requests_review(self):
        r=self.exe.execute(self.action());self.assertEqual(r['decision'],'REVIEW');self.assertEqual((self.root/'work/a.txt').read_text(),'old')
    def test_bound_approval_executes(self):
        a=self.action();r=self.exe.execute(a,self.exe.issue_approval(a));self.assertEqual(r['result'],'EXECUTED');self.assertEqual((self.root/'work/a.txt').read_text(),'new')
    def test_forged_signature(self):
        a=self.action();t=self.exe.issue_approval(a);t['signature']='0'*64;self.deny(a,t)
    def test_modified_approval_body(self):
        a=self.action();t=self.exe.issue_approval(a);t['body']['binding']['context']['actor']='attacker';self.deny(a,t)
    def test_changed_action_after_approval(self):
        a=self.action();t=self.exe.issue_approval(a);a['content']='changed';self.deny(a,t)
    def test_changed_target_after_approval(self):
        a=self.action();t=self.exe.issue_approval(a);(self.root/'work/a.txt').write_text('external-change');self.deny(a,t)
    def test_replay_rejected_even_if_target_restored(self):
        a=self.action();t=self.exe.issue_approval(a);self.exe.execute(a,t)
        (self.root/'work/a.txt').write_text('old') # trusted test fixture restoration
        self.deny(a,t)
    def test_expired_approval(self):
        a=self.action();t=self.exe.issue_approval(a,ttl_seconds=1);self.time[0]+=dt.timedelta(seconds=2);self.deny(a,t)
    def test_approval_from_different_executor(self):
        a=self.action();other=FileExecutor(self.root,lambda:self.ctx[0],clock=lambda:self.time[0]);self.deny(a,other.issue_approval(a))
    def test_actor_drift(self):
        a=self.action();t=self.exe.issue_approval(a);self.ctx[0]=Context('other','task','env','p1','a'*64);self.deny(a,t)
    def test_task_drift(self):
        a=self.action();t=self.exe.issue_approval(a);self.ctx[0]=Context('actor','other','env','p1','a'*64);self.deny(a,t)
    def test_policy_drift(self):
        a=self.action();t=self.exe.issue_approval(a);self.ctx[0]=Context('actor','task','env','p2','a'*64);self.deny(a,t)
    def test_candidate_drift(self):
        a=self.action();t=self.exe.issue_approval(a);self.ctx[0]=Context('actor','task','env','p1','b'*64);self.deny(a,t)
    def test_environment_drift(self):
        a=self.action();t=self.exe.issue_approval(a);self.ctx[0]=Context('actor','task','other','p1','a'*64);self.deny(a,t)
    def test_revocation(self):
        self.ctx[0]=Context('actor','task','env','p1','a'*64,revoked=True);self.deny({'operation':'read_file','path':'work/a.txt'})
    def test_cancellation(self):
        self.ctx[0]=Context('actor','task','env','p1','a'*64,cancelled=True);self.deny({'operation':'create_file','path':'work/cancelled.txt','content':'no'});self.assertFalse((self.root/'work/cancelled.txt').exists())
    def test_unknown_shell(self):self.deny({'operation':'shell','path':'work/a.txt','content':'anything'})
    def test_unknown_network(self):self.deny({'operation':'network','path':'work/a.txt'})
    def test_model_identity_claim(self):self.deny({'operation':'read_file','path':'work/a.txt','actor':'owner'})
    def test_model_authorized_flag(self):self.deny({'operation':'create_file','path':'work/z.txt','content':'x','authorized':True})
    def test_model_risk_claim(self):
        a=self.action();a['risk']='low';self.deny(a)
    def test_traversal(self):self.deny({'operation':'read_file','path':'work/../../outside.txt'})
    def test_absolute_path(self):self.deny({'operation':'read_file','path':str(self.root/'work/a.txt')})
    def test_windows_drive(self):self.deny({'operation':'read_file','path':'C:/Windows/file'})
    def test_backslash_path(self):self.deny({'operation':'read_file','path':'work\\a.txt'})
    def test_prefix_boundary(self):
        (self.root/'work2').mkdir();(self.root/'work2/a.txt').write_text('outside');self.deny({'operation':'read_file','path':'work2/a.txt'})
    def test_control_plane_path(self):
        (self.root/'.aghr').mkdir();self.deny({'operation':'create_file','path':'.aghr/policy.json','content':'bad'})
    def test_hidden_credentials_path(self):
        (self.root/'work/.env').write_text('synthetic-secret');self.deny({'operation':'read_file','path':'work/.env'})
    def test_symlink_file(self):
        (self.root/'work/link.txt').symlink_to(self.root/'input/allowed.txt');self.deny({'operation':'read_file','path':'work/link.txt'})
    def test_symlink_parent(self):
        (self.root/'work/link').symlink_to(self.root/'input',target_is_directory=True);self.deny({'operation':'read_file','path':'work/link/allowed.txt'})
    def test_hardlink(self):
        os.link(self.root/'input/allowed.txt',self.root/'work/hard.txt');self.deny({'operation':'read_file','path':'work/hard.txt'})
    def test_input_directory_not_writable(self):self.deny({'operation':'create_file','path':'input/not-permitted.txt','content':'x'})
    def test_payload_budget(self):self.deny({'operation':'create_file','path':'work/large.txt','content':'x'*16385})
    def test_read_budget(self):
        (self.root/'work/large.txt').write_text('x'*16385);self.deny({'operation':'read_file','path':'work/large.txt'})
    def test_step_budget(self):
        self.exe.max_steps=1;self.exe.execute({'operation':'read_file','path':'work/a.txt'});self.deny({'operation':'read_file','path':'work/a.txt'})
    def test_time_budget(self):
        tick=[0.0];self.exe=FileExecutor(self.root,lambda:self.ctx[0],monotonic=lambda:tick[0],max_seconds=1);tick[0]=2;self.deny({'operation':'read_file','path':'work/a.txt'})
    def test_missing_intent_audit_denies_effect(self):
        def broken(row):raise OSError('audit unavailable')
        self.exe=FileExecutor(self.root,lambda:self.ctx[0],audit=broken);self.deny({'operation':'create_file','path':'work/audit.txt','content':'x'});self.assertFalse((self.root/'work/audit.txt').exists())
    def test_failed_result_audit_is_indeterminate(self):
        def fail_result(row):
            if row['status']=='RESULT':raise OSError('audit unavailable')
        self.exe=FileExecutor(self.root,lambda:self.ctx[0],audit=fail_result)
        r=self.exe.execute({'operation':'create_file','path':'work/effect.txt','content':'actual'})
        self.assertEqual(r['result'],'INDETERMINATE');self.assertEqual((self.root/'work/effect.txt').read_text(),'actual')
    def test_recheck_after_intent_audit(self):
        def revoke(row):self.ctx[0]=Context('actor','task','env','p1','a'*64,revoked=True)
        self.exe=FileExecutor(self.root,lambda:self.ctx[0],audit=revoke)
        self.deny({'operation':'create_file','path':'work/revoked.txt','content':'no'});self.assertFalse((self.root/'work/revoked.txt').exists())
    def test_expiry_during_audit(self):
        def delay(row):
            if row['status']=='INTENT':self.time[0]+=dt.timedelta(seconds=2)
        self.exe=FileExecutor(self.root,lambda:self.ctx[0],audit=delay,clock=lambda:self.time[0])
        a=self.action();self.deny(a,self.exe.issue_approval(a,ttl_seconds=1))
    def test_audit_has_no_payload_or_token(self):
        a=self.action();a['content']='private-test-payload';t=self.exe.issue_approval(a);self.exe.execute(a,t)
        raw=json.dumps(self.exe.events);self.assertNotIn(a['content'],raw);self.assertNotIn(t['signature'],raw);self.assertNotIn(t['body']['nonce'],raw)
    def test_approval_ttl_bounds(self):
        with self.assertRaises(GovernanceError):self.exe.issue_approval(self.action(),ttl_seconds=301)
    def test_hidden_prefix_cannot_be_granted(self):
        with self.assertRaises(GovernanceError):FileExecutor(self.root,lambda:self.ctx[0],write_prefixes=('.aghr/',))
    def test_malformed_context_is_denied(self):
        self.exe=FileExecutor(self.root,lambda:None);self.deny({'operation':'read_file','path':'work/a.txt'})
