# Read-only generic JSON Schema tests and in-memory SQL checks.
# This does not execute or reimplement the AGHR Python policy engine.
[CmdletBinding()]
param()
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$contractProject = Split-Path -Parent $PSScriptRoot
$contractRoot = Join-Path $contractProject 'docs/contracts/aghr-rc3'
$contractResults = [System.Collections.Generic.List[object]]::new()
$contractBundleText = & node --disable-warning=ExperimentalWarning (Join-Path $PSScriptRoot 'check_studio_contracts.mjs') --schema-bundles
if ($LASTEXITCODE -ne 0) { throw 'Cannot resolve local contract schemas' }
$contractBundles = ($contractBundleText -join "`n") | ConvertFrom-Json -AsHashtable -Depth 100

function Copy-ContractFixture($Value) {
    return ($Value | ConvertTo-Json -Depth 100 | ConvertFrom-Json -AsHashtable -Depth 100)
}
function Assert-ContractCase([string]$Name, [string]$Schema, $Value, [bool]$Expected) {
    $schemaParts = $Schema.Split('#', 2)
    $schemaName = $schemaParts[0]
    $schemaFragment = if ($schemaParts.Length -eq 2) { $schemaParts[1] } else { '' }
    $schemaProbe = @{'$schema'='https://json-schema.org/draft/2020-12/schema'; '$ref'=('#/$defs/' + $schemaName + $schemaFragment); '$defs'=$contractBundles[$schemaName]['$defs']}
    $json = $Value | ConvertTo-Json -Depth 100 -Compress
    $schemaErrors = @()
    $actual = Test-Json -Json $json -Schema ($schemaProbe | ConvertTo-Json -Depth 100 -Compress) -ErrorAction SilentlyContinue -ErrorVariable schemaErrors
    foreach ($schemaError in $schemaErrors) {
        if (-not $schemaError.FullyQualifiedErrorId.StartsWith('InvalidJsonAgainstSchema')) { throw "Schema adapter error in ${Name}: $($schemaError.Exception.Message)" }
    }
    if ([bool]$actual -ne $Expected) { throw "Contract case failed: $Name (expected $Expected, observed $actual)" }
    $contractResults.Add(@{name=$Name; expected_valid=$Expected; status='PASS'})
}

$manifest = Get-Content -LiteralPath (Join-Path $contractRoot 'aghr.json') -Raw -Encoding UTF8 | ConvertFrom-Json -AsHashtable
Assert-ContractCase 'manifest_v1_2_example' 'aghr.schema.json' $manifest $true
$sample = Copy-ContractFixture $manifest; $sample.schemaVersion = '1.1'
Assert-ContractCase 'reject_old_manifest_schema_version' 'aghr.schema.json' $sample $false
$sample = Copy-ContractFixture $manifest; $sample.validation.enforceAuthorityLevel = $false
Assert-ContractCase 'reject_disabling_authority_enforcement' 'aghr.schema.json' $sample $false

$light = @{id='CONTRACT-TEST-ONLY'; kind='OBSERVATION'; force='INFORMATIVE'; severity='info'; scope=@{}; rule='Synthetic fixture, never an adopted instruction.'; impact=@{evidence='assumed'}}
Assert-ContractCase 'light_informative_item' 'item.schema.json' $light $true
$sample = Copy-ContractFixture $light; $sample.force = 'MAY'
Assert-ContractCase 'light_may_item' 'item.schema.json' $sample $true
$sample = Copy-ContractFixture $light; $sample.force = 'SHOULD'
Assert-ContractCase 'should_requires_owner_and_rationale' 'item.schema.json' $sample $false
$sample.authority = @{owner='SYNTHETIC_ONLY'}; $sample.rationale = 'Synthetic structural example.'
Assert-ContractCase 'should_does_not_require_full_mandatory_authority' 'item.schema.json' $sample $true

$mandatory = Copy-ContractFixture $light
$mandatory.force = 'MUST'; $mandatory.kind = 'REQUIREMENT'; $mandatory.severity = 'medium'
$mandatory.rationale = 'Synthetic contract test.'
$mandatory.authority = @{source='not-a-real-policy.yaml'; level='project'; owner='SYNTHETIC_ONLY'; approvedBy='SYNTHETIC_ONLY'; status='draft'; effectiveFrom='2026-10-22'}
$mandatory.verification = @{commands=@('synthetic-never-executed')}
Assert-ContractCase 'complete_must_structure' 'item.schema.json' $mandatory $true
foreach ($force in @('MUST','MUST_NOT')) {
    $sample = Copy-ContractFixture $mandatory; $sample.force = $force; $null = $sample.authority.Remove('level')
    Assert-ContractCase "${force}_reject_missing_authority_level" 'item.schema.json' $sample $false
    $sample.authority.level = 'administrator'
    Assert-ContractCase "${force}_reject_unknown_authority_level" 'item.schema.json' $sample $false
}
$sample = Copy-ContractFixture $mandatory; $sample.force = 'UNRESOLVED'
Assert-ContractCase 'legacy_unresolved_is_not_a_target_force' 'item.schema.json' $sample $false
$sample = Copy-ContractFixture $light; $null = $sample.Remove('impact')
Assert-ContractCase 'every_item_requires_impact_evidence' 'item.schema.json' $sample $false
$sample = Copy-ContractFixture $light; $sample.impact.evidence = 'believed'
Assert-ContractCase 'reject_unknown_impact_evidence_class' 'item.schema.json' $sample $false

$prohibition = Copy-ContractFixture $mandatory
$prohibition.force = 'MUST_NOT'; $prohibition.severity = 'critical'
$prohibition.enforcement = @{technical=@('synthetic-not-a-real-control'); mergeEffect='blocking'; gate=@{type='synthetic-not-a-real-gate'; required=$true}}
$prohibition.verification.evalFixtures = @('synthetic-fixture-not-run')
Assert-ContractCase 'critical_must_not_structure_only' 'item.schema.json' $prohibition $true
$sample = Copy-ContractFixture $prohibition; $null = $sample.enforcement.Remove('gate')
Assert-ContractCase 'critical_prohibition_requires_gate' 'item.schema.json' $sample $false
$sample = Copy-ContractFixture $prohibition; $sample.verification.evalFixtures = @()
Assert-ContractCase 'critical_prohibition_requires_nonempty_eval_fixture_refs' 'item.schema.json' $sample $false

$capability = Copy-ContractFixture $light; $capability.kind = 'CAPABILITY'
$capability.skillId='synthetic-skill'; $capability.source='project'; $capability.function='verification'
$capability.permissions=@{read=@('synthetic/**');write=@();network='deny';secrets='deny'}
$capability.inputs=@(); $capability.outputs=@()
Assert-ContractCase 'capability_requires_qualification_record' 'item.schema.json' $capability $false
$capability.skillQualification = @{skillId='synthetic-skill'; host='synthetic-host'; hostVersion='0-test'; scope='synthetic/**'; contentHash=('sha256:' + ('0' * 64)); status='NOT_RUN'}
Assert-ContractCase 'not_run_qualification_is_valid_structure' 'item.schema.json' $capability $true
foreach ($key in @('host','hostVersion','scope','contentHash')) {
    $sample = Copy-ContractFixture $capability; $null = $sample.skillQualification.Remove($key)
    Assert-ContractCase "qualification_requires_$key" 'item.schema.json' $sample $false
}
$sample = Copy-ContractFixture $capability; $sample.skillQualification.status = 'QUALIFIED'
Assert-ContractCase 'qualified_needs_date_and_evidence_refs' 'item.schema.json' $sample $false

$line = @{task_id='synthetic-task'; session=@{agent='synthetic-host'; agent_version='0-test'; host_os='test'; started_at='2026-10-22T00:00:00Z'}; events=@(@{at='2026-10-22T00:00:01Z'; type='discovery.outcome'; task_language='ar'; outcome='NO_SKILL_MATCH'; reason='Synthetic fixture only.'}); submit_to_ci=$false}
foreach ($outcome in @('UNKNOWN_ID','NO_SKILL_MATCH','DISCOVERY_UNAVAILABLE')) {
    $sample = Copy-ContractFixture $line; $sample.events[0].outcome = $outcome
    Assert-ContractCase "discovery_report_structure_$outcome" 'evidence.schema.json' $sample $true
}
$sample = Copy-ContractFixture $line; $sample.events[0].outcome = 'UNKNOWN_SKILL'
Assert-ContractCase 'reject_collapsed_discovery_outcome' 'evidence.schema.json' $sample $false
$sample = Copy-ContractFixture $line; $sample.events += $sample.events[0]
Assert-ContractCase 'draft_jsonl_one_event_per_line' 'evidence.schema.json' $sample $false

$sample = Copy-ContractFixture $line; $sample.events = @(@{at='2026-10-22T00:00:01Z'; type='host.signal'; status='NOT_OBSERVABLE'; reason='No host activation API in synthetic fixture.'})
Assert-ContractCase 'unobservable_host_signal_is_valid' 'evidence.schema.json' $sample $true
$sample.events[0].status = 'HOST_SIGNAL'; $sample.events[0].skill_id = 'synthetic-skill'
Assert-ContractCase 'host_signal_requires_acknowledgement' 'evidence.schema.json' $sample $false
$sample.events[0].acknowledgement = @{fixture_only=$true}
Assert-ContractCase 'host_signal_still_requires_current_task_execution_ref' 'evidence.schema.json' $sample $false
$sample.events[0].execution_ref = @{path='synthetic://not-a-real-execution';content_hash=('sha256:' + ('0' * 64))}
Assert-ContractCase 'acknowledgement_structure_is_not_execution_proof' 'evidence.schema.json' $sample $true

$sample = Copy-ContractFixture $line; $sample.events = @(@{at='2026-10-22T00:00:01Z'; type='skill.loaded'; skill_id='synthetic-skill'; instruction_hash=('sha256:' + ('0' * 64))})
Assert-ContractCase 'loaded_instructions_structure' 'evidence.schema.json' $sample $true
$sample.events[0].result = 'PASS'
Assert-ContractCase 'loaded_event_cannot_contain_verification_pass' 'evidence.schema.json' $sample $false

$sample = Copy-ContractFixture $line; $sample.events = @(@{at='2026-10-22T00:00:01Z'; type='skill.executed'; skill_id='synthetic-skill'; inputs=@(); outputs=@(); exit_status='success'})
Assert-ContractCase 'successful_execution_requires_output_refs' 'evidence.schema.json' $sample $false
$sample.events[0].exit_status = 'failed'
Assert-ContractCase 'failure_without_outputs_can_be_reported_honestly' 'evidence.schema.json' $sample $true
$sample.events[0].exit_status = 'UNKNOWN'
Assert-ContractCase 'unknown_execution_status_rejected' 'evidence.schema.json' $sample $false

$sample = Copy-ContractFixture $line; $sample.events = @(@{at='2026-10-22T00:00:01Z'; type='skill.verified'; skill_id='synthetic-skill'; verifier_output=@{synthetic_only=$true}; result='PASS'})
Assert-ContractCase 'verification_requires_actual_task_criteria_field' 'evidence.schema.json' $sample $false
$sample.events[0].task_criteria = 'Synthetic criteria; never executed.'
Assert-ContractCase 'verification_structure_is_not_actual_task_success' 'evidence.schema.json' $sample $true

$contractVectorText = & node --disable-warning=ExperimentalWarning (Join-Path $PSScriptRoot 'check_studio_contracts.mjs') --contract-vectors
if ($LASTEXITCODE -ne 0) { throw 'Cannot load independent contract examples' }
$contractVectors = ($contractVectorText -join "`n") | ConvertFrom-Json -AsHashtable -Depth 100
foreach ($contractVector in $contractVectors) {
    Assert-ContractCase $contractVector.name $contractVector.schema $contractVector.value $contractVector.valid
}

$integrityText = & node --disable-warning=ExperimentalWarning (Join-Path $PSScriptRoot 'check_studio_contracts.mjs')
if ($LASTEXITCODE -ne 0) { throw 'Contract integrity/SQL checker failed' }
$integrity = ($integrityText -join "`n") | ConvertFrom-Json -AsHashtable
[ordered]@{
    status='PASS'
    scope='LOCAL_DRAFT_CONTRACTS_ONLY'
    observed_at=[DateTime]::UtcNow.ToString('o')
    validator=@{command='Test-Json'; powershell_version=$PSVersionTable.PSVersion.ToString(); dialect='2020-12'}
    schema_case_count=$contractResults.Count
    schema_cases=$contractResults.ToArray()
    integrity=$integrity
    aghr_validate_strict='NOT_RUN'
    native_host_qualification='NOT_RUN'
    phase_0_exit='NOT_RUN'
} | ConvertTo-Json -Depth 20
