# Create the Insights table and wire it to Studies + Player Experience Goals

$token    = "patTt2ktBH4gi24Gq.8081a8377b6c75cf3b14bf13a3c76d7b1376867fe47968ad13ee4e9ecc6a7aad"
$baseId   = "appWiS3DSO8r4JdqN"
$studiesId = "tblJ56rM6QtM3xL1N"   # Studies
$pegId     = "tblAcgtpdXv7O48oB"   # Player Experience Goals
$headers  = @{ "Authorization" = "Bearer $token"; "Content-Type" = "application/json" }
$metaBase = "https://api.airtable.com/v0/meta/bases/$baseId"

# ── 1. Create Insights table with core fields ─────────────────────────────────
Write-Host "Creating 'Insights' table..." -ForegroundColor White

$body = ConvertTo-Json -Depth 10 -InputObject @{
    name   = "Insights"
    fields = @(
        @{ name = "Insight Title"; type = "singleLineText" }
        @{ name = "Insight";       type = "multilineText"  }
    )
}

$table     = Invoke-RestMethod -Uri "$metaBase/tables" -Headers $headers -Method Post -Body $body
$insightsId = $table.id
Write-Host "  [OK] Table 'Insights' created  (id: $insightsId)" -ForegroundColor Green

# ── 2. Link Insights -> Studies ───────────────────────────────────────────────
Write-Host "  Linking Insights -> Studies..." -ForegroundColor White
$linkStudy = ConvertTo-Json -Depth 5 -InputObject @{
    name    = "Study"
    type    = "multipleRecordLinks"
    options = @{ linkedTableId = $studiesId }
}
$r1 = Invoke-RestMethod -Uri "$metaBase/tables/$insightsId/fields" -Headers $headers -Method Post -Body $linkStudy
Write-Host "  [OK] 'Study' link field added  (id: $($r1.id))" -ForegroundColor Cyan

# ── 3. Link Insights -> Player Experience Goals ───────────────────────────────
Write-Host "  Linking Insights -> Player Experience Goals..." -ForegroundColor White
$linkPEG = ConvertTo-Json -Depth 5 -InputObject @{
    name    = "Player Experience Goal"
    type    = "multipleRecordLinks"
    options = @{ linkedTableId = $pegId }
}
$r2 = Invoke-RestMethod -Uri "$metaBase/tables/$insightsId/fields" -Headers $headers -Method Post -Body $linkPEG
Write-Host "  [OK] 'Player Experience Goal' link field added  (id: $($r2.id))" -ForegroundColor Cyan

# ── Summary ───────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "=== Insights table ready ===" -ForegroundColor Green
Write-Host "  Table ID : $insightsId"
Write-Host "  Fields   : Insight Title, Insight, Study (linked), Player Experience Goal (linked)"
Write-Host ""
Write-Host "Airtable base: https://airtable.com/$baseId" -ForegroundColor Cyan
