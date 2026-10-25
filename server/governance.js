import fs from "node:fs";
import path from "node:path";
import {
  DEFAULT_PACKAGE_ID,
  AGHR_1_0_0_ROOT,
  AGHR_1_1_0_ROOT,
  AGHR_MINIMAL_1_1_0_ROOT,
  AGHR_1_2_0_ROOT,
  AGHR_RC3_ROOT,
  GOVERNANCE_PACKAGES_ROOT,
} from "./security.js";

function readJsonFile(rootPath, relPath) {
  const fullPath = path.join(rootPath, relPath);
  if (!fs.existsSync(fullPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(fullPath, "utf8"));
  } catch {
    return null;
  }
}

/**
 * Service for querying and browsing multiple AGHR Reference packages and relationships.
 */
class GovernanceReferenceService {
  constructor() {
    this._defaultPackageId = DEFAULT_PACKAGE_ID;
    this._packages = new Map();
    this.refresh();
  }

  refresh() {
    this._packages.clear();

    if (fs.existsSync(AGHR_RC3_ROOT)) {
      const manifest = readJsonFile(AGHR_RC3_ROOT, "aghr.json");
      const status = readJsonFile(GOVERNANCE_PACKAGES_ROOT, "references/AGHR_Studio_1.0.0_rc3_RELEASE.json");
      const observation = readJsonFile(AGHR_RC3_ROOT, "policies/observations/reference-state.json");
      if (!manifest || !status || !observation) throw new Error("OFFICIAL_RC3_REFERENCE_UNAVAILABLE");
      this._packages.set("aghr_rc3", {
        id: "aghr_rc3", name: status.package, version: manifest.version, kind: "OFFICIAL_LOCAL_REFERENCE",
        rootPath: AGHR_RC3_ROOT, description: status.scope, isDefault: true, status,
        // Exact Core content in the legacy read view; no invented normative rules or sources.
        rules: [{...observation, text: observation.rule, basis: []}],
        sources: [], adapters: [], profiles: {}, enforcement: [],
      });
    }

    // Historical baseline remains available under its existing IDs.
    if (fs.existsSync(AGHR_1_0_0_ROOT)) {
      const status = readJsonFile(AGHR_1_0_0_ROOT, "PACKAGE_STATUS.json") || {};
      const rules = (readJsonFile(AGHR_1_0_0_ROOT, "registry/RULES.json") || {}).rules || [];
      const sources = (readJsonFile(AGHR_1_0_0_ROOT, "sources/REGISTER.json") || {}).sources || [];
      const adapters = (readJsonFile(AGHR_1_0_0_ROOT, "adapters/REGISTER.json") || {}).adapters || [];
      const profiles = (readJsonFile(AGHR_1_0_0_ROOT, "profiles/PROFILES.json") || {}).profiles || {};
      const enforcement = (readJsonFile(AGHR_1_0_0_ROOT, "registry/ENFORCEMENT_COVERAGE.json") || {}).rules || [];

      this._packages.set("aghr", {
        id: "aghr",
        name: "AGHR Reference 1.0.0",
        version: status.version || "1.0.0",
        kind: "HISTORICAL_BASELINE",
        rootPath: AGHR_1_0_0_ROOT,
        description: "Authoritative Agent Governance and Harness Reference v1.0.0 (Historical Baseline)",
        isDefault: false,
        status,
        rules,
        sources,
        adapters,
        profiles,
        enforcement,
      });
      this._packages.set("aghr_1_0_0", this._packages.get("aghr"));
    }

    // Previous full reference stays available from archive for comparison.
    if (fs.existsSync(AGHR_1_1_0_ROOT)) {
      const status = readJsonFile(AGHR_1_1_0_ROOT, "PACKAGE_STATUS.json") || {};
      const rules = (readJsonFile(AGHR_1_1_0_ROOT, "registry/RULES.json") || {}).rules || [];
      const sources = (readJsonFile(AGHR_1_1_0_ROOT, "sources/REGISTER.json") || {}).sources || [];
      const adapters = (readJsonFile(AGHR_1_1_0_ROOT, "adapters/REGISTER.json") || {}).adapters || [];
      const profiles = (readJsonFile(AGHR_1_1_0_ROOT, "profiles/PROFILES.json") || {}).profiles || {};
      const enforcement = (readJsonFile(AGHR_1_1_0_ROOT, "registry/ENFORCEMENT_COVERAGE.json") || {}).rules || [];

      this._packages.set("aghr_1_1_0", {
        id: "aghr_1_1_0",
        name: "AGHR Reference 1.1.0 (Full, Archived)",
        version: status.version || "1.1.0",
        kind: "FULL_REFERENCE",
        rootPath: AGHR_1_1_0_ROOT,
        description: "Archived AGHR v1.1.0 full reference for historical comparison",
        isDefault: false,
        status,
        rules,
        sources,
        adapters,
        profiles,
        enforcement,
      });
    }

    if (fs.existsSync(AGHR_1_2_0_ROOT)) {
      const status = readJsonFile(AGHR_1_2_0_ROOT, "PACKAGE_STATUS.json") || {};
      this._packages.set("aghr_1_2_0", {
        id: "aghr_1_2_0",
        name: "AGHR Reference 1.2.0",
        version: status.version || "1.2.0",
        kind: "FULL_REFERENCE",
        rootPath: AGHR_1_2_0_ROOT,
        description: "Updated reference with governed learning and classified lesson records",
        isDefault: false,
        status,
        rules: (readJsonFile(AGHR_1_2_0_ROOT, "registry/RULES.json") || {}).rules || [],
        sources: (readJsonFile(AGHR_1_2_0_ROOT, "sources/REGISTER.json") || {}).sources || [],
        adapters: (readJsonFile(AGHR_1_2_0_ROOT, "adapters/REGISTER.json") || {}).adapters || [],
        profiles: (readJsonFile(AGHR_1_2_0_ROOT, "profiles/PROFILES.json") || {}).profiles || {},
        enforcement: (readJsonFile(AGHR_1_2_0_ROOT, "registry/ENFORCEMENT_COVERAGE.json") || {}).rules || [],
      });
    }

    // Previous minimal distribution stays available from archive.
    if (fs.existsSync(AGHR_MINIMAL_1_1_0_ROOT)) {
      const prov = readJsonFile(AGHR_MINIMAL_1_1_0_ROOT, "PROVENANCE.json") || {};
      const rules = (readJsonFile(AGHR_MINIMAL_1_1_0_ROOT, "registry/RULES.json") || {}).rules || [];
      const sources = (readJsonFile(AGHR_MINIMAL_1_1_0_ROOT, "sources/REGISTER.json") || {}).sources || [];

      this._packages.set("aghr_minimal_1_1_0", {
        id: "aghr_minimal_1_1_0",
        name: "AGHR Minimal 1.1.0 (Archived)",
        version: prov.version || "1.1.0",
        kind: "MINIMAL_CORE",
        rootPath: AGHR_MINIMAL_1_1_0_ROOT,
        description: "Archived AGHR Minimal v1.1.0 (Core & Contracts)",
        isDefault: false,
        status: {
          package: "AGHR Minimal",
          version: prov.version || "1.1.0",
          reference_state: "STANDALONE_MINIMAL_DISTRIBUTION",
          default_provider: "OPENAI",
          default_profile: "LITE",
          independent_review: "NOT_PERFORMED",
          release_acceptance: "NOT_GRANTED",
        },
        rules,
        sources,
        adapters: [],
        profiles: { LITE: { id: "LITE", name: "Lite Minimal Profile" } },
        enforcement: [],
      });
    }
  }

  _getPackage(packageId) {
    if (packageId && this._packages.has(packageId)) {
      return this._packages.get(packageId);
    }
    return this._packages.get(this._defaultPackageId) || Array.from(this._packages.values())[0];
  }

  listPackages() {
    return Array.from(this._packages.values())
      .filter((pkg, idx, arr) => arr.findIndex((p) => p.id === pkg.id) === idx)
      .map((p) => ({
        id: p.id,
        name: p.name,
        version: p.version,
        kind: p.kind,
        description: p.description,
        isDefault: p.id === this._defaultPackageId,
        counts: {
          rules: p.rules.length,
          sources: p.sources.length,
          adapters: p.adapters.length,
          profiles: Object.keys(p.profiles).length,
        },
      }));
  }

  getSummary(packageId = "") {
    const pkg = this._getPackage(packageId);
    if (!pkg) return {};
    const status = pkg.status || {};
    return {
      packageId: pkg.id,
      package: status.package || pkg.name,
      version: status.version || pkg.version,
      reference_state: status.reference_state || "FINAL_REFERENCE",
      default_provider: status.default_provider || "OPENAI",
      default_profile: status.default_profile || "STANDARD",
      independent_review: status.independent_review || "NOT_PERFORMED",
      release_acceptance: status.release_acceptance || "NOT_GRANTED",
      counts: {
        rules: pkg.rules.length,
        sources: pkg.sources.length,
        adapters: pkg.adapters.length,
        profiles: Object.keys(pkg.profiles).length,
        contracts: this.getContracts(pkg.id).length,
      },
    };
  }

  getRules({ search = "", force = "", source = "", enforcementClass = "", packageId = "" } = {}) {
    const pkg = this._getPackage(packageId);
    if (!pkg) return [];
    const s = search.toLowerCase().trim();
    return pkg.rules.filter((r) => {
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

  getRule(id, packageId = "") {
    const pkg = this._getPackage(packageId);
    if (!pkg) return null;
    const rule = pkg.rules.find((r) => r.id === id);
    if (!rule) return null;

    // Enrich with source details
    const sources = pkg.sources.filter((s) => (rule.basis || []).includes(s.id));
    const enforcement = pkg.enforcement.find((e) => e.rule_id === rule.id);

    return {
      ...rule,
      basis_sources: sources,
      enforcement_coverage: enforcement || null,
    };
  }

  getSources({ search = "", publisher = "", kind = "", packageId = "" } = {}) {
    const pkg = this._getPackage(packageId);
    if (!pkg) return [];
    const s = search.toLowerCase().trim();
    return pkg.sources.filter((src) => {
      if (publisher && src.publisher !== publisher) return false;
      if (kind && src.kind !== kind) return false;
      if (s) {
        const hay = `${src.id} ${src.title} ${src.publisher} ${src.supported_takeaway} ${src.locator}`.toLowerCase();
        return hay.includes(s);
      }
      return true;
    });
  }

  getSource(id, packageId = "") {
    const pkg = this._getPackage(packageId);
    if (!pkg) return null;
    const src = pkg.sources.find((s) => s.id === id);
    if (!src) return null;
    const derivedRules = pkg.rules.filter((r) => (r.basis || []).includes(id));
    return {
      ...src,
      derived_rules: derivedRules.map((r) => ({ id: r.id, title: r.title, force: r.force })),
    };
  }

  getAdapters(packageId = "") {
    const pkg = this._getPackage(packageId);
    return pkg ? pkg.adapters : [];
  }

  getProfiles(packageId = "") {
    const pkg = this._getPackage(packageId);
    return pkg ? pkg.profiles : {};
  }

  getContracts(packageId = "") {
    const pkg = this._getPackage(packageId);
    if (pkg?.id === "aghr_rc3") return []; // rc.3 schemas use the existing Studio contract viewer.
    const contracts = [
      { id: "GOVERNANCE", title: "Core Governance Contract", path: "contracts/GOVERNANCE.md" },
      { id: "RUNTIME", title: "Runtime & Tool Contract", path: "contracts/RUNTIME.md" },
      { id: "ENFORCEMENT", title: "Enforcement Contract", path: "contracts/ENFORCEMENT.md" },
      { id: "EVIDENCE", title: "Evidence & Records Contract", path: "contracts/EVIDENCE.md" },
    ];
    if (pkg && pkg.id === "aghr_minimal_1_1_0") {
      contracts.push(
        { id: "CORE", title: "AGHR Minimal Core Specification", path: "CORE.md" },
        { id: "ADOPT", title: "Minimal Adoption Guide", path: "ADOPT.md" },
        { id: "SMART_CLARIFICATION", title: "Smart Clarification Procedure", path: "procedures/SMART_CLARIFICATION_AR.md" }
      );
    }
    return contracts;
  }

  getRelationshipGraph(packageId = "") {
    const pkg = this._getPackage(packageId);
    if (!pkg) return { nodes: [], edges: [] };

    const nodes = [];
    const edges = [];
    const nodeSet = new Set();

    const addNode = (id, label, group, title = "") => {
      if (nodeSet.has(id)) return;
      nodeSet.add(id);
      nodes.push({ id, label, group, title });
    };

    // 1. Add Source Nodes
    for (const s of pkg.sources) {
      addNode(s.id, `${s.id}: ${s.title.slice(0, 24)}…`, "source", `${s.publisher}: ${s.title}\n${s.url || ""}`);
    }

    // 2. Add Contract Nodes
    for (const c of this.getContracts(packageId)) {
      addNode(c.id, c.title, "contract", c.path);
    }

    // 3. Add Rule Nodes & Typed Relationships
    for (const r of pkg.rules) {
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
        else if (r.explanation_ref.includes("CORE")) contractId = "CORE";

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
