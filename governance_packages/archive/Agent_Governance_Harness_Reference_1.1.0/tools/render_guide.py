#!/usr/bin/env python3
"""Build a self-contained Arabic reading edition from local reviewed sources.
Optional authoring dependencies only. No network, installation or execution of references.
"""
from pathlib import Path
import hashlib
import html
import json
import re
from urllib.parse import unquote
import mistune
from bs4 import BeautifulSoup

ROOT=Path(__file__).resolve().parents[1]
PRIMARY='guide/GUIDE_AR.md'
ORDER=[PRIMARY,'START_HERE_AR.md',
 'procedures/SMART_CLARIFICATION_AR.md','procedures/ALTERNATIVES_AND_IMPACT_AR.md',
 'procedures/LIFECYCLE_AR.md','procedures/EXTERNAL_CAPABILITIES_AR.md',
 'procedures/EXECUTION_AND_GIT_AR.md','procedures/COMMUNICATION_AND_HANDOFF_AR.md',
 'procedures/PROGRESS_AND_DRIFT_AR.md','standards/README_AR.md']
ORDER += [p.relative_to(ROOT).as_posix() for p in sorted((ROOT/'standards').glob('[0-9]*.md'))]
ORDER += ['options/EXTERNAL_TOOLS_AR.md','options/OPTIONAL_SKILLS_AR.md','sources/REGISTER_AR.md','templates/DELIVERY_HANDOFF_AR.md','templates/STATUS_REPORT_AR.md','optional_skills/README.md']
ORDER += [p.relative_to(ROOT).as_posix() for p in sorted((ROOT/'optional_skills').glob('*/SKILL.md'))]
EXCLUDE={'MANIFEST.json','guide/GUIDE_AR.html'}
def anchor(path):return 'doc-'+hashlib.sha256(path.encode()).hexdigest()[:16]
def local_target(current,link):
 link=unquote(link.split('#')[0])
 if not link or re.match(r'^[a-zA-Z][a-zA-Z0-9+.-]*:',link):return None
 p=(ROOT/current).parent/link;p=p.resolve()
 if not p.is_relative_to(ROOT) or not p.is_file():return None
 return p.relative_to(ROOT).as_posix()

def build():
 paths=list(dict.fromkeys(ORDER));pending=list(paths)
 # Embed locally linked text recursively; no scripts are run. Prevent output self-inclusion.
 while pending:
  name=pending.pop(0)
  if Path(name).suffix!='.md':continue
  for link in re.findall(r'\[[^\]]*\]\(([^\s)]+)\)',(ROOT/name).read_text()):
   target=local_target(name,link)
   if target=='guide/GUIDE_AR.html':target=PRIMARY
   if target and target not in EXCLUDE and target not in paths and Path(target).suffix in {'.md','.json','.py','.txt'} and not target.startswith(('design/frozen/','verification/results/')):
    paths.append(target);pending.append(target)
 renderer=mistune.create_markdown(escape=True,plugins=['table','strikethrough'])
 diagrams=json.loads((ROOT/'guide/DIAGRAMS.json').read_text())['diagrams'];di=0
 fragments=[];toc=[];hashes={}
 for name in paths:
  text=(ROOT/name).read_text();hashes[name]=hashlib.sha256(text.encode()).hexdigest()
  rendered=renderer(text) if Path(name).suffix=='.md' else '<pre><code>'+html.escape(text)+'</code></pre>'
  soup=BeautifulSoup(rendered,'html.parser')
  for a in soup.find_all('a',href=True):
   target=local_target(name,a['href'])
   if target=='guide/GUIDE_AR.html':target=PRIMARY
   if target in paths:a['href']='#'+anchor(target)
   elif a['href'].startswith(('https://','http://')):a['rel']='noopener noreferrer'
  for pre in soup.find_all('pre'):
   code=pre.find('code');classes=code.get('class',[]) if code else []
   if name==PRIMARY and 'language-mermaid' in classes:
    if di>=len(diagrams):raise ValueError('Missing reviewed SVG illustration')
    svg=BeautifulSoup(diagrams[di],'html.parser');di+=1
    figure=soup.new_tag('figure',attrs={'class':'diagram'})
    svg.svg['role']='img';svg.svg['aria-label']=f'شكل توضيحي {di} لمكونات الحوكمة'
    figure.append(svg);cap=soup.new_tag('figcaption');cap.string=f'شكل {di} — توضيح مرجعي؛ لا يمثل تنفيذًا أو صلاحية فعلية.';figure.append(cap);pre.replace_with(figure)
   else:pre['dir']='auto'
  for table in soup.find_all('table'):
   wrap=soup.new_tag('div',attrs={'class':'table-wrap','tabindex':'0'});table.wrap(wrap)
  for n,h in enumerate(soup.find_all(re.compile('^h[1-6]$'))):
   h['id']=anchor(name)+'-h'+str(n)
   if name==PRIMARY and h.name=='h1' and re.match(r'^\d+\.',h.get_text()):toc.append((h['id'],h.get_text()))
  title=soup.find(re.compile('^h[1-6]$'));title=title.get_text() if title else name
  if name!=PRIMARY:
   toc.append((anchor(name),title))
   fragments.append('<section class="appendix" id="'+anchor(name)+'"><div class="path" dir="ltr">'+html.escape(name)+'</div>'+str(soup)+'</section>')
  else:fragments.append('<section id="'+anchor(name)+'">'+str(soup)+'</section>')
 if di!=len(diagrams):raise ValueError('Unused reviewed illustrations')
 css='''*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:#f3f5f7;color:#1d2e3f;font-family:Tahoma,Arial,sans-serif;font-size:16px;line-height:1.95}header{background:#113b4a;color:white;padding:44px max(4vw,22px)}header h1{color:#ffffff;font-size:34px;line-height:1.5;max-width:1050px;margin:16px 0}header p{max-width:950px;color:#e0edf1}header .eyebrow{font-size:13px;letter-spacing:.12em;color:#99d0d4}.layout{display:grid;grid-template-columns:290px minmax(0,1fr);gap:26px;max-width:1500px;padding:26px;margin:auto}aside{position:sticky;top:15px;max-height:92vh;overflow:auto;background:white;border:1px solid #d5dfe4;border-radius:12px;padding:18px;align-self:start;font-size:12px}aside a{display:block;padding:7px 0;border-bottom:1px solid #edf1f3;text-decoration:none}aside input{width:100%;padding:8px;border:1px solid #c2d1d9;font:inherit}main{min-width:0;background:white;border:1px solid #d5dfe4;border-radius:12px;padding:35px 42px}a{color:#096a85;overflow-wrap:anywhere}h1,h2,h3{line-height:1.65;color:#134b60;scroll-margin-top:20px}main h1{font-size:26px;margin-top:45px;border-top:2px solid #dbe5e9;padding-top:22px}main h2{font-size:21px}main h3{font-size:18px}p,li{overflow-wrap:anywhere}code{font-family:Consolas,monospace;font-size:.88em;direction:ltr;unicode-bidi:isolate;background:#edf3f6;padding:2px 4px;border-radius:4px;overflow-wrap:anywhere}pre{background:#163140;color:#edf4f7;padding:18px;border-radius:8px;overflow:auto;line-height:1.7;font-size:13px;max-height:550px}pre code{background:none;padding:0;white-space:pre;overflow-wrap:normal;direction:inherit;unicode-bidi:plaintext}.table-wrap{overflow:auto;margin:22px 0;border:1px solid #d7e1e6;border-radius:8px}table{border-collapse:collapse;width:100%;min-width:520px;font-size:14px}th,td{padding:12px;border-bottom:1px solid #dfe6ea;vertical-align:top;text-align:right}th{background:#eaf1f5}tr:nth-child(even){background:#fafcfd}.diagram{margin:25px 0;border:1px solid #d5e2e8;border-radius:10px;overflow:auto}.diagram svg{display:block;width:100%;min-width:650px;height:auto;font-family:Tahoma,Arial,sans-serif}figcaption{padding:8px 14px;font-size:12px;color:#556d7a;min-width:500px}.appendix{margin-top:60px;border-top:4px solid #658f9e;padding-top:24px}.path{font-family:Consolas,monospace;font-size:12px;color:#607985;overflow-wrap:anywhere}footer{text-align:center;padding:25px;color:#607080;font-size:13px}.skip{position:absolute;right:-9999px}.skip:focus{right:12px;top:12px;padding:12px;background:white;z-index:5}@media(max-width:1050px){.layout{display:block;padding:15px}aside{position:static;max-height:250px;margin-bottom:18px}main{padding:24px}}@media(max-width:600px){header{padding:24px 18px}header h1{font-size:25px}body{font-size:15px}main{padding:17px}main h1{font-size:22px}.layout{padding:10px}}@media print{aside{display:none}.layout{display:block;padding:0}header,main{background:white;color:#163140;border:0;padding:0}header p{color:#163140}pre{max-height:none;white-space:pre-wrap}.diagram svg{min-width:0}table{min-width:0}h1,h2,h3{break-after:avoid}.diagram,tr{break-inside:avoid}a{color:inherit}}'''
 nav=''.join('<a href="#'+i+'">'+html.escape(t)+'</a>' for i,t in toc)
 output='<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="الدليل الأكاديمي الموحّد لحزمة AGHR 1.1.0"><title>AGHR 1.1.0 — الدليل العربي الموحّد</title><style>'+css+'</style></head><body><a class="skip" href="#content">الانتقال إلى المحتوى</a><header><div class="eyebrow" dir="ltr">AGHR · COMPLETE REFERENCE · 1.1.0</div><h1>حوكمة واضحة، واستيضاح ذكي، وتنفيذ قابل للتحقق</h1><p>الدليل الأكاديمي والتطبيقي الموحّد: 38 بابًا، مع الإجراءات والمعايير والمهارات الاختيارية. العقود الأربعة وسجل القواعد الواحد هما أساس التشغيل؛ العرض لا يمنح اعتمادًا أو صلاحية.</p></header><div class="layout"><aside aria-label="فهرس الدليل والملاحق"><strong>أبواب الدليل والمراجع المرفقة</strong>'+nav+'</aside><main id="content">'+''.join(fragments)+'</main></div><footer>AGHR 1.1.0 · نسخة قراءة محلية مشتقة من المرجع · المهارات غير مثبّتة؛ تأهيل المضيف والتقييم الحي غير منفذين.</footer></body></html>'
 (ROOT/'guide/GUIDE_AR.html').write_text(output,encoding='utf-8')
 return {'status':'RENDERED','main_chapters':38,'embedded_documents':len(paths),'illustrations':di,'source_sha256':hashes,'network_used':False}
if __name__=='__main__':print(json.dumps(build(),ensure_ascii=False,indent=2))
