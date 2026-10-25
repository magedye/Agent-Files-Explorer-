import assert from 'node:assert/strict';

export async function runCases({cdp,artifacts,token,deadline,checkpoint}){
 const evaluate=expression=>cdp.evaluate(expression);
 const click=selector=>evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
 const select=async(selector,value)=>{await evaluate(`document.querySelector(${JSON.stringify(selector)}).value=${JSON.stringify(value)};document.querySelector(${JSON.stringify(selector)}).dispatchEvent(new Event('change',{bubbles:true}))`);};
 const capture=async name=>{artifacts[name]=Buffer.from((await cdp.call('Page.captureScreenshot',{format:'png',captureBeyondViewport:true})).data,'base64');};
 const ids=()=>evaluate(`Array.from(document.querySelectorAll('[data-testid=registry] tr[data-row-id]'),x=>x.dataset.rowId)`);
 const arIDs=await ids();assert.deepEqual(arIDs,['OBS-REFERENCE-STATE-001']);
 assert.equal(await evaluate('document.documentElement.dir'),'rtl');
 await click('.p0-source-link');await deadline(()=>evaluate('Boolean(document.querySelector("[data-testid=instruction-detail]"))'),'detail');
 await deadline(()=>evaluate('document.body.textContent.includes("لا يوجد سجل تحقق تاريخي")'),'history read');
 assert.ok(await evaluate('document.querySelector("[data-testid=raw-unit]").textContent.includes("OBS-REFERENCE-STATE-001")'));
 await capture('t07-detail-ar.png');await click('[data-testid=back-registry]');
 if(checkpoint==='PHASE1'){
  await deadline(()=>evaluate('!document.querySelector("[data-testid=registry]").parentElement.hidden'),'core registry back');
  await click('.p0-scope-filter summary');await click('[data-testid=registry-scope]');
  await deadline(()=>evaluate('!document.querySelector("[data-testid=registry-scope]").disabled'),'actual applicability filter');
  assert.deepEqual(await ids(),arIDs);
 }
 await select('[data-testid=locale]','en');await deadline(()=>evaluate('document.documentElement.dir==="ltr"'),'English');assert.deepEqual(await ids(),arIDs);
 await select('[data-testid=filter-due]','true');await deadline(()=>evaluate('document.querySelector("[data-testid=result-count]").textContent.startsWith("0 /")'),'Review Due empty actual source');
 await select('[data-testid=filter-due]','');
 await select('[data-testid=source]','sample');await deadline(()=>evaluate('document.querySelector("[data-testid=result-count]").textContent.startsWith("50 / 50")'),'50 sample units');
 const sampleIds=[];
 for(let page=0;page<4;page++){sampleIds.push(...await ids());if(page<3){await click('[data-testid=next]');await deadline(()=>evaluate(`document.querySelector('.p0-pagination span').textContent.startsWith('${page+2} /')`),'next page');}}
 assert.equal(sampleIds.length,50);assert.equal(new Set(sampleIds).size,50);
 await select('[data-testid=filter-force]','MUST');await deadline(()=>evaluate('document.querySelector("[data-testid=result-count]").textContent!=="50 / 50 units"'),'force filter');
 assert.ok((await ids()).length>0);assert.ok((await ids()).length<50);await select('[data-testid=filter-force]','');
 await select('[data-testid="filter-authority.level"]','__missing');assert.ok(await evaluate('document.body.textContent.includes("Not recorded")'));await select('[data-testid="filter-authority.level"]','');
 await select('[data-testid=sort]','severity');await click('.p0-toolbar button');await select('[data-testid=sort]','id');await click('.p0-toolbar button');
 await capture('t07-registry-sample-en.png');
 await select('[data-testid=locale]','ar');await deadline(()=>evaluate('document.documentElement.dir==="rtl"'),'Arabic sample');assert.equal(await evaluate('document.querySelector("[data-testid=result-count]").textContent.startsWith("50 / 50")'),true);
 await capture('t07-registry-sample-ar.png');
 await click('.p0-source-link');await deadline(()=>evaluate('Boolean(document.querySelector("[data-testid=instruction-detail]"))'),'sample detail');
 await deadline(()=>evaluate('Boolean(document.querySelector("[data-testid=raw-file]"))'),'pinned original');
 assert.ok(await evaluate('document.body.textContent.includes("PENDING_REVIEW")'));
 await capture('t07-sample-detail-ar.png');await click('[data-testid=back-registry]');
 // Native keyboard activation, rather than dispatching a synthetic click.
 await deadline(()=>evaluate('!document.querySelector("[data-testid=registry]").parentElement.hidden'),'registry visible after return');
 await evaluate('document.querySelector(".p0-source-link").focus()');assert.equal(await evaluate('document.activeElement.className'),'p0-source-link');
 await cdp.call('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',text:'\r',windowsVirtualKeyCode:13});await cdp.call('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
 await deadline(()=>evaluate('Boolean(document.querySelector("[data-testid=instruction-detail]"))'),'keyboard detail');await click('[data-testid=back-registry]');
 if(checkpoint!=='T07'){
  await click('[data-nav=capabilities]');await deadline(()=>evaluate('document.querySelectorAll("[data-skill-id]").length===5'),'five actual skill files');
  await capture('t08-capabilities-ar.png');await select('[data-testid=locale]','en');await deadline(()=>evaluate('document.documentElement.dir==="ltr"'),'English skills');
  assert.equal(await evaluate('document.querySelectorAll("[data-skill-id]").length'),5);
  await click('[data-testid=capabilities] .p0-source-link');await deadline(()=>evaluate('Boolean(document.querySelector("[data-testid=skill-detail]"))'),'skill detail');
  for(const label of ['1 · Availability','2 · Qualification','3 · Usage','DISCOVERY_UNAVAILABLE','hostVersion','contentHash','NOT_RUN'])assert.ok(await evaluate(`document.body.textContent.includes(${JSON.stringify(label)})`),label);
  await click('[data-testid=tuple-match]');await deadline(()=>evaluate('Boolean(document.querySelector("[data-testid=tuple-result]"))'),'tuple read');assert.ok(await evaluate('document.querySelector("[data-testid=tuple-result]").textContent.includes("NOT_RUN")'));
  await evaluate('document.querySelector("[data-testid=tuple-version]").focus()');await cdp.call('Input.insertText',{text:'changed-unobserved-version'});await click('[data-testid=tuple-match]');await deadline(()=>evaluate('Boolean(document.querySelector("[data-testid=tuple-result]"))'),'changed tuple');
  assert.ok(await evaluate('document.querySelector("[data-testid=tuple-result]").textContent.includes("NOT_RUN")'));
  await capture('t08-skill-detail-en.png');await select('[data-testid=locale]','ar');await capture('t08-skill-detail-ar.png');
  await click('[data-testid=back-capabilities]');
 }
 if(checkpoint==='PHASE1'){
  await click('[data-nav=profiles]');await deadline(()=>evaluate('Boolean(document.querySelector("[data-testid=scope-run]"))'),'profiles');
  await click('[data-testid=scope-run]');await deadline(()=>evaluate('Boolean(document.querySelector("[data-testid=scope-result]"))'),'Arabic scope');
  const arScope=await evaluate('Array.from(document.querySelectorAll("[data-scope-id]"),e=>({id:e.dataset.scopeId,status:e.cells[1].textContent}))');
  assert.equal(arScope[0].status,'APPLIES');await capture('t09-profiles-scope-ar.png');
  await select('[data-testid=locale]','en');await deadline(()=>evaluate('document.documentElement.dir==="ltr"'),'English profiles');
  await click('[data-testid=scope-run]');await deadline(()=>evaluate('Boolean(document.querySelector("[data-testid=scope-result]"))'),'English scope');
  assert.deepEqual(await evaluate('Array.from(document.querySelectorAll("[data-scope-id]"),e=>({id:e.dataset.scopeId,status:e.cells[1].textContent}))'),arScope);
  await capture('t09-profiles-scope-en.png');
  await evaluate('document.querySelector("[data-testid=scope-path]").focus();document.querySelector("[data-testid=scope-path]").select()');await cdp.call('Input.insertText',{text:'docs/INDEX.md'});await click('[data-testid=scope-run]');await deadline(()=>evaluate('Boolean(document.querySelector("[data-testid=scope-result]"))'),'excluded path');
  assert.ok(await evaluate('document.querySelector("[data-testid=scope-result]").textContent.includes("DOES_NOT_APPLY")'));
  await evaluate('document.querySelector("[data-testid=scope-path]").focus();document.querySelector("[data-testid=scope-path]").select()');await cdp.call('Input.insertText',{text:'../escape'});await click('[data-testid=scope-run]');await deadline(()=>evaluate('Boolean(document.querySelector("[data-testid=scope-error]"))'),'scope rejection');
  assert.equal(await evaluate('Boolean(document.querySelector("[data-testid=scope-result]"))'),false);
  const routes=await evaluate('Array.from(document.querySelectorAll("[data-nav]"),e=>e.dataset.nav)');assert.equal(routes.length,16);
  for(const id of routes){await click('[data-nav="'+id+'"]');await deadline(()=>evaluate(`location.hash.startsWith('#/${id}')`),'route '+id);}
  await deadline(()=>evaluate('Boolean(document.querySelector("[data-testid=planned-screen]"))'),'planned settings');
  assert.ok(await evaluate('document.querySelector("[data-testid=planned-screen]").textContent.includes("NOT_IMPLEMENTED")'));
  await capture('t10-navigation-settings-en.png');
  await click('[data-nav=registry]');
  await evaluate('document.querySelector(".p0-skip").focus()');await cdp.call('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',text:'\r',windowsVirtualKeyCode:13});await cdp.call('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
  assert.equal(await evaluate('document.activeElement.id'),'studio-main');
 }
 const rejected=[];
 for(const [route,method,status] of [['/api/v1/workspaces','POST',403],['/api/v1/workspaces/rc3-local/generate/export','POST',403],['/api/staging','POST',403],['/api/v1/workspaces/rc3-local/instructions?language=ar','GET',400]]){
  const actual=await evaluate(`fetch(${JSON.stringify(route)},{method:${JSON.stringify(method)},headers:{'X-Studio-Token':${JSON.stringify(token)}}}).then(r=>r.status)`);assert.equal(actual,status);rejected.push({route,method,status});
 }
 for(const width of [320,768,1024,1440]){
  await cdp.call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width===320});
  assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth+1'),'No page overflow at '+width);
 }
 await capture('t07-registry-desktop.png');
 const ax=await cdp.call('Accessibility.getFullAXTree');assert.ok(ax.nodes.some(n=>n.role?.value==='heading'));
 return {checkpoint,arIDs,sampleIds,ar_en_ids_identical:true,keyboard:'PASS',scope:checkpoint==='PHASE1'?'Python CLI 3: ar/en identical; exclusion and invalid-path rejection tested':'NOT_RUN',navigation:checkpoint==='PHASE1'?'16 routes; 5 read screens and explicit deferred routes':'CHECKPOINT_ONLY',review_due:'Real source has no nextReview; overdue filter returns zero; positive due case is covered separately in catalog tests',sample_status:'PENDING_REVIEW / T11a NOT_RUN',rejected,breakpoints:[320,768,1024,1440],accessibility_nodes:ax.nodes.length};
}
