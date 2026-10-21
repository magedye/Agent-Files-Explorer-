# Verification, evaluation and acceptance policy

**Rules:** AGHR-014–017, AGHR-028, AGHR-031, AGHR-036, AGHR-039–040.

## Assurance dimensions
Assess source/configuration integrity, software behavior, tool/policy behavior, actual host environment, and the accepted user outcome separately. A higher assurance profile requires evidence suitable to its risks, not arbitrary larger test counts. Software tests can verify the evaluator while live evaluations test model behavior; neither is the same as production acceptance.

## Evidence and gate semantics
Every required criterion has an identified check or a justified non-applicability decision. For PASS, the actual target population is nonempty; test claims also have positive executed test count. Artifact existence/digest, candidate/environment identity, timestamps and exclusions are explicit. NOT_RUN/BLOCKED/ERROR are not PASS. Optional checks can remain unrun without inventing completeness; required ones block the corresponding readiness claim.

## Evaluation program
Use evaluations/SCENARIOS.json for portable behavioral and boundary cases. Instantiate them with synthetic or approved data, target host/model/version, exact criteria and observed artifacts. Keep expectations separate from results. Evaluate allowed work as well as refusals to detect overblocking. Include instruction conflicts, scope, injection, unsafe retry, cancellation, stale policy and malformed tools. Perform repeated samples when probabilistic behavior matters; record the sample size and limitations, not an invented universal confidence score.

## Authenticity and review
The local evidence validator checks structure, byte integrity and cross-record conditions; it cannot prove that an external person executed a test or that a log was honest at creation. Production trust requires protected CI/runner identities, controlled artifacts and independent review where applicable. A same-session self-review is not an independent audit.

## Release versus activation
Decisions name exact source/build/artifact identities, accepted capabilities, required checks, limitations, authority and environment. Non-deployable artifacts may have activation NOT_APPLICABLE. Do not inject customer onboarding into product release unless the accepted contract requires it. A permitted merge still needs its distinct gate. No shipped tool self-grants release acceptance.

## Package verification
Run the package validator, the independent executable test suite, local demo, negative mutations and clean-extraction checks. The manifest excludes itself and post-freeze result outputs explicitly; the detached ZIP hash covers final archive bytes. No self-referential hash is asserted. Checksum integrity is not signer authentication.
