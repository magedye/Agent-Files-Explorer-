# AGHR Studio — التثبيت والتشغيل الداخلي

## حالة المرشح

اعتمد المالك [Studio v1.0.0 للاستخدام المحلي والمؤسسي المغلق](../evidence/studio-signoff-2026-10-26/OWNER_SIGNOFF_AR.md) وأغلق المشروع. wheel المقبولة تحتفظ بمعرف بنائها `aghr-studio 0.1.0.dev20261025+win.3` وبصمتها الأصلية؛ لم يعاد بناؤها أو إعادة تسميتها. واجهة Studio المثبتة تستخدم rc.3 بالفعل؛ تحديث كتالوج المصدر يجعل rc.3 الافتراضي أيضًا للمشاريع الجديدة مع Legacy1.2.0. عتبات الأداء غير المحققة مقبولة كقيود، وتجربة pipx لا تدعي VMنظيفة. لا نشر PyPI أو إصدار عام.

## المتطلبات الفعلية

- Windows AMD64، وCPython3.12، وNode.js `>=24.11,<25` مثبت خارجيًا. ملف Node التنفيذي غير مضمّن في wheel.
- `pipx`؛ تجربة البناء الحالية تستخدم1.18.4، وhatchling1.32.4 في بيئة أدوات منفصلة.
- Python: سبع حزم من `requirements.lock` الأصلي، بنسخ وبصمات مغلقة. أصول الواجهة وws8.22.0 ومحرك rc.3 والعقود داخل حزمة المصدر المثبتة.
- محوّلا T15 وقراءة Python المجمدان يعتمدان Windows. Linux/macOS خارج نطاق القبول بتوجيه المالك؛ لا يطلب المرشح دعمهما. لا يُستبدل الحد الصلب للذاكرة بتقدير أو ادعاء دعم.

## تثبيت wheel المحلية

من مجلد المشروع، وبعد فحص بصمة wheel في تقرير T38؛ استبدل مسار CPython3.12بمساره الفعلي على جهازك:

```powershell
$aghrPipxMaintenance = $env:PIPX_DISABLE_SHARED_LIBS_AUTO_UPGRADE
try {
  $env:PIPX_DISABLE_SHARED_LIBS_AUTO_UPGRADE = "1"
  pipx install --python "C:/Users/Majed/AppData/Local/Programs/Python/Python312/python.exe" --pip-args="--no-index --find-links=D:/APP/Agent-Files-Explorer/temp/t38-wheelhouse --only-binary=:all:" D:/APP/Agent-Files-Explorer/docs/evidence/studio-t38-2026-10-25/wheels/aghr_studio-0.1.0.dev20261025+win.3-py3-none-any.whl
} finally {
  $env:PIPX_DISABLE_SHARED_LIBS_AUTO_UPGRADE = $aghrPipxMaintenance
}
aghr-studio --version
aghr-studio --doctor
aghr-studio
```

هذا تثبيت من ملف محلي؛ لا تنفذ `pipx install aghr-studio` من الفهرس العام قبل وجود إصدار معتمد. اسم عام مطابق لا يثبت صلته بهذا المرشح. عند العمل دون اتصال يمكن استخدام خيار pipx الرسمي PIPX_DISABLE_SHARED_LIBS_AUTO_UPGRADE=1 لتهيئة مُثبّته من pip المرفق مع CPython؛ يُضبط في طرفية الاختبار فقط. لا يغيّر ذلك حدود T15 أو صلاحيات التطبيق.

الوضع الافتراضي يستمع على `127.0.0.1:5183`. التخزين في `%LOCALAPPDATA%/AGHRStudio/Drafts`؛ يمكن تحديد مجلد Draft خارجي صراحة:

```powershell
aghr-studio --port=5183 --storage-root=D:/AGHRStudioTrials/Drafts
```

لا يقبل المشغل مسار تخزين داخل الحمولة المثبتة أو مسارًا يحوّله junction/symlink. يتحقق من بصمات الحمولة قبل التشغيل. يبقى توقيع الناشر غير موثق، ولا تعادل البصمة مصادقة الناشر.

## الجلسة والتفويض

انسخ رمز الجلسة المؤقت من الطرفية إلى واجهة الدخول؛ لا تحفظه في تقرير أو رابط أو مستودع. يتغير عند إعادة التشغيل. كتابة Draft تحتاج منحة محددة العملية والبصمة والمدة، تُعتمد من قناة المشغل المحلية. لا يستطيع HTTP إصدار المنحة لنفسه. GPG غير مهيأ؛ تحذير Unsigned ظاهر ومقبول مؤقتًا من المالك.

مصدر العرض مستقل عن مساحة Draft التشغيلية. المشروعان المرفقان عينتان مقبولتان تاريخيًا؛ لا يمنحهما فتح التطبيق تأهيلًا جديدًا. Codex/Antigravity وCI المستضاف تبقى `NOT_RUN`.

## الإيقاف والتراجع

أرسل `quit` في طرفية المشغل وانتظر خروج العملية. احتفظ بقاعدة Draft وأدلتها وبنسخة wheel وبصمتها. الرجوع إلى wheel سابقة يحتاج تثبيتًا صريحًا في بيئة منفصلة؛ لا استعادة تلقائية لقاعدة البيانات ولا downgrade صامتًا. ملفات المرجع1.2.0 والمشروعين المنشورين لا تدخل في عمليات كتابة التطبيق.

للتطوير: [الواجهة والعقود والحدود](STUDIO_UNIFIED_ACCEPTANCE.md). أدلة النظامين غير المتاحين لا تُستبدل بمحاكاة أو بمجرد بناء wheel؛ ومراجعة T39 مستقلة، وقرار T40 للمالك.
