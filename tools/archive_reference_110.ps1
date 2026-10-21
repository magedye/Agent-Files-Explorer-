$ErrorActionPreference = 'Stop'
$workspaceRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$packageRoot = (Resolve-Path -LiteralPath (Join-Path $workspaceRoot 'governance_packages')).Path
$referenceRoot = (Resolve-Path -LiteralPath (Join-Path $packageRoot 'references')).Path
$archiveRoot = (Resolve-Path -LiteralPath (Join-Path $packageRoot 'archive')).Path
$evidenceRoot = Join-Path $workspaceRoot 'docs/evidence/reference-layout-2026-10-20'
$entries = @('Agent_Governance_Harness_Reference_1.1.0', 'AGHR_Minimal_1.1.0', 'Agent_Governance_Harness_Reference_1.1.0.zip', 'AGHR_Minimal_1.1.0.zip')
$latestNames = @('Agent_Governance_Harness_Reference_1.2.0', 'Agent_Governance_Harness_Reference_1.2.0.zip', 'Agent_Governance_Harness_Reference_1.2.0.zip.sha256')

function Assert-ChildPath([string]$filePath, [string]$parentPath) {
    $absolutePath = [System.IO.Path]::GetFullPath($filePath)
    if (-not $absolutePath.StartsWith($parentPath + [System.IO.Path]::DirectorySeparatorChar, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "Path outside intended directory: $absolutePath"
    }
}

function Get-Custody([string]$targetPath) {
    $target = Get-Item -LiteralPath $targetPath -Force
    if ($target.Attributes -band [System.IO.FileAttributes]::ReparsePoint) { throw 'Reparse point rejected' }
    $files = @($target)
    if ($target.PSIsContainer) {
        $children = @(Get-ChildItem -LiteralPath $targetPath -Recurse -Force)
        if ($children | Where-Object { $_.Attributes -band [System.IO.FileAttributes]::ReparsePoint }) { throw 'Nested reparse point rejected' }
        $files = @($children | Where-Object { -not $_.PSIsContainer } | Sort-Object FullName)
    }
    $result = [ordered]@{}
    foreach ($file in $files) {
        $key = '.'
        if ($target.PSIsContainer) {
            Assert-ChildPath $file.FullName $target.FullName
            $key = $file.FullName.Substring($target.FullName.Length + 1).Replace('\', '/')
        }
        $result[$key] = (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
    }
    return $result
}

function Assert-SameCustody($before, $after) {
    if ($before.Count -ne $after.Count) { throw 'File population changed during move' }
    foreach ($key in $before.Keys) {
        if (-not $after.Contains($key) -or $before[$key] -ne $after[$key]) { throw "Digest changed: $key" }
    }
}

function Save-NewJson([string]$fileName, $record) {
    $destination = Join-Path $evidenceRoot $fileName
    $stream = [System.IO.File]::Open($destination, [System.IO.FileMode]::CreateNew, [System.IO.FileAccess]::Write)
    $writer = [System.IO.StreamWriter]::new($stream, [System.Text.UTF8Encoding]::new($false))
    try { $writer.WriteLine(($record | ConvertTo-Json -Depth 12)) } finally { $writer.Dispose() }
}

$plans = @()
foreach ($name in $entries) {
    $source = [System.IO.Path]::GetFullPath((Join-Path $referenceRoot $name))
    $destination = [System.IO.Path]::GetFullPath((Join-Path $archiveRoot $name))
    Assert-ChildPath $source $referenceRoot
    Assert-ChildPath $destination $archiveRoot
    if (-not (Test-Path -LiteralPath $source)) { throw "Source missing: $name" }
    if (Test-Path -LiteralPath $destination) { throw "Archive destination already exists: $name" }
    $plans += [ordered]@{ name = $name; source = $source; destination = $destination; before = (Get-Custody $source) }
}
$latestBefore = [ordered]@{}
foreach ($name in $latestNames) { $latestBefore[$name] = Get-Custody (Join-Path $referenceRoot $name) }
$beforeEntries = @(Get-ChildItem -LiteralPath $referenceRoot -Force | Select-Object -ExpandProperty Name)
[System.IO.Directory]::CreateDirectory($evidenceRoot) | Out-Null
Save-NewJson 'before.json' ([ordered]@{ observedAtUtc = [DateTime]::UtcNow.ToString('o'); entries = $beforeEntries; moves = $plans; latest = $latestBefore })

foreach ($plan in $plans) {
    Move-Item -LiteralPath $plan.source -Destination $plan.destination
    $after = Get-Custody $plan.destination
    Assert-SameCustody $plan.before $after
    $plan['after'] = $after
    $plan['preserved'] = $true
}
$afterEntries = @(Get-ChildItem -LiteralPath $referenceRoot -Force | Select-Object -ExpandProperty Name)
if (@(Compare-Object $latestNames $afterEntries).Count) { throw 'References must contain only the latest edition and its distribution/digest' }
foreach ($name in $latestNames) { Assert-SameCustody $latestBefore[$name] (Get-Custody (Join-Path $referenceRoot $name)) }
Save-NewJson 'after.json' ([ordered]@{ observedAtUtc = [DateTime]::UtcNow.ToString('o'); entries = $afterEntries; moves = $plans; latestUnchanged = $true })
[ordered]@{ archivedEntries = $plans.Count; latestUnchanged = $true; remaining = $afterEntries } | ConvertTo-Json
