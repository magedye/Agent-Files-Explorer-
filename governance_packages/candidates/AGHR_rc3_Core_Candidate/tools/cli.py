"""Read-only metadata/catalog and E2 strict/lint CLI. E3+ remain blocked."""

import argparse
from dataclasses import asdict
import hashlib
import json
from pathlib import Path
import sys


ROOT = Path(__file__).resolve().parent.parent
SOURCE_FILES = (
    "CLI_CONTRACT.json",
    "LICENSE",
    "PACKAGE_STATUS.json",
    "PROVENANCE.json",
    "SOURCE_MAP.json",
    "E2_PROFILE.md",
    "aghr.json",
    "policies/observations/reference-state.json",
    "requirements.lock",
    "schemas/MODEL_INDEX.json",
    "schemas/SCHEMAS.lock.json",
    "schemas/aghr.schema.json",
    "schemas/api.change.schema.json",
    "schemas/api.execution.schema.json",
    "schemas/api.read.schema.json",
    "schemas/api.responses.schema.json",
    "schemas/auth.schema.json",
    "schemas/capability.schema.json",
    "schemas/common.schema.json",
    "schemas/engine.schema.json",
    "schemas/evidence.schema.json",
    "schemas/item.schema.json",
    "schemas/proposal.schema.json",
    "schemas/qualification.schema.json",
    "schemas/settings.schema.json",
    "schemas/state.schema.json",
    "schemas/transport.schema.json",
    "tests/test_catalog.py",
    "tests/test_cli.py",
    "tests/test_loader.py",
    "tests/e2_support.py",
    "tests/test_validate.py",
    "tests/test_scope.py",
    "tests/test_authority.py",
    "tests/test_evidence.py",
    "tests/test_e2_cli.py",
    "tools/catalog.py",
    "tools/cli.py",
    "tools/diagnostics.py",
    "tools/loader.py",
    "tools/validate.py",
    "tools/scope.py",
    "tools/authority.py",
    "tools/conflicts.py",
    "tools/evidence.py",
    "tools/lint.py",
)
DEFERRED = {
    "generate": "E3", "check": "E3",
    "eval": "E4 and T15", "qualify": "E4 and T15", "doctor": "E3",
}


class UsageError(Exception):
    """Do not echo caller-supplied argument values into diagnostics."""


class Parser(argparse.ArgumentParser):
    def error(self, message):
        raise UsageError("Invalid command or arguments; use --help.")


def source_identity():
    artifacts = []
    for name in SOURCE_FILES:
        source = (ROOT / name).resolve(strict=True)
        if not source.is_relative_to(ROOT) or not source.is_file():
            raise ValueError("Source artifact escapes the candidate or is not a file.")
        if source.stat().st_size > 2 * 1024 * 1024:
            raise ValueError("Source artifact exceeds the identity limit.")
        artifacts.append({"path": name, "sha256": hashlib.sha256(source.read_bytes()).hexdigest()})
    mapping = {item["path"]: item["sha256"] for item in artifacts}
    encoded = json.dumps(mapping, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    return {
        "implementation_id": "aghr-rc3-core-candidate", "stage": "E2.e",
        "target_spec_version": "1.0.0-rc.3", "schema_version": "1.2",
        "content_hash": hashlib.sha256(encoded.encode("utf-8")).hexdigest(),
        "hash_algorithm": "sha256-path-map-v1", "artifacts": artifacts,
        "publisher_authentication": "UNKNOWN", "qualification": "NOT_RUN",
        "distribution": None,
    }


def response(command, result, exit_code, source=None, diagnostic=None, data=None):
    return {
        "protocol_version": "3", "command": command, "result": result,
        "exit_code": exit_code, "source": source,
        "inputs": {"candidate_hash": None, "config_hash": None, "inputs_hash": None, "catalog": None},
        "checks": {"status": "NOT_RUN", "reason": "No completed governing result."},
        "diagnostics": [diagnostic] if diagnostic else [], "data": data,
    }


def emit(report, output_format):
    if output_format == "json":
        print(json.dumps(report, ensure_ascii=False, allow_nan=False, separators=(",", ":")))
    elif report["result"] == "READ":
        print(f"READ: {len(report['data']['catalog']['items'])} items (NOT_VALIDATED)")
    elif report["data"] and "help" in report["data"]:
        print(report["data"]["help"], end="")
    elif report["result"] == "INFO":
        print(f"AGHR rc.3 core candidate {report['source']['stage']} sha256:{report['source']['content_hash']} (NOT_QUALIFIED)")
    elif report["result"] == "VALID":
        print("VALID: E2_PACKAGE_READ_VALIDATE_LINT (runtime qualification NOT_RUN)")
    else:
        print(f"{report['result']}: {report['diagnostics'][0]['code']}")
    for diagnostic in report["diagnostics"]:
        print(f"{diagnostic['code']}: {diagnostic['message']}", file=sys.stderr)
    return report["exit_code"]


def main(argv=None):
    # Disable option abbreviation and @file expansion: argv is data, never shell.
    # https://docs.python.org/3.12/library/argparse.html
    parser = Parser(prog="aghr", add_help=False, allow_abbrev=False)
    parser.add_argument("command", nargs="?", choices=("catalog", "validate", "lint", *DEFERRED))
    actions = parser.add_mutually_exclusive_group()
    actions.add_argument("-h", "--help", action="store_true")
    actions.add_argument("--version", action="store_true")
    parser.add_argument("--format", choices=("json", "text"), default="json")
    parser.add_argument("--strict", action="store_true")
    for flag in ("path", "agent", "host-version", "environment", "stage", "task-type", "skill-id", "language", "as-of"):
        parser.add_argument("--" + flag)
    parser.description = "E2: catalog/validate/lint read cwd without writes; E3+ commands remain BLOCKED."
    parser.epilog = "validate always enforces strict contract.1. No CLI trust-grant file. eval/qualify remain BLOCKED for E4/T15. No source, state, cache or log writes."
    args = list(sys.argv[1:] if argv is None else argv)
    output_format = "json"
    for index, arg in enumerate(args):
        if arg == "--format" and index + 1 < len(args):
            value = args[index + 1]
        elif arg.startswith("--format="):
            value = arg.removeprefix("--format=")
        else:
            continue
        if value in ("json", "text"):
            output_format = value
    command = None
    try:
        options = parser.parse_args(args)
        if options.strict and (options.command != "validate" or options.version):
            raise UsageError("--strict is only valid with validate.")
        if options.version and options.command:
            raise UsageError("--version cannot execute a governance command.")
        if not options.command and not (options.help or options.version):
            raise UsageError("A command, --help or --version is required.")
        context_values = {key: getattr(options, key) for key in ("path", "agent", "host_version", "environment", "stage", "task_type", "skill_id", "language", "as_of") if getattr(options, key) is not None}
        if context_values and (options.command not in ("validate", "lint") or options.help or options.version):
            raise UsageError("Context options only apply to validate/lint.")
        output_format = options.format
        command = "help" if options.help else "version" if options.version else options.command
        identity = source_identity()
    except UsageError as error:
        return emit(response(None, "ERROR", 2, diagnostic={
            "code": "INVALID_ARGUMENTS", "message": str(error), "stage": None,
        }), output_format)
    except (OSError, ValueError):
        return emit(response(command, "ERROR", 2, diagnostic={
            "code": "SOURCE_IDENTITY_UNAVAILABLE", "message": "Cannot read the complete candidate source identity.", "stage": "E2.e",
        }), output_format)
    if command in ("help", "version"):
        data = {"help": parser.format_help()} if command == "help" else None
        return emit(response(command, "INFO", 0, identity, data=data), output_format)
    if command in ("catalog", "validate", "lint"):
        # Imports always come from the owned source, never the selected package.
        sys.path.insert(0, str(ROOT / "tools"))
        from diagnostics import ReadFailure, fail
        package = None
        try:
            from catalog import build_catalog, serialize_catalog, source_record
            from loader import read_package
            package = read_package(Path.cwd())
            payload = build_catalog(package)
            data = {"catalog": payload}
            if command != "catalog":
                from scope import ScopeContext
                from validate import validate_package
                from lint import lint_package
                from loader import read_support_sources
                try:
                    context = ScopeContext(**context_values)
                except (TypeError, ValueError):
                    return emit(response(command, "ERROR", 2, identity, diagnostic={"code": "INVALID_ARGUMENTS", "message": "Invalid bounded context values.", "stage": "E2.e"}), output_format)
                verifier = lint_package if command == "lint" else validate_package
                verification, supporting = verifier(package, Path.cwd(), context)
                data["validation"] = verification
                sources = {s.path: s for s in (*package.sources, *supporting)}
                observed = read_support_sources(Path.cwd(), tuple((s.path, s.role) for s in sources.values()))
                if any(s.sha256 != sources[s.path].sha256 for s in observed) or source_identity()["content_hash"] != identity["content_hash"]:
                    fail("SOURCE_CHANGED", "A validation input or engine changed during the operation.", ".", sources=tuple(sources.values()))
                from catalog import compact_json
                def digest(value):
                    return hashlib.sha256(compact_json(value).encode("utf-8")).hexdigest()
                candidate_hash = digest({s.path: s.sha256 for s in sources.values()})
                config = {"command": command, "strict": True, "context": {**asdict(context), "as_of": str(context.day)}, "validation": package.manifest.value.get("validation"), "source_selection": list(package.source_paths), "trust_grants": []}
                config_hash = digest(config)
                inputs = {"candidate_hash": candidate_hash, "config_hash": config_hash,
                          "inputs_hash": digest({"engine": identity["content_hash"], "candidate": candidate_hash, "config": config_hash, "schema_closure": payload["schema_closure"]["lock_sha256"]}),
                          "catalog": [{"path": s.path, "sha256": s.sha256, "role": s.role} for s in sorted(sources.values(), key=lambda s: s.path)]}
            serialize_catalog(data)  # Bound complete transport body before stdout.
        except ImportError:
            return emit(response(command, "BLOCKED", 3, identity, diagnostic={
                "code": "READER_DEPENDENCY_UNAVAILABLE", "message": "Locked reader dependencies are unavailable.",
                "stage": "E2.e",
            }), output_format)
        except ReadFailure as error:
            diagnostic = {**asdict(error.diagnostic), "stage": "E2.e"}
            captured = {s.path: s for s in (() if package is None else package.sources)}
            captured.update({s.path: s for s in error.sources})
            data = {"read_error": {"sources": [source_record(s) for s in captured.values()]}}
            return emit(response(command, "ERROR", 2, identity, diagnostic=diagnostic, data=data), output_format)
        if command == "catalog":
            return emit(response(command, "READ", 0, identity, data=data), output_format)
        report = response(command, verification["result"], verification["exit_code"], identity, data=data)
        report["inputs"] = inputs
        report["checks"] = {"status": "BLOCKED" if verification["result"] == "BLOCKED" else "COMPLETE", "reason": "E2 static package profile only; E4 runtime qualification NOT_RUN."}
        report["diagnostics"] = [{**issue, "stage": "E2.e"} for issue in verification["findings"] if issue["disposition"] != "WARNING"]
        return emit(report, output_format)
    return emit(response(command, "BLOCKED", 3, identity, diagnostic={
        "code": "IMPLEMENTATION_UNAVAILABLE", "message": "The requested governance command has not been implemented.",
        "stage": DEFERRED[command],
    }), output_format)


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8", errors="strict")
    sys.stderr.reconfigure(encoding="utf-8", errors="strict")
    raise SystemExit(main())
