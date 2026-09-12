# Upload demo documents with curl.exe (Windows PowerShell 5.1 has no -Form parameter).
# Adds data only; never modifies or deletes existing users or documents.
$ErrorActionPreference = 'Continue'
$base = 'http://127.0.0.1:8080'

Write-Host "=== login ==="
$loginRaw = curl.exe -s -X POST "$base/auth/login" -H "Content-Type: application/json" -d '{\"username\":\"demo_showcase\",\"password\":\"DemoShowcase2026\"}'
$login = $loginRaw | ConvertFrom-Json
$token = $login.data.token
Write-Host "  code=$($login.code) role=$($login.data.role)"
if (-not $token) { Write-Host "  NO TOKEN"; return }
$auth = "Authorization: Bearer $token"

$dir = 'C:\maimai\Python\personal-portfolio\project\backend\target\dbprobe\demo-docs'
$docs = @(
    @{ file = "$dir\rag-basics.md";    title = 'RAG Workflow Notes' },
    @{ file = "$dir\kb-guidelines.md"; title = 'Knowledge Base Guidelines' }
)

Write-Host "=== upload ==="
$ids = @()
foreach ($doc in $docs) {
    if (-not (Test-Path $doc.file)) { Write-Host "  missing $($doc.file)"; continue }
    $raw = curl.exe -s -X POST "$base/document/upload" -H $auth -F "file=@$($doc.file)" -F "title=$($doc.title)"
    Write-Host "  raw: $raw"
    try {
        $parsed = $raw | ConvertFrom-Json
        if ($parsed.data.id) { $ids += [int]$parsed.data.id }
    } catch { Write-Host "  parse failed" }
}

Write-Host "=== process ==="
foreach ($id in $ids) {
    $raw = curl.exe -s -X POST "$base/document/process/$id" -H $auth
    Write-Host "  process $id -> $raw"
}

Write-Host "=== list (raw) ==="
$listRaw = curl.exe -s -X GET "$base/document/list" -H $auth
Write-Host $listRaw.Substring(0, [Math]::Min(1200, $listRaw.Length))
