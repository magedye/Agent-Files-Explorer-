export async function fetchRoots() {
  const r = await fetch("/api/roots");
  if (!r.ok) throw new Error("error.roots");
  return (await r.json()).roots;
}

export async function fetchTree(dir, rootId) {
  const url = rootId
    ? "/api/tree?rootId=" + encodeURIComponent(rootId)
    : "/api/tree?dir=" + encodeURIComponent(dir);
  const r = await fetch(url);
  const j = await r.json();
  if (!r.ok) throw new Error(j.error || "error.tree");
  return j;
}

export async function fetchFile(path, rootId, rel) {
  const url = rootId && rel
    ? "/api/file?rootId=" + encodeURIComponent(rootId) + "&rel=" + encodeURIComponent(rel)
    : "/api/file?path=" + encodeURIComponent(path);
  const r = await fetch(url);
  const j = await r.json();
  if (!r.ok) throw new Error(j.error || "error.file");
  return j;
}

export const rawUrl = (path, rootId, rel) =>
  rootId && rel
    ? "/api/raw?rootId=" + encodeURIComponent(rootId) + "&rel=" + encodeURIComponent(rel)
    : "/api/raw?path=" + encodeURIComponent(path);

// -----------------------------------------------------------------------------
// AAPES v2.1 Client API
// -----------------------------------------------------------------------------
export async function fetchAapesStatus() {
  const r = await fetch("/api/aapes/status");
  if (!r.ok) throw new Error("Failed to load AAPES status");
  return await r.json();
}

export async function fetchAapesFramework() {
  const r = await fetch("/api/aapes/framework");
  if (!r.ok) throw new Error("Failed to load AAPES framework");
  return await r.json();
}

export async function fetchAapesMatrix() {
  const r = await fetch("/api/aapes/matrix");
  if (!r.ok) throw new Error("Failed to load AAPES matrix");
  return await r.json();
}

export async function reviewAapesPolicy(text, ruleId) {
  const r = await fetch("/api/aapes/review", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text, ruleId })
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error || "Failed to review policy");
  return j.review;
}

export async function assessAapesReadiness(payload) {
  const r = await fetch("/api/aapes/assess", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error || "Failed to assess readiness");
  return j.assessment;
}

export async function evaluateAapesSynthetic() {
  const r = await fetch("/api/aapes/evaluate", {
    method: "POST",
    headers: { "content-type": "application/json" }
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error || "Failed to run synthetic evaluation");
  return j.evaluation;
}

export async function proposeAapesChangePackage(payload) {
  const r = await fetch("/api/aapes/propose-cp", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error || "Failed to propose ChangePackage");
  return j;
}
