# Airtable Database Setup Script
# Run once to create all tables and fields for the Playtest Cost Tracker

$token  = "patTt2ktBH4gi24Gq.8081a8377b6c75cf3b14bf13a3c76d7b1376867fe47968ad13ee4e9ecc6a7aad"
$baseId = "appWiS3DSO8r4JdqN"
$baseUrl = "https://api.airtable.com/v0/meta/bases/$baseId"
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type"  = "application/json"
}

function New-AirtableTable($name, $fields) {
    $body = @{ name = $name; fields = $fields } | ConvertTo-Json -Depth 10
    try {
        $resp = Invoke-RestMethod -Uri "$baseUrl/tables" -Headers $headers -Method Post -Body $body
        Write-Host "  [OK] Table '$name' created  (id: $($resp.id))" -ForegroundColor Green
        return $resp
    } catch {
        Write-Host "  [ERR] Table '$name': $_" -ForegroundColor Red
        throw
    }
}

function Add-AirtableField($tableId, $field) {
    $body = $field | ConvertTo-Json -Depth 10
    try {
        $resp = Invoke-RestMethod -Uri "$baseUrl/tables/$tableId/fields" -Headers $headers -Method Post -Body $body
        Write-Host "    [OK] Field '$($field.name)' added" -ForegroundColor Cyan
        return $resp
    } catch {
        Write-Host "    [ERR] Field '$($field.name)': $_" -ForegroundColor Red
        throw
    }
}

# ── Helpers for common field shapes ──────────────────────────────────────────

function Select-Field($name, $choices) {
    @{
        name    = $name
        type    = "singleSelect"
        options = @{ choices = $choices }
    }
}

function Choice($name, $color) { @{ name = $name; color = $color } }

# ─────────────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "=== Playtest Cost Tracker — Airtable Setup ===" -ForegroundColor Yellow
Write-Host "Base: $baseId"
Write-Host ""

# ── 1. GAMES ─────────────────────────────────────────────────────────────────
Write-Host "1/4  Creating 'Games' table..." -ForegroundColor White
$gamesTable = New-AirtableTable "Games" @(
    @{ name = "Name";        type = "singleLineText" }
    @{ name = "Description"; type = "multilineText"  }
    @{ name = "Studio";      type = "singleLineText" }
    (Select-Field "Status" @(
        (Choice "Active"    "greenLight2")
        (Choice "On Hold"   "yellowLight2")
        (Choice "Shipped"   "blueLight2")
        (Choice "Cancelled" "redLight2")
    ))
    (Select-Field "Current Phase" @(
        (Choice "Discovery" "purpleLight2")
        (Choice "Pre-Alpha" "purpleLight1")
        (Choice "Alpha"     "blueLight2")
        (Choice "Beta"      "cyanLight2")
        (Choice "Gold"      "yellowLight2")
        (Choice "Launch"    "greenLight2")
    ))
    @{
        name    = "Target Launch Date"
        type    = "date"
        options = @{ dateFormat = @{ name = "iso" } }
    }
)
$gamesId = $gamesTable.id

# ── 2. PRODUCT GOALS ─────────────────────────────────────────────────────────
Write-Host ""
Write-Host "2/4  Creating 'Product Goals' table..." -ForegroundColor White
$pgTable = New-AirtableTable "Product Goals" @(
    @{ name = "Name";        type = "singleLineText" }
    @{ name = "Description"; type = "multilineText"  }
    (Select-Field "Priority" @(
        (Choice "High"   "redLight2")
        (Choice "Medium" "yellowLight2")
        (Choice "Low"    "grayLight2")
    ))
)
$pgId = $pgTable.id

Write-Host "    Linking Product Goals -> Games..."
Add-AirtableField $pgId @{
    name    = "Game"
    type    = "multipleRecordLinks"
    options = @{ linkedTableId = $gamesId }
}

# ── 3. PLAYER EXPERIENCE GOALS ───────────────────────────────────────────────
Write-Host ""
Write-Host "3/4  Creating 'Player Experience Goals' table..." -ForegroundColor White
$pegTable = New-AirtableTable "Player Experience Goals" @(
    @{ name = "Name";        type = "singleLineText" }
    @{ name = "Description"; type = "multilineText"  }
    @{ name = "Notes";       type = "multilineText"  }
    (Select-Field "Development Phase" @(
        (Choice "Discovery" "purpleLight2")
        (Choice "Pre-Alpha" "purpleLight1")
        (Choice "Alpha"     "blueLight2")
        (Choice "Beta"      "cyanLight2")
        (Choice "Gold"      "yellowLight2")
        (Choice "Launch"    "greenLight2")
    ))
    (Select-Field "Status" @(
        (Choice "Not Started" "grayLight2")
        (Choice "Planning"    "grayLight1")
        (Choice "In Progress" "yellowLight2")
        (Choice "Measuring"   "blueLight2")
        (Choice "Complete"    "greenLight2")
    ))
    @{
        name    = "Forecasted Cost"
        type    = "currency"
        options = @{ precision = 0; symbol = "$" }
    }
)
$pegId = $pegTable.id

Write-Host "    Linking Player Experience Goals -> Product Goals..."
Add-AirtableField $pegId @{
    name    = "Product Goal"
    type    = "multipleRecordLinks"
    options = @{ linkedTableId = $pgId }
}

# ── 4. STUDIES ───────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "4/4  Creating 'Studies' table..." -ForegroundColor White
$studiesTable = New-AirtableTable "Studies" @(
    @{ name = "Name"; type = "singleLineText" }
    @{ name = "Insights"; type = "multilineText" }
    (Select-Field "Type" @(
        (Choice "Playtest"             "blueLight2")
        (Choice "Survey"               "greenLight2")
        (Choice "Interview"            "purpleLight2")
        (Choice "Diary Study"          "orangeLight2")
        (Choice "Analytics Review"     "cyanLight2")
        (Choice "Heuristic Evaluation" "yellowLight2")
    ))
    (Select-Field "Status" @(
        (Choice "Planned"     "grayLight2")
        (Choice "In Progress" "yellowLight2")
        (Choice "Complete"    "greenLight2")
        (Choice "Cancelled"   "redLight2")
    ))
    @{
        name    = "Date"
        type    = "date"
        options = @{ dateFormat = @{ name = "iso" } }
    }
    @{
        name    = "Actual Cost"
        type    = "currency"
        options = @{ precision = 0; symbol = "$" }
    }
    @{
        name    = "Forecasted Cost"
        type    = "currency"
        options = @{ precision = 0; symbol = "$" }
    }
    @{
        name    = "Participants"
        type    = "number"
        options = @{ precision = 0 }
    }
)
$studiesId = $studiesTable.id

Write-Host "    Linking Studies -> Player Experience Goals..."
Add-AirtableField $studiesId @{
    name    = "Player Experience Goal"
    type    = "multipleRecordLinks"
    options = @{ linkedTableId = $pegId }
}

# ── SUMMARY ──────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "=== SETUP COMPLETE ===" -ForegroundColor Green
Write-Host ""
Write-Host "Add these to your .env file:" -ForegroundColor Yellow
Write-Host "VITE_AIRTABLE_API_KEY=$token"
Write-Host "VITE_AIRTABLE_BASE_ID=$baseId"
Write-Host ""
Write-Host "Table IDs (for reference):" -ForegroundColor Yellow
Write-Host "  Games:                    $gamesId"
Write-Host "  Product Goals:            $pgId"
Write-Host "  Player Experience Goals:  $pegId"
Write-Host "  Studies:                  $studiesId"
Write-Host ""
Write-Host "Open your base at: https://airtable.com/$baseId" -ForegroundColor Cyan
