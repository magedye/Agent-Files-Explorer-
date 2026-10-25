# E5 proposal extension 1

Separate from immutable E2. Python owns proposal parsing, JCS, wrapper matching and policy validation via E2. Host owns identity/grants, transactional lifecycle and audit. No proposal supplies a SourceGrant. Operational calibration/project/generated-file proposals parse/hash but remain BLOCKED for full validation without downstream evidence. E4 seven checks: REQUIRED / NOT_RUN / NOT_WAIVED.

JCS: unmodified vendored rfc8785 0.1.4, Apache-2.0 (vendor/LICENSE.rfc8785). See delivery VENDOR.json for wheel origin/hash. This license applies to vendored code only, not the provisional MIT package. No installation/global dependency change. EXTENSION.lock.json pins source at every worker invocation.
