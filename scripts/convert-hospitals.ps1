param(
  [string]$InputPath = "동물_동물병원.csv",
  [string]$OutputPath = "data/animal_hospitals_import.csv"
)

$ErrorActionPreference = "Stop"

$inputFullPath = Resolve-Path -LiteralPath $InputPath
$outputDirectory = Split-Path -Parent $OutputPath

if ($outputDirectory -and -not (Test-Path -LiteralPath $outputDirectory)) {
  New-Item -ItemType Directory -Path $outputDirectory | Out-Null
}

function Get-RegionParts {
  param([string]$RoadAddress, [string]$LotAddress)

  $address = if ($RoadAddress -and $RoadAddress.Trim()) { $RoadAddress.Trim() } else { $LotAddress.Trim() }
  $parts = $address -split "\s+"

  return @{
    Sido = if ($parts.Count -ge 1) { $parts[0] } else { $null }
    Sigungu = if ($parts.Count -ge 2) { $parts[1] } else { $null }
  }
}

$encoding = [System.Text.Encoding]::GetEncoding(949)
$lines = [System.IO.File]::ReadAllLines($inputFullPath, $encoding)
$rows = $lines | ConvertFrom-Csv

$converted = foreach ($row in $rows) {
  $region = Get-RegionParts -RoadAddress $row."도로명주소" -LotAddress $row."지번주소"
  $licenseDate = if ($row."인허가일자") { $row."인허가일자" } else { $null }

  [PSCustomObject]@{
    source_id = $row."관리번호"
    name = $row."사업장명"
    status = if ($row."상세영업상태명") { $row."상세영업상태명" } else { $row."영업상태명" }
    phone = $row."전화번호"
    road_address = $row."도로명주소"
    lot_address = $row."지번주소"
    sido = $region.Sido
    sigungu = $region.Sigungu
    latitude = $null
    longitude = $null
    license_date = $licenseDate
  }
}

$converted | Export-Csv -LiteralPath $OutputPath -NoTypeInformation -Encoding UTF8

Write-Output "input_rows=$($rows.Count)"
Write-Output "output_path=$OutputPath"
