import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frameworkPath = path.join(__dirname, "aapes-framework.json");

let cachedFramework = null;
export function getAapesFramework() {
  if (!cachedFramework) {
    cachedFramework = JSON.parse(fs.readFileSync(frameworkPath, "utf8"));
  }
  return cachedFramework;
}

/**
 * Evaluate an assessment payload against the AAPES v2.1 framework.
 *
 * Discloses separate outputs:
 * 1. diagnostic_score (0-100)
 * 2. qualification (BLOCKED | READY_FOR_AUTHORIZED_REVIEW)
 * 3. blockers array
 * 4. domains breakdown
 * 5. hard_limit notice
 */
export function evaluateAssessment(assessment) {
  const fw = getAapesFramework();

  if (!assessment || typeof assessment !== "object") {
    throw new Error("Invalid assessment payload: expected an object");
  }

  const risk = assessment.risk_level;
  if (!fw.risk_levels[risk]) {
    throw new Error(`Invalid risk_level: '${risk}'. Must be one of: R0, R1, R2, R3`);
  }

  const scores = assessment.scores || {};
  const blockers = [];
  const domain_details = [];
  let num = 0.0;
  let den = 0.0;

  for (const d of fw.domains) {
    const did = d.id;
    const data = scores[did] || { maturity: 0, evidence_refs: [] };
    const m = data.maturity;
    const w = d.importance_weight_percent;
    const impact = d.impact_multiplier_by_risk[risk] !== undefined ? d.impact_multiplier_by_risk[risk] : 1.0;
    const p0 = d.priority_base === "P0" || (d.priority_if_risk && d.priority_if_risk[risk] === "P0");

    if (m === "NOT_APPLICABLE") {
      const permitted = (risk === "R0" || risk === "R1") && (did === "D08" || did === "D11");
      if (!permitted || !data.na_reason || !data.na_approved_by) {
        blockers.push(`${did}: invalid/unapproved N/A exception`);
      }
      domain_details.push({
        id: did,
        name: d.name,
        maturity: m,
        weight: w,
        impact,
        p0
      });
      continue;
    }

    const maturityNum = Number(m);
    if (isNaN(maturityNum) || maturityNum < 0 || maturityNum > 4) {
      blockers.push(`${did}: invalid maturity score '${m}'. Must be 0, 1, 2, 3, 4, or NOT_APPLICABLE`);
      domain_details.push({ id: did, name: d.name, maturity: m, weight: w, impact, p0 });
      continue;
    }

    den += w * impact;
    num += w * impact * (maturityNum / 4);

    if (maturityNum >= 3 && (!data.evidence_refs || data.evidence_refs.length === 0)) {
      blockers.push(`${did}: maturity ${maturityNum} has no evidence references`);
    }
    if (maturityNum === 4 && (!data.verified_by || !data.verification_ref)) {
      blockers.push(`${did}: maturity 4 lacks named independent verification evidence`);
    }
    if (p0 && (risk === "R2" || risk === "R3") && maturityNum !== 4) {
      blockers.push(`${did}: applicable P0 must be maturity 4 for ${risk}`);
    }

    domain_details.push({
      id: did,
      name: d.name,
      maturity: maturityNum,
      weight: w,
      impact,
      p0,
      evidence_refs: data.evidence_refs || []
    });
  }

  const score = den > 0 ? Math.round((100 * num / den) * 100) / 100 : 0;
  if (den === 0) {
    blockers.push("All domains excluded; no scoring basis");
  }

  const threshold = fw.risk_levels[risk].minimum_readiness;
  if (score < threshold) {
    blockers.push(`Diagnostic score ${score} < provisional risk-tier threshold ${threshold}`);
  }

  // Critical safety veto signals
  const vetoSignals = assessment.veto_signals || {};
  for (const key of fw.critical_blocker_signals) {
    if (vetoSignals[key] !== false) {
      blockers.push(`Critical safety signal ${key}=${vetoSignals[key]} (FALSE required)`);
    }
  }

  // Stage gates check
  const requiredGates = fw.qualification_required_gates[risk] || [];
  const gates = assessment.gates || {};
  for (const gate of requiredGates) {
    const v = gates[gate];
    if (!v || v.status !== "PASS") {
      blockers.push(`${gate}: required gate not PASS (${v?.status || "NOT_PROVIDED"})`);
    } else if (!v.evidence_refs || v.evidence_refs.length === 0) {
      blockers.push(`${gate}: PASS claim without evidence reference`);
    }
  }

  // Owner approval check
  const approval = assessment.owner_approval || {};
  if ((risk === "R2" || risk === "R3") && (approval.status !== "GRANTED" || !approval.approval_ref || !approval.approver)) {
    blockers.push(`${risk}: independent authorized owner approval is missing or incomplete`);
  }

  const status = blockers.length > 0 ? "BLOCKED" : "READY_FOR_AUTHORIZED_REVIEW";

  return {
    standard_id: fw.standard_id,
    standard_version: fw.version,
    risk_level: risk,
    diagnostic_score: score,
    provisional_threshold: threshold,
    qualification: status,
    blocker_count: blockers.length,
    blockers,
    domains: domain_details,
    evidence_sufficiency: blockers.filter(b => b.includes("evidence") || b.includes("verification")).length === 0 ? "SUFFICIENT" : "DEFICIENT",
    verification_status: blockers.filter(b => b.includes("verified")).length === 0 ? "VERIFIED" : "UNVERIFIED",
    approval_status: approval.status || "NOT_REQUESTED",
    hard_limit: "Input evidence and approval references are unverified assertions. Passing this calculator NEVER activates an agent or authorizes execution."
  };
}
