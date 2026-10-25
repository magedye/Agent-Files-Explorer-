import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { AGHR_ROOT, PROJECT_ROOT } from "./security.js";

const PYTHON_BIN = "C:\\Users\\Majed\\AppData\\Local\\Programs\\Python\\Python312\\python.exe";
const EVAL_STORAGE_DIR = path.join(PROJECT_ROOT, ".governance", "evaluations");

function ensureStorageDir() {
  if (!fs.existsSync(EVAL_STORAGE_DIR)) {
    fs.mkdirSync(EVAL_STORAGE_DIR, { recursive: true });
  }
}

/**
 * Executes a controlled python script within AGHR boundaries safely.
 */
function runControlledPython(scriptRelPath, args = []) {
  return new Promise((resolve) => {
    const fullScript = path.join(AGHR_ROOT, scriptRelPath);
    if (!fs.existsSync(fullScript)) {
      return resolve({
        status: "BLOCKED",
        error: `Controlled script not found: ${scriptRelPath}`,
        stdout: "",
        stderr: "",
        exitCode: -1,
      });
    }

    const start = new Date().toISOString();
    const child = spawn(PYTHON_BIN, [fullScript, ...args], {
      cwd: AGHR_ROOT,
      env: { ...process.env, PYTHONPATH: AGHR_ROOT },
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (d) => (stdout += d.toString()));
    child.stderr.on("data", (d) => (stderr += d.toString()));

    child.on("close", (exitCode) => {
      const end = new Date().toISOString();
      resolve({
        started_at: start,
        finished_at: end,
        exitCode,
        stdout,
        stderr,
      });
    });

    child.on("error", (err) => {
      resolve({
        status: "BLOCKED",
        error: `Subprocess spawn error: ${err.message}`,
        stdout,
        stderr,
        exitCode: -1,
      });
    });
  });
}

/**
 * Compliance and Evaluation Center Service.
 */
class EvaluationService {

  /**
   * Run the authoritative AGHR unittest suite.
   */
  async runUnitTestSuite() {
    const res = await runControlledPython("tools/run_tests.py");

    let parsedSummary = null;
    try {
      // Find JSON block at end of stdout
      const jsonStart = res.stdout.lastIndexOf("{");
      if (jsonStart !== -1) {
        parsedSummary = JSON.parse(res.stdout.slice(jsonStart));
      }
    } catch {}

    const runId = `EVAL-UNIT-${Date.now().toString(36).toUpperCase()}`;
    const report = {
      runId,
      suite: "AGHR_UNIT_TEST_SUITE",
      status: parsedSummary ? parsedSummary.status : res.exitCode === 0 ? "PASS" : "FAIL",
      executed_at: new Date().toISOString(),
      exitCode: res.exitCode,
      summary: parsedSummary || {
        status: res.exitCode === 0 ? "PASS" : "FAIL",
        raw_output_available: true,
      },
      rawStdout: res.stdout,
      rawStderr: res.stderr,
      independent_review: "NOT_PERFORMED",
      release_acceptance: "NOT_GRANTED",
    };

    // Save evidence
    ensureStorageDir();
    fs.writeFileSync(path.join(EVAL_STORAGE_DIR, `${runId}.json`), JSON.stringify(report, null, 2), "utf8");

    return report;
  }

  /**
   * Run the package integrity check (tools/check_package.py).
   */
  async runPackageCheck() {
    const res = await runControlledPython("tools/check_package.py");

    let parsed = null;
    try {
      parsed = JSON.parse(res.stdout);
    } catch {}

    const runId = `EVAL-PKG-${Date.now().toString(36).toUpperCase()}`;
    const report = {
      runId,
      suite: "AGHR_PACKAGE_INTEGRITY_CHECK",
      status: parsed ? parsed.status : res.exitCode === 0 ? "PASS" : "FAIL",
      executed_at: new Date().toISOString(),
      exitCode: res.exitCode,
      report: parsed,
      rawStdout: res.stdout,
      rawStderr: res.stderr,
      independent_review: "NOT_PERFORMED",
      release_acceptance: "NOT_GRANTED",
    };

    // Save evidence
    ensureStorageDir();
    fs.writeFileSync(path.join(EVAL_STORAGE_DIR, `${runId}.json`), JSON.stringify(report, null, 2), "utf8");

    return report;
  }

  listEvaluationHistory() {
    if (!fs.existsSync(EVAL_STORAGE_DIR)) return [];
    const files = fs.readdirSync(EVAL_STORAGE_DIR).filter((f) => f.endsWith(".json"));
    const history = [];
    for (const f of files) {
      try {
        const text = fs.readFileSync(path.join(EVAL_STORAGE_DIR, f), "utf8");
        history.push(JSON.parse(text));
      } catch {}
    }
    history.sort((a, b) => new Date(b.executed_at) - new Date(a.executed_at));
    return history;
  }
}

export const evaluationService = new EvaluationService();
