import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const PROJECT_ROOT = path.resolve(__dirname, "..");
export const AAPES_ZIP_PATH = path.resolve(
  PROJECT_ROOT,
  "governance_packages",
  "INBOX",
  "NEW",
  "AAPES_Policy_Engineering_PLUGIN_SKILL_v2.1.zip"
);
export const AAPES_CANDIDATE_ROOT = path.resolve(
  PROJECT_ROOT,
  "governance_packages",
  "candidates",
  "AAPES_v2.1_Candidate"
);

export const EXPECTED_AAPES_SHA256 = "da902a9cd9ddd2967302ac26bb35e700408a290cf154b7fbb0bf612f0d436edb";

/**
 * Validate archive integrity and safe member paths.
 */
export function verifyAndUnpackAapesPackage(zipPath = AAPES_ZIP_PATH, targetDir = AAPES_CANDIDATE_ROOT) {
  if (!fs.existsSync(zipPath)) {
    throw new Error(`AAPES package not found at ${zipPath}`);
  }

  // 1. Verify SHA-256
  const zipBytes = fs.readFileSync(zipPath);
  const actualHash = crypto.createHash("sha256").update(zipBytes).digest("hex").toLowerCase();
  if (actualHash !== EXPECTED_AAPES_SHA256.toLowerCase()) {
    throw new Error(`AAPES package hash mismatch! Expected ${EXPECTED_AAPES_SHA256}, got ${actualHash}`);
  }

  // 2. Validate entries via PowerShell inspection to ensure no path traversal or null bytes
  const pwshScript = `
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $zip = [System.IO.Compression.ZipFile]::OpenRead('${zipPath.replace(/'/g, "''")}')
    $entries = @()
    foreach ($entry in $zip.Entries) {
      if ($entry.FullName -match '\\.\\.' -or $entry.FullName -match '^[\\\\/]' -or $entry.FullName -match '\\0') {
        throw "UNSAFE_ARCHIVE_ENTRY: $($entry.FullName)"
      }
      $entries += $entry.FullName
    }
    $zip.Dispose()
    $entries | ConvertTo-Json -Compress
  `;

  let entriesJson;
  try {
    entriesJson = execFileSync("pwsh", ["-NoProfile", "-Command", pwshScript], {
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024
    });
  } catch (err) {
    throw new Error(`Failed to validate archive entries: ${err.message}`);
  }

  const entries = JSON.parse(entriesJson);

  // 3. Extract to targetDir safely if not already unpacked
  if (!fs.existsSync(targetDir) || !fs.existsSync(path.join(targetDir, "plugin.json"))) {
    fs.mkdirSync(targetDir, { recursive: true });
    const extractScript = `
      Add-Type -AssemblyName System.IO.Compression.FileSystem
      $zip = [System.IO.Compression.ZipFile]::OpenRead('${zipPath.replace(/'/g, "''")}')
      $target = '${targetDir.replace(/'/g, "''")}'
      foreach ($entry in $zip.Entries) {
        # Strip top-level 'aapes-policy-engineering/' prefix if present
        $rel = $entry.FullName
        if ($rel.StartsWith('aapes-policy-engineering/')) {
          $rel = $rel.Substring('aapes-policy-engineering/'.Length)
        }
        if ([string]::IsNullOrWhiteSpace($rel)) { continue }
        $destPath = [System.IO.Path]::Combine($target, $rel.Replace('/', [System.IO.Path]::DirectorySeparatorChar))
        if ($entry.FullName.EndsWith('/')) {
          [System.IO.Directory]::CreateDirectory($destPath) | Out-Null
        } else {
          $parent = [System.IO.Path]::GetDirectoryName($destPath)
          if (-not [System.IO.Directory]::Exists($parent)) {
            [System.IO.Directory]::CreateDirectory($parent) | Out-Null
          }
          [System.IO.Compression.ZipFileExtensions]::ExtractToFile($entry, $destPath, $true)
        }
      }
      $zip.Dispose()
    `;

    try {
      execFileSync("pwsh", ["-NoProfile", "-Command", extractScript], {
        encoding: "utf8",
        maxBuffer: 10 * 1024 * 1024
      });
    } catch (err) {
      throw new Error(`Failed to extract AAPES package: ${err.message}`);
    }
  }

  // 4. Return custody receipt
  return {
    packageId: "aapes_v2_1",
    version: "2.1.1",
    sha256: actualHash,
    bytes: zipBytes.length,
    entryCount: entries.length,
    extractedTo: targetDir,
    verifiedAt: new Date().toISOString(),
    status: "CANDIDATE_FOR_REVIEW"
  };
}
