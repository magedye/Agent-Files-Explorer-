#!/usr/bin/env bash
# aprende — PostToolUse signal capture
#
# Reads the hook JSON payload from stdin and appends a signal record to
# ~/.claude/projects/<slug>/.aprende-signals.md when something interesting
# happened (non-zero exit code, error in stderr, repeated edit to the same
# file).
#
# CONTRACTS (do not break):
#   - This script NEVER writes a learning. It only accumulates signal
#     records. /aprende reads them in Pass A.
#   - It NEVER blocks tool calls. Exit code is always 0, even on internal
#     error.
#   - It NEVER overwrites user files. Append-only on per-session scratch.
#   - It NEVER leaks resources. Temp files are cleaned via trap.
#
# Portability: bash 3.2+ (macOS default) and bash 5+. No GNU-only flags.

set -u  # treat unset vars as errors; do NOT set -e (we never want to fail)

# --- bulletproof exit -----------------------------------------------------
# Any unexpected failure: log to stderr (Claude Code will swallow it) and
# exit 0 so the user's tool call is not affected.
trap '_aprende_cleanup' EXIT

_aprende_tmpfiles=()
_aprende_cleanup() {
  local f
  for f in "${_aprende_tmpfiles[@]:-}"; do
    [[ -n "$f" && -f "$f" ]] && rm -f "$f"
  done
}

# --- read payload ---------------------------------------------------------
payload=$(cat 2>/dev/null || true)
[[ -z "$payload" ]] && exit 0

# --- derive project slug --------------------------------------------------
# CLAUDE_PROJECT_DIR is set by Claude Code. Fallback: pwd.
project_dir="${CLAUDE_PROJECT_DIR:-${PWD:-/tmp}}"
# Reject obvious garbage (empty, /, just whitespace).
case "$project_dir" in
  ""|"/"|" "*) exit 0 ;;
esac

# Slug the project path the SAME way Claude Code does: replace every
# character that is not a letter or digit with '-'. This matters on Windows
# (D:/proyectos_python/... -> D--proyectos-python-...) and for any path
# containing '_', ':', '\' etc. A '/'-only replacement would mis-slug and
# write signals to a folder /aprende never reads. Leading dash is preserved.
slug=$(printf '%s' "$project_dir" | sed 's/[^A-Za-z0-9]/-/g')
slug="${slug%-}"  # drop a single trailing dash (e.g. pwd had a trailing /)

signals_dir="${HOME}/.claude/projects/${slug}"
signals_file="${signals_dir}/.aprende-signals.md"
counter_file="${signals_dir}/.aprende-edit-counts.tsv"
lock_file="${signals_dir}/.aprende.lock"

mkdir -p "$signals_dir" 2>/dev/null || exit 0

# --- inspect payload ------------------------------------------------------
# No jq dependency: shell + grep. The hook JSON has fields tool_name,
# tool_input, tool_response (with success/error/exit_code).
tool_name=$(printf '%s' "$payload" \
  | grep -o '"tool_name"[[:space:]]*:[[:space:]]*"[^"]*"' \
  | head -1 \
  | sed 's/.*"\([^"]*\)"$/\1/')

# Detect failure signals.
is_error=0
if printf '%s' "$payload" | grep -qE '"is_error"[[:space:]]*:[[:space:]]*true'; then
  is_error=1
fi
if printf '%s' "$payload" | grep -qE '"exit_code"[[:space:]]*:[[:space:]]*[1-9]'; then
  is_error=1
fi

# Write signal record (append is atomic for short lines on POSIX).
timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
if [[ $is_error -eq 1 ]]; then
  printf -- '- %s  error-from-%s\n' "$timestamp" "${tool_name:-unknown}" >> "$signals_file" 2>/dev/null || exit 0
fi

# --- repeated-edit tracking (with file lock) ------------------------------
if [[ "$tool_name" == "Edit" || "$tool_name" == "Write" ]]; then
  file_path=$(printf '%s' "$payload" \
    | grep -o '"file_path"[[:space:]]*:[[:space:]]*"[^"]*"' \
    | head -1 \
    | sed 's/.*"\([^"]*\)"$/\1/')

  if [[ -n "$file_path" ]]; then
    today=$(date -u +"%Y-%m-%d")

    # Lock around the read-modify-write to avoid races between concurrent
    # PostToolUse invocations. flock is on macOS (util-linux flock from brew)
    # OR Linux. If not available, fall back to non-atomic best-effort.
    (
      if command -v flock >/dev/null 2>&1; then
        flock -x 9 || exit 0
      fi

      # Read current count for (today, file_path).
      prev=0
      if [[ -f "$counter_file" ]]; then
        prev=$(awk -F'\t' -v t="$today" -v f="$file_path" '
          $1==t && $2==f { print $3; exit }
        ' "$counter_file")
        prev="${prev:-0}"
      fi
      new=$((prev + 1))

      # Rewrite counter file atomically via temp.
      tmpfile=$(mktemp 2>/dev/null) || exit 0
      _aprende_tmpfiles+=("$tmpfile")

      if [[ -f "$counter_file" ]] && grep -qF "${today}	${file_path}" "$counter_file"; then
        awk -F'\t' -v t="$today" -v f="$file_path" -v n="$new" '
          $1==t && $2==f { printf "%s\t%s\t%s\n", t, f, n; next }
          { print }
        ' "$counter_file" > "$tmpfile"
      else
        if [[ -f "$counter_file" ]]; then
          cat "$counter_file" > "$tmpfile"
        fi
        printf '%s\t%s\t%s\n' "$today" "$file_path" "$new" >> "$tmpfile"
      fi

      mv "$tmpfile" "$counter_file" 2>/dev/null || exit 0

      # Emit repeated-edit signal at the 3rd occurrence.
      if [[ $new -eq 3 ]]; then
        printf -- '- %s  repeated-edit %s (3x today)\n' \
          "$timestamp" "$file_path" >> "$signals_file" 2>/dev/null || true
      fi
    ) 9>"$lock_file"
  fi
fi

exit 0
