import fs from "node:fs";
import path from "node:path";
import { DATA_ROOT, resolveSafePath } from "./security.js";

/**
 * Project Adoption Management Service.
 */
class AdoptionService {
  /**
   * List candidate projects available in data/ directory.
   */
  listCandidates() {
    const candidates = [];
    if (!fs.existsSync(DATA_ROOT)) return candidates;

    const entries = fs.readdirSync(DATA_ROOT, { withFileTypes: true });
    for (const e of entries) {
      if (e.isDirectory() && !e.name.startsWith(".")) {
        const dir = path.join(DATA_ROOT, e.name);
        const inspection = this.inspectCandidate(dir);
        candidates.push({
          id: `candidate-${e.name}`,
          name: e.name,
          dir: dir.replace(/\\/g, "/"),
          ...inspection,
        });
      }
    }
    return candidates;
  }

  /**
   * Inspect a project directory for existing structure, stack, and governance state.
   */
  inspectCandidate(targetDir) {
    const abs = path.resolve(targetDir);
    const result = {
      exists: fs.existsSync(abs),
      hasPackageJson: fs.existsSync(path.join(abs, "package.json")),
      hasPyproject: fs.existsSync(path.join(abs, "pyproject.toml")) || fs.existsSync(path.join(abs, "requirements.txt")),
      hasSkillMd: fs.existsSync(path.join(abs, "SKILL.md")),
      hasAgentsMd: fs.existsSync(path.join(abs, "AGENTS.md")),
      hasGit: fs.existsSync(path.join(abs, ".git")),
      existingAgentsContent: null,
      governanceState: "NOT_ADOPTED",
      detectedStack: [],
    };

    if (result.hasPackageJson) result.detectedStack.push("Node.js");
    if (result.hasPyproject) result.detectedStack.push("Python");
    if (result.hasSkillMd) result.detectedStack.push("Agent Skill");

    if (result.hasAgentsMd) {
      try {
        const text = fs.readFileSync(path.join(abs, "AGENTS.md"), "utf8");
        result.existingAgentsContent = text;
        if (text.includes("AGHR") || text.includes("Agent Governance and Harness Reference")) {
          result.governanceState = "ADOPTED_AGHR";
        } else {
          result.governanceState = "UNGOVERNED_CUSTOM_AGENTS";
        }
      } catch {}
    }

    return result;
  }

  /**
   * Prepare an adoption plan with exact diffs, profile configuration, and schema record.
   */
  prepareAdoption({
    projectDir,
    profile = "STANDARD",
    provider = "OPENAI",
    host = "CODEX",
    owner = "Project Owner",
  }) {
    const abs = path.resolve(projectDir);
    if (!fs.existsSync(abs)) throw new Error("Project directory does not exist");

    const projectName = path.basename(abs);
    const inspection = this.inspectCandidate(abs);

    // Profile qualification check
    if (!["LITE", "STANDARD", "CONTROLLED"].includes(profile)) {
      throw new Error(`Invalid AGHR profile: ${profile}`);
    }

    // 1. Generate AGENTS.md content
    let proposedAgentsContent = "";
    const aghrHeader = [
      `# Agent Governance and Harness Reference (AGHR 1.0.0) — Governed Workspace`,
      ``,
      `> Profile: ${profile} | Provider Default: ${provider} | Host Default: ${host}`,
      `> Authoritative Reference: Agent Governance and Harness Reference 1.0.0`,
      ``,
      `## Foundational Directives`,
      `1. Follow official developer-first documentation for interacting with the model and host.`,
      `2. Strictly preserve working existing code and configurations without unsolicited refactorings.`,
      `3. Never overwrite files or execute irreversible operations without explicit confirmation.`,
      `4. Verify changes using deterministic local tests rather than assumptions.`,
      ``,
    ].join("\n");

    if (inspection.existingAgentsContent) {
      if (inspection.governanceState === "ADOPTED_AGHR") {
        proposedAgentsContent = inspection.existingAgentsContent; // Already adopted
      } else {
        // Prepend AGHR header while preserving existing custom sections
        proposedAgentsContent = `${aghrHeader}\n## Project-Specific Instructions (Preserved)\n\n${inspection.existingAgentsContent}`;
      }
    } else {
      proposedAgentsContent = `${aghrHeader}\n## Project Operations\n- Maintain clean audit trail for all changes.\n- Consult repository documents before modifications.\n`;
    }

    // 2. Generate conforming PROJECT.json record
    const projectRecord = {
      schema_version: "1.0",
      project_id: `proj-${projectName}`,
      name: projectName,
      owner: owner,
      profile: profile,
      artifact_kind: inspection.hasSkillMd ? "LIBRARY" : inspection.hasPackageJson ? "APPLICATION" : "DOCUMENTATION",
      repository_ref: abs.replace(/\\/g, "/"),
      stack: inspection.detectedStack,
      architecture: "Local-first governed workspace",
      system_flow: [],
      provider: {
        id: provider,
        model: provider === "OPENAI" ? "gpt-4o" : null,
        endpoint: null,
      },
      host: {
        id: host,
        version: null,
        os: process.platform,
        qualification_ref: null,
      },
      adoption: {
        state: "PREPARED",
        decision_ref: `DECISION-ADOPT-${projectName.toUpperCase()}`,
        effective_scope: ["WORKSPACE"],
      },
      security: {
        data_class: profile === "LITE" ? "INTERNAL_NON_SENSITIVE" : "CONFIDENTIAL",
        production_access: false,
        irreversible_operations: false,
        external_mutations: false,
        independent_review_required: profile === "CONTROLLED",
        allowed_destinations: ["localhost"],
      },
      budgets: {
        max_steps: 50,
        max_seconds: 600,
        max_retries: 2,
        max_output_bytes: 16384,
      },
      commands: [],
      canonical_backend: "LOCAL_JSON",
      external_backend_ref: null,
    };

    // Planned file changes
    const plannedFiles = [
      {
        path: "AGENTS.md",
        action: inspection.hasAgentsMd ? "UPDATE" : "CREATE",
        currentContent: inspection.existingAgentsContent || "",
        proposedContent: proposedAgentsContent,
      },
      {
        path: ".governance/project.json",
        action: "CREATE",
        currentContent: "",
        proposedContent: JSON.stringify(projectRecord, null, 2),
      },
    ];

    return {
      projectName,
      projectDir: abs.replace(/\\/g, "/"),
      profile,
      provider,
      host,
      inspection,
      projectRecord,
      plannedFiles,
      status: "ADOPTION_PREPARED",
    };
  }
}

export const adoptionService = new AdoptionService();
