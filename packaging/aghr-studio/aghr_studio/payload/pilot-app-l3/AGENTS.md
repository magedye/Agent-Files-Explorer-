# AGENTS.md

<!-- Candidate output; approval/export require current CP gates. -->

## CAP-PILOT-SQL
MAY
Use the registered local read-only procedure when evaluating the inventory SQL boundary. Loading is not execution.

## PILOT-IDENTITY-001
MUST
Read API responses MUST identify this sandbox project. Do not claim authority over another project.

## PRIN-007
MUST
When receiving a software task or crossing a substantive phase boundary,
the agent MUST evaluate the fitness of the capabilities actually available
in the execution environment, and select the minimal effective set for
the current phase. Priority is given to native capabilities compatible with
the host and project. Repetition, conflict, and authorization bypass MUST
be prevented. The agent is NOT obligated to use a skill when direct
execution is better, and MUST NOT treat discovery or loading as evidence
of execution or success. Adoption of new skills, modification of governing
instructions, and promotion of lessons into persistent memory remain
subject to the approved authority and procedure.


## PILOT-SQL-001
MUST_NOT
The inventory inspection procedure MUST_NOT execute mutating, multiple, extension-loading or metadata SQL. Enforce both SQL authorization and SQLite read-only permissions.

