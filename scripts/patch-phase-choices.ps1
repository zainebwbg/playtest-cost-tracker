# Replace "Current Phase" in the Games table with correct choices
# Strategy: delete old field, create new field with right options

$token   = "patTt2ktBH4gi24Gq.8081a8377b6c75cf3b14bf13a3c76d7b1376867fe47968ad13ee4e9ecc6a7aad"
$baseId  = "appWiS3DSO8r4JdqN"
$tableId = "tbllE8toDoYl832Xm"   # Games
$fieldId = "fldxUGC7WjzUiOdGY"   # Current Phase (old)
$headers = @{ "Authorization" = "Bearer $token"; "Content-Type" = "application/json" }
$metaBase = "https://api.airtable.com/v0/meta/bases/$baseId"

# ── 1. Delete old "Current Phase" field ───────────────────────────────────────
Write-Host "Deleting old 'Current Phase' field ($fieldId)..."
$del = Invoke-RestMethod -Uri "$metaBase/tables/$tableId/fields/$fieldId" -Headers $headers -Method Delete
Write-Host "  Deleted: $($del.deleted)  id: $($del.id)"

# ── 2. Create new "Current Phase" field with correct choices ──────────────────
Write-Host "Creating new 'Current Phase' field with updated choices..."
$body = ConvertTo-Json -Depth 10 -InputObject @{
    name    = "Current Phase"
    type    = "singleSelect"
    options = @{
        choices = @(
            @{ name = "Concept";        color = "purpleLight2" }
            @{ name = "Pre Production"; color = "purpleLight1" }
            @{ name = "Production";     color = "blueLight2"   }
            @{ name = "Alpha";          color = "cyanLight2"   }
            @{ name = "Beta";           color = "yellowLight2" }
            @{ name = "Launch";         color = "greenLight2"  }
        )
    }
}

$resp = Invoke-RestMethod -Uri "$metaBase/tables/$tableId/fields" -Headers $headers -Method Post -Body $body
Write-Host "  New field id: $($resp.id)"
Write-Host ""
Write-Host "Current Phase choices:" -ForegroundColor Green
foreach ($c in $resp.options.choices) {
    Write-Host "  - $($c.name)  [$($c.color)]" -ForegroundColor Cyan
}
Write-Host ""
Write-Host "Done. Open your base to verify:" -ForegroundColor Yellow
Write-Host "  https://airtable.com/$baseId"
