param(
  [Parameter(Mandatory = $true)][string]$TextFile,
  [Parameter(Mandatory = $true)][string]$OutputFile,
  [string]$Voice = 'Microsoft Maria Desktop',
  [int]$Rate = 0
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech
$text = [System.IO.File]::ReadAllText($TextFile, [System.Text.Encoding]::UTF8)
if ([string]::IsNullOrWhiteSpace($text)) { throw 'O texto da narração está vazio.' }
$speaker = New-Object System.Speech.Synthesis.SpeechSynthesizer
try {
  $installed = $speaker.GetInstalledVoices() | ForEach-Object { $_.VoiceInfo.Name }
  $selectedVoice = $null
  
  if ($Voice -and ($installed -contains $Voice)) {
    $selectedVoice = $Voice
  } elseif ($installed -match 'Maria') {
    $selectedVoice = ($installed -match 'Maria')[0]
  } elseif ($installed -match 'Portuguese|Brazil|Heloisa|Daniel|Luciana|Vitoria') {
    $selectedVoice = ($installed -match 'Portuguese|Brazil|Heloisa|Daniel|Luciana|Vitoria')[0]
  } elseif ($installed.Count -gt 0) {
    $selectedVoice = $installed[0]
  }

  if ($selectedVoice) {
    $speaker.SelectVoice($selectedVoice)
  }
  
  $speaker.Rate = [Math]::Max(-5, [Math]::Min(5, $Rate))
  $speaker.SetOutputToWaveFile($OutputFile)
  $speaker.Speak($text)
} finally {
  $speaker.Dispose()
}
