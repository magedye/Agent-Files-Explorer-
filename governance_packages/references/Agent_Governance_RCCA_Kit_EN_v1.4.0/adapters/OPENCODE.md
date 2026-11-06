# OpenCode adapter — optional, explicitly version-scoped

**Status:** DOCUMENTATION_REVIEWED / LIVE_HOST_NOT_RUN / WINDOWS_NOT_RUN. Sources S06/S07.

Do not mix V1 and V2 configuration. The reviewed documentation uses different schemas and tool names:

| Area | Reviewed V1 documentation | Reviewed V2 documentation |
|---|---|---|
| Permission configuration | `permission` object | `permissions` ordered array |
| Shell tool identifier | `bash` | `shell` |
| Rule matching | Ordered specificity/last-match semantics documented | Ordered rules, last matching rule wins |
| Instruction discovery | Version-specific AGENTS/legacy fallback behavior | Version-specific AGENTS discovery; do not assume legacy fallback |

Record the installed version and provider, then consult its matching official documentation. No configuration is
installed by this kit. A generic copied `bash: allow` or `shell: allow` is not a bounded-autonomy policy.

The V2 permission documentation warns that shell execution has host-user permissions and that external-directory
checks depend on the operation/context; shell command arguments can still refer elsewhere [S07]. Therefore a
permission rule or cwd check is not proof that all file writes, subprocesses or network effects are contained.
Use an actual operating-system/runtime boundary where sensitive actions require one. The kit's scope classifier
checks declared metadata only and does not parse shell commands or intercept tool calls.

Default assistance: read-only analysis of a small assigned scope with redacted context. A separate scoped worktree
is needed for optional edits; retain one writer per worktree. Model changes, session separation and different host
names are not independent acceptance. Do not use auto-approval or an unrestricted wildcard to bypass unresolved
scope, owner decisions or higher instructions. Qualify the actual host/version before claiming support.
