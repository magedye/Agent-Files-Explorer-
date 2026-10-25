import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {DatabaseSync,constants} from 'node:sqlite';
import {openPersistentStore,storageScope,migrateDatabase} from '../server/studio/db/persistent.js';
import {createWriteAuthority,consumeAuthorization} from '../server/studio/write-authorization.js';
function fixture(){const root=fs.mkdtempSync(path.join(os.tmpdir(),'aghr-t14-'));const auth=createWriteAuthority(),owner=auth.createPrincipal({actor:'isolated-operator',role:'governance-owner',installationOwnerVerified:true}),config={workspaceId:'w1',targetProject:'project-a',storageRoot:root};return {root,auth,owner,config,grant(scope){return auth.authorize(owner.principal,scope,auth.issueGrant({issuer:owner.principal,principal:owner.principal,scope,expiresAt:Date.now()+60000}));},cleanup(){const resolved=path.resolve(root);assert.ok(resolved.startsWith(path.resolve(os.tmpdir())+path.sep+'aghr-t14-'));fs.rmSync(resolved,{recursive:true,force:true});}};}
test('T14 explicit disk mode persists/reopens 12 tables and truthful audit; no default activation',()=>{
 const f=fixture();let store;
 try{
  const scope=storageScope(f.config);assert.throws(()=>openPersistentStore(f.config,{profile:'T12_OWNER_APPROVED_MOCK'}));assert.deepEqual(fs.readdirSync(f.root),[]);
  store=openPersistentStore(f.config,f.grant(scope));assert.equal(store.tables.length,12);assert.ok(store.tables.includes('change_package_approval_history'));
  const action={...scope,action:'cp.create',resource_id:'CP-1',proposal_version_hash:'sha256:'+'a'.repeat(64)},receipt=f.grant(action);consumeAuthorization(receipt,action);
  store.appendAudit(receipt,{event_type:'cp.create',resource_type:'package',payload:{literal:"'; DROP TABLE workspaces; --"}});
  assert.equal(store.auditEvents().length,2);assert.equal(store.auditEvents()[1].actor,'isolated-operator');assert.equal(store.auditEvents()[1].simulated_role,null);
  assert.throws(()=>store.appendAudit(receipt,{event_type:'adoption.apply'}),/REPLAY/);
  store.close();store=null;
  store=openPersistentStore(f.config,f.grant(scope));assert.equal(store.auditEvents().length,3);assert.equal(store.auditEvents()[1].actor_role,'governance-owner');store.close();store=null;
  const inspect=new DatabaseSync(scope.resource_id);assert.equal(inspect.prepare('PRAGMA user_version').get().user_version,1);inspect.close();
 }finally{store?.close();f.cleanup();}
});
test('T14 migration is atomic: real SQLite denial rolls back, then authorized retry succeeds',()=>{
 const db=new DatabaseSync(':memory:');
 try{
  db.setAuthorizer(action=>action===constants.SQLITE_CREATE_INDEX?constants.SQLITE_DENY:constants.SQLITE_OK);
  assert.throws(()=>migrateDatabase(db));db.setAuthorizer(()=>constants.SQLITE_OK);
  assert.equal(db.prepare("SELECT count(*) n FROM sqlite_master WHERE type='table'").get().n,0);assert.equal(db.prepare('PRAGMA user_version').get().user_version,0);
  assert.equal(migrateDatabase(db).tables.length,12);
 }finally{db.close();}
});
test('T14 detects incompatible schemas and keeps approval history constraints',()=>{
 const db=new DatabaseSync(':memory:');
 try{
  migrateDatabase(db);db.exec('PRAGMA foreign_keys=ON;');assert.throws(()=>db.prepare("INSERT INTO change_package_approvals (package_id,role,approver,decision,approved_version_hash,at) VALUES ('absent','governance-owner','owner','approve','hash','now')").run());
  db.exec('CREATE TABLE unauthorized_extra(x)');assert.throws(()=>migrateDatabase(db),/SCHEMA_DRIFT/);
 }finally{db.close();}
});
