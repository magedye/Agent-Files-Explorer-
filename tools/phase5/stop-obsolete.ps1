param([Parameter(Mandatory=$true)][int]$TestRootPid)
$all = @(Get-CimInstance Win32_Process)
$root = $all | Where-Object ProcessId -eq $TestRootPid
if (-not $root -or $root.Name -notmatch '^(pwsh|powershell)\.exe$' -or $root.CommandLine -notlike '*Tee-Object -FilePath docs/evidence/studio-phase5-2026-10-24/NPM_TEST_FINAL.log*') { throw 'TEST_PROCESS_CUSTODY_MISMATCH' }
$tree = [Collections.Generic.List[object]]::new()
$tree.Add($root)
for ($i=0; $i -lt $tree.Count; $i++) { foreach ($child in @($all | Where-Object ParentProcessId -eq $tree[$i].ProcessId)) { $tree.Add($child) } }
$receipt = @{ status='CANCELLED_OBSOLETE_CANDIDATE'; reason='Required T30 corrections identified: live qualification and NO_SKILL_MATCH denominators; first full regression is not a final verdict.'; processes=@($tree | Select-Object ProcessId,ParentProcessId,Name,CreationDate); at=[DateTime]::UtcNow.ToString('o') }
$receipt | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath 'docs/evidence/studio-phase5-2026-10-24/REGRESSION_CANCELLED.json' -Encoding utf8
for ($i=$tree.Count-1; $i -ge 0; $i--) { $current=Get-CimInstance Win32_Process -Filter "ProcessId = $($tree[$i].ProcessId)"; if($current -and $current.CreationDate -eq $tree[$i].CreationDate){ Stop-Process -Id $current.ProcessId -ErrorAction SilentlyContinue } }
