# Upload the additional demo documents with curl.exe. ASCII-only for PowerShell 5.1.
$ErrorActionPreference = 'Continue'
$base = 'http://127.0.0.1:8080'

$loginRaw = curl.exe -s -X POST "$base/auth/login" -H "Content-Type: application/json" -d '{\"username\":\"demo_showcase\",\"password\":\"DemoShowcase2026\"}'
$token = ($loginRaw | ConvertFrom-Json).data.token
if (-not $token) { Write-Host "NO TOKEN"; return }
$auth = "Authorization: Bearer $token"

$dir = 'C:\maimai\Python\personal-portfolio\project\backend\target\dbprobe\demo-docs'
$docs = @(
    @{ file = "$dir\vector-search.md"; title = 'Vector Search and Similarity' },
    @{ file = "$dir\prompt-design.md"; title = 'Prompt Design and Context Assembly' }
)

$ids = @()
foreach ($doc in $docs) {
    if (-not (Test-Path $doc.file)) { Write-Host "  missing $($doc.file)"; continue }
    $raw = curl.exe -s -X POST "$base/document/upload" -H $auth -F "file=@$($doc.file)" -F "title=$($doc.title)"
    $parsed = $raw | ConvertFrom-Json
    Write-Host "  upload id=$($parsed.data.id) status=$($parsed.data.status) title=$($doc.title)"
    if ($parsed.data.id) { $ids += [int]$parsed.data.id }
}

foreach ($id in $ids) {
    $raw = curl.exe -s -X POST "$base/document/process/$id" -H $auth
    Write-Host "  process $id -> code=$(($raw | ConvertFrom-Json).code)"
}

Write-Host "=== waiting for embedding ==="
for ($i = 1; $i -le 12; $i++) {
    Start-Sleep -Seconds 4
    $list = (curl.exe -s -X GET "$base/document/list" -H $auth) | ConvertFrom-Json
    $pending = @($list.data.records | Where-Object { $_.status -ne 2 })
    Write-Host "  round $i : total=$($list.data.total) pending=$($pending.Count)"
    if ($pending.Count -eq 0) { break }
}
Write-Host "=== final ==="
$list = (curl.exe -s -X GET "$base/document/list" -H $auth) | ConvertFrom-Json
foreach ($r in $list.data.records) { Write-Host "  id=$($r.id) status=$($r.status) slices=$($r.sliceCount) title=$($r.title)" }
