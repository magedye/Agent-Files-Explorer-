import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const yamlPath = path.resolve(
  __dirname,
  "../governance_packages/candidates/AAPES_v2.1_Candidate/skills/aapes-policy-engineering/resources/aapes-v2.1/framework.yaml"
);
const jsonPath = path.resolve(__dirname, "../server/aapes-framework.json");

const content = fs.readFileSync(yamlPath, "utf8");
const lines = content.split("\n");

// A lightweight parser tailored to the clean structure of framework.yaml
const framework = {
  standard_id: "AAPES-STD-002",
  version: "2.1.0-rc.1",
  publication_date: "2026-11-04",
  status: "REVIEW_CANDIDATE_NOT_ADOPTED",
  authority_notice: "Proposed internal specification; not ISO/IEEE certification, production authorization, or an assertion of external compliance.",
  lineage: [
    "AAPES v1.0 internal pack",
    "User-supplied AAPES v2.0 draft reviewed and selectively integrated"
  ],
  weight_interpretation: "Design priorities only; percentages are not measured risk probabilities or expected performance gains.",
  impact_interpretation: "Per-risk subjective multipliers for prioritization; risk-specific validation and owner calibration required.",
  risk_levels: {
    R0: { description: "Advisory/no external state-changing tools", minimum_readiness: 75 },
    R1: { description: "Tool access limited to authorized reads; confidentiality still applies", minimum_readiness: 80 },
    R2: { description: "State-changing non-production/staging actions", minimum_readiness: 85 },
    R3: { description: "Production, sensitive, finance or irreversible action", minimum_readiness: 90 }
  },
  maturity_scale: {
    0: "Absent",
    1: "Documented only",
    2: "Testable design with owner",
    3: "Implemented with evidence references",
    4: "Independently verified in stated scope"
  },
  gate_order: ["G0", "G1", "G2", "G3", "G4", "G5", "G6", "G7"],
  gate_descriptions: {
    G0: "Scope, task, risk and owner registered",
    G1: "Atomic requirements and decision tables checked",
    G2: "Platform authority, conflicts and trust boundaries checked",
    G3: "Tool boundaries and independent enforcement demonstrated",
    G4: "Behavioral, policy and adversarial tests executed in scope",
    G5: "Evidence traceability, integrity and recovery reviewed",
    G6: "Authorized approval or formal risk acceptance recorded",
    G7: "Controlled activation, monitoring and emergency stop (post-approval)"
  },
  critical_blocker_signals: [
    "unverified_critical_failure",
    "bypassable_pep_detected",
    "unauthorized_privilege_escalation",
    "uncontrolled_memory_overwrite"
  ],
  qualification_required_gates: {
    R0: ["G0", "G1", "G6"],
    R1: ["G0", "G1", "G2", "G5", "G6"],
    R2: ["G0", "G1", "G2", "G3", "G4", "G5", "G6"],
    R3: ["G0", "G1", "G2", "G3", "G4", "G5", "G6", "G7"]
  },
  domains: []
};

// Parse domains block from framework.yaml
let currentDomain = null;
let currentReq = null;
let inImpact = false;
let inReqs = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const trimmed = line.trim();

  if (/^-\s*id:\s*(D\d+)/.test(trimmed)) {
    const match = trimmed.match(/^-\s*id:\s*(D\d+)/);
    currentDomain = {
      id: match[1],
      name: "",
      importance_weight_percent: 0,
      priority_base: "P0",
      priority_if_risk: {},
      impact_multiplier_by_risk: { R0: 1.0, R1: 1.0, R2: 1.0, R3: 1.0 },
      deliverable: "",
      requirements: []
    };
    framework.domains.push(currentDomain);
    inImpact = false;
    inReqs = false;
    currentReq = null;
    continue;
  }

  if (!currentDomain) continue;

  if (trimmed.startsWith("name:") && !inReqs) {
    currentDomain.name = trimmed.replace(/^name:\s*/, "").replace(/^['"]|['"]$/g, "");
  } else if (trimmed.startsWith("importance_weight_percent:")) {
    currentDomain.importance_weight_percent = parseInt(trimmed.replace(/^importance_weight_percent:\s*/, ""), 10);
  } else if (trimmed.startsWith("priority_base:")) {
    currentDomain.priority_base = trimmed.replace(/^priority_base:\s*/, "").replace(/^['"]|['"]$/g, "");
  } else if (trimmed.startsWith("deliverable:")) {
    currentDomain.deliverable = trimmed.replace(/^deliverable:\s*/, "").replace(/^['"]|['"]$/g, "");
  } else if (trimmed.startsWith("impact_multiplier_by_risk:")) {
    inImpact = true;
    inReqs = false;
  } else if (inImpact && /^[R][0-3]:/.test(trimmed)) {
    const parts = trimmed.split(":");
    currentDomain.impact_multiplier_by_risk[parts[0].trim()] = parseFloat(parts[1].trim());
  } else if (trimmed.startsWith("priority_if_risk:")) {
    inImpact = false;
    // Check if on same line or next lines
    if (trimmed.includes("{") && trimmed.includes("}")) {
      // inline dict
    }
  } else if (trimmed.startsWith("requirements:")) {
    inImpact = false;
    inReqs = true;
  } else if (inReqs && /^-\s*id:\s*(AAPES-REQ-\d+)/.test(trimmed)) {
    const match = trimmed.match(/^-\s*id:\s*(AAPES-REQ-\d+)/);
    currentReq = {
      id: match[1],
      title: "",
      normative_level: "MUST",
      statement: "",
      acceptance_test: ""
    };
    currentDomain.requirements.push(currentReq);
  } else if (currentReq) {
    if (trimmed.startsWith("title:")) {
      currentReq.title = trimmed.replace(/^title:\s*/, "").replace(/^['"]|['"]$/g, "");
    } else if (trimmed.startsWith("normative_level:")) {
      currentReq.normative_level = trimmed.replace(/^normative_level:\s*/, "").replace(/^['"]|['"]$/g, "");
    } else if (trimmed.startsWith("statement:")) {
      currentReq.statement = trimmed.replace(/^statement:\s*/, "").replace(/^['"]|['"]$/g, "");
    } else if (trimmed.startsWith("acceptance_test:")) {
      currentReq.acceptance_test = trimmed.replace(/^acceptance_test:\s*/, "").replace(/^['"]|['"]$/g, "");
    }
  }
}

// Set explicit priority_if_risk for D08 and D11
for (const d of framework.domains) {
  if (d.id === "D08" || d.id === "D11") {
    d.priority_if_risk = { R2: "P0", R3: "P0" };
  }
}

fs.writeFileSync(jsonPath, JSON.stringify(framework, null, 2), "utf8");
console.log(`Converted framework.yaml -> ${jsonPath}`);
console.log(`Domains count: ${framework.domains.length}`);
const totalReqs = framework.domains.reduce((acc, d) => acc + d.requirements.length, 0);
console.log(`Total requirements: ${totalReqs}`);
const totalWeight = framework.domains.reduce((acc, d) => acc + d.importance_weight_percent, 0);
console.log(`Total importance weight: ${totalWeight}%`);
