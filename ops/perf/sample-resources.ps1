param(
  [Parameter(Mandatory = $true)][int]$ApiProcessId,
  [int]$DurationSeconds = 130,
  [string]$OutputPath = '.data/perf/resources.json'
)
$ErrorActionPreference = 'Stop'
$processor = Get-CimInstance Win32_Processor
$computer = Get-CimInstance Win32_ComputerSystem
$cores = [int]$computer.NumberOfLogicalProcessors
$baseline = [ordered]@{ processor = $processor.Name; logicalProcessors = $cores;
  physicalMemoryBytes = [long]$computer.TotalPhysicalMemory; os = [Environment]::OSVersion.VersionString }
$samples = [Collections.Generic.List[object]]::new()
$previous = Get-Process -Id $ApiProcessId
$previousCpu = $previous.CPU
$clock = [Diagnostics.Stopwatch]::StartNew()
$previousTime = $clock.Elapsed.TotalSeconds
while ($clock.Elapsed.TotalSeconds -lt $DurationSeconds) {
  Start-Sleep -Seconds 2
  $process = Get-Process -Id $ApiProcessId
  $now = $clock.Elapsed.TotalSeconds
  $delta = $now - $previousTime
  $cpuPercent = 100 * ($process.CPU - $previousCpu) / $delta / $cores
  $dockerLine = & docker stats Postgre --no-stream --format '{{json .}}' 2>$null
  $postgres = if ($LASTEXITCODE -eq 0) { $dockerLine | ConvertFrom-Json } else { $null }
  $samples.Add([ordered]@{ elapsedSeconds = $now; intervalSeconds = $delta;
    apiCpuHostPercent = $cpuPercent; apiCpuOneCorePercent = $cpuPercent * $cores;
    apiWorkingSetBytes = $process.WorkingSet64; apiPrivateBytes = $process.PrivateMemorySize64;
    postgresCpuPercent = $postgres.CPUPerc; postgresMemory = $postgres.MemUsage;
    postgresMemoryPercent = $postgres.MemPerc })
  $previousCpu = $process.CPU
  $previousTime = $now
}
$result = [ordered]@{ measuredAt = [DateTime]::UtcNow.ToString('o'); apiProcessId = $ApiProcessId;
  baseline = $baseline; durationSeconds = $clock.Elapsed.TotalSeconds; samples = $samples }
$outputFullPath = [IO.Path]::GetFullPath($OutputPath)
[IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($outputFullPath)) | Out-Null
$result | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $outputFullPath -Encoding utf8
Write-Output "Muestras de recursos guardadas: $($samples.Count); duración $($result.durationSeconds) segundos."
