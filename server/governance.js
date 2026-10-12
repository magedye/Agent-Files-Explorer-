import fs from "node:fs";
import path from "node:path";
import { AGHR_ROOT } from "./security.js";

function readJsonFile(relPath) {
  const fullPath = path.join(AGHR_ROOT, relPath);
  if (!fs.existsSync(fullPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(fullPath, "utf8"));
  } catch {
    return null;
  }
}

/**
 * Service for querying and browsing AGHR Reference files and relationships.
 */
class GovernanceReferenceService {
  constructor() {
    this._status = null;
    this._rules = null;
    this._sources = null;
    this._adapters = null;
    this._profiles = null;
    this._enforcement = null;
    this.refresh();
  }

  refresh() {
    this._status = readJsonFile("PACKAGE_STATUS.json") || {};
    this._rules = (readJsonFile("registry/RULES.json") || {}).rules || [];
    this._sources = (readJsonFile("sources/REGISTER.json") || {}).sources || [];
    this._adapters = (readJsonFile("adapters/REGISTER.json") || {}).adapters || [];
    this._profiles = (readJsonFile("profiles/PROFILES.json") || {}).profiles || {};
    this._enforcement = (readJsonFile("registry/ENFORCEMENT_COVERAGE.json") || {}).rules || [];
  }

  getSummary() {
    return {
      package: this._status.package || "Agent Governance and Harness Reference",
      version: this._status.version || "1.0.0",
      reference_state: this._status.reference_state || "FINAL_REFERENCE",
      default_provider: this._status.default_provider || "OPENAI",
      default_profile: this._status.default_profile || "STANDARD",
      independent_review: this._status.independent_review || "NOT_PERFORMED",
      release_acceptance: this._status.release_acceptance || "NOT_GRANTED",
      counts: {
        rules: this._rules.length,
        sources: this._sources.length,
        adapters: this._adapters.length,
        profiles: Object.keys(this._profiles).length,
        contracts: 4, // GOVERNANCE, RUNTIME, ENFORCEMENT, EVIDENCE
      },
    };
  }

  getRules({ search = "", force = "", source = "", enforcementClass = "" } = {}) {
    const s = search.toLowerCase().trim();
    return this._rules.filter((r) => {
      if (force && r.force !== force) return false;
      if (enforcementClass && r.enforcement_class !== enforcementClass) return false;
      if (source && !(r.basis || []).includes(source)) return false;
      if (s) {
        const hay = `${r.id} ${r.title} ${r.text} ${r.applies_when} ${(r.basis || []).join(" ")}`.toLowerCase();
        return hay.includes(s);
      }
      return true;
    });
  }

  getRule(id) {
    const rule = this._rules.find((r) => r.id === id);
    if (!rule) return null;

    // Enrich with source details
    const sources = this._sources.filter((s) => (rule.basis || []).includes(s.id));
    const enforcement = this._enforcement.find((e) => e.rule_id === rule.id);

    return {
      ...rule,
      basis_sources: sources,
      enforcement_coverage: enforcement || null,
    };
  }

  getSources({ search = "", publisher = "", kind = "" } = {}) {
    const s = search.toLowerCase().trim();
    return this._sources.filter((src) => {
      if (publisher && src.publisher !== publisher) return false;
      if (kind && src.kind !== kind) return false;
      if (s) {
        const hay = `${src.id} ${src.title} ${src.publisher} ${src.supported_takeaway} ${src.locator}`.toLowerCase();
        return hay.includes(s);
      }
      return true;
    });
  }

  getSource(id) {
    const src = this._sources.find((s) => s.id === id);
    if (!src) return null;
    const derivedRules = this._rules.filter((r) => (r.basis || []).includes(id));
    return {
      ...src,
      derived_rules: derivedRules.map((r) => ({ id: r.id, title: r.title, force: r.force })),
    };
  }

  getAdapters() {
    return this._adapters;
  }

  getProfiles() {
    return this._profiles;
  }

  getContracts() {
    return [
      { id: "GOVERNANCE", title: "Core Governance Contract", path: "contracts/GOVERNANCE.md" },
      { id: "RUNTIME", title: "Runtime & Tool Contract", path: "contracts/RUNTIME.md" },
      { id: "ENFORCEMENT", title: "Enforcement Contract", path: "contracts/ENFORCEMENT.md" },
      { id: "EVIDENCE", title: "Evidence & Records Contract", path: "contracts/EVIDENCE.md" },
    ];
  }

  getRelationshipGraph() {
    const nodes = [];
    const edges = [];
    const nodeSet = new Set();

    const addNode = (id, label, group, title = "") => {
      if (nodeSet.has(id)) return;
      nodeSet.add(id);
      nodes.push({ id, label, group, title });
    };

    // 1. Add Source Nodes
    for (const s of this._sources) {
      addNode(s.id, `${s.id}: ${s.title.slice(0, 24)}…`, "source", `${s.publisher}: ${s.title}\n${s.url}`);
    }

    // 2. Add Contract Nodes
    for (const c of this.getContracts()) {
      addNode(c.id, c.title, "contract", c.path);
    }

    // 3. Add Rule Nodes & Typed Relationships
    for (const r of this._rules) {
      addNode(r.id, `${r.id}: ${r.title.slice(0, 20)}…`, `rule_${r.force}`, `${r.title}\nForce: ${r.force}`);

      // Edge Rule -> Basis Sources (AUTHORITATIVE_BASIS)
      for (const b of r.basis || []) {
        if (nodeSet.has(b)) {
          edges.push({
            from: r.id,
            to: b,
            type: "AUTHORITATIVE_BASIS",
            label: "basis",
            arrows: "to",
            color: "#3b82f6",
          });
        }
      }

      // Edge Rule -> Contract (NORMATIVE_CONTRACT)
      if (r.explanation_ref) {
        let contractId = null;
        if (r.explanation_ref.includes("GOVERNANCE")) contractId = "GOVERNANCE";
        else if (r.explanation_ref.includes("RUNTIME")) contractId = "RUNTIME";
        else if (r.explanation_ref.includes("ENFORCEMENT")) contractId = "ENFORCEMENT";
        else if (r.explanation_ref.includes("EVIDENCE")) contractId = "EVIDENCE";

        if (contractId && nodeSet.has(contractId)) {
          edges.push({
            from: r.id,
            to: contractId,
            type: "NORMATIVE_CONTRACT",
            label: "contract",
            arrows: "to",
            color: "#10b981",
          });
        }
      }
    }

    return { nodes, edges };
  }
}

export const governanceService = new GovernanceReferenceService();
