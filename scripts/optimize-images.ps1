param(
  [int[]] $Widths = @(480,768,1080,1440,1920),
  [int] $Quality = 80
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Ensure-Dir([string]$Path) { if (-not (Test-Path $Path)) { New-Item -ItemType Directory -Path $Path | Out-Null } }

function Get-JpegCodec {
  return [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
}

function Save-ResizedJpeg([string]$InputPath, [string]$OutputPath, [int]$Width, [int]$Quality) {
  Add-Type -AssemblyName System.Drawing
  $img = [System.Drawing.Image]::FromFile($InputPath)
  try {
    $ratio = $Width / $img.Width
    $height = [int]([Math]::Round($img.Height * $ratio))
    $bmp = New-Object System.Drawing.Bitmap $Width, $height
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    try {
      $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
      $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
      $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
      $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
      $g.DrawImage($img, 0, 0, $Width, $height)
      $codec = Get-JpegCodec
      $ep = New-Object System.Drawing.Imaging.EncoderParameters 1
      $ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality), $Quality
      Ensure-Dir (Split-Path $OutputPath)
      $bmp.Save($OutputPath, $codec, $ep)
    } finally { $g.Dispose(); $bmp.Dispose() }
  } finally { $img.Dispose() }
}

$map = @(
  @{ name = 'step-1'; url = 'https://source.unsplash.com/1920x1080/?meeting,notebook,brainstorm'; outDir = 'public/images/steps' },
  @{ name = 'step-2'; url = 'https://source.unsplash.com/1920x1080/?wireframe,ux,sketch'; outDir = 'public/images/steps' },
  @{ name = 'step-3'; url = 'https://source.unsplash.com/1920x1080/?design,typography,moodboard'; outDir = 'public/images/steps' },
  @{ name = 'step-4'; url = 'https://source.unsplash.com/1920x1080/?collaboration,feedback,design'; outDir = 'public/images/steps' },
  @{ name = 'step-5'; url = 'https://source.unsplash.com/1920x1080/?code,frontend,developer'; outDir = 'public/images/steps' },
  @{ name = 'step-6'; url = 'https://source.unsplash.com/1920x1080/?testing,usability,mobile'; outDir = 'public/images/steps' },
  @{ name = 'step-7'; url = 'https://source.unsplash.com/1920x1080/?launch,rocket,website'; outDir = 'public/images/steps' },
  @{ name = 'work-1'; url = 'https://source.unsplash.com/1920x1080/?landing,website,design'; outDir = 'public/images/works' },
  @{ name = 'work-2'; url = 'https://source.unsplash.com/1920x1080/?corporate,website,design'; outDir = 'public/images/works' },
  @{ name = 'work-3'; url = 'https://source.unsplash.com/1920x1080/?campaign,landing,form'; outDir = 'public/images/works' }
)

Ensure-Dir 'assets/raw'

foreach ($item in $map) {
  $raw = Join-Path 'assets/raw' "$($item.name).jpg"
  Write-Host "Downloading $($item.url) -> $raw"
  Invoke-WebRequest -Uri $item.url -OutFile $raw -Headers @{ 'Referer' = '' }
  foreach ($w in $Widths) {
    $out = Join-Path $item.outDir "$($item.name)-w$w.jpg"
    Write-Host "Resizing $raw -> $out ($w px)"
    Save-ResizedJpeg -InputPath $raw -OutputPath $out -Width $w -Quality $Quality
  }
}

Write-Host 'Done.'

