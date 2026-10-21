#!/usr/bin/env bash
# aprende — Stop hook reminder
#
# At session end, check whether /aprende has signals to process. If so, emit
# additionalContext via the hook JSON output protocol so the next interaction
# shows a bilingual nudge. Does not write anything.
#
# CONTRACTS:
#   - Read-only on the signals file.
#   - Exit 0 always (a failing Stop hook would interrupt the user).
#   - Output is valid JSON or nothing.

set -u

# --- derive project slug --------------------------------------------------
project_dir="${CLAUDE_PROJECT_DIR:-${PWD:-/tmp}}"
case "$project_dir" in
  ""|"/"|" "*) exit 0 ;;
esac
# Same non-alphanumeric -> '-' slug convention Claude Code uses (see
# capture-signal.sh). A '/'-only replacement mis-slugs on Windows and on any
# path containing '_', ':' etc., so the reminder would check the wrong file.
slug=$(printf '%s' "$project_dir" | sed 's/[^A-Za-z0-9]/-/g')
slug="${slug%-}"

signals_file="${HOME}/.claude/projects/${slug}/.aprende-signals.md"

# --- check signals file ---------------------------------------------------
if [[ ! -s "$signals_file" ]]; then
  # No signals captured this session. Nothing to suggest.
  exit 0
fi

count=$(wc -l < "$signals_file" 2>/dev/null | tr -d ' ')
[[ -z "$count" || "$count" -eq 0 ]] && exit 0

# --- emit additionalContext as valid JSON ---------------------------------
# We construct the JSON via printf, escaping any literal quotes/backslashes
# defensively (even though our messages contain none today). The "\n"
# sequence inside the JSON string is interpreted by the consumer as a
# newline — this is correct per RFC 8259.

msg_en="aprende: ${count} learning signal(s) captured this session were not reviewed. Run /aprende before closing to crystallize them."
msg_es="aprende: se capturaron ${count} señal(es) de aprendizaje sin revisar. Corre /aprende antes de cerrar para guardarlas."

# JSON-escape: backslash, doublequote, control chars. Keep it simple — our
# strings are ASCII with no quotes or backslashes today, but be defensive.
json_escape() {
  printf '%s' "$1" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g'
}

esc_en=$(json_escape "$msg_en")
esc_es=$(json_escape "$msg_es")

# Single-line JSON to avoid any heredoc / newline ambiguity.
printf '{"additionalContext":"%s\\n%s"}\n' "$esc_en" "$esc_es"

exit 0
