export async function fetchRoots() {
  const r = await fetch("/api/roots");
  if (!r.ok) throw new Error("فشل جلب الجذور المعتمدة");
  return (await r.json()).roots;
}

export async function fetchTree(dir, rootId) {
  const url = rootId
    ? "/api/tree?rootId=" + encodeURIComponent(rootId)
    : "/api/tree?dir=" + encodeURIComponent(dir);
  const r = await fetch(url);
  const j = await r.json();
  if (!r.ok) throw new Error(j.error || "فشل جلب الشجرة");
  return j;
}

export async function fetchFile(path, rootId, rel) {
  const url = rootId && rel
    ? "/api/file?rootId=" + encodeURIComponent(rootId) + "&rel=" + encodeURIComponent(rel)
    : "/api/file?path=" + encodeURIComponent(path);
  const r = await fetch(url);
  const j = await r.json();
  if (!r.ok) throw new Error(j.error || "فشل جلب الملف");
  return j;
}

export const rawUrl = (path, rootId, rel) =>
  rootId && rel
    ? "/api/raw?rootId=" + encodeURIComponent(rootId) + "&rel=" + encodeURIComponent(rel)
    : "/api/raw?path=" + encodeURIComponent(path);

