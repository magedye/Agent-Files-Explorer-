import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { governanceService } from "./governance.js";
import { DEFAULT_PACKAGE_ID } from "./security.js";

function sha256(content) {
  return crypto.createHash("sha256").update(content).digest("hex");
}

/**
 * Service for structural and semantic comparison between governance packages/versions.
 */
class GovernanceComparisonService {
  /**
   * Compare two registered governance packages (e.g. 1.0.0 vs 1.1.0).
   */
  comparePackages(basePackageId = "aghr", targetPackageId = DEFAULT_PACKAGE_ID) {
    const baseSummary = governanceService.getSummary(basePackageId);
    const targetSummary = governanceService.getSummary(targetPackageId);

    const baseRules = governanceService.getRules({ packageId: basePackageId });
    const targetRules = governanceService.getRules({ packageId: targetPackageId });

    const baseSources = governanceService.getSources({ packageId: basePackageId });
    const targetSources = governanceService.getSources({ packageId: targetPackageId });

    // 1. Compare Rules
    const baseRuleMap = new Map(baseRules.map((r) => [r.id, r]));
    const targetRuleMap = new Map(targetRules.map((r) => [r.id, r]));

    const addedRules = [];
    const modifiedRules = [];
    const unchangedRules = [];
    const removedRules = [];

    for (const [id, targetRule] of targetRuleMap.entries()) {
      if (!baseRuleMap.has(id)) {
        addedRules.push({
          id,
          title: targetRule.title,
          force: targetRule.force,
          status: "ADDED_IN_TARGET",
        });
      } else {
        const baseRule = baseRuleMap.get(id);
        const isModified =
          baseRule.text !== targetRule.text ||
          baseRule.force !== targetRule.force ||
          baseRule.title !== targetRule.title ||
          JSON.stringify(baseRule.basis || []) !== JSON.stringify(targetRule.basis || []);

        if (isModified) {
          modifiedRules.push({
            id,
            title: targetRule.title,
            baseForce: baseRule.force,
            targetForce: targetRule.force,
            changes: {
              textChanged: baseRule.text !== targetRule.text,
              forceChanged: baseRule.force !== targetRule.force,
              basisChanged: JSON.stringify(baseRule.basis || []) !== JSON.stringify(targetRule.basis || []),
            },
            status: "MODIFIED",
          });
        } else {
          unchangedRules.push({ id, title: targetRule.title, status: "UNCHANGED" });
        }
      }
    }

    for (const [id, baseRule] of baseRuleMap.entries()) {
      if (!targetRuleMap.has(id)) {
        removedRules.push({
          id,
          title: baseRule.title,
          force: baseRule.force,
          status: "REMOVED_IN_TARGET",
        });
      }
    }

    // 2. Compare Sources
    const baseSourceMap = new Map(baseSources.map((s) => [s.id, s]));
    const targetSourceMap = new Map(targetSources.map((s) => [s.id, s]));

    const addedSources = [];
    const commonSources = [];

    for (const [id, s] of targetSourceMap.entries()) {
      if (!baseSourceMap.has(id)) {
        addedSources.push({ id, title: s.title, publisher: s.publisher });
      } else {
        commonSources.push({ id, title: s.title, publisher: s.publisher });
      }
    }

    return {
      comparisonId: `CMP-${basePackageId}-VS-${targetPackageId}`,
      timestamp: new Date().toISOString(),
      base: {
        packageId: basePackageId,
        version: baseSummary.version,
        ruleCount: baseRules.length,
        sourceCount: baseSources.length,
      },
      target: {
        packageId: targetPackageId,
        version: targetSummary.version,
        ruleCount: targetRules.length,
        sourceCount: targetSources.length,
      },
      rulesDelta: {
        addedCount: addedRules.length,
        modifiedCount: modifiedRules.length,
        unchangedCount: unchangedRules.length,
        removedCount: removedRules.length,
        added: addedRules,
        modified: modifiedRules,
        removed: removedRules,
      },
      sourcesDelta: {
        addedCount: addedSources.length,
        commonCount: commonSources.length,
        added: addedSources,
      },
      impactNotice:
        "NEWER != SUPERSEDES. Differences demonstrate baseline divergence; normative supersession requires authorized adoption.",
    };
  }

  /**
   * Analyze impact of a proposed rule modification against registered baselines.
   */
  analyzeRuleImpact(ruleId, proposedRule = {}, packageId = DEFAULT_PACKAGE_ID) {
    const existing = governanceService.getRule(ruleId, packageId);
    const affectedDownstreamRules = [];
    const allRules = governanceService.getRules({ packageId });

    // Check rules depending on the same sources or mentioning this rule
    for (const r of allRules) {
      if (r.id !== ruleId) {
        const sharesBasis = (r.basis || []).some((b) => (existing?.basis || []).includes(b));
        if (sharesBasis) {
          affectedDownstreamRules.push({
            id: r.id,
            title: r.title,
            reason: "SHARES_AUTHORITATIVE_BASIS",
            force: r.force,
          });
        }
      }
    }

    return {
      ruleId,
      packageId,
      existsInBaseline: !!existing,
      currentForce: existing?.force || null,
      proposedForce: proposedRule.force || existing?.force || "PROPOSED",
      forceEscalation: existing && existing.force !== "MUST" && proposedRule.force === "MUST",
      downstreamImpact: {
        count: affectedDownstreamRules.length,
        rules: affectedDownstreamRules.slice(0, 10),
      },
      authorityNotice:
        "Impact analysis is derived from structural graph linkages; it does not constitute binding legal approval.",
    };
  }
}

export const comparisonService = new GovernanceComparisonService();
