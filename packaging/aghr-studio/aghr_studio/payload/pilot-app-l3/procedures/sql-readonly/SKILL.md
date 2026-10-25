---
name: pilot-sql-readonly
description: Inspect this sandbox's inventory through its actual SQL safety and read-only SQLite boundary.
---

Scope: pilot-app-l3 only, on aghr-local-process. Read source and sandbox data;
never write, spawn children, access secrets or use the network. Exercise the
application's real query boundary with allowed and denied statements. Return
the measured rows, rejected cases and input/source hashes. Loading this text
does not mean execution or verification. A failed request must exit nonzero.
Native Codex and Antigravity qualification is NOT_RUN.
